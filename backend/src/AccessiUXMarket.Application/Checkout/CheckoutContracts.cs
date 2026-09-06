namespace AccessiUXMarket.Application.Checkout;

public sealed record CheckoutAddressRequest(
    string RecipientName,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string Region,
    string PostalCode,
    string CountryCode,
    string Phone);

public sealed record CheckoutRequest(
    CheckoutAddressRequest Address,
    string PaymentMethod);

public sealed record CheckoutItemDto(
    Guid ProductId,
    string Name,
    string Slug,
    decimal UnitPrice,
    int Quantity,
    int AvailableStock,
    decimal LineTotal);

public sealed record CheckoutReviewDto(
    IReadOnlyList<CheckoutItemDto> Items,
    CheckoutAddressRequest Address,
    string PaymentMethod,
    decimal Subtotal,
    decimal ShippingAmount,
    decimal TaxAmount,
    decimal Total,
    string Currency,
    bool CanConfirm,
    IReadOnlyList<string> Warnings);

public sealed record CheckoutConfirmationDto(
    Guid OrderId,
    string OrderNumber,
    decimal Total,
    string Currency,
    string Status,
    DateTime CreatedAtUtc);

public interface ICheckoutService
{
    Task<CheckoutReviewDto> ReviewAsync(Guid userId, CheckoutRequest request, CancellationToken cancellationToken = default);
    Task<CheckoutConfirmationDto> ConfirmAsync(Guid userId, CheckoutRequest request, CancellationToken cancellationToken = default);
}
