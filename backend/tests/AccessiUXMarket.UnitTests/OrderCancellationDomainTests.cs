using AccessiUXMarket.Domain.Catalog;
using AccessiUXMarket.Domain.Orders;

namespace AccessiUXMarket.UnitTests;

public sealed class OrderCancellationDomainTests
{
    private static readonly TimeSpan CancellationWindow = TimeSpan.FromMinutes(30);

    [Fact]
    public void Order_CanCancel_WithinConfiguredWindow()
    {
        var createdAt = new DateTime(2026, 9, 6, 18, 0, 0, DateTimeKind.Utc);
        var order = CreateOrder(createdAt);

        Assert.True(order.CanCancel(createdAt.AddMinutes(29), CancellationWindow));
        Assert.Equal(createdAt.AddMinutes(30), order.GetCancellationDeadlineUtc(CancellationWindow));
    }

    [Fact]
    public void Order_Cancel_ChangesStatusInsideWindow()
    {
        var createdAt = new DateTime(2026, 9, 6, 18, 0, 0, DateTimeKind.Utc);
        var cancelledAt = createdAt.AddMinutes(10);
        var order = CreateOrder(createdAt);

        order.Cancel(cancelledAt, CancellationWindow);

        Assert.Equal(OrderStatus.Cancelled, order.Status);
        Assert.Equal(cancelledAt, order.UpdatedAtUtc);
        Assert.False(order.CanCancel(cancelledAt, CancellationWindow));
    }

    [Fact]
    public void Order_Cancel_RejectsExpiredWindow()
    {
        var createdAt = new DateTime(2026, 9, 6, 18, 0, 0, DateTimeKind.Utc);
        var order = CreateOrder(createdAt);

        var exception = Assert.Throws<InvalidOperationException>(() =>
            order.Cancel(createdAt.AddMinutes(31), CancellationWindow));

        Assert.Contains("expired", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(OrderStatus.Pending, order.Status);
    }

    [Fact]
    public void Order_Cancel_RejectsSecondCancellation()
    {
        var createdAt = new DateTime(2026, 9, 6, 18, 0, 0, DateTimeKind.Utc);
        var order = CreateOrder(createdAt);
        order.Cancel(createdAt.AddMinutes(5), CancellationWindow);

        Assert.Throws<InvalidOperationException>(() =>
            order.Cancel(createdAt.AddMinutes(6), CancellationWindow));
    }

    [Fact]
    public void Product_IncreaseStock_RestoresInventory()
    {
        var now = new DateTime(2026, 9, 6, 18, 0, 0, DateTimeKind.Utc);
        var product = new Product(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "Producto", "producto", "Descripción válida", 100m, "DOP", 3, now);

        product.IncreaseStock(2, now.AddMinutes(1));

        Assert.Equal(5, product.StockQuantity);
        Assert.Equal(now.AddMinutes(1), product.UpdatedAtUtc);
    }

    private static Order CreateOrder(DateTime createdAt)
    {
        return new Order(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "AUX-20260906-CANCEL01",
            "DOP",
            1000m,
            0m,
            180m,
            "Card",
            "Cliente Prueba",
            "Calle Principal 1",
            null,
            "Santo Domingo",
            "Distrito Nacional",
            "10127",
            "DO",
            "8095550101",
            createdAt);
    }
}
