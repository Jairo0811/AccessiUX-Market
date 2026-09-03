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
        var category = Assert.Single(categories!, item => item.Slug == "tecnologia");
        var productSlug = $"teclado-{Guid.NewGuid():N}";
        var productResponse = await client.PostAsJsonAsync(
            $"{CatalogRoot}/seller/products",
            new CreateProductRequest(category.Id, "Teclado de alto contraste", productSlug, "Teclado diseñado para mejorar la visibilidad de las teclas.", 2499m, "DOP", 5));
        Assert.Equal(HttpStatusCode.Created, productResponse.StatusCode);
        var product = await productResponse.Content.ReadFromJsonAsync<ProductDto>();
        Assert.NotNull(product);
        Assert.Equal("Draft", product.Status);

        var publishResponse = await client.PostAsJsonAsync($"{CatalogRoot}/seller/products/{product.Id}/publish", new { });
        Assert.Equal(HttpStatusCode.NoContent, publishResponse.StatusCode);

        using var publicClient = CreateClient();
        var publicResponse = await publicClient.GetAsync($"{CatalogRoot}/products/{productSlug}");
        Assert.Equal(HttpStatusCode.OK, publicResponse.StatusCode);
        var published = await publicResponse.Content.ReadFromJsonAsync<ProductDto>();
        Assert.Equal("Published", published?.Status);
    }

    [Fact]
    public async Task Search_FiltersByTextCategoryPriceAndStock()
    {
        using var client = CreateClient();
        await AuthenticateNewCustomerAsync(client);
        await CreateSellerAsync(client, "search");
        var categories = await client.GetFromJsonAsync<List<CategoryDto>>($"{CatalogRoot}/categories");
        var technology = Assert.Single(categories!, item => item.Slug == "tecnologia");
        var home = Assert.Single(categories!, item => item.Slug == "hogar");

        await CreateAndPublishProductAsync(client, technology.Id, "Mouse ergonómico accesible", 1500m, 8);
        await CreateAndPublishProductAsync(client, technology.Id, "Monitor de alto contraste", 14000m, 2);
        await CreateAndPublishProductAsync(client, home.Id, "Lámpara accesible", 1200m, 4);

        using var publicClient = CreateClient();
        var url = $"{CatalogRoot}/search?q=accesible&categoryId={technology.Id}&minPrice=1400&maxPrice=2000&inStock=true&sort=price-asc";
        var response = await publicClient.GetAsync(url);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<CatalogSearchResultDto>();
        Assert.NotNull(result);
        var item = Assert.Single(result.Items);
        Assert.Equal("Mouse ergonómico accesible", item.Name);
        Assert.Contains(result.Facets.Categories, facet => facet.Id == technology.Id);
    }

    [Fact]
    public async Task Search_PaginatesAndSortsByPriceDescending()
    {
        using var client = CreateClient();
        await AuthenticateNewCustomerAsync(client);
        await CreateSellerAsync(client, "paging");
        var categories = await client.GetFromJsonAsync<List<CategoryDto>>($"{CatalogRoot}/categories");
        var category = categories!.First();

        await CreateAndPublishProductAsync(client, category.Id, "Producto fase tres A", 100m, 1);
        await CreateAndPublishProductAsync(client, category.Id, "Producto fase tres B", 200m, 1);
        await CreateAndPublishProductAsync(client, category.Id, "Producto fase tres C", 300m, 1);

        using var publicClient = CreateClient();
        var response = await publicClient.GetAsync($"{CatalogRoot}/search?q=Producto%20fase%20tres&sort=price-desc&page=1&pageSize=2");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<CatalogSearchResultDto>();
        Assert.NotNull(result);
        Assert.Equal(3, result.TotalCount);
        Assert.Equal(2, result.TotalPages);
        Assert.Equal(2, result.Items.Count);
        Assert.True(result.Items[0].Price >= result.Items[1].Price);
    }

    [Fact]
    public async Task Search_RejectsInvalidPriceRange()
    {
        using var client = CreateClient();
        var response = await client.GetAsync($"{CatalogRoot}/search?minPrice=1000&maxPrice=100");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
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
        var response = await attackerClient.PostAsJsonAsync($"{CatalogRoot}/seller/products/{product.Id}/publish", new { });
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private HttpClient CreateClient() => fixture.Factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });

    private static async Task AuthenticateNewCustomerAsync(HttpClient client)
    {
        var email = $"catalog-{Guid.NewGuid():N}@example.com";
        var response = await client.PostAsJsonAsync($"{AuthRoot}/register", new RegisterRequest(email, "AccessiUX_2026!", "Catalog Test User"));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var session = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(session);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", session.AccessToken);
    }

    private static async Task CreateSellerAsync(HttpClient client, string prefix)
    {
        var response = await client.PostAsJsonAsync($"{CatalogRoot}/seller", new CreateSellerRequest($"{prefix} seller", $"{prefix}-{Guid.NewGuid():N}", null));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    private static async Task<ProductDto> CreateAndPublishProductAsync(HttpClient client, Guid categoryId, string name, decimal price, int stock)
    {
        var slug = $"phase3-{Guid.NewGuid():N}";
        var response = await client.PostAsJsonAsync(
            $"{CatalogRoot}/seller/products",
            new CreateProductRequest(categoryId, name, slug, $"Descripción accesible para {name}.", price, "DOP", stock));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var product = await response.Content.ReadFromJsonAsync<ProductDto>();
        Assert.NotNull(product);
        var publish = await client.PostAsJsonAsync($"{CatalogRoot}/seller/products/{product.Id}/publish", new { });
        Assert.Equal(HttpStatusCode.NoContent, publish.StatusCode);
        return product;
    }
}
