using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace AccessiUXMarket.IntegrationTests;

public sealed class TestApplicationFactory : WebApplicationFactory<Program>
{
    private readonly IReadOnlyDictionary<string, string?> _settings;

    public TestApplicationFactory(string connectionString)
    {
        _settings = new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = connectionString,
            ["Database:ApplyMigrations"] = "true",
            ["Database:SeedRoles"] = "true",
            ["Database:SeedCatalog"] = "true",
            ["Jwt:Issuer"] = "AccessiUXMarket.IntegrationTests",
            ["Jwt:Audience"] = "AccessiUXMarket.IntegrationTests",
            ["Jwt:SigningKey"] = "AccessiUXMarket_IntegrationTests_SigningKey_2026_Only",
            ["Jwt:AccessTokenMinutes"] = "15",
            ["Jwt:RefreshTokenDays"] = "7",
            ["Cors:AllowedOrigins:0"] = "http://localhost:4200",
            ["PasswordReset:FrontendUrl"] = "http://localhost:4200/reset-password",
            ["Smtp:Enabled"] = "false",
            ["RateLimiting:AuthPermitLimit"] = "1000",
            ["RateLimiting:PasswordResetPermitLimit"] = "1000"
        };
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(_settings);
        });
    }
}
