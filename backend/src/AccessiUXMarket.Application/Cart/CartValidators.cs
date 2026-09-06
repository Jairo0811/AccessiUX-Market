using FluentValidation;

namespace AccessiUXMarket.Application.Cart;

public sealed class AddCartItemRequestValidator : AbstractValidator<AddCartItemRequest>
{
    public AddCartItemRequestValidator()
    {
        RuleFor(request => request.ProductId).NotEmpty();
        RuleFor(request => request.Quantity).InclusiveBetween(1, 99);
    }
}

public sealed class UpdateCartItemRequestValidator : AbstractValidator<UpdateCartItemRequest>
{
    public UpdateCartItemRequestValidator() => RuleFor(request => request.Quantity).InclusiveBetween(1, 99);
}
