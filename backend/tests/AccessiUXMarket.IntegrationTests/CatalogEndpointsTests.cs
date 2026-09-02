using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using AccessiUXMarket.Application.Catalog;
using AccessiUXMarket.Application.Identity;
using Microsoft.AspNetCore.Mvc.Testing;

namespace AccessiUXMarket.IntegrationTests;

public sealed class CatalogEndpointsTests(IdentityApiFixture fixture) : IClassFixture<IdentityApiFixture>
{
    private const string AuthRoot = "/api/v1/auth";
    private const string CatalogRoot = "/api/v1/catalog";

    [Fact]
    public async Task Catalog_ExposesSeededCategories()
    {
        using var client = CreateClient();

        var response = await client.GetAsync($"{CatalogRoot}/categories");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var categories = await response.Content.ReadFromJsonAsync<List<CategoryDto>>();
        Assert.NotNull(categories);
        Assert.Contains(categories, category => category.Slug == "tecnologia");
        Assert.Contains(categories, category => category.Slug == "hogar");
    }

    [Fact]
    public async Task Seller_CanCreatePublishAndExposeProductPublicly()
    {
        using var client = CreateClient();
        await AuthenticateNewCustomerAsync(client);

        var sellerResponse = await client.PostAsJsonAsync(
            $"{CatalogRoot}/seller",
            new CreateSellerRequest("Tienda Accesible", $"tienda-{Guid.NewGuid():N}", "Productos accesibles."));
        Assert.Equal(HttpStatusCode.Created, sellerResponse.StatusCode);

        var categories = await client.GetFromJsonAsync<List<CategoryDto>>($"{CatalogRoot}/categories");
        var category = Assert.Single(categories!.Where(item => item.Slug == "tecnologia"));

        var productSlug = $"teclado-{Guid.NewGuid():N}";
        var productResponse = await client.PostAsJsonAsync(
            $"{CatalogRoot}/seller/products",
            new CreateProductRequest(
                category.Id,
                "Teclado de alto contraste",
                productSlug,
                "Teclado diseñado para mejorar la visibilidad de las teclas.",
                2499m,
                "DOP",
                5));
        Assert.Equal(HttpStatusCode.Created, productResponse.StatusCode);
        var product = await productResponse.Content.ReadFromJsonAsync<ProductDto>();
        Assert.NotNull(product);
        Assert.Equal("Draft", product.Status);

        var publishResponse = await client.PostAsJsonAsync(
            $"{CatalogRoot}/seller/products/{product.Id}/publish",
            new { });
        Assert.Equal(HttpStatusCode.NoContent, publishResponse.StatusCode);

        using var publicClient = CreateClient();
        var publicResponse = await publicClient.GetAsync($"{CatalogRoot}/products/{productSlug}");
        Assert.Equal(HttpStatusCode.OK, publicResponse.StatusCode);
        var published = await publicResponse.Content.ReadFromJsonAsync<ProductDto>();
        Assert.Equal("Published", published?.Status);
    }

    [Fact]
    public async Task Seller_CannotPublishAnotherSellersProduct()
    {
        using var ownerClient = CreateClient();
        await AuthenticateNewCustomerAsync(ownerClient);
        await CreateSellerAsync(ownerClient, "owner");

        var categories = await ownerClient.GetFromJsonAsync<List<CategoryDto>>($"{CatalogRoot}/categories");
        var category = categories!.First();
        var productResponse = await ownerClient.PostAsJsonAsync(
            $"{CatalogRoot}/seller/products",
            new CreateProductRequest(category.Id, "Producto privado", $"private-{Guid.NewGuid():N}", "Producto para prueba de ownership.", 100m, "DOP", 1));
        var product = await productResponse.Content.ReadFromJsonAsync<ProductDto>();
        Assert.NotNull(product);

        using var attackerClient = CreateClient();
        await AuthenticateNewCustomerAsync(attackerClient);
        await CreateSellerAsync(attackerClient, "other");

        var response = await attackerClient.PostAsJsonAsync(
            $"{CatalogRoot}/seller/products/{product.Id}/publish",
            new { });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private HttpClient CreateClient() => fixture.Factory.CreateClient(
        new WebApplicationFactoryClientOptions { HandleCookies = true });

    private static async Task AuthenticateNewCustomerAsync(HttpClient client)
    {
        var email = $"catalog-{Guid.NewGuid():N}@example.com";
        var response = await client.PostAsJsonAsync(
            $"{AuthRoot}/register",
            new RegisterRequest("Catalog Test User", email, "AccessiUX_2026!", "AccessiUX_2026!"));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var session = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(session);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", session.AccessToken);
    }

    private static async Task CreateSellerAsync(HttpClient client, string prefix)
    {
        var response = await client.PostAsJsonAsync(
            $"{CatalogRoot}/seller",
            new CreateSellerRequest($"{prefix} seller", $"{prefix}-{Guid.NewGuid():N}", null));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }
}
