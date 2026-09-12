namespace AccessiUXMarket.Application.Admin;

public sealed record AdminOverviewDto(
    int TotalUsers,
    int ActiveUsers,
    int Sellers,
    int Products,
    int PublishedProducts,
    int Orders);

public interface IAdminService
{
    Task<AdminOverviewDto> GetOverviewAsync(CancellationToken cancellationToken = default);
}
