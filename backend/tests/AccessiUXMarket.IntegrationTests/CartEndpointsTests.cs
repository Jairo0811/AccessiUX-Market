using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using AccessiUXMarket.Application.Cart;
using AccessiUXMarket.Application.Catalog;
using AccessiUXMarket.Application.Identity;
using Microsoft.AspNetCore.Mvc.Testing;

namespace AccessiUXMarket.IntegrationTests;

public sealed class CartEndpointsTests(IdentityApiFixture fixture) : IClassFixture<IdentityApiFixture>
{
    private const string AuthRoot = "/api/v1/auth";
    private const string CatalogRoot = "/api/v1/catalog";
    private const string CartRoot = "/api/v1/cart";

    [Fact]
    public async Task Cart_RequiresAuthentication()
    {
        using var client = CreateClient();
        var response = await client.GetAsync(CartRoot);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Customer_CanAddUpdateAndRemoveCartItem()
    {
        using var client = CreateClient();
        await AuthenticateNewCustomerAsync(client, "cart-owner");
        var product = await CreatePublishedProductAsync(client, stock: 6);

        var addResponse = await client.PostAsJsonAsync($"{CartRoot}/items", new AddCartItemRequest(product.Id, 2));
        Assert.Equal(HttpStatusCode.OK, addResponse.StatusCode);
        var added = await addResponse.Content.ReadFromJsonAsync<CartDto>();
        Assert.NotNull(added);
        var line = Assert.Single(added.Items);
        Assert.Equal(2, line.Quantity);
        Assert.Equal(product.Price * 2, line.LineTotal);

        var updateResponse = await client.PutAsJsonAsync($"{CartRoot}/items/{product.Id}", new UpdateCartItemRequest(4));
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        var updated = await updateResponse.Content.ReadFromJsonAsync<CartDto>();
        Assert.NotNull(updated);
        Assert.Equal(4, Assert.Single(updated.Items).Quantity);
        Assert.Equal(4, updated.TotalQuantity);

        var persisted = await client.GetFromJsonAsync<CartDto>(CartRoot);
        Assert.NotNull(persisted);
        Assert.Equal(4, Assert.Single(persisted.Items).Quantity);

        var removeResponse = await client.DeleteAsync($"{CartRoot}/items/{product.Id}");
        Assert.Equal(HttpStatusCode.OK, removeResponse.StatusCode);
        var removed = await removeResponse.Content.ReadFromJsonAsync<CartDto>();
        Assert.NotNull(removed);
        Assert.Empty(removed.Items);
    }

    [Fact]
    public async Task Cart_RejectsQuantityAboveAvailableStock()
    {
        using var client = CreateClient();
        await AuthenticateNewCustomerAsync(client, "cart-stock");
        var product = await CreatePublishedProductAsync(client, stock: 2);

        var response = await client.PostAsJsonAsync($"{CartRoot}/items", new AddCartItemRequest(product.Id, 3));
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);

        var cart = await client.GetFromJsonAsync<CartDto>(CartRoot);
        Assert.NotNull(cart);
        Assert.Empty(cart.Items);
    }

    [Fact]
    public async Task Carts_AreIsolatedPerUser()
    {
        using var firstClient = CreateClient();
        await AuthenticateNewCustomerAsync(firstClient, "cart-first");
        var product = await CreatePublishedProductAsync(firstClient, stock: 5);
        var add = await firstClient.PostAsJsonAsync($"{CartRoot}/items", new AddCartItemRequest(product.Id, 1));
        Assert.Equal(HttpStatusCode.OK, add.StatusCode);

        using var secondClient = CreateClient();
        await AuthenticateNewCustomerAsync(secondClient, "cart-second");
        var secondCart = await secondClient.GetFromJsonAsync<CartDto>(CartRoot);

        Assert.NotNull(secondCart);
        Assert.Empty(secondCart.Items);
    }

    [Fact]
    public async Task AddingSameProduct_IncreasesExistingLineWithoutDuplicates()
    {
        using var client = CreateClient();
        await AuthenticateNewCustomerAsync(client, "cart-merge");
        var product = await CreatePublishedProductAsync(client, stock: 5);

        await client.PostAsJsonAsync($"{CartRoot}/items", new AddCartItemRequest(product.Id, 1));
        var secondAdd = await client.PostAsJsonAsync($"{CartRoot}/items", new AddCartItemRequest(product.Id, 2));
        Assert.Equal(HttpStatusCode.OK, secondAdd.StatusCode);

        var cart = await secondAdd.Content.ReadFromJsonAsync<CartDto>();
        Assert.NotNull(cart);
        var item = Assert.Single(cart.Items);
        Assert.Equal(3, item.Quantity);
        Assert.Equal(3, cart.TotalQuantity);
    }

    private HttpClient CreateClient() => fixture.Factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });

    private static async Task AuthenticateNewCustomerAsync(HttpClient client, string prefix)
    {
        var email = $"{prefix}-{Guid.NewGuid():N}@example.com";
        var response = await client.PostAsJsonAsync($"{AuthRoot}/register", new RegisterRequest(email, "AccessiUX_2026!", "Cart Test User"));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var session = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(session);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", session.AccessToken);
    }

    private static async Task<ProductDto> CreatePublishedProductAsync(HttpClient client, int stock)
    {
        var sellerResponse = await client.PostAsJsonAsync(
            $"{CatalogRoot}/seller",
            new CreateSellerRequest("Cart test seller", $"cart-seller-{Guid.NewGuid():N}", null));
        Assert.Equal(HttpStatusCode.Created, sellerResponse.StatusCode);

        var categories = await client.GetFromJsonAsync<List<CategoryDto>>($"{CatalogRoot}/categories");
        Assert.NotNull(categories);
        var category = categories.First();
        var productResponse = await client.PostAsJsonAsync(
            $"{CatalogRoot}/seller/products",
            new CreateProductRequest(
                category.Id,
                "Producto para carrito",
                $"cart-product-{Guid.NewGuid():N}",
                "Producto de integración para validar el carrito.",
                1250m,
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
