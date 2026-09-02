namespace AccessiUXMarket.Application.Identity;

public sealed record RegisterRequest(string Email, string Password, string FullName);

public sealed record LoginRequest(string Email, string Password);

public sealed record ForgotPasswordRequest(string Email);

public sealed record ResetPasswordRequest(string Email, string Token, string NewPassword);

public sealed record ClientContext(string IpAddress, string? UserAgent);

public sealed record CurrentUser(
    Guid Id,
    string Email,
    string FullName,
    bool EmailConfirmed,
    IReadOnlyCollection<string> Roles);

public sealed record AuthSession(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAtUtc,
    string RefreshToken,
    DateTimeOffset RefreshTokenExpiresAtUtc,
    CurrentUser User);

public sealed record AuthResponse(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAtUtc,
    string TokenType,
    CurrentUser User)
{
    public static AuthResponse FromSession(AuthSession session) =>
        new(session.AccessToken, session.AccessTokenExpiresAtUtc, "Bearer", session.User);
}
