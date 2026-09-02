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
        CancellationToken cancellationToken = default)
    {
        if (!applyMigrations && !seedRoles)
        {
            return;
        }

        await using var scope = services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        if (applyMigrations)
        {
            await dbContext.Database.MigrateAsync(cancellationToken);
        }

        if (seedRoles)
        {
            var seeder = scope.ServiceProvider.GetRequiredService<IdentityDataSeeder>();
            await seeder.SeedAsync();
        }
    }
}
