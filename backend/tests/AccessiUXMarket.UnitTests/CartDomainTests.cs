using AccessiUXMarket.Domain.Cart;

namespace AccessiUXMarket.UnitTests;

public sealed class CartDomainTests
{
    [Fact]
    public void Constructor_RejectsNonPositiveQuantity()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            new CartItem(Guid.NewGuid(), Guid.NewGuid(), 0, DateTime.UtcNow));
    }

    [Fact]
    public void IncreaseQuantity_AddsToExistingQuantity()
    {
        var now = DateTime.UtcNow;
        var item = new CartItem(Guid.NewGuid(), Guid.NewGuid(), 1, now);

        item.IncreaseQuantity(2, now.AddMinutes(1));

        Assert.Equal(3, item.Quantity);
        Assert.Equal(now.AddMinutes(1), item.UpdatedAtUtc);
    }

    [Fact]
    public void SetQuantity_ReplacesQuantityAndTimestamp()
    {
        var now = DateTime.UtcNow;
        var item = new CartItem(Guid.NewGuid(), Guid.NewGuid(), 1, now);

        item.SetQuantity(4, now.AddMinutes(2));

        Assert.Equal(4, item.Quantity);
        Assert.Equal(now.AddMinutes(2), item.UpdatedAtUtc);
    }
}
