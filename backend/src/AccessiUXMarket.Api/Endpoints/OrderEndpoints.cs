using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AccessiUXMarket.Application.Orders;

namespace AccessiUXMarket.Api.Endpoints;

public static class OrderEndpoints
{
    public static IEndpointRouteBuilder MapOrderEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/orders")
            .WithTags("Orders")
            .RequireAuthorization();

        group.MapGet("/", GetOrdersAsync);
        group.MapGet("/{orderId:guid}", GetOrderAsync);
        group.MapPost("/{orderId:guid}/cancel", CancelOrderAsync);

        return endpoints;
    }

    private static async Task<IResult> GetOrdersAsync(
        HttpContext context,
        IOrderService service,
        CancellationToken ct)
    {
        var orders = await service.GetOrdersAsync(GetUserId(context.User), ct);
        return Results.Ok(orders);
    }

    private static async Task<IResult> GetOrderAsync(
        Guid orderId,
        HttpContext context,
        IOrderService service,
        CancellationToken ct)
    {
        var order = await service.GetOrderAsync(GetUserId(context.User), orderId, ct);
        return order is null
            ? Results.NotFound(new { message = "Order not found." })
            : Results.Ok(order);
    }

    private static async Task<IResult> CancelOrderAsync(
        Guid orderId,
        HttpContext context,
        IOrderService service,
        CancellationToken ct)
    {
        try
        {
            var result = await service.CancelAsync(GetUserId(context.User), orderId, ct);
            return result is null
                ? Results.NotFound(new { message = "Order not found." })
                : Results.Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return Results.Conflict(new { message = ex.Message });
        }
    }

    private static Guid GetUserId(ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? user.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(value, out var id)
            ? id
            : throw new UnauthorizedAccessException("Authenticated user id is invalid.");
    }
}
