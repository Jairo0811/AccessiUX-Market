namespace AccessiUXMarket.Application.Orders;

public sealed class OrderPolicyOptions
{
    public const string SectionName = "Orders";
    public int CancellationWindowMinutes { get; set; } = 30;
    public TimeSpan CancellationWindow => TimeSpan.FromMinutes(CancellationWindowMinutes);
}

public sealed record OrderSummaryDto(
    Guid Id,
    string OrderNumber,
    string Status,
    decimal Total,
    string Currency,
    int ItemCount,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc,
    bool CanCancel,
    bool CanComplete,
    bool InvoiceAvailable,
    DateTime CancelUntilUtc,
    string CancellationMessage,
    DateTime? CompletedAtUtc);

public sealed record OrderItemDto(
    Guid ProductId,
    string Name,
    string Slug,
    decimal UnitPrice,
    int Quantity,
    decimal LineTotal);

public sealed record OrderAddressDto(
    string RecipientName,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string Region,
    string PostalCode,
    string CountryCode,
    string Phone);

public sealed record OrderDetailDto(
    Guid Id,
    string OrderNumber,
    string Status,
    string Currency,
    decimal Subtotal,
    decimal ShippingAmount,
    decimal TaxAmount,
    decimal Total,
    string PaymentMethod,
    OrderAddressDto Address,
    IReadOnlyList<OrderItemDto> Items,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc,
    DateTime? CancelledAtUtc,
    DateTime? CompletedAtUtc,
    bool CanCancel,
    bool CanComplete,
    bool InvoiceAvailable,
    DateTime CancelUntilUtc,
    string CancellationMessage);

public sealed record OrderCancellationDto(
    Guid Id,
    string OrderNumber,
    string Status,
    DateTime CancelledAtUtc,
    string Message);

public sealed record OrderCompletionDto(
    Guid Id,
    string OrderNumber,
    string Status,
    DateTime CompletedAtUtc,
    string Message);

public sealed record OrderInvoiceDto(
    string InvoiceNumber,
    Guid OrderId,
    string OrderNumber,
    string Status,
    DateTime IssuedAtUtc,
    string Currency,
    decimal Subtotal,
    decimal ShippingAmount,
    decimal TaxAmount,
    decimal Total,
    string PaymentMethod,
    OrderAddressDto Address,
    IReadOnlyList<OrderItemDto> Items);

public interface IOrderService
{
    Task<IReadOnlyList<OrderSummaryDto>> GetOrdersAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<OrderDetailDto?> GetOrderAsync(Guid userId, Guid orderId, CancellationToken cancellationToken = default);
    Task<OrderCancellationDto?> CancelAsync(Guid userId, Guid orderId, CancellationToken cancellationToken = default);
    Task<OrderCompletionDto?> CompleteAsync(Guid userId, Guid orderId, CancellationToken cancellationToken = default);
    Task<OrderInvoiceDto?> GetInvoiceAsync(Guid userId, Guid orderId, CancellationToken cancellationToken = default);
}
