using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using AccessiUXMarket.Application.Cart;
using AccessiUXMarket.Application.Catalog;
using AccessiUXMarket.Application.Checkout;
using AccessiUXMarket.Application.Identity;
using AccessiUXMarket.Application.Orders;
using Microsoft.AspNetCore.Mvc.Testing;

namespace AccessiUXMarket.IntegrationTests;

public sealed class OrderEndpointsTests(IdentityApiFixture fixture) : IClassFixture<IdentityApiFixture>
{
    private const string AuthRoot = "/api/v1/auth";
    private const string CatalogRoot = "/api/v1/catalog";
    private const string CartRoot = "/api/v1/cart";
    private const string CheckoutRoot = "/api/v1/checkout";
    private const string OrdersRoot = "/api/v1/orders";

    [Fact]
    public async Task Orders_RequireAuthentication()
    {
        using var client = CreateClient();

        var listResponse = await client.GetAsync(OrdersRoot);
        var detailResponse = await client.GetAsync($"{OrdersRoot}/{Guid.NewGuid()}");
        var cancelResponse = await client.PostAsJsonAsync($"{OrdersRoot}/{Guid.NewGuid()}/cancel", new { });

        Assert.Equal(HttpStatusCode.Unauthorized, listResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, detailResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, cancelResponse.StatusCode);
    }

    [Fact]
    public async Task Orders_ListAndDetail_ExposeServerAuthoritativeCancellationMetadata()
    {
        using var client = CreateClient();
        await AuthenticateNewCustomerAsync(client, "orders-list");
        var product = await CreatePublishedProductAsync(client, stock: 4, prefix: "orders-list");
        var confirmation = await CreateOrderAsync(client, product.Id, quantity: 2);

        var orders = await client.GetFromJsonAsync<List<OrderSummaryDto>>(OrdersRoot);
        Assert.NotNull(orders);
        var summary = Assert.Single(orders, order => order.Id == confirmation.OrderId);
        Assert.Equal("Pending", summary.Status);
        Assert.True(summary.CanCancel);
        Assert.True(summary.CancelUntilUtc > summary.CreatedAtUtc);
        Assert.Contains("cancel", summary.CancellationMessage, StringComparison.OrdinalIgnoreCase);

        var detailResponse = await client.GetAsync($"{OrdersRoot}/{confirmation.OrderId}");
        Assert.Equal(HttpStatusCode.OK, detailResponse.StatusCode);
        var detail = await detailResponse.Content.ReadFromJsonAsync<OrderDetailDto>();
        Assert.NotNull(detail);
        Assert.Equal(confirmation.OrderNumber, detail.OrderNumber);
        Assert.Equal("Pending", detail.Status);
        Assert.True(detail.CanCancel);
        Assert.Equal(2, Assert.Single(detail.Items).Quantity);
        Assert.Equal(product.Price * 2, detail.Subtotal);
        Assert.Equal("Cliente Pedidos", detail.Address.RecipientName);
    }

    [Fact]
    public async Task Cancel_ChangesStatusAndRestoresInventoryAtomically()
    {
        using var client = CreateClient();
        await AuthenticateNewCustomerAsync(client, "orders-cancel");
        var product = await CreatePublishedProductAsync(client, stock: 5, prefix: "orders-cancel");
        var confirmation = await CreateOrderAsync(client, product.Id, quantity: 2);

        var afterCheckout = await client.GetFromJsonAsync<ProductDto>($"{CatalogRoot}/products/{product.Slug}");
        Assert.NotNull(afterCheckout);
        Assert.Equal(3, afterCheckout.StockQuantity);

        var cancelResponse = await client.PostAsJsonAsync($"{OrdersRoot}/{confirmation.OrderId}/cancel", new { });
        Assert.Equal(HttpStatusCode.OK, cancelResponse.StatusCode);
        var cancellation = await cancelResponse.Content.ReadFromJsonAsync<OrderCancellationDto>();
        Assert.NotNull(cancellation);
        Assert.Equal("Cancelled", cancellation.Status);
        Assert.Equal(confirmation.OrderNumber, cancellation.OrderNumber);

        var detail = await client.GetFromJsonAsync<OrderDetailDto>($"{OrdersRoot}/{confirmation.OrderId}");
        Assert.NotNull(detail);
        Assert.Equal("Cancelled", detail.Status);
        Assert.False(detail.CanCancel);
        Assert.NotNull(detail.CancelledAtUtc);

        var afterCancellation = await client.GetFromJsonAsync<ProductDto>($"{CatalogRoot}/products/{product.Slug}");
        Assert.NotNull(afterCancellation);
        Assert.Equal(5, afterCancellation.StockQuantity);
    }

    [Fact]
    public async Task Cancel_RejectsSecondCancellationWithoutRestoringStockTwice()
    {
        using var client = CreateClient();
        await AuthenticateNewCustomerAsync(client, "orders-double-cancel");
        var product = await CreatePublishedProductAsync(client, stock: 3, prefix: "orders-double-cancel");
        var confirmation = await CreateOrderAsync(client, product.Id, quantity: 1);

        var first = await client.PostAsJsonAsync($"{OrdersRoot}/{confirmation.OrderId}/cancel", new { });
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        var second = await client.PostAsJsonAsync($"{OrdersRoot}/{confirmation.OrderId}/cancel", new { });
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);

        var productAfter = await client.GetFromJsonAsync<ProductDto>($"{CatalogRoot}/products/{product.Slug}");
        Assert.NotNull(productAfter);
        Assert.Equal(3, productAfter.StockQuantity);
    }

    [Fact]
    public async Task Orders_DoNotExposeAnotherUsersOrder()
    {
        using var owner = CreateClient();
        await AuthenticateNewCustomerAsync(owner, "orders-owner");
        var product = await CreatePublishedProductAsync(owner, stock: 2, prefix: "orders-owner");
        var confirmation = await CreateOrderAsync(owner, product.Id, quantity: 1);

        using var otherUser = CreateClient();
        await AuthenticateNewCustomerAsync(otherUser, "orders-other");

        var detail = await otherUser.GetAsync($"{OrdersRoot}/{confirmation.OrderId}");
        var cancel = await otherUser.PostAsJsonAsync($"{OrdersRoot}/{confirmation.OrderId}/cancel", new { });

        Assert.Equal(HttpStatusCode.NotFound, detail.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, cancel.StatusCode);
    }

    private HttpClient CreateClient() => fixture.Factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });

    private static CheckoutRequest CreateCheckoutRequest() => new(
        new CheckoutAddressRequest(
            "Cliente Pedidos",
            "Av. 27 de Febrero 100",
            "Apto. 4B",
            "Santo Domingo",
            "Distrito Nacional",
            "10127",
            "DO",
            "8095550101"),
        "Card");

    private static async Task<CheckoutConfirmationDto> CreateOrderAsync(HttpClient client, Guid productId, int quantity)
    {
        var add = await client.PostAsJsonAsync($"{CartRoot}/items", new AddCartItemRequest(productId, quantity));
        Assert.Equal(HttpStatusCode.OK, add.StatusCode);

        var confirm = await client.PostAsJsonAsync($"{CheckoutRoot}/confirm", CreateCheckoutRequest());
        Assert.Equal(HttpStatusCode.Created, confirm.StatusCode);
        var confirmation = await confirm.Content.ReadFromJsonAsync<CheckoutConfirmationDto>();
        Assert.NotNull(confirmation);
        return confirmation;
    }

    private static async Task AuthenticateNewCustomerAsync(HttpClient client, string prefix)
    {
        var email = $"{prefix}-{Guid.NewGuid():N}@example.com";
        var response = await client.PostAsJsonAsync(
            $"{AuthRoot}/register",
            new RegisterRequest(email, "AccessiUX_2026!", "Orders Test User"));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var session = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(session);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", session.AccessToken);
    }

    private static async Task<ProductDto> CreatePublishedProductAsync(HttpClient client, int stock, string prefix)
    {
        var sellerResponse = await client.PostAsJsonAsync(
            $"{CatalogRoot}/seller",
            new CreateSellerRequest("Orders test seller", $"{prefix}-seller-{Guid.NewGuid():N}", null));
        Assert.Equal(HttpStatusCode.Created, sellerResponse.StatusCode);

        var categories = await client.GetFromJsonAsync<List<CategoryDto>>($"{CatalogRoot}/categories");
        Assert.NotNull(categories);
        var category = categories.First();

        var productResponse = await client.PostAsJsonAsync(
            $"{CatalogRoot}/seller/products",
            new CreateProductRequest(
                category.Id,
                "Producto para pedidos",
                $"{prefix}-product-{Guid.NewGuid():N}",
                "Producto de integración para validar pedidos y cancelaciones.",
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
