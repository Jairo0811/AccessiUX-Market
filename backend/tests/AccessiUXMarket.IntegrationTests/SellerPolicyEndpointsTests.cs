using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using AccessiUXMarket.Application.Catalog;
using AccessiUXMarket.Application.Identity;
using Microsoft.AspNetCore.Mvc.Testing;

namespace AccessiUXMarket.IntegrationTests;

public sealed class SellerPolicyEndpointsTests(IdentityApiFixture fixture) : IClassFixture<IdentityApiFixture>
{
    private const string AuthRoot = "/api/v1/auth";
    private const string CatalogRoot = "/api/v1/catalog";

    [Fact]
    public async Task Seller_can_publish_standardized_policies_and_they_are_public()
    {
        using var client = CreateClient();
        await AuthenticateNewCustomerAsync(client);

        var sellerResponse = await client.PostAsJsonAsync(
            $"{CatalogRoot}/seller",
            new CreateSellerRequest("Tienda Política", $"policy-{Guid.NewGuid():N}", "Vendedor para pruebas de políticas."));
        Assert.Equal(HttpStatusCode.Created, sellerResponse.StatusCode);
        var seller = await sellerResponse.Content.ReadFromJsonAsync<SellerDto>();
        Assert.NotNull(seller);

        var updateResponse = await client.PutAsJsonAsync(
            $"{CatalogRoot}/seller/policies",
            new UpdateSellerPoliciesRequest(
                "Garantía limitada de 12 meses.",
                "Envíos en 2 a 4 días laborables.",
                "Devoluciones dentro de 30 días."));
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        var updated = await updateResponse.Content.ReadFromJsonAsync<SellerDto>();
        Assert.NotNull(updated);
        Assert.Equal("Garantía limitada de 12 meses.", updated.WarrantyPolicy);
        Assert.Equal("Envíos en 2 a 4 días laborables.", updated.ShippingPolicy);
        Assert.Equal("Devoluciones dentro de 30 días.", updated.ReturnPolicy);

        using var publicClient = CreateClient();
        var publicResponse = await publicClient.GetAsync($"{CatalogRoot}/sellers/id/{seller.Id}");
        Assert.Equal(HttpStatusCode.OK, publicResponse.StatusCode);
        var publiclyVisible = await publicResponse.Content.ReadFromJsonAsync<SellerDto>();
        Assert.NotNull(publiclyVisible);
        Assert.Equal(updated.WarrantyPolicy, publiclyVisible.WarrantyPolicy);
        Assert.Equal(updated.ShippingPolicy, publiclyVisible.ShippingPolicy);
        Assert.Equal(updated.ReturnPolicy, publiclyVisible.ReturnPolicy);
    }

    [Fact]
    public async Task Seller_policy_update_rejects_incomplete_policy_set()
    {
        using var client = CreateClient();
        await AuthenticateNewCustomerAsync(client);
        var sellerResponse = await client.PostAsJsonAsync(
            $"{CatalogRoot}/seller",
            new CreateSellerRequest("Tienda Validación", $"validation-{Guid.NewGuid():N}", null));
        Assert.Equal(HttpStatusCode.Created, sellerResponse.StatusCode);

        var response = await client.PutAsJsonAsync(
            $"{CatalogRoot}/seller/policies",
            new UpdateSellerPoliciesRequest("Garantía vigente.", "", "Devoluciones en 30 días."));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private HttpClient CreateClient() => fixture.Factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });

    private static async Task AuthenticateNewCustomerAsync(HttpClient client)
    {
        var email = $"seller-policy-{Guid.NewGuid():N}@example.com";
        var response = await client.PostAsJsonAsync(
            $"{AuthRoot}/register",
            new RegisterRequest(email, "AccessiUX_2026!", "Seller Policy Test User"));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var session = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(session);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", session.AccessToken);
    }
}
