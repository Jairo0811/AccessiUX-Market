using AccessiUXMarket.Domain.Catalog;
using AccessiUXMarket.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AccessiUXMarket.Infrastructure.Catalog;

public sealed class CatalogDataSeeder(ApplicationDbContext dbContext, TimeProvider timeProvider)
{
    private static readonly (string Name, string Slug, string Description)[] Defaults =
    [
        ("Tecnología", "tecnologia", "Computadoras, dispositivos y accesorios."),
        ("Hogar", "hogar", "Productos para el hogar y la vida diaria."),
        ("Moda", "moda", "Ropa, calzado y accesorios."),
        ("Salud y bienestar", "salud-bienestar", "Productos de bienestar y cuidado personal."),
        ("Libros y educación", "libros-educacion", "Libros, materiales educativos y aprendizaje.")
    ];

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var existing = await dbContext.Categories.Select(x => x.Slug).ToHashSetAsync(cancellationToken);
        var now = timeProvider.GetUtcNow().UtcDateTime;
        foreach (var item in Defaults.Where(x => !existing.Contains(x.Slug)))
            dbContext.Categories.Add(new Category(Guid.NewGuid(), item.Name, item.Slug, item.Description, now));
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
