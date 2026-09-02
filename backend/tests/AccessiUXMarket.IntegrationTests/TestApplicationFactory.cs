using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace AccessiUXMarket.IntegrationTests;

public sealed class TestApplicationFactory(string connectionString) : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = connectionString,
                ["Database:ApplyMigrations"] = "true",
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
            });
        });
    }
}
