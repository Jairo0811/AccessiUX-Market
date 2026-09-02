using System.Text.Json;
using FluentValidation;

namespace AccessiUXMarket.Api.Infrastructure;

public sealed class ValidationFilter<TRequest>(IValidator<TRequest> validator) : IEndpointFilter
    where TRequest : class
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var request = context.Arguments.OfType<TRequest>().FirstOrDefault();
        if (request is null)
        {
            return await next(context);
        }

        var validationResult = await validator.ValidateAsync(
            request,
            context.HttpContext.RequestAborted);
        if (validationResult.IsValid)
        {
            return await next(context);
        }

        var errors = validationResult.Errors
            .GroupBy(error => JsonNamingPolicy.CamelCase.ConvertName(error.PropertyName))
            .ToDictionary(
                group => group.Key,
                group => group.Select(error => error.ErrorMessage).Distinct().ToArray());

        return Results.ValidationProblem(
            errors,
            title: "One or more validation errors occurred.");
    }
}
