using System.Data;
using AccessiUXMarket.Application.Orders;
using AccessiUXMarket.Domain.Orders;
using AccessiUXMarket.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace AccessiUXMarket.Infrastructure.Orders;

public sealed class OrderService(
    ApplicationDbContext dbContext,
    TimeProvider timeProvider,
    IOptions<OrderPolicyOptions> options) : IOrderService
{
    private readonly TimeSpan cancellationWindow = options.Value.CancellationWindow;

    public async Task<IReadOnlyList<OrderSummaryDto>> GetOrdersAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var now = timeProvider.GetUtcNow().UtcDateTime;
        var orders = await dbContext.Orders
            .AsNoTracking()
            .Include(order => order.Items)
            .Where(order => order.UserId == userId)
            .OrderByDescending(order => order.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        return orders.Select(order => ToSummary(order, now)).ToArray();
    }

    public async Task<OrderDetailDto?> GetOrderAsync(
        Guid userId,
        Guid orderId,
        CancellationToken cancellationToken = default)
    {
        var order = await dbContext.Orders
            .AsNoTracking()
            .Include(candidate => candidate.Items)
            .SingleOrDefaultAsync(candidate => candidate.Id == orderId && candidate.UserId == userId, cancellationToken);

        return order is null ? null : ToDetail(order, timeProvider.GetUtcNow().UtcDateTime);
    }

    public async Task<OrderCancellationDto?> CancelAsync(
        Guid userId,
        Guid orderId,
        CancellationToken cancellationToken = default)
    {
        var strategy = dbContext.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await dbContext.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

            var order = await dbContext.Orders
                .Include(candidate => candidate.Items)
                .SingleOrDefaultAsync(candidate => candidate.Id == orderId && candidate.UserId == userId, cancellationToken);

            if (order is null)
            {
                return null;
            }

            var now = timeProvider.GetUtcNow().UtcDateTime;
            order.Cancel(now, cancellationWindow);

            var productIds = order.Items.Select(item => item.ProductId).Distinct().ToArray();
            var products = await dbContext.Products
                .Where(product => productIds.Contains(product.Id))
                .ToDictionaryAsync(product => product.Id, cancellationToken);

            foreach (var item in order.Items)
            {
                if (!products.TryGetValue(item.ProductId, out var product))
                {
                    throw new InvalidOperationException($"Product {item.ProductId} required to reverse order stock no longer exists.");
                }

                product.IncreaseStock(item.Quantity, now);
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return new OrderCancellationDto(
                order.Id,
                order.OrderNumber,
                order.Status.ToString(),
                order.UpdatedAtUtc,
                "Order cancelled successfully. Reserved stock was restored.");
        });
    }

    public async Task<OrderCompletionDto?> CompleteAsync(
        Guid userId,
        Guid orderId,
        CancellationToken cancellationToken = default)
    {
        var strategy = dbContext.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await dbContext.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

            var order = await dbContext.Orders
                .SingleOrDefaultAsync(candidate => candidate.Id == orderId && candidate.UserId == userId, cancellationToken);

            if (order is null)
            {
                return null;
            }

            var now = timeProvider.GetUtcNow().UtcDateTime;
            order.Complete(now);

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return new OrderCompletionDto(
                order.Id,
                order.OrderNumber,
                order.Status.ToString(),
                order.UpdatedAtUtc,
                "Purchase marked as completed. Cancellation is now disabled and the invoice is available.");
        });
    }

    public async Task<OrderInvoiceDto?> GetInvoiceAsync(
        Guid userId,
        Guid orderId,
        CancellationToken cancellationToken = default)
    {
        var order = await dbContext.Orders
            .AsNoTracking()
            .Include(candidate => candidate.Items)
            .SingleOrDefaultAsync(candidate => candidate.Id == orderId && candidate.UserId == userId, cancellationToken);

        if (order is null)
        {
            return null;
        }

        if (order.Status != OrderStatus.Confirmed)
        {
            throw new InvalidOperationException("The invoice is available only after the purchase has been marked as completed.");
        }

        return new OrderInvoiceDto(
            CreateInvoiceNumber(order.OrderNumber),
            order.Id,
            order.OrderNumber,
            order.Status.ToString(),
            order.UpdatedAtUtc,
            order.Currency,
            order.Subtotal,
            order.ShippingAmount,
            order.TaxAmount,
            order.Total,
            order.PaymentMethod,
            ToAddress(order),
            ToItems(order));
    }

    private OrderSummaryDto ToSummary(Order order, DateTime now)
    {
        var deadline = order.GetCancellationDeadlineUtc(cancellationWindow);
        var canCancel = order.CanCancel(now, cancellationWindow);
        var completed = order.Status == OrderStatus.Confirmed;

        return new OrderSummaryDto(
            order.Id,
            order.OrderNumber,
            order.Status.ToString(),
            order.Total,
            order.Currency,
            order.Items.Sum(item => item.Quantity),
            order.CreatedAtUtc,
            order.UpdatedAtUtc,
            canCancel,
            order.Status == OrderStatus.Pending,
            completed,
            deadline,
            GetCancellationMessage(order, now, deadline, canCancel),
            completed ? order.UpdatedAtUtc : null);
    }

    private OrderDetailDto ToDetail(Order order, DateTime now)
    {
        var deadline = order.GetCancellationDeadlineUtc(cancellationWindow);
        var canCancel = order.CanCancel(now, cancellationWindow);
        var completed = order.Status == OrderStatus.Confirmed;

        return new OrderDetailDto(
            order.Id,
            order.OrderNumber,
            order.Status.ToString(),
            order.Currency,
            order.Subtotal,
            order.ShippingAmount,
            order.TaxAmount,
            order.Total,
            order.PaymentMethod,
            ToAddress(order),
            ToItems(order),
            order.CreatedAtUtc,
            order.UpdatedAtUtc,
            order.Status == OrderStatus.Cancelled ? order.UpdatedAtUtc : null,
            completed ? order.UpdatedAtUtc : null,
            canCancel,
            order.Status == OrderStatus.Pending,
            completed,
            deadline,
            GetCancellationMessage(order, now, deadline, canCancel));
    }

    private static OrderAddressDto ToAddress(Order order) => new(
        order.RecipientName,
        order.AddressLine1,
        order.AddressLine2,
        order.City,
        order.Region,
        order.PostalCode,
        order.CountryCode,
        order.Phone);

    private static IReadOnlyList<OrderItemDto> ToItems(Order order) => order.Items
        .Select(item => new OrderItemDto(
            item.ProductId,
            item.ProductName,
            item.ProductSlug,
            item.UnitPrice,
            item.Quantity,
            item.LineTotal))
        .ToArray();

    private static string GetCancellationMessage(Order order, DateTime now, DateTime deadline, bool canCancel)
    {
        if (order.Status == OrderStatus.Cancelled)
        {
            return "This order has been cancelled.";
        }

        if (order.Status == OrderStatus.Confirmed)
        {
            return "Purchase completed. Cancellation is no longer available.";
        }

        if (!canCancel || now > deadline)
        {
            return "The cancellation window for this order has expired.";
        }

        return $"This order can be cancelled until {deadline:O}.";
    }

    private static string CreateInvoiceNumber(string orderNumber)
    {
        const string orderPrefix = "AUX-";
        return orderNumber.StartsWith(orderPrefix, StringComparison.OrdinalIgnoreCase)
            ? $"FAC-{orderNumber[orderPrefix.Length..]}"
            : $"FAC-{orderNumber}";
    }
}
