namespace AccessiUXMarket.Domain.Orders;

public enum OrderStatus
{
    Pending = 0,
    Confirmed = 1,
    Cancelled = 2
}

public sealed class Order
{
    private Order() { }

    public Order(
        Guid id,
        Guid userId,
        string orderNumber,
        string currency,
        decimal subtotal,
        decimal shippingAmount,
        decimal taxAmount,
        string paymentMethod,
        string recipientName,
        string addressLine1,
        string? addressLine2,
        string city,
        string region,
        string postalCode,
        string countryCode,
        string phone,
        DateTime createdAtUtc)
    {
        if (subtotal < 0 || shippingAmount < 0 || taxAmount < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(subtotal), "Order amounts cannot be negative.");
        }

        Id = id;
        UserId = userId;
        OrderNumber = orderNumber.Trim().ToUpperInvariant();
        Currency = currency.Trim().ToUpperInvariant();
        Subtotal = subtotal;
        ShippingAmount = shippingAmount;
        TaxAmount = taxAmount;
        Total = subtotal + shippingAmount + taxAmount;
        PaymentMethod = paymentMethod.Trim();
        RecipientName = recipientName.Trim();
        AddressLine1 = addressLine1.Trim();
        AddressLine2 = string.IsNullOrWhiteSpace(addressLine2) ? null : addressLine2.Trim();
        City = city.Trim();
        Region = region.Trim();
        PostalCode = postalCode.Trim();
        CountryCode = countryCode.Trim().ToUpperInvariant();
        Phone = phone.Trim();
        Status = OrderStatus.Pending;
        CreatedAtUtc = createdAtUtc;
        UpdatedAtUtc = createdAtUtc;
    }

    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string OrderNumber { get; private set; } = string.Empty;
    public OrderStatus Status { get; private set; }
    public string Currency { get; private set; } = "DOP";
    public decimal Subtotal { get; private set; }
    public decimal ShippingAmount { get; private set; }
    public decimal TaxAmount { get; private set; }
    public decimal Total { get; private set; }
    public string PaymentMethod { get; private set; } = string.Empty;
    public string RecipientName { get; private set; } = string.Empty;
    public string AddressLine1 { get; private set; } = string.Empty;
    public string? AddressLine2 { get; private set; }
    public string City { get; private set; } = string.Empty;
    public string Region { get; private set; } = string.Empty;
    public string PostalCode { get; private set; } = string.Empty;
    public string CountryCode { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }
    public List<OrderItem> Items { get; private set; } = [];

    public DateTime GetCancellationDeadlineUtc(TimeSpan cancellationWindow)
    {
        ValidateCancellationWindow(cancellationWindow);
        return CreatedAtUtc.Add(cancellationWindow);
    }

    public bool CanCancel(DateTime utcNow, TimeSpan cancellationWindow)
    {
        return Status == OrderStatus.Pending && utcNow <= GetCancellationDeadlineUtc(cancellationWindow);
    }

    public void Cancel(DateTime utcNow, TimeSpan cancellationWindow)
    {
        if (Status == OrderStatus.Cancelled)
        {
            throw new InvalidOperationException("The order has already been cancelled.");
        }

        if (Status != OrderStatus.Pending)
        {
            throw new InvalidOperationException("The order can no longer be cancelled because fulfillment has already started.");
        }

        if (utcNow > GetCancellationDeadlineUtc(cancellationWindow))
        {
            throw new InvalidOperationException("The cancellation window for this order has expired.");
        }

        Status = OrderStatus.Cancelled;
        UpdatedAtUtc = utcNow;
    }

    public void Complete(DateTime utcNow)
    {
        if (Status == OrderStatus.Cancelled)
        {
            throw new InvalidOperationException("A cancelled order cannot be marked as completed.");
        }

        if (Status == OrderStatus.Confirmed)
        {
            throw new InvalidOperationException("The purchase has already been marked as completed.");
        }

        if (Status != OrderStatus.Pending)
        {
            throw new InvalidOperationException("The order cannot be completed from its current status.");
        }

        Status = OrderStatus.Confirmed;
        UpdatedAtUtc = utcNow;
    }

    public void AddItem(Guid id, Guid productId, string productName, string productSlug, decimal unitPrice, int quantity)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be greater than zero.");
        }

        Items.Add(new OrderItem(id, Id, productId, productName, productSlug, unitPrice, quantity));
    }

    private static void ValidateCancellationWindow(TimeSpan cancellationWindow)
    {
        if (cancellationWindow <= TimeSpan.Zero)
        {
            throw new ArgumentOutOfRangeException(nameof(cancellationWindow), "Cancellation window must be greater than zero.");
        }
    }
}

public sealed class OrderItem
{
    private OrderItem() { }

    internal OrderItem(Guid id, Guid orderId, Guid productId, string productName, string productSlug, decimal unitPrice, int quantity)
    {
        if (unitPrice < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(unitPrice), "Unit price cannot be negative.");
        }

        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be greater than zero.");
        }

        Id = id;
        OrderId = orderId;
        ProductId = productId;
        ProductName = productName.Trim();
        ProductSlug = productSlug.Trim().ToLowerInvariant();
        UnitPrice = unitPrice;
        Quantity = quantity;
        LineTotal = unitPrice * quantity;
    }

    public Guid Id { get; private set; }
    public Guid OrderId { get; private set; }
    public Guid ProductId { get; private set; }
    public string ProductName { get; private set; } = string.Empty;
    public string ProductSlug { get; private set; } = string.Empty;
    public decimal UnitPrice { get; private set; }
    public int Quantity { get; private set; }
    public decimal LineTotal { get; private set; }
}
