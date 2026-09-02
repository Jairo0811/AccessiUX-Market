using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AccessiUXMarket.Api.Infrastructure;
using AccessiUXMarket.Application.Identity;

namespace AccessiUXMarket.Api.Endpoints;

public static class IdentityEndpoints
{
    public static IEndpointRouteBuilder MapIdentityEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/auth")
            .WithTags("Authentication");

        group.MapPost("/register", RegisterAsync)
            .AddEndpointFilter<ValidationFilter<RegisterRequest>>()
            .RequireRateLimiting("auth")
            .Produces<AuthResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status409Conflict);

        group.MapPost("/login", LoginAsync)
            .AddEndpointFilter<ValidationFilter<LoginRequest>>()
            .RequireRateLimiting("auth")
            .Produces<AuthResponse>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        group.MapPost("/refresh", RefreshAsync)
            .AddEndpointFilter<TrustedOriginFilter>()
            .RequireRateLimiting("auth")
            .Produces<AuthResponse>()
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        group.MapPost("/logout", LogoutAsync)
            .AddEndpointFilter<TrustedOriginFilter>()
            .RequireAuthorization()
            .RequireRateLimiting("auth")
            .Produces(StatusCodes.Status204NoContent);

        group.MapGet("/me", GetCurrentUserAsync)
            .RequireAuthorization()
            .Produces<CurrentUser>()
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/forgot-password", ForgotPasswordAsync)
            .AddEndpointFilter<ValidationFilter<ForgotPasswordRequest>>()
            .RequireRateLimiting("password-reset")
            .Produces(StatusCodes.Status202Accepted)
            .ProducesValidationProblem();

        group.MapPost("/reset-password", ResetPasswordAsync)
            .AddEndpointFilter<ValidationFilter<ResetPasswordRequest>>()
            .RequireRateLimiting("password-reset")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesValidationProblem();

        return endpoints;
    }

    private static async Task<IResult> RegisterAsync(
        RegisterRequest request,
        HttpContext httpContext,
        IWebHostEnvironment environment,
        IIdentityService identityService,
        CancellationToken cancellationToken)
    {
        var result = await identityService.RegisterAsync(
            request,
            CreateClientContext(httpContext),
            cancellationToken);
        if (!result.IsSuccess || result.Value is null)
        {
            return result.ToProblem();
        }

        RefreshTokenCookie.Write(
            httpContext.Response,
            result.Value.RefreshToken,
            result.Value.RefreshTokenExpiresAtUtc,
            environment);
        return Results.Created("/api/v1/auth/me", AuthResponse.FromSession(result.Value));
    }

    private static async Task<IResult> LoginAsync(
        LoginRequest request,
        HttpContext httpContext,
        IWebHostEnvironment environment,
        IIdentityService identityService,
        CancellationToken cancellationToken)
    {
        var result = await identityService.LoginAsync(
            request,
            CreateClientContext(httpContext),
            cancellationToken);
        if (!result.IsSuccess || result.Value is null)
        {
            return result.ToProblem();
        }

        RefreshTokenCookie.Write(
            httpContext.Response,
            result.Value.RefreshToken,
            result.Value.RefreshTokenExpiresAtUtc,
            environment);
        return Results.Ok(AuthResponse.FromSession(result.Value));
    }

    private static async Task<IResult> RefreshAsync(
        HttpContext httpContext,
        IWebHostEnvironment environment,
        IIdentityService identityService,
        CancellationToken cancellationToken)
    {
        var refreshToken = RefreshTokenCookie.Read(httpContext.Request);
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return Results.Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "invalid_refresh_token",
                detail: "The session is invalid or has expired.");
        }

        var result = await identityService.RefreshAsync(
            refreshToken,
            CreateClientContext(httpContext),
            cancellationToken);
        if (!result.IsSuccess || result.Value is null)
        {
            RefreshTokenCookie.Delete(httpContext.Response, environment);
            return result.ToProblem();
        }

        RefreshTokenCookie.Write(
            httpContext.Response,
            result.Value.RefreshToken,
            result.Value.RefreshTokenExpiresAtUtc,
            environment);
        return Results.Ok(AuthResponse.FromSession(result.Value));
    }

    private static async Task<IResult> LogoutAsync(
        ClaimsPrincipal principal,
        HttpContext httpContext,
        IWebHostEnvironment environment,
        IIdentityService identityService,
        CancellationToken cancellationToken)
    {
        var refreshToken = RefreshTokenCookie.Read(httpContext.Request);
        if (TryGetUserId(principal, out var userId) && !string.IsNullOrWhiteSpace(refreshToken))
        {
            await identityService.LogoutAsync(
                userId,
                refreshToken,
                CreateClientContext(httpContext),
                cancellationToken);
        }

        RefreshTokenCookie.Delete(httpContext.Response, environment);
        return Results.NoContent();
    }

    private static async Task<IResult> GetCurrentUserAsync(
        ClaimsPrincipal principal,
        IIdentityService identityService,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(principal, out var userId))
        {
            return Results.Unauthorized();
        }

        var result = await identityService.GetCurrentUserAsync(userId, cancellationToken);
        return result.IsSuccess && result.Value is not null
            ? Results.Ok(result.Value)
            : result.ToProblem();
    }

    private static async Task<IResult> ForgotPasswordAsync(
        ForgotPasswordRequest request,
        IIdentityService identityService,
        CancellationToken cancellationToken)
    {
        await identityService.RequestPasswordResetAsync(request, cancellationToken);
        return Results.Accepted(value: new
        {
            message = "If the account exists, password reset instructions will be sent."
        });
    }

    private static async Task<IResult> ResetPasswordAsync(
        ResetPasswordRequest request,
        HttpContext httpContext,
        IIdentityService identityService,
        CancellationToken cancellationToken)
    {
        var result = await identityService.ResetPasswordAsync(
            request,
            CreateClientContext(httpContext),
            cancellationToken);
        return result.IsSuccess ? Results.NoContent() : result.ToProblem();
    }

    private static ClientContext CreateClientContext(HttpContext context) =>
        new(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            context.Request.Headers.UserAgent.ToString() is { Length: > 0 } userAgent
                ? userAgent[..Math.Min(userAgent.Length, 512)]
                : null);

    private static bool TryGetUserId(ClaimsPrincipal principal, out Guid userId)
    {
        var subject = principal.FindFirstValue(JwtRegisteredClaimNames.Sub) ??
            principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(subject, out userId);
    }
}
