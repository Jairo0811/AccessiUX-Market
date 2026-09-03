using System.Linq.Expressions;
using AccessiUXMarket.Application.Catalog;
using AccessiUXMarket.Domain.Catalog;
using AccessiUXMarket.Domain.Identity;
using AccessiUXMarket.Infrastructure.Identity;
using AccessiUXMarket.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AccessiUXMarket.Infrastructure.Catalog;

public sealed class CatalogService(ApplicationDbContext dbContext, TimeProvider timeProvider, UserManager<ApplicationUser> userManager) : ICatalogService
{
    private static readonly Expression<Func<Product, ProductDto>> ProductProjection = product => new ProductDto(
        product.Id,
        product.SellerId,
        product.CategoryId,
        product.Name,
        product.Slug,
        product.Description,
        product.Price,
        product.Currency,
        product.StockQuantity,
        product.Status.ToString());

    public async Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken = default) =>
        await dbContext.Categories.AsNoTracking().Where(category => category.IsActive).OrderBy(category => category.Name)
            .Select(category => new CategoryDto(category.Id, category.Name, category.Slug, category.Description)).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<ProductDto>> GetPublishedProductsAsync(CancellationToken cancellationToken = default) =>
        await dbContext.Products.AsNoTracking().Where(product => product.Status == ProductStatus.Published).OrderBy(product => product.Name)
            .Select(ProductProjection).ToListAsync(cancellationToken);

    public async Task<CatalogSearchResultDto> SearchPublishedProductsAsync(CatalogSearchRequest request, CancellationToken cancellationToken = default)
    {
        var page = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 48);
        var queryText = request.Query?.Trim();

        var published = dbContext.Products.AsNoTracking().Where(product => product.Status == ProductStatus.Published);
        if (!string.IsNullOrWhiteSpace(queryText))
        {
            published = published.Where(product => EF.Functions.Like(product.Name, $"%{queryText}%") || EF.Functions.Like(product.Description, $"%{queryText}%"));
        }
        if (request.CategoryId is { } categoryId) published = published.Where(product => product.CategoryId == categoryId);
        if (request.MinPrice is { } minPrice) published = published.Where(product => product.Price >= minPrice);
        if (request.MaxPrice is { } maxPrice) published = published.Where(product => product.Price <= maxPrice);
        if (request.InStock is true) published = published.Where(product => product.StockQuantity > 0);
        else if (request.InStock is false) published = published.Where(product => product.StockQuantity == 0);

        var totalCount = await published.CountAsync(cancellationToken);
        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);
        var ordered = request.Sort.Trim().ToLowerInvariant() switch
        {
            "price-asc" => published.OrderBy(product => product.Price).ThenBy(product => product.Name),
            "price-desc" => published.OrderByDescending(product => product.Price).ThenBy(product => product.Name),
            "name" => published.OrderBy(product => product.Name),
            "newest" => published.OrderByDescending(product => product.CreatedAtUtc).ThenBy(product => product.Name),
            _ => published.OrderBy(product => product.Name)
        };

        var items = await ordered.Skip((page - 1) * pageSize).Take(pageSize).Select(ProductProjection).ToListAsync(cancellationToken);

        var facetBase = dbContext.Products.AsNoTracking().Where(product => product.Status == ProductStatus.Published);
        if (!string.IsNullOrWhiteSpace(queryText))
        {
            facetBase = facetBase.Where(product => EF.Functions.Like(product.Name, $"%{queryText}%") || EF.Functions.Like(product.Description, $"%{queryText}%"));
        }

        var categoryFacets = await dbContext.Categories.AsNoTracking().Where(category => category.IsActive)
            .Select(category => new CategoryFacetDto(category.Id, category.Name, category.Slug, facetBase.Count(product => product.CategoryId == category.Id)))
            .Where(facet => facet.Count > 0).OrderBy(facet => facet.Name).ToListAsync(cancellationToken);
        var facetMinPrice = await facetBase.Select(product => (decimal?)product.Price).MinAsync(cancellationToken);
        var facetMaxPrice = await facetBase.Select(product => (decimal?)product.Price).MaxAsync(cancellationToken);

        return new CatalogSearchResultDto(items, totalCount, page, pageSize, totalPages, new CatalogFacetsDto(categoryFacets, facetMinPrice, facetMaxPrice));
    }

    public async Task<ProductDto?> GetPublishedProductBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        var normalizedSlug = slug.Trim().ToLowerInvariant();
        return await dbContext.Products.AsNoTracking().Where(product => product.Status == ProductStatus.Published && product.Slug == normalizedSlug)
            .Select(ProductProjection).SingleOrDefaultAsync(cancellationToken);
    }

    public async Task<SellerDto?> GetSellerBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        var normalizedSlug = slug.Trim().ToLowerInvariant();
        return await dbContext.SellerProfiles.AsNoTracking().Where(seller => seller.IsActive && seller.Slug == normalizedSlug)
            .Select(seller => new SellerDto(seller.Id, seller.DisplayName, seller.Slug, seller.Description)).SingleOrDefaultAsync(cancellationToken);
    }

    public async Task<SellerDto?> GetSellerByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await dbContext.SellerProfiles.AsNoTracking().Where(seller => seller.UserId == userId && seller.IsActive)
            .Select(seller => new SellerDto(seller.Id, seller.DisplayName, seller.Slug, seller.Description)).SingleOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyList<ProductDto>> GetSellerProductsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var sellerId = await dbContext.SellerProfiles.Where(seller => seller.UserId == userId && seller.IsActive)
            .Select(seller => (Guid?)seller.Id).SingleOrDefaultAsync(cancellationToken);
        if (sellerId is null) return [];
        return await dbContext.Products.AsNoTracking().Where(product => product.SellerId == sellerId.Value).OrderByDescending(product => product.CreatedAtUtc)
            .Select(ProductProjection).ToListAsync(cancellationToken);
    }

    public async Task<SellerDto> CreateSellerAsync(Guid userId, CreateSellerRequest request, CancellationToken cancellationToken = default)
    {
        if (await dbContext.SellerProfiles.AnyAsync(seller => seller.UserId == userId, cancellationToken)) throw new InvalidOperationException("The current user already has a seller profile.");
        var normalizedSlug = request.Slug.Trim().ToLowerInvariant();
        if (await dbContext.SellerProfiles.AnyAsync(seller => seller.Slug == normalizedSlug, cancellationToken)) throw new InvalidOperationException("The seller slug is already in use.");
        var user = await userManager.FindByIdAsync(userId.ToString()) ?? throw new InvalidOperationException("The current user does not exist.");
        var seller = new SellerProfile(Guid.NewGuid(), userId, request.DisplayName, normalizedSlug, request.Description, timeProvider.GetUtcNow().UtcDateTime);
        dbContext.SellerProfiles.Add(seller);
        await dbContext.SaveChangesAsync(cancellationToken);
        if (!await userManager.IsInRoleAsync(user, RoleNames.Seller))
        {
            var roleResult = await userManager.AddToRoleAsync(user, RoleNames.Seller);
            if (!roleResult.Succeeded) throw new InvalidOperationException("The Seller role could not be assigned.");
        }
        return new SellerDto(seller.Id, seller.DisplayName, seller.Slug, seller.Description);
    }

    public async Task<ProductDto> CreateProductAsync(Guid userId, CreateProductRequest request, CancellationToken cancellationToken = default)
    {
        var seller = await dbContext.SellerProfiles.SingleOrDefaultAsync(profile => profile.UserId == userId && profile.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("An active seller profile is required.");
        if (!await dbContext.Categories.AnyAsync(category => category.Id == request.CategoryId && category.IsActive, cancellationToken)) throw new InvalidOperationException("The selected category does not exist or is inactive.");
        var normalizedSlug = request.Slug.Trim().ToLowerInvariant();
        if (await dbContext.Products.AnyAsync(product => product.Slug == normalizedSlug, cancellationToken)) throw new InvalidOperationException("The product slug is already in use.");
        var product = new Product(Guid.NewGuid(), seller.Id, request.CategoryId, request.Name, normalizedSlug, request.Description, request.Price, request.Currency, request.StockQuantity, timeProvider.GetUtcNow().UtcDateTime);
        dbContext.Products.Add(product);
        await dbContext.SaveChangesAsync(cancellationToken);
        return ToDto(product);
    }

    public async Task<bool> PublishProductAsync(Guid userId, Guid productId, CancellationToken cancellationToken = default)
    {
        var sellerId = await dbContext.SellerProfiles.Where(seller => seller.UserId == userId && seller.IsActive).Select(seller => (Guid?)seller.Id).SingleOrDefaultAsync(cancellationToken);
        if (sellerId is null) return false;
        var product = await dbContext.Products.SingleOrDefaultAsync(item => item.Id == productId && item.SellerId == sellerId.Value, cancellationToken);
        if (product is null) return false;
        product.Publish(timeProvider.GetUtcNow().UtcDateTime);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static ProductDto ToDto(Product product) => new(product.Id, product.SellerId, product.CategoryId, product.Name, product.Slug, product.Description, product.Price, product.Currency, product.StockQuantity, product.Status.ToString());
}
