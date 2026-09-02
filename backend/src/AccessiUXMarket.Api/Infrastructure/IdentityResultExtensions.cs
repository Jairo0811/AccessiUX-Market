using AccessiUXMarket.Application.Identity;

namespace AccessiUXMarket.Api.Infrastructure;

public static class IdentityResultExtensions
{
    public static IResult ToProblem<T>(this IdentityOperationResult<T> result)
    {
        var firstError = result.Errors.FirstOrDefault() ??
            new IdentityError("request_failed", "The request could not be completed.", IdentityErrorType.Validation);

        if (firstError.Type == IdentityErrorType.Validation)
        {
            var validationErrors = result.Errors
                .GroupBy(error => error.Field ?? "request")
                .ToDictionary(
                    group => group.Key,
                    group => group.Select(error => error.Description).Distinct().ToArray());
            return Results.ValidationProblem(
                validationErrors,
                title: "One or more validation errors occurred.");
        }

        var statusCode = firstError.Type switch
        {
            IdentityErrorType.Conflict => StatusCodes.Status409Conflict,
            IdentityErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
            IdentityErrorType.Forbidden => StatusCodes.Status403Forbidden,
            IdentityErrorType.NotFound => StatusCodes.Status404NotFound,
            _ => StatusCodes.Status400BadRequest
        };

        return Results.Problem(
            statusCode: statusCode,
            title: firstError.Code,
            detail: firstError.Description,
            extensions: new Dictionary<string, object?>
            {
                ["errors"] = result.Errors.Select(error => new
                {
                    error.Code,
                    error.Description,
                    error.Field
                }).ToArray()
            });
    }
}
