using System.Text;
using AccessiUXMarket.Application.Catalog;
using AccessiUXMarket.Application.Identity;
using AccessiUXMarket.Infrastructure.Catalog;
using AccessiUXMarket.Infrastructure.Identity;
using AccessiUXMarket.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AccessiUXMarket.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("ConnectionStrings:DefaultConnection must be configured at runtime.");
        }

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(connectionString, sqlOptions => sqlOptions.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null)));

        services.AddHealthChecks().AddDbContextCheck<ApplicationDbContext>("database");

        services.AddIdentityCore<ApplicationUser>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.Password.RequiredLength = 12;
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireNonAlphanumeric = true;
                options.Lockout.AllowedForNewUsers = true;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
                options.Tokens.PasswordResetTokenProvider = TokenOptions.DefaultProvider;
            })
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

        services.AddOptions<JwtOptions>()
            .Bind(configuration.GetSection(JwtOptions.SectionName))
            .Validate(options => !string.IsNullOrWhiteSpace(options.Issuer), "Jwt:Issuer is required.")
            .Validate(options => !string.IsNullOrWhiteSpace(options.Audience), "Jwt:Audience is required.")
            .Validate(options => Encoding.UTF8.GetByteCount(options.SigningKey) >= 32, "Jwt:SigningKey must contain at least 32 bytes.")
            .Validate(options => options.AccessTokenMinutes is >= 5 and <= 60, "Access token lifetime must be 5-60 minutes.")
            .Validate(options => options.RefreshTokenDays is >= 1 and <= 30, "Refresh token lifetime must be 1-30 days.")
            .ValidateOnStart();

        services.AddOptions<PasswordResetOptions>()
            .Bind(configuration.GetSection(PasswordResetOptions.SectionName))
            .Validate(options => Uri.TryCreate(options.FrontendUrl, UriKind.Absolute, out _), "PasswordReset:FrontendUrl must be an absolute URL.")
            .ValidateOnStart();

        services.AddOptions<SmtpOptions>()
            .Bind(configuration.GetSection(SmtpOptions.SectionName))
            .Validate(options => !options.Enabled || (!string.IsNullOrWhiteSpace(options.Host) && options.Port is > 0 and <= 65535 && !string.IsNullOrWhiteSpace(options.FromAddress)),
                "Enabled SMTP delivery requires Host, Port and FromAddress.")
            .ValidateOnStart();

        services.AddSingleton(TimeProvider.System);
        services.AddScoped<IJwtTokenFactory, JwtTokenFactory>();
        services.AddScoped<IPasswordResetNotifier, SmtpPasswordResetNotifier>();
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddScoped<ICatalogService, CatalogService>();
        services.AddScoped<IdentityDataSeeder>();
        services.AddScoped<CatalogDataSeeder>();
        return services;
    }
}
