using System.Data;
using AccessiUXMarket.Application.Checkout;
using AccessiUXMarket.Domain.Catalog;
using AccessiUXMarket.Domain.Orders;
using AccessiUXMarket.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AccessiUXMarket.Infrastructure.Checkout;

public sealed class CheckoutService(ApplicationDbContext dbContext, TimeProvider timeProvider) : ICheckoutService
{
    private const decimal ShippingAmount = 0m;
    private const decimal TaxAmount = 0m;

    public async Task<CheckoutReviewDto> ReviewAsync(
        Guid userId,
        CheckoutRequest request,
        CancellationToken cancellationToken = default)
    {
        var lines = await (
            from cartItem in dbContext.CartItems.AsNoTracking()
            join product in dbContext.Products.AsNoTracking() on cartItem.ProductId equals product.Id
            where cartItem.UserId == userId
            orderby cartItem.CreatedAtUtc
            select new CheckoutLine(
                product.Id,
                product.Name,
                product.Slug,
                product.Price,
                product.Currency,
                product.StockQuantity,
                product.Status,
                cartItem.Quantity))
            .ToListAsync(cancellationToken);

        return BuildReview(lines, request);
    }

    public async Task<CheckoutConfirmationDto> ConfirmAsync(
        Guid userId,
        CheckoutRequest request,
        CancellationToken cancellationToken = default)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        var cartItems = await dbContext.CartItems
            .Where(item => item.UserId == userId)
            .OrderBy(item => item.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        if (cartItems.Count == 0)
        {
            throw new InvalidOperationException("The cart is empty.");
        }

        var productIds = cartItems.Select(item => item.ProductId).ToArray();
        var products = await dbContext.Products
            .Where(product => productIds.Contains(product.Id))
            .ToDictionaryAsync(product => product.Id, cancellationToken);

        if (products.Count != productIds.Distinct().Count())
        {
            throw new InvalidOperationException("One or more products are no longer available.");
        }

        var currencies = products.Values
            .Select(product => product.Currency)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (currencies.Length != 1)
        {
            throw new InvalidOperationException("All checkout items must use the same currency.");
        }

        var now = timeProvider.GetUtcNow().UtcDateTime;
        var subtotal = 0m;

        foreach (var cartItem in cartItems)
        {
            var product = products[cartItem.ProductId];

            if (product.Status != ProductStatus.Published)
            {
                throw new InvalidOperationException($"{product.Name} is no longer available for purchase.");
            }

            if (cartItem.Quantity > product.StockQuantity)
            {
                throw new InvalidOperationException($"{product.Name} does not have enough stock.");
            }

            subtotal += product.Price * cartItem.Quantity;
        }

        var orderId = Guid.NewGuid();
        var order = new Order(
            orderId,
            userId,
            CreateOrderNumber(now),
            currencies[0],
            subtotal,
            ShippingAmount,
            TaxAmount,
            request.PaymentMethod,
            request.Address.RecipientName,
            request.Address.AddressLine1,
            request.Address.AddressLine2,
            request.Address.City,
            request.Address.Region,
            request.Address.PostalCode,
            request.Address.CountryCode,
            request.Address.Phone,
            now);

        foreach (var cartItem in cartItems)
        {
            var product = products[cartItem.ProductId];
            product.DecreaseStock(cartItem.Quantity, now);
            order.AddItem(
                Guid.NewGuid(),
                product.Id,
                product.Name,
                product.Slug,
                product.Price,
                cartItem.Quantity);
        }

        dbContext.Orders.Add(order);
        dbContext.CartItems.RemoveRange(cartItems);

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return new CheckoutConfirmationDto(
            order.Id,
            order.OrderNumber,
            order.Total,
            order.Currency,
            order.Status.ToString(),
            order.CreatedAtUtc);
    }

    private static CheckoutReviewDto BuildReview(IReadOnlyList<CheckoutLine> lines, CheckoutRequest request)
    {
        if (lines.Count == 0)
        {
            return new CheckoutReviewDto(
                [],
                request.Address,
                request.PaymentMethod,
                0m,
                ShippingAmount,
                TaxAmount,
                0m,
                "DOP",
                false,
                ["Tu carrito está vacío."]);
        }

        var warnings = new List<string>();
        var currencies = lines
            .Select(line => line.Currency)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (currencies.Length != 1)
        {
            warnings.Add("Todos los productos deben usar la misma moneda antes de confirmar la compra.");
        }

        foreach (var line in lines)
        {
            if (line.Status != ProductStatus.Published)
            {
                warnings.Add($"{line.Name} ya no está disponible para compra.");
            }
            else if (line.Quantity > line.AvailableStock)
            {
                warnings.Add($"{line.Name} no tiene existencias suficientes para la cantidad solicitada.");
            }
        }

        var items = lines.Select(line => new CheckoutItemDto(
            line.ProductId,
            line.Name,
            line.Slug,
            line.UnitPrice,
            line.Quantity,
            line.AvailableStock,
            line.UnitPrice * line.Quantity)).ToArray();

        var subtotal = items.Sum(item => item.LineTotal);
        var currency = currencies.Length == 1 ? currencies[0] : lines[0].Currency;

        return new CheckoutReviewDto(
            items,
            request.Address,
            request.PaymentMethod,
            subtotal,
            ShippingAmount,
            TaxAmount,
            subtotal + ShippingAmount + TaxAmount,
            currency,
            warnings.Count == 0,
            warnings);
    }

    private static string CreateOrderNumber(DateTime now)
    {
        var suffix = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
        return $"AUX-{now:yyyyMMdd}-{suffix}";
    }

    private sealed record CheckoutLine(
        Guid ProductId,
        string Name,
        string Slug,
        decimal UnitPrice,
        string Currency,
        int AvailableStock,
        ProductStatus Status,
        int Quantity);
}
