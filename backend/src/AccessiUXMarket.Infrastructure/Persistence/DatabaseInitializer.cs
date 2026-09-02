using AccessiUXMarket.Infrastructure.Catalog;
using AccessiUXMarket.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace AccessiUXMarket.Infrastructure.Persistence;

public static class DatabaseInitializer
{
    public static async Task InitializeDatabaseAsync(this IServiceProvider services, bool applyMigrations, bool seedRoles, bool seedCatalog, CancellationToken cancellationToken = default)
    {
        if (!applyMigrations && !seedRoles && !seedCatalog) return;
        await using var scope = services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        if (applyMigrations) await dbContext.Database.MigrateAsync(cancellationToken);
        if (seedRoles) await scope.ServiceProvider.GetRequiredService<IdentityDataSeeder>().SeedAsync();
        if (seedCatalog) await scope.ServiceProvider.GetRequiredService<CatalogDataSeeder>().SeedAsync(cancellationToken);
    }
}
