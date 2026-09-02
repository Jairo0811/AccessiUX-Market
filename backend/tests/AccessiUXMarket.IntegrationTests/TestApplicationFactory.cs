using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace AccessiUXMarket.IntegrationTests;

public sealed class TestApplicationFactory : WebApplicationFactory<Program>
{
    public TestApplicationFactory(string connectionString)
    {
        SetEnvironmentConfiguration(new Dictionary<string, string>
        {
            ["ASPNETCORE_ENVIRONMENT"] = "Testing",
            ["ConnectionStrings__DefaultConnection"] = connectionString,
            ["Database__ApplyMigrations"] = "true",
            ["Database__SeedRoles"] = "true",
            ["Database__SeedCatalog"] = "true",
            ["Jwt__Issuer"] = "AccessiUXMarket.IntegrationTests",
            ["Jwt__Audience"] = "AccessiUXMarket.IntegrationTests",
            ["Jwt__SigningKey"] = "AccessiUXMarket_IntegrationTests_SigningKey_2026_Only",
            ["Jwt__AccessTokenMinutes"] = "15",
            ["Jwt__RefreshTokenDays"] = "7",
            ["Cors__AllowedOrigins__0"] = "http://localhost:4200",
            ["PasswordReset__FrontendUrl"] = "http://localhost:4200/reset-password",
            ["Smtp__Enabled"] = "false",
            ["RateLimiting__AuthPermitLimit"] = "1000",
            ["RateLimiting__PasswordResetPermitLimit"] = "1000"
        });
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
    }

    private static void SetEnvironmentConfiguration(IReadOnlyDictionary<string, string> settings)
    {
        foreach (var (key, value) in settings)
        {
            Environment.SetEnvironmentVariable(key, value);
        }
    }
}
