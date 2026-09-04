using AccessiUXMarket.Application.Cart;
using AccessiUXMarket.Domain.Cart;
using AccessiUXMarket.Domain.Catalog;
using AccessiUXMarket.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AccessiUXMarket.Infrastructure.Cart;

public sealed class CartService(ApplicationDbContext dbContext, TimeProvider timeProvider) : ICartService
{
    public async Task<CartDto> GetAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var items = await (
            from item in dbContext.CartItems.AsNoTracking()
            join product in dbContext.Products.AsNoTracking() on item.ProductId equals product.Id
            where item.UserId == userId
            orderby item.CreatedAtUtc
            select new CartItemDto(
                product.Id,
                product.Name,
                product.Slug,
                product.Price,
                product.Currency,
                item.Quantity,
                product.StockQuantity,
                product.Price * item.Quantity))
            .ToListAsync(cancellationToken);

        return BuildCart(items);
    }

    public async Task<CartDto> AddAsync(Guid userId, AddCartItemRequest request, CancellationToken cancellationToken = default)
    {
        var product = await dbContext.Products.SingleOrDefaultAsync(
            item => item.Id == request.ProductId && item.Status == ProductStatus.Published,
            cancellationToken) ?? throw new InvalidOperationException("The selected product is not available.");

        if (product.StockQuantity <= 0) throw new InvalidOperationException("The selected product is out of stock.");

        var currencies = await (
            from item in dbContext.CartItems.AsNoTracking()
            join existingProduct in dbContext.Products.AsNoTracking() on item.ProductId equals existingProduct.Id
            where item.UserId == userId
            select existingProduct.Currency)
            .Distinct()
            .ToListAsync(cancellationToken);

        if (currencies.Count > 0 && currencies.Any(currency => currency != product.Currency))
            throw new InvalidOperationException("Products with different currencies cannot be combined in the same cart.");

        var now = timeProvider.GetUtcNow().UtcDateTime;
        var cartItem = await dbContext.CartItems.SingleOrDefaultAsync(
            item => item.UserId == userId && item.ProductId == request.ProductId,
            cancellationToken);

        var resultingQuantity = (cartItem?.Quantity ?? 0) + request.Quantity;
        if (resultingQuantity > 99) throw new InvalidOperationException("A cart line cannot exceed 99 units.");
        if (resultingQuantity > product.StockQuantity) throw new InvalidOperationException("Requested quantity exceeds available stock.");

        if (cartItem is null)
            dbContext.CartItems.Add(new CartItem(userId, product.Id, request.Quantity, now));
        else
            cartItem.IncreaseQuantity(request.Quantity, now);

        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetAsync(userId, cancellationToken);
    }

    public async Task<CartDto> UpdateAsync(Guid userId, Guid productId, UpdateCartItemRequest request, CancellationToken cancellationToken = default)
    {
        var cartItem = await dbContext.CartItems.SingleOrDefaultAsync(
            item => item.UserId == userId && item.ProductId == productId,
            cancellationToken) ?? throw new KeyNotFoundException("Cart item was not found.");

        var product = await dbContext.Products.AsNoTracking().SingleOrDefaultAsync(
            item => item.Id == productId && item.Status == ProductStatus.Published,
            cancellationToken) ?? throw new InvalidOperationException("The selected product is not available.");

        if (request.Quantity > product.StockQuantity) throw new InvalidOperationException("Requested quantity exceeds available stock.");

        cartItem.SetQuantity(request.Quantity, timeProvider.GetUtcNow().UtcDateTime);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetAsync(userId, cancellationToken);
    }

    public async Task<CartDto> RemoveAsync(Guid userId, Guid productId, CancellationToken cancellationToken = default)
    {
        var item = await dbContext.CartItems.SingleOrDefaultAsync(
            cartItem => cartItem.UserId == userId && cartItem.ProductId == productId,
            cancellationToken);

        if (item is not null)
        {
            dbContext.CartItems.Remove(item);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return await GetAsync(userId, cancellationToken);
    }

    public async Task ClearAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        await dbContext.CartItems.Where(item => item.UserId == userId).ExecuteDeleteAsync(cancellationToken);
    }

    private static CartDto BuildCart(IReadOnlyList<CartItemDto> items)
    {
        var currency = items.Count == 0 ? "DOP" : items[0].Currency;
        return new CartDto(items, items.Sum(item => item.Quantity), items.Sum(item => item.LineTotal), currency);
    }
}
