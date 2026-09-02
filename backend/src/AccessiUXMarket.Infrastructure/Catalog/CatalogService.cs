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
    public async Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken = default) =>
        await dbContext.Categories.AsNoTracking().Where(x => x.IsActive).OrderBy(x => x.Name)
            .Select(x => new CategoryDto(x.Id, x.Name, x.Slug, x.Description)).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<ProductDto>> GetPublishedProductsAsync(CancellationToken cancellationToken = default) =>
        await dbContext.Products.AsNoTracking().Where(x => x.Status == ProductStatus.Published).OrderBy(x => x.Name)
            .Select(x => ToDto(x)).ToListAsync(cancellationToken);

    public async Task<ProductDto?> GetPublishedProductBySlugAsync(string slug, CancellationToken cancellationToken = default) =>
        await dbContext.Products.AsNoTracking().Where(x => x.Status == ProductStatus.Published && x.Slug == slug.Trim().ToLowerInvariant())
            .Select(x => ToDto(x)).SingleOrDefaultAsync(cancellationToken);

    public async Task<SellerDto?> GetSellerBySlugAsync(string slug, CancellationToken cancellationToken = default) =>
        await dbContext.SellerProfiles.AsNoTracking().Where(x => x.IsActive && x.Slug == slug.Trim().ToLowerInvariant())
            .Select(x => new SellerDto(x.Id, x.DisplayName, x.Slug, x.Description)).SingleOrDefaultAsync(cancellationToken);

    public async Task<SellerDto?> GetSellerByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await dbContext.SellerProfiles.AsNoTracking().Where(x => x.UserId == userId && x.IsActive)
            .Select(x => new SellerDto(x.Id, x.DisplayName, x.Slug, x.Description)).SingleOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyList<ProductDto>> GetSellerProductsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var sellerId = await dbContext.SellerProfiles.Where(x => x.UserId == userId && x.IsActive).Select(x => (Guid?)x.Id).SingleOrDefaultAsync(cancellationToken);
        if (sellerId is null) return [];
        return await dbContext.Products.AsNoTracking().Where(x => x.SellerId == sellerId.Value).OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => ToDto(x)).ToListAsync(cancellationToken);
    }

    public async Task<SellerDto> CreateSellerAsync(Guid userId, CreateSellerRequest request, CancellationToken cancellationToken = default)
    {
        if (await dbContext.SellerProfiles.AnyAsync(x => x.UserId == userId, cancellationToken)) throw new InvalidOperationException("The current user already has a seller profile.");
        var slug = request.Slug.Trim().ToLowerInvariant();
        if (await dbContext.SellerProfiles.AnyAsync(x => x.Slug == slug, cancellationToken)) throw new InvalidOperationException("The seller slug is already in use.");
        var user = await userManager.FindByIdAsync(userId.ToString()) ?? throw new InvalidOperationException("The current user does not exist.");
        var seller = new SellerProfile(Guid.NewGuid(), userId, request.DisplayName, slug, request.Description, timeProvider.GetUtcNow().UtcDateTime);
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
        var seller = await dbContext.SellerProfiles.SingleOrDefaultAsync(x => x.UserId == userId && x.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("An active seller profile is required.");
        if (!await dbContext.Categories.AnyAsync(x => x.Id == request.CategoryId && x.IsActive, cancellationToken)) throw new InvalidOperationException("The selected category does not exist or is inactive.");
        var slug = request.Slug.Trim().ToLowerInvariant();
        if (await dbContext.Products.AnyAsync(x => x.Slug == slug, cancellationToken)) throw new InvalidOperationException("The product slug is already in use.");
        var product = new Product(Guid.NewGuid(), seller.Id, request.CategoryId, request.Name, slug, request.Description, request.Price, request.Currency, request.StockQuantity, timeProvider.GetUtcNow().UtcDateTime);
        dbContext.Products.Add(product);
        await dbContext.SaveChangesAsync(cancellationToken);
        return ToDto(product);
    }

    public async Task<bool> PublishProductAsync(Guid userId, Guid productId, CancellationToken cancellationToken = default)
    {
        var sellerId = await dbContext.SellerProfiles.Where(x => x.UserId == userId && x.IsActive).Select(x => (Guid?)x.Id).SingleOrDefaultAsync(cancellationToken);
        if (sellerId is null) return false;
        var product = await dbContext.Products.SingleOrDefaultAsync(x => x.Id == productId && x.SellerId == sellerId.Value, cancellationToken);
        if (product is null) return false;
        product.Publish(timeProvider.GetUtcNow().UtcDateTime);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static ProductDto ToDto(Product x) => new(x.Id, x.SellerId, x.CategoryId, x.Name, x.Slug, x.Description, x.Price, x.Currency, x.StockQuantity, x.Status.ToString());
}
