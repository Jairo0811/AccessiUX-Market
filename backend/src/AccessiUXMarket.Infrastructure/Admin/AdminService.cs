using AccessiUXMarket.Application.Admin;
using AccessiUXMarket.Domain.Catalog;
using AccessiUXMarket.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AccessiUXMarket.Infrastructure.Admin;

public sealed class AdminService(ApplicationDbContext dbContext) : IAdminService
{
    public async Task<AdminOverviewDto> GetOverviewAsync(CancellationToken cancellationToken = default)
    {
        var totalUsers = await dbContext.Users.AsNoTracking().CountAsync(cancellationToken);
        var activeUsers = await dbContext.Users.AsNoTracking().CountAsync(user => user.IsActive, cancellationToken);
        var sellers = await dbContext.SellerProfiles.AsNoTracking().CountAsync(seller => seller.IsActive, cancellationToken);
        var products = await dbContext.Products.AsNoTracking().CountAsync(cancellationToken);
        var publishedProducts = await dbContext.Products.AsNoTracking().CountAsync(product => product.Status == ProductStatus.Published, cancellationToken);
        var orders = await dbContext.Orders.AsNoTracking().CountAsync(cancellationToken);

        return new AdminOverviewDto(totalUsers, activeUsers, sellers, products, publishedProducts, orders);
    }
}
