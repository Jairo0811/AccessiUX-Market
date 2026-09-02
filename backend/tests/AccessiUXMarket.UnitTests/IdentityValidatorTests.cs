using AccessiUXMarket.Application.Identity;

namespace AccessiUXMarket.UnitTests;

public sealed class IdentityValidatorTests
{
    [Fact]
    public void RegisterValidator_RejectsWeakAndMalformedInput()
    {
        var validator = new RegisterRequestValidator();

        var result = validator.Validate(new RegisterRequest("invalid", "short", ""));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(RegisterRequest.Email));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(RegisterRequest.Password));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(RegisterRequest.FullName));
    }

    [Fact]
    public void RegisterValidator_AcceptsValidInput()
    {
        var validator = new RegisterRequestValidator();

        var result = validator.Validate(new RegisterRequest(
            "jairo@example.com",
            "AccessiUX_2026!",
            "Jairo Matías"));

        Assert.True(result.IsValid);
    }
}
