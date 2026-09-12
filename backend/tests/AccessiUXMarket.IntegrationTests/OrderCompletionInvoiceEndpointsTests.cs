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

public sealed class OrderCompletionInvoiceEndpointsTests(IdentityApiFixture fixture) : IClassFixture<IdentityApiFixture>
{
    private const string AuthRoot = "/api/v1/auth";
    private const string CatalogRoot = "/api/v1/catalog";
    private const string CartRoot = "/api/v1/cart";
    private const string CheckoutRoot = "/api/v1/checkout";
    private const string OrdersRoot = "/api/v1/orders";

    [Fact]
    public async Task CompletionAndInvoice_RequireAuthentication()
    {
        using var client = CreateClient();
        var orderId = Guid.NewGuid();

        var complete = await client.PostAsJsonAsync($"{OrdersRoot}/{orderId}/complete", new { });
        var invoice = await client.GetAsync($"{OrdersRoot}/{orderId}/invoice");

        Assert.Equal(HttpStatusCode.Unauthorized, complete.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, invoice.StatusCode);
    }

    [Fact]
    public async Task Complete_MarksPurchaseCompleted_DisablesCancellation_AndEnablesInvoice()
    {
        using var client = CreateClient();
        await AuthenticateNewCustomerAsync(client, "orders-complete");
        var product = await CreatePublishedProductAsync(client, stock: 5, prefix: "orders-complete");
        var confirmation = await CreateOrderAsync(client, product.Id, quantity: 2);

        var invoiceBefore = await client.GetAsync($"{OrdersRoot}/{confirmation.OrderId}/invoice");
        Assert.Equal(HttpStatusCode.Conflict, invoiceBefore.StatusCode);

        var completeResponse = await client.PostAsJsonAsync($"{OrdersRoot}/{confirmation.OrderId}/complete", new { });
        Assert.Equal(HttpStatusCode.OK, completeResponse.StatusCode);
        var completion = await completeResponse.Content.ReadFromJsonAsync<OrderCompletionDto>();
        Assert.NotNull(completion);
        Assert.Equal("Confirmed", completion.Status);
        Assert.Equal(confirmation.OrderNumber, completion.OrderNumber);

        var detail = await client.GetFromJsonAsync<OrderDetailDto>($"{OrdersRoot}/{confirmation.OrderId}");
        Assert.NotNull(detail);
        Assert.Equal("Confirmed", detail.Status);
        Assert.False(detail.CanCancel);
        Assert.False(detail.CanComplete);
        Assert.True(detail.InvoiceAvailable);
        Assert.NotNull(detail.CompletedAtUtc);

        var cancelAfterCompletion = await client.PostAsJsonAsync($"{OrdersRoot}/{confirmation.OrderId}/cancel", new { });
        Assert.Equal(HttpStatusCode.Conflict, cancelAfterCompletion.StatusCode);

        var invoiceResponse = await client.GetAsync($"{OrdersRoot}/{confirmation.OrderId}/invoice");
        Assert.Equal(HttpStatusCode.OK, invoiceResponse.StatusCode);
        var invoice = await invoiceResponse.Content.ReadFromJsonAsync<OrderInvoiceDto>();
        Assert.NotNull(invoice);
        Assert.StartsWith("FAC-", invoice.InvoiceNumber);
        Assert.Equal(confirmation.OrderId, invoice.OrderId);
        Assert.Equal(confirmation.OrderNumber, invoice.OrderNumber);
        Assert.Equal("Confirmed", invoice.Status);
        Assert.Equal(3000m, invoice.Subtotal);
        Assert.Equal(540m, invoice.TaxAmount);
        Assert.Equal(3540m, invoice.Total);
        Assert.Equal("DO", invoice.Address.CountryCode);
        Assert.Equal(2, Assert.Single(invoice.Items).Quantity);

        var productAfter = await client.GetFromJsonAsync<ProductDto>($"{CatalogRoot}/products/{product.Slug}");
        Assert.NotNull(productAfter);
        Assert.Equal(3, productAfter.StockQuantity);
    }

    [Fact]
    public async Task CancelledOrder_CannotBeCompletedOrInvoiced()
    {
        using var client = CreateClient();
        await AuthenticateNewCustomerAsync(client, "orders-cancelled-invoice");
        var product = await CreatePublishedProductAsync(client, stock: 2, prefix: "orders-cancelled-invoice");
        var confirmation = await CreateOrderAsync(client, product.Id, quantity: 1);

        var cancel = await client.PostAsJsonAsync($"{OrdersRoot}/{confirmation.OrderId}/cancel", new { });
        Assert.Equal(HttpStatusCode.OK, cancel.StatusCode);

        var complete = await client.PostAsJsonAsync($"{OrdersRoot}/{confirmation.OrderId}/complete", new { });
        var invoice = await client.GetAsync($"{OrdersRoot}/{confirmation.OrderId}/invoice");

        Assert.Equal(HttpStatusCode.Conflict, complete.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, invoice.StatusCode);
    }

    [Fact]
    public async Task CompletionAndInvoice_DoNotExposeAnotherUsersOrder()
    {
        using var owner = CreateClient();
        await AuthenticateNewCustomerAsync(owner, "orders-complete-owner");
        var product = await CreatePublishedProductAsync(owner, stock: 2, prefix: "orders-complete-owner");
        var confirmation = await CreateOrderAsync(owner, product.Id, quantity: 1);

        using var other = CreateClient();
        await AuthenticateNewCustomerAsync(other, "orders-complete-other");

        var complete = await other.PostAsJsonAsync($"{OrdersRoot}/{confirmation.OrderId}/complete", new { });
        var invoice = await other.GetAsync($"{OrdersRoot}/{confirmation.OrderId}/invoice");

        Assert.Equal(HttpStatusCode.NotFound, complete.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, invoice.StatusCode);
    }

    private HttpClient CreateClient() => fixture.Factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });

    private static CheckoutRequest CreateCheckoutRequest() => new(
        new CheckoutAddressRequest(
            "Cliente Factura",
            "Av. 27 de Febrero 100",
            null,
            "Santo Domingo",
            "Distrito Nacional",
            "10127",
            "DO",
            "8095550101"),
        "CashOnDelivery");

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
            new RegisterRequest(email, "AccessiUX_2026!", "Invoice Test User"));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var session = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(session);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", session.AccessToken);
    }

    private static async Task<ProductDto> CreatePublishedProductAsync(HttpClient client, int stock, string prefix)
    {
        var sellerResponse = await client.PostAsJsonAsync(
            $"{CatalogRoot}/seller",
            new CreateSellerRequest("Invoice test seller", $"{prefix}-seller-{Guid.NewGuid():N}", null));
        Assert.Equal(HttpStatusCode.Created, sellerResponse.StatusCode);
        await RefreshSellerSessionAsync(client);

        var categories = await client.GetFromJsonAsync<List<CategoryDto>>($"{CatalogRoot}/categories");
        Assert.NotNull(categories);
        var category = categories.First();

        var productResponse = await client.PostAsJsonAsync(
            $"{CatalogRoot}/seller/products",
            new CreateProductRequest(
                category.Id,
                "Producto para factura",
                $"{prefix}-product-{Guid.NewGuid():N}",
                "Producto de integración para validar compra realizada y factura accesible.",
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

    private static async Task RefreshSellerSessionAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync($"{AuthRoot}/refresh", new { });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var session = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(session);
        Assert.Contains("Seller", session.User.Roles);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", session.AccessToken);
    }
}
