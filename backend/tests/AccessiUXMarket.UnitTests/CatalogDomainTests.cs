using AccessiUXMarket.Domain.Catalog;

namespace AccessiUXMarket.UnitTests;

public sealed class CatalogDomainTests
{
    [Fact]
    public void Product_is_created_as_draft()
    {
        var product = CreateProduct(3);
        Assert.Equal(ProductStatus.Draft, product.Status);
    }

    [Fact]
    public void Product_with_stock_can_be_published()
    {
        var product = CreateProduct(3);
        product.Publish(DateTime.UtcNow.AddMinutes(1));
        Assert.Equal(ProductStatus.Published, product.Status);
    }

    [Fact]
    public void Product_without_stock_cannot_be_published()
    {
        var product = CreateProduct(0);
        Assert.Throws<InvalidOperationException>(() => product.Publish(DateTime.UtcNow));
    }

    private static Product CreateProduct(int stock) => new(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "Teclado accesible", "teclado-accesible", "Teclado con alto contraste.", 2500m, "DOP", stock, DateTime.UtcNow);
}
