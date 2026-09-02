namespace AccessiUXMarket.Application.Identity;

public enum IdentityErrorType
{
    Validation,
    Conflict,
    Unauthorized,
    Forbidden,
    NotFound
}

public sealed record IdentityError(
    string Code,
    string Description,
    IdentityErrorType Type,
    string? Field = null);

public sealed class IdentityOperationResult<T>
{
    private IdentityOperationResult(T value)
    {
        Value = value;
        Errors = [];
        IsSuccess = true;
    }

    private IdentityOperationResult(IReadOnlyCollection<IdentityError> errors)
    {
        Errors = errors;
        IsSuccess = false;
    }

    public bool IsSuccess { get; }

    public T? Value { get; }

    public IReadOnlyCollection<IdentityError> Errors { get; }

    public static IdentityOperationResult<T> Success(T value) => new(value);

    public static IdentityOperationResult<T> Failure(params IdentityError[] errors) => new(errors);
}
