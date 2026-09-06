using AccessiUXMarket.Domain.Catalog;
using AccessiUXMarket.Domain.Orders;

namespace AccessiUXMarket.UnitTests;

public sealed class CheckoutDomainTests
{
    [Fact]
    public void Order_ComputesTotalsAndSnapshotsItems()
    {
        var now = new DateTime(2026, 9, 6, 18, 30, 0, DateTimeKind.Utc);
        var order = new Order(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "AUX-20260906-TEST1234",
            "DOP",
            2500m,
            150m,
            450m,
            "Card",
            "Cliente Prueba",
            "Calle Principal 1",
            null,
            "Santo Domingo",
            "Distrito Nacional",
            "10127",
            "DO",
            "8095550101",
            now);

        order.AddItem(Guid.NewGuid(), Guid.NewGuid(), "Teclado accesible", "teclado-accesible", 1250m, 2);

        Assert.Equal(3100m, order.Total);
        Assert.Equal(OrderStatus.Pending, order.Status);
        var item = Assert.Single(order.Items);
        Assert.Equal("Teclado accesible", item.ProductName);
        Assert.Equal(2500m, item.LineTotal);
    }

    [Fact]
    public void Product_DecreaseStock_ReducesLiveInventory()
    {
        var now = DateTime.UtcNow;
        var product = new Product(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "Producto", "producto", "Descripción válida", 100m, "DOP", 5, now);

        product.DecreaseStock(2, now.AddMinutes(1));

        Assert.Equal(3, product.StockQuantity);
    }

    [Fact]
    public void Product_DecreaseStock_RejectsQuantityAboveInventory()
    {
        var now = DateTime.UtcNow;
        var product = new Product(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "Producto", "producto", "Descripción válida", 100m, "DOP", 1, now);

        Assert.Throws<InvalidOperationException>(() => product.DecreaseStock(2, now.AddMinutes(1)));
        Assert.Equal(1, product.StockQuantity);
    }
}
