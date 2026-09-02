using FluentValidation;

namespace AccessiUXMarket.Application.Catalog;

public sealed class CreateSellerRequestValidator : AbstractValidator<CreateSellerRequest>
{
    public CreateSellerRequestValidator()
    {
        RuleFor(x => x.DisplayName)
            .NotEmpty()
            .MaximumLength(120);

        RuleFor(x => x.Slug)
            .NotEmpty()
            .MaximumLength(140)
            .Matches("^[a-z0-9]+(?:-[a-z0-9]+)*$");

        RuleFor(x => x.Description)
            .MaximumLength(1000);
    }
}

public sealed class CreateProductRequestValidator : AbstractValidator<CreateProductRequest>
{
    public CreateProductRequestValidator()
    {
        RuleFor(x => x.CategoryId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(180);
        RuleFor(x => x.Slug)
            .NotEmpty()
            .MaximumLength(200)
            .Matches("^[a-z0-9]+(?:-[a-z0-9]+)*$");
        RuleFor(x => x.Description).NotEmpty().MaximumLength(5000);
        RuleFor(x => x.Price).GreaterThan(0).LessThanOrEqualTo(99_999_999m);
        RuleFor(x => x.Currency).NotEmpty().Length(3).Matches("^[A-Za-z]{3}$");
        RuleFor(x => x.StockQuantity).GreaterThanOrEqualTo(0).LessThanOrEqualTo(1_000_000);
    }
}
