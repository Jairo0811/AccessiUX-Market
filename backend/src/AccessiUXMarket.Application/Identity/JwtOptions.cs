namespace AccessiUXMarket.Application.Identity;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; init; } = string.Empty;

    public string Audience { get; init; } = string.Empty;

    public string SigningKey { get; init; } = string.Empty;

    public int AccessTokenMinutes { get; init; } = 15;

    public int RefreshTokenDays { get; init; } = 7;
}

public sealed class PasswordResetOptions
{
    public const string SectionName = "PasswordReset";

    public string FrontendUrl { get; init; } = "http://localhost:4200/reset-password";
}

public sealed class SmtpOptions
{
    public const string SectionName = "Smtp";

    public bool Enabled { get; init; }

    public string Host { get; init; } = string.Empty;

    public int Port { get; init; } = 587;

    public bool EnableSsl { get; init; } = true;

    public string UserName { get; init; } = string.Empty;

    public string Password { get; init; } = string.Empty;

    public string FromAddress { get; init; } = string.Empty;

    public string FromName { get; init; } = "AccessiUX Market";
}
