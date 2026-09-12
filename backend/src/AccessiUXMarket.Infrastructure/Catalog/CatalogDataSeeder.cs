using AccessiUXMarket.Domain.Catalog;
using AccessiUXMarket.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AccessiUXMarket.Infrastructure.Catalog;

public sealed class CatalogDataSeeder(ApplicationDbContext dbContext, TimeProvider timeProvider)
{
    private const string DemoSellerEmail = "seller@accessiux.local";

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

    public async Task SeedDemoSellerAsync(CancellationToken cancellationToken = default)
    {
        var normalizedEmail = DemoSellerEmail.ToUpperInvariant();
        var userId = await dbContext.Users
            .AsNoTracking()
            .Where(user => user.NormalizedEmail == normalizedEmail)
            .Select(user => (Guid?)user.Id)
            .SingleOrDefaultAsync(cancellationToken);

        if (userId is null || await dbContext.SellerProfiles.AnyAsync(seller => seller.UserId == userId.Value, cancellationToken))
        {
            return;
        }

        var seller = new SellerProfile(
            Guid.NewGuid(),
            userId.Value,
            "Vendedor Demo",
            "vendedor-demo",
            "Tienda demostrativa de AccessiUX Market para validar el flujo de vendedores.",
            timeProvider.GetUtcNow().UtcDateTime);

        seller.UpdatePolicies(
            "Garantía limitada de 12 meses para los productos de demostración.",
            "Envíos nacionales de demostración con seguimiento y estado visible.",
            "Devoluciones de demostración aceptadas dentro de 30 días.");

        dbContext.SellerProfiles.Add(seller);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
