namespace AccessiUXMarket.Api.Infrastructure;

public static class RefreshTokenCookie
{
    public const string Name = "accessiux_refresh";
    private const string CookiePath = "/api/v1/auth";

    public static string? Read(HttpRequest request) => request.Cookies[Name];

    public static void Write(
        HttpResponse response,
        string refreshToken,
        DateTimeOffset expiresAtUtc,
        IWebHostEnvironment environment)
    {
        response.Cookies.Append(Name, refreshToken, CreateOptions(expiresAtUtc, environment));
    }

    public static void Delete(HttpResponse response, IWebHostEnvironment environment)
    {
        response.Cookies.Delete(Name, CreateOptions(DateTimeOffset.UnixEpoch, environment));
    }

    private static CookieOptions CreateOptions(
        DateTimeOffset expiresAtUtc,
        IWebHostEnvironment environment) =>
        new()
        {
            HttpOnly = true,
            Secure = environment.IsProduction(),
            SameSite = SameSiteMode.Strict,
            Path = CookiePath,
            Expires = expiresAtUtc,
            IsEssential = true
        };
}
