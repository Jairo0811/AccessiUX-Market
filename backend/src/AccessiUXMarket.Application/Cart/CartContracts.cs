namespace AccessiUXMarket.Application.Cart;

public sealed record AddCartItemRequest(Guid ProductId, int Quantity);
public sealed record UpdateCartItemRequest(int Quantity);

public sealed record CartItemDto(
    Guid ProductId,
    string Name,
    string Slug,
    decimal UnitPrice,
    string Currency,
    int Quantity,
    int AvailableStock,
    decimal LineTotal);

public sealed record CartDto(
    IReadOnlyList<CartItemDto> Items,
    int TotalQuantity,
    decimal Subtotal,
    string Currency);

public interface ICartService
{
    Task<CartDto> GetAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<CartDto> AddAsync(Guid userId, AddCartItemRequest request, CancellationToken cancellationToken = default);
    Task<CartDto> UpdateAsync(Guid userId, Guid productId, UpdateCartItemRequest request, CancellationToken cancellationToken = default);
    Task<CartDto> RemoveAsync(Guid userId, Guid productId, CancellationToken cancellationToken = default);
    Task ClearAsync(Guid userId, CancellationToken cancellationToken = default);
}
