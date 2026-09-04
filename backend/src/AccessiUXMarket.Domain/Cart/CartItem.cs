namespace AccessiUXMarket.Domain.Cart;

public sealed class CartItem
{
    private CartItem() { }

    public CartItem(Guid userId, Guid productId, int quantity, DateTime createdAtUtc)
    {
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity), "Cart quantity must be greater than zero.");

        UserId = userId;
        ProductId = productId;
        Quantity = quantity;
        CreatedAtUtc = createdAtUtc;
        UpdatedAtUtc = createdAtUtc;
    }

    public Guid UserId { get; private set; }
    public Guid ProductId { get; private set; }
    public int Quantity { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }

    public void SetQuantity(int quantity, DateTime updatedAtUtc)
    {
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity), "Cart quantity must be greater than zero.");
        Quantity = quantity;
        UpdatedAtUtc = updatedAtUtc;
    }

    public void IncreaseQuantity(int quantity, DateTime updatedAtUtc)
    {
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity to add must be greater than zero.");
        Quantity = checked(Quantity + quantity);
        UpdatedAtUtc = updatedAtUtc;
    }
}
