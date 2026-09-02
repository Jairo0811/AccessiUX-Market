namespace AccessiUXMarket.Application.Identity;

public interface IIdentityService
{
    Task<IdentityOperationResult<AuthSession>> RegisterAsync(
        RegisterRequest request,
        ClientContext client,
        CancellationToken cancellationToken);

    Task<IdentityOperationResult<AuthSession>> LoginAsync(
        LoginRequest request,
        ClientContext client,
        CancellationToken cancellationToken);

    Task<IdentityOperationResult<AuthSession>> RefreshAsync(
        string refreshToken,
        ClientContext client,
        CancellationToken cancellationToken);

    Task LogoutAsync(
        Guid userId,
        string refreshToken,
        ClientContext client,
        CancellationToken cancellationToken);

    Task<IdentityOperationResult<CurrentUser>> GetCurrentUserAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task RequestPasswordResetAsync(
        ForgotPasswordRequest request,
        CancellationToken cancellationToken);

    Task<IdentityOperationResult<bool>> ResetPasswordAsync(
        ResetPasswordRequest request,
        ClientContext client,
        CancellationToken cancellationToken);
}

public interface IPasswordResetNotifier
{
    Task SendAsync(string recipientEmail, string resetToken, CancellationToken cancellationToken);
}
