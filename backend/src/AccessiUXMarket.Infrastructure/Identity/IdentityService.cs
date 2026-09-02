using System.Data;
using AccessiUXMarket.Application.Identity;
using AccessiUXMarket.Domain.Identity;
using AccessiUXMarket.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using AppIdentityError = AccessiUXMarket.Application.Identity.IdentityError;

namespace AccessiUXMarket.Infrastructure.Identity;

internal sealed class IdentityService(
    UserManager<ApplicationUser> userManager,
    ApplicationDbContext dbContext,
    IJwtTokenFactory jwtTokenFactory,
    IPasswordResetNotifier passwordResetNotifier,
    IOptions<JwtOptions> jwtOptions,
    TimeProvider timeProvider,
    ILogger<IdentityService> logger) : IIdentityService
{
    private readonly JwtOptions _jwtOptions = jwtOptions.Value;

    public async Task<IdentityOperationResult<AuthSession>> RegisterAsync(
        RegisterRequest request,
        ClientContext client,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = request.Email.Trim(),
            UserName = request.Email.Trim(),
            FullName = request.FullName.Trim(),
            CreatedAtUtc = timeProvider.GetUtcNow(),
            IsActive = true
        };

        var creationResult = await userManager.CreateAsync(user, request.Password);
        if (!creationResult.Succeeded)
        {
            return IdentityOperationResult<AuthSession>.Failure(MapIdentityErrors(creationResult.Errors));
        }

        var roleResult = await userManager.AddToRoleAsync(user, RoleNames.Customer);
        if (!roleResult.Succeeded)
        {
            return IdentityOperationResult<AuthSession>.Failure(MapIdentityErrors(roleResult.Errors));
        }

        var session = await CreateSessionAsync(user, Guid.NewGuid(), client, cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return IdentityOperationResult<AuthSession>.Success(session);
    }

    public async Task<IdentityOperationResult<AuthSession>> LoginAsync(
        LoginRequest request,
        ClientContext client,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByEmailAsync(request.Email.Trim());
        if (user is null || !user.IsActive)
        {
            return InvalidCredentials();
        }

        if (await userManager.IsLockedOutAsync(user))
        {
            return InvalidCredentials();
        }

        if (!await userManager.CheckPasswordAsync(user, request.Password))
        {
            await userManager.AccessFailedAsync(user);
            return InvalidCredentials();
        }

        await userManager.ResetAccessFailedCountAsync(user);

        var session = await CreateSessionAsync(user, Guid.NewGuid(), client, cancellationToken);
        return IdentityOperationResult<AuthSession>.Success(session);
    }

    public async Task<IdentityOperationResult<AuthSession>> RefreshAsync(
        string refreshToken,
        ClientContext client,
        CancellationToken cancellationToken)
    {
        var tokenHash = SecureTokenGenerator.Hash(refreshToken);
        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        var storedToken = await dbContext.RefreshTokens
            .SingleOrDefaultAsync(token => token.TokenHash == tokenHash, cancellationToken);

        if (storedToken is null)
        {
            return InvalidRefreshToken();
        }

        var now = timeProvider.GetUtcNow();
        if (!storedToken.IsActive(now))
        {
            if (storedToken.RevokedAtUtc is not null && storedToken.ReplacedByTokenHash is not null)
            {
                await RevokeFamilyAsync(
                    storedToken.FamilyId,
                    now,
                    client.IpAddress,
                    "Refresh token reuse detected",
                    cancellationToken);
                await dbContext.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
            }

            return InvalidRefreshToken();
        }

        var user = await userManager.FindByIdAsync(storedToken.UserId.ToString());
        if (user is null || !user.IsActive)
        {
            storedToken.Revoke(now, client.IpAddress, "User unavailable");
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return InvalidRefreshToken();
        }

        var replacementRawToken = SecureTokenGenerator.CreateRefreshToken();
        var replacementHash = SecureTokenGenerator.Hash(replacementRawToken);
        var refreshExpiresAtUtc = now.AddDays(_jwtOptions.RefreshTokenDays);
        var replacement = RefreshToken.Create(
            user.Id,
            replacementHash,
            storedToken.FamilyId,
            now,
            refreshExpiresAtUtc,
            client.IpAddress,
            client.UserAgent);

        storedToken.Rotate(now, client.IpAddress, replacementHash);
        dbContext.RefreshTokens.Add(replacement);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return InvalidRefreshToken();
        }

        var session = await BuildSessionAsync(
            user,
            replacementRawToken,
            refreshExpiresAtUtc,
            cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return IdentityOperationResult<AuthSession>.Success(session);
    }

    public async Task LogoutAsync(
        Guid userId,
        string refreshToken,
        ClientContext client,
        CancellationToken cancellationToken)
    {
        var tokenHash = SecureTokenGenerator.Hash(refreshToken);
        var storedToken = await dbContext.RefreshTokens.SingleOrDefaultAsync(
            token => token.TokenHash == tokenHash && token.UserId == userId,
            cancellationToken);

        if (storedToken is null || !storedToken.IsActive(timeProvider.GetUtcNow()))
        {
            return;
        }

        storedToken.Revoke(timeProvider.GetUtcNow(), client.IpAddress, "User logout");
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IdentityOperationResult<CurrentUser>> GetCurrentUserAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null || !user.IsActive)
        {
            return IdentityOperationResult<CurrentUser>.Failure(
                new AppIdentityError("user_not_found", "The user is unavailable.", IdentityErrorType.NotFound));
        }

        return IdentityOperationResult<CurrentUser>.Success(
            await MapUserAsync(user, cancellationToken));
    }

    public async Task RequestPasswordResetAsync(
        ForgotPasswordRequest request,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByEmailAsync(request.Email.Trim());
        if (user is null || !user.IsActive)
        {
            return;
        }

        var token = await userManager.GeneratePasswordResetTokenAsync(user);

        try
        {
            await passwordResetNotifier.SendAsync(user.Email!, token, cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Password reset notification delivery failed.");
        }
    }

    public async Task<IdentityOperationResult<bool>> ResetPasswordAsync(
        ResetPasswordRequest request,
        ClientContext client,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByEmailAsync(request.Email.Trim());
        if (user is null || !user.IsActive)
        {
            return InvalidPasswordReset();
        }

        var resetResult = await userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!resetResult.Succeeded)
        {
            return InvalidPasswordReset();
        }

        await userManager.UpdateSecurityStampAsync(user);
        var activeTokens = await dbContext.RefreshTokens
            .Where(token => token.UserId == user.Id && token.RevokedAtUtc == null)
            .ToListAsync(cancellationToken);

        var now = timeProvider.GetUtcNow();
        foreach (var token in activeTokens)
        {
            token.Revoke(now, client.IpAddress, "Password changed");
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return IdentityOperationResult<bool>.Success(true);
    }

    private async Task<AuthSession> CreateSessionAsync(
        ApplicationUser user,
        Guid familyId,
        ClientContext client,
        CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow();
        var rawRefreshToken = SecureTokenGenerator.CreateRefreshToken();
        var refreshExpiresAtUtc = now.AddDays(_jwtOptions.RefreshTokenDays);
        dbContext.RefreshTokens.Add(RefreshToken.Create(
            user.Id,
            SecureTokenGenerator.Hash(rawRefreshToken),
            familyId,
            now,
            refreshExpiresAtUtc,
            client.IpAddress,
            client.UserAgent));

        await dbContext.SaveChangesAsync(cancellationToken);
        return await BuildSessionAsync(user, rawRefreshToken, refreshExpiresAtUtc, cancellationToken);
    }

    private async Task<AuthSession> BuildSessionAsync(
        ApplicationUser user,
        string refreshToken,
        DateTimeOffset refreshExpiresAtUtc,
        CancellationToken cancellationToken)
    {
        var roles = await userManager.GetRolesAsync(user);
        var currentUser = new CurrentUser(
            user.Id,
            user.Email ?? string.Empty,
            user.FullName,
            user.EmailConfirmed,
            roles.ToArray());
        var accessToken = jwtTokenFactory.Create(user, roles.ToArray());

        cancellationToken.ThrowIfCancellationRequested();
        return new AuthSession(
            accessToken.Value,
            accessToken.ExpiresAtUtc,
            refreshToken,
            refreshExpiresAtUtc,
            currentUser);
    }

    private async Task<CurrentUser> MapUserAsync(
        ApplicationUser user,
        CancellationToken cancellationToken)
    {
        var roles = await userManager.GetRolesAsync(user);
        cancellationToken.ThrowIfCancellationRequested();
        return new CurrentUser(
            user.Id,
            user.Email ?? string.Empty,
            user.FullName,
            user.EmailConfirmed,
            roles.ToArray());
    }

    private async Task RevokeFamilyAsync(
        Guid familyId,
        DateTimeOffset now,
        string ipAddress,
        string reason,
        CancellationToken cancellationToken)
    {
        var activeFamilyTokens = await dbContext.RefreshTokens
            .Where(token => token.FamilyId == familyId && token.RevokedAtUtc == null)
            .ToListAsync(cancellationToken);

        foreach (var familyToken in activeFamilyTokens)
        {
            familyToken.Revoke(now, ipAddress, reason);
        }
    }

    private static IdentityOperationResult<AuthSession> InvalidCredentials() =>
        IdentityOperationResult<AuthSession>.Failure(
            new AppIdentityError(
                "invalid_credentials",
                "The email or password is invalid.",
                IdentityErrorType.Unauthorized));

    private static IdentityOperationResult<AuthSession> InvalidRefreshToken() =>
        IdentityOperationResult<AuthSession>.Failure(
            new AppIdentityError(
                "invalid_refresh_token",
                "The session is invalid or has expired.",
                IdentityErrorType.Unauthorized));

    private static IdentityOperationResult<bool> InvalidPasswordReset() =>
        IdentityOperationResult<bool>.Failure(
            new AppIdentityError(
                "invalid_password_reset",
                "The password reset request is invalid or has expired.",
                IdentityErrorType.Validation,
                "token"));

    private static AppIdentityError[] MapIdentityErrors(
        IEnumerable<Microsoft.AspNetCore.Identity.IdentityError> errors) =>
        errors.Select(error =>
        {
            var isDuplicate = error.Code is "DuplicateEmail" or "DuplicateUserName";
            return new AppIdentityError(
                error.Code,
                error.Description,
                isDuplicate ? IdentityErrorType.Conflict : IdentityErrorType.Validation,
                isDuplicate ? "email" : "password");
        }).ToArray();
}
