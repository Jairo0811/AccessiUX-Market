using FluentValidation;

namespace AccessiUXMarket.Application.Checkout;

public sealed class CheckoutRequestValidator : AbstractValidator<CheckoutRequest>
{
    public CheckoutRequestValidator()
    {
        RuleFor(request => request.Address).NotNull().SetValidator(new CheckoutAddressRequestValidator());
        RuleFor(request => request.PaymentMethod)
            .NotEmpty()
            .Must(method => method is "Card" or "CashOnDelivery")
            .WithMessage("PaymentMethod must be Card or CashOnDelivery.");
    }
}

public sealed class CheckoutAddressRequestValidator : AbstractValidator<CheckoutAddressRequest>
{
    public CheckoutAddressRequestValidator()
    {
        RuleFor(address => address.RecipientName).NotEmpty().MaximumLength(150);
        RuleFor(address => address.AddressLine1).NotEmpty().MaximumLength(200);
        RuleFor(address => address.AddressLine2).MaximumLength(200);
        RuleFor(address => address.City).NotEmpty().MaximumLength(120);
        RuleFor(address => address.Region).NotEmpty().MaximumLength(120);
        RuleFor(address => address.PostalCode).NotEmpty().MaximumLength(20);
        RuleFor(address => address.CountryCode)
            .NotEmpty()
            .Length(2)
            .Matches("^[A-Za-z]{2}$");
        RuleFor(address => address.Phone).NotEmpty().MaximumLength(30);
    }
}
