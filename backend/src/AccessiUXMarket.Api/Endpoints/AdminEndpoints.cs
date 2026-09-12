using AccessiUXMarket.Application.Admin;
using AccessiUXMarket.Domain.Identity;

namespace AccessiUXMarket.Api.Endpoints;

public static class AdminEndpoints
{
    public static IEndpointRouteBuilder MapAdminEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints
            .MapGroup("/api/v1/admin")
            .WithTags("Admin")
            .RequireAuthorization(policy => policy.RequireRole(RoleNames.Administrator));

        group.MapGet("/overview", async (IAdminService service, CancellationToken ct) =>
            Results.Ok(await service.GetOverviewAsync(ct)));

        return endpoints;
    }
}
