using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AccessiUXMarket.Api.Infrastructure;
using AccessiUXMarket.Application.Cart;

namespace AccessiUXMarket.Api.Endpoints;

public static class CartEndpoints
{
    public static IEndpointRouteBuilder MapCartEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/cart")
            .WithTags("Cart")
            .RequireAuthorization();

        group.MapGet(string.Empty, async (HttpContext context, ICartService service, CancellationToken ct) =>
            Results.Ok(await service.GetAsync(GetUserId(context.User), ct)));

        group.MapPost("/items", AddAsync)
            .AddEndpointFilter<ValidationFilter<AddCartItemRequest>>();

        group.MapPut("/items/{productId:guid}", UpdateAsync)
            .AddEndpointFilter<ValidationFilter<UpdateCartItemRequest>>();

        group.MapDelete("/items/{productId:guid}", async (Guid productId, HttpContext context, ICartService service, CancellationToken ct) =>
            Results.Ok(await service.RemoveAsync(GetUserId(context.User), productId, ct)));

        group.MapDelete(string.Empty, async (HttpContext context, ICartService service, CancellationToken ct) =>
        {
            await service.ClearAsync(GetUserId(context.User), ct);
            return Results.NoContent();
        });

        return endpoints;
    }

    private static async Task<IResult> AddAsync(AddCartItemRequest request, HttpContext context, ICartService service, CancellationToken ct)
    {
        try
        {
            return Results.Ok(await service.AddAsync(GetUserId(context.User), request, ct));
        }
        catch (InvalidOperationException ex)
        {
            return Results.Conflict(new { message = ex.Message });
        }
    }

    private static async Task<IResult> UpdateAsync(Guid productId, UpdateCartItemRequest request, HttpContext context, ICartService service, CancellationToken ct)
    {
        try
        {
            return Results.Ok(await service.UpdateAsync(GetUserId(context.User), productId, request, ct));
        }
        catch (KeyNotFoundException)
        {
            return Results.NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return Results.Conflict(new { message = ex.Message });
        }
    }

    private static Guid GetUserId(ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? user.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(value, out var id) ? id : throw new UnauthorizedAccessException("Authenticated user id is invalid.");
    }
}
