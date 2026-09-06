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

    private OrderSummaryDto ToSummary(Order order, DateTime now)
    {
        var deadline = order.GetCancellationDeadlineUtc(cancellationWindow);
        var canCancel = order.CanCancel(now, cancellationWindow);

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
            deadline,
            GetCancellationMessage(order, now, deadline, canCancel));
    }

    private OrderDetailDto ToDetail(Order order, DateTime now)
    {
        var deadline = order.GetCancellationDeadlineUtc(cancellationWindow);
        var canCancel = order.CanCancel(now, cancellationWindow);

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
            new OrderAddressDto(
                order.RecipientName,
                order.AddressLine1,
                order.AddressLine2,
                order.City,
                order.Region,
                order.PostalCode,
                order.CountryCode,
                order.Phone),
            order.Items
                .Select(item => new OrderItemDto(
                    item.ProductId,
                    item.ProductName,
                    item.ProductSlug,
                    item.UnitPrice,
                    item.Quantity,
                    item.LineTotal))
                .ToArray(),
            order.CreatedAtUtc,
            order.UpdatedAtUtc,
            order.Status == OrderStatus.Cancelled ? order.UpdatedAtUtc : null,
            canCancel,
            deadline,
            GetCancellationMessage(order, now, deadline, canCancel));
    }

    private static string GetCancellationMessage(Order order, DateTime now, DateTime deadline, bool canCancel)
    {
        if (order.Status == OrderStatus.Cancelled)
        {
            return "This order has been cancelled.";
        }

        if (order.Status != OrderStatus.Pending)
        {
            return "Cancellation is unavailable because fulfillment has already started.";
        }

        if (!canCancel || now > deadline)
        {
            return "The cancellation window for this order has expired.";
        }

        return $"This order can be cancelled until {deadline:O}.";
    }
}
