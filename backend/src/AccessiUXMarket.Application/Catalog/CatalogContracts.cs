namespace AccessiUXMarket.Application.Catalog;

public sealed record CategoryDto(Guid Id, string Name, string Slug, string? Description);
public sealed record SellerDto(Guid Id, string DisplayName, string Slug, string? Description);
public sealed record ProductDto(Guid Id, Guid SellerId, Guid CategoryId, string Name, string Slug, string Description, decimal Price, string Currency, int StockQuantity, string Status);
public sealed record CreateSellerRequest(string DisplayName, string Slug, string? Description);
public sealed record CreateProductRequest(Guid CategoryId, string Name, string Slug, string Description, decimal Price, string Currency, int StockQuantity);

public interface ICatalogService
{
    Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ProductDto>> GetPublishedProductsAsync(CancellationToken cancellationToken = default);
    Task<ProductDto?> GetPublishedProductBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<SellerDto?> GetSellerBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<SellerDto?> GetSellerByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ProductDto>> GetSellerProductsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<SellerDto> CreateSellerAsync(Guid userId, CreateSellerRequest request, CancellationToken cancellationToken = default);
    Task<ProductDto> CreateProductAsync(Guid userId, CreateProductRequest request, CancellationToken cancellationToken = default);
    Task<bool> PublishProductAsync(Guid userId, Guid productId, CancellationToken cancellationToken = default);
}
