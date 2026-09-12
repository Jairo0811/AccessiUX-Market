using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace AccessiUXMarket.IntegrationTests;

public sealed class HealthEndpointsTests(IdentityApiFixture fixture) : IClassFixture<IdentityApiFixture>
{
    [Theory]
    [InlineData("/health")]
    [InlineData("/health/live")]
    [InlineData("/health/ready")]
    public async Task Health_endpoints_are_healthy(string path)
    {
        using var client = fixture.Factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });
        var response = await client.GetAsync(path);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Api_metadata_exposes_final_product_version()
    {
        using var client = fixture.Factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });
        var metadata = await client.GetFromJsonAsync<ApiMetadata>("/api");

        Assert.NotNull(metadata);
        Assert.Equal("AccessiUX Market API", metadata.Name);
        Assert.Equal("1.0.1", metadata.Version);
    }

    private sealed record ApiMetadata(string Name, string Version);
}
