using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AccessiUXMarket.Api.Infrastructure;
using AccessiUXMarket.Application.Catalog;
using AccessiUXMarket.Domain.Identity;

namespace AccessiUXMarket.Api.Endpoints;

public static class CatalogEndpoints
{
    public static IEndpointRouteBuilder MapCatalogEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/catalog").WithTags("Catalog");
        group.MapGet("/categories", async (ICatalogService service, CancellationToken ct) => Results.Ok(await service.GetCategoriesAsync(ct)));
        group.MapGet("/products", async (ICatalogService service, CancellationToken ct) => Results.Ok(await service.GetPublishedProductsAsync(ct)));
        group.MapGet("/products/{slug}", async (string slug, ICatalogService service, CancellationToken ct) =>
            await service.GetPublishedProductBySlugAsync(slug, ct) is { } product ? Results.Ok(product) : Results.NotFound());
        group.MapGet("/sellers/{slug}", async (string slug, ICatalogService service, CancellationToken ct) =>
            await service.GetSellerBySlugAsync(slug, ct) is { } seller ? Results.Ok(seller) : Results.NotFound());

        group.MapGet("/seller/me", async (HttpContext context, ICatalogService service, CancellationToken ct) =>
            await service.GetSellerByUserIdAsync(GetUserId(context.User), ct) is { } seller ? Results.Ok(seller) : Results.NotFound())
            .RequireAuthorization();
        group.MapGet("/seller/products", async (HttpContext context, ICatalogService service, CancellationToken ct) =>
            Results.Ok(await service.GetSellerProductsAsync(GetUserId(context.User), ct)))
            .RequireAuthorization(policy => policy.RequireRole(RoleNames.Seller));
        group.MapPost("/seller", CreateSellerAsync).AddEndpointFilter<ValidationFilter<CreateSellerRequest>>().RequireAuthorization();
        group.MapPost("/seller/products", CreateProductAsync).AddEndpointFilter<ValidationFilter<CreateProductRequest>>()
            .RequireAuthorization(policy => policy.RequireRole(RoleNames.Seller));
        group.MapPost("/seller/products/{productId:guid}/publish", PublishAsync)
            .RequireAuthorization(policy => policy.RequireRole(RoleNames.Seller));
        return endpoints;
    }

    private static async Task<IResult> CreateSellerAsync(CreateSellerRequest request, HttpContext context, ICatalogService service, CancellationToken ct)
    {
        try { return Results.Created("/api/v1/catalog/seller/me", await service.CreateSellerAsync(GetUserId(context.User), request, ct)); }
        catch (InvalidOperationException ex) { return Results.Conflict(new { message = ex.Message }); }
    }

    private static async Task<IResult> CreateProductAsync(CreateProductRequest request, HttpContext context, ICatalogService service, CancellationToken ct)
    {
        try { var product = await service.CreateProductAsync(GetUserId(context.User), request, ct); return Results.Created($"/api/v1/catalog/products/{product.Slug}", product); }
        catch (InvalidOperationException ex) { return Results.Conflict(new { message = ex.Message }); }
    }

    private static async Task<IResult> PublishAsync(Guid productId, HttpContext context, ICatalogService service, CancellationToken ct)
    {
        try { return await service.PublishProductAsync(GetUserId(context.User), productId, ct) ? Results.NoContent() : Results.NotFound(); }
        catch (InvalidOperationException ex) { return Results.Conflict(new { message = ex.Message }); }
    }

    private static Guid GetUserId(ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? user.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(value, out var id) ? id : throw new UnauthorizedAccessException("Authenticated user id is invalid.");
    }
}
