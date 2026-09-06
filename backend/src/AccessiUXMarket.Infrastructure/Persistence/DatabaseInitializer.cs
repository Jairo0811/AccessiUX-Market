using AccessiUXMarket.Infrastructure.Catalog;
using AccessiUXMarket.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace AccessiUXMarket.Infrastructure.Persistence;

public static class DatabaseInitializer
{
    public static async Task InitializeDatabaseAsync(
        this IServiceProvider services,
        bool applyMigrations,
        bool seedRoles,
        bool seedCatalog,
        bool seedDemoUsers = false,
        CancellationToken cancellationToken = default)
    {
        if (!applyMigrations && !seedRoles && !seedCatalog && !seedDemoUsers)
        {
            return;
        }

        await using var scope = services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        if (applyMigrations)
        {
            await dbContext.Database.MigrateAsync(cancellationToken);
        }

        var identitySeeder = scope.ServiceProvider.GetRequiredService<IdentityDataSeeder>();
        if (seedRoles)
        {
            await identitySeeder.SeedRolesAsync();
        }

        if (seedCatalog)
        {
            await scope.ServiceProvider.GetRequiredService<CatalogDataSeeder>().SeedAsync(cancellationToken);
        }

        if (seedDemoUsers)
        {
            await identitySeeder.SeedDemoUsersAsync(cancellationToken);
        }
    }
}
