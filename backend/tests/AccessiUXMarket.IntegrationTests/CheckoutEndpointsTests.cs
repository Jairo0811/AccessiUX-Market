using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using AccessiUXMarket.Application.Cart;
using AccessiUXMarket.Application.Catalog;
using AccessiUXMarket.Application.Checkout;
using AccessiUXMarket.Application.Identity;
using Microsoft.AspNetCore.Mvc.Testing;

namespace AccessiUXMarket.IntegrationTests;

public sealed class CheckoutEndpointsTests(IdentityApiFixture fixture) : IClassFixture<IdentityApiFixture>
{
    private const string AuthRoot = "/api/v1/auth";
    private const string CatalogRoot = "/api/v1/catalog";
    private const string CartRoot = "/api/v1/cart";
    private const string CheckoutRoot = "/api/v1/checkout";

    [Fact]
    public async Task Checkout_RequiresAuthentication()
    {
        using var client = CreateClient();
        var response = await client.PostAsJsonAsync($"{CheckoutRoot}/review", CreateCheckoutRequest());
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Review_ExposesItemsAddressPaymentAndTotalsBeforeConfirmation()
    {
        using var client = CreateClient();
        await AuthenticateNewCustomerAsync(client, "checkout-review");
        var product = await CreatePublishedProductAsync(client, stock: 5);
        var add = await client.PostAsJsonAsync($"{CartRoot}/items", new AddCartItemRequest(product.Id, 2));
        Assert.Equal(HttpStatusCode.OK, add.StatusCode);

        var request = CreateCheckoutRequest();
        var response = await client.PostAsJsonAsync($"{CheckoutRoot}/review", request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var review = await response.Content.ReadFromJsonAsync<CheckoutReviewDto>();
        Assert.NotNull(review);
        Assert.True(review.CanConfirm);
        Assert.Empty(review.Warnings);
        Assert.Equal(request.Address, review.Address);
        Assert.Equal(request.PaymentMethod, review.PaymentMethod);
        Assert.Equal(product.Price * 2, review.Subtotal);
        Assert.Equal(review.Subtotal + review.ShippingAmount + review.TaxAmount, review.Total);
        Assert.Equal("DOP", review.Currency);
        Assert.Single(review.Items);
    }

    [Fact]
    public async Task Confirm_CreatesOrderDecrementsStockAndClearsCart()
    {
        using var client = CreateClient();
        await AuthenticateNewCustomerAsync(client, "checkout-confirm");
        var product = await CreatePublishedProductAsync(client, stock: 4);
        var add = await client.PostAsJsonAsync($"{CartRoot}/items", new AddCartItemRequest(product.Id, 2));
        Assert.Equal(HttpStatusCode.OK, add.StatusCode);

        var response = await client.PostAsJsonAsync($"{CheckoutRoot}/confirm", CreateCheckoutRequest());

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var confirmation = await response.Content.ReadFromJsonAsync<CheckoutConfirmationDto>();
        Assert.NotNull(confirmation);
        Assert.StartsWith("AUX-", confirmation.OrderNumber);
        Assert.Equal(product.Price * 2, confirmation.Total);
        Assert.Equal("DOP", confirmation.Currency);
        Assert.Equal("Pending", confirmation.Status);

        var cart = await client.GetFromJsonAsync<CartDto>(CartRoot);
        Assert.NotNull(cart);
        Assert.Empty(cart.Items);

        var productAfterCheckout = await client.GetFromJsonAsync<ProductDto>($"{CatalogRoot}/products/{product.Slug}");
        Assert.NotNull(productAfterCheckout);
        Assert.Equal(2, productAfterCheckout.StockQuantity);
    }

    [Fact]
    public async Task Confirm_RejectsEmptyCart()
    {
        using var client = CreateClient();
        await AuthenticateNewCustomerAsync(client, "checkout-empty");

        var response = await client.PostAsJsonAsync($"{CheckoutRoot}/confirm", CreateCheckoutRequest());

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Confirm_RevalidatesStockAfterReview()
    {
        using var firstClient = CreateClient();
        await AuthenticateNewCustomerAsync(firstClient, "checkout-stock-first");
        var product = await CreatePublishedProductAsync(firstClient, stock: 2);
        var firstAdd = await firstClient.PostAsJsonAsync($"{CartRoot}/items", new AddCartItemRequest(product.Id, 2));
        Assert.Equal(HttpStatusCode.OK, firstAdd.StatusCode);

        var review = await firstClient.PostAsJsonAsync($"{CheckoutRoot}/review", CreateCheckoutRequest());
        Assert.Equal(HttpStatusCode.OK, review.StatusCode);

        using var secondClient = CreateClient();
        await AuthenticateNewCustomerAsync(secondClient, "checkout-stock-second");
        var secondAdd = await secondClient.PostAsJsonAsync($"{CartRoot}/items", new AddCartItemRequest(product.Id, 1));
        Assert.Equal(HttpStatusCode.OK, secondAdd.StatusCode);
        var secondConfirm = await secondClient.PostAsJsonAsync($"{CheckoutRoot}/confirm", CreateCheckoutRequest());
        Assert.Equal(HttpStatusCode.Created, secondConfirm.StatusCode);

        var firstConfirm = await firstClient.PostAsJsonAsync($"{CheckoutRoot}/confirm", CreateCheckoutRequest());
        Assert.Equal(HttpStatusCode.Conflict, firstConfirm.StatusCode);

        var firstCart = await firstClient.GetFromJsonAsync<CartDto>(CartRoot);
        Assert.NotNull(firstCart);
        Assert.Equal(2, Assert.Single(firstCart.Items).Quantity);
    }

    private HttpClient CreateClient() => fixture.Factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });

    private static CheckoutRequest CreateCheckoutRequest() => new(
        new CheckoutAddressRequest(
            "Cliente Checkout",
            "Av. Winston Churchill 100",
            "Apto. 2A",
            "Santo Domingo",
            "Distrito Nacional",
            "10127",
            "DO",
            "8095550101"),
        "Card");

    private static async Task AuthenticateNewCustomerAsync(HttpClient client, string prefix)
    {
        var email = $"{prefix}-{Guid.NewGuid():N}@example.com";
        var response = await client.PostAsJsonAsync($"{AuthRoot}/register", new RegisterRequest(email, "AccessiUX_2026!", "Checkout Test User"));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var session = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(session);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", session.AccessToken);
    }

    private static async Task<ProductDto> CreatePublishedProductAsync(HttpClient client, int stock)
    {
        var sellerResponse = await client.PostAsJsonAsync(
            $"{CatalogRoot}/seller",
            new CreateSellerRequest("Checkout test seller", $"checkout-seller-{Guid.NewGuid():N}", null));
        Assert.Equal(HttpStatusCode.Created, sellerResponse.StatusCode);

        var categories = await client.GetFromJsonAsync<List<CategoryDto>>($"{CatalogRoot}/categories");
        Assert.NotNull(categories);
        var category = categories.First();

        var productResponse = await client.PostAsJsonAsync(
            $"{CatalogRoot}/seller/products",
            new CreateProductRequest(
                category.Id,
                "Producto para checkout",
                $"checkout-product-{Guid.NewGuid():N}",
                "Producto de integración para validar checkout.",
                1500m,
                "DOP",
                stock));
        Assert.Equal(HttpStatusCode.Created, productResponse.StatusCode);
        var product = await productResponse.Content.ReadFromJsonAsync<ProductDto>();
        Assert.NotNull(product);

        var publish = await client.PostAsJsonAsync($"{CatalogRoot}/seller/products/{product.Id}/publish", new { });
        Assert.Equal(HttpStatusCode.NoContent, publish.StatusCode);
        return product;
    }
}
