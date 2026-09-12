using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AccessiUXMarket.Api.Infrastructure;
using AccessiUXMarket.Application.Checkout;
using AccessiUXMarket.Domain.Identity;

namespace AccessiUXMarket.Api.Endpoints;

public static class CheckoutEndpoints
{
    public static IEndpointRouteBuilder MapCheckoutEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/checkout")
            .WithTags("Checkout")
            .RequireAuthorization(policy => policy.RequireRole(RoleNames.Customer));

        group.MapPost("/review", ReviewAsync)
            .AddEndpointFilter<ValidationFilter<CheckoutRequest>>();

        group.MapPost("/confirm", ConfirmAsync)
            .AddEndpointFilter<ValidationFilter<CheckoutRequest>>();

        return endpoints;
    }

    private static async Task<IResult> ReviewAsync(
        CheckoutRequest request,
        HttpContext context,
        ICheckoutService service,
        CancellationToken ct)
    {
        var review = await service.ReviewAsync(GetUserId(context.User), request, ct);
        return Results.Ok(review);
    }

    private static async Task<IResult> ConfirmAsync(
        CheckoutRequest request,
        HttpContext context,
        ICheckoutService service,
        CancellationToken ct)
    {
        try
        {
            var confirmation = await service.ConfirmAsync(GetUserId(context.User), request, ct);
            return Results.Created($"/api/v1/orders/{confirmation.OrderId}", confirmation);
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
