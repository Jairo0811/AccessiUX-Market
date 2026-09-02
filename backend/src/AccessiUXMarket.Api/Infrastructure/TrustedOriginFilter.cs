using Microsoft.Extensions.Options;

namespace AccessiUXMarket.Api.Infrastructure;

public sealed class TrustedOriginFilter(IOptions<FrontendCorsOptions> options) : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var origin = context.HttpContext.Request.Headers.Origin.ToString();
        if (string.IsNullOrWhiteSpace(origin))
        {
            return await next(context);
        }

        if (options.Value.AllowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
        {
            return await next(context);
        }

        return Results.Problem(
            statusCode: StatusCodes.Status403Forbidden,
            title: "Untrusted request origin",
            detail: "The request origin is not allowed for this session operation.");
    }
}
