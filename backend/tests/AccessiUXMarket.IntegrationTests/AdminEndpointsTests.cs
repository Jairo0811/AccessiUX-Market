using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using AccessiUXMarket.Application.Admin;
using AccessiUXMarket.Application.Identity;
using AccessiUXMarket.Domain.Identity;
using AccessiUXMarket.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace AccessiUXMarket.IntegrationTests;

public sealed class AdminEndpointsTests(IdentityApiFixture fixture) : IClassFixture<IdentityApiFixture>
{
    private const string AuthRoot = "/api/v1/auth";
    private const string AdminRoot = "/api/v1/admin";

    [Fact]
    public async Task Customer_CannotAccessAdministratorOverview()
    {
        using var client = CreateClient();
        await RegisterAndAuthenticateAsync(client, $"customer-admin-{Guid.NewGuid():N}@example.com");

        var response = await client.GetAsync($"{AdminRoot}/overview");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Administrator_CanReadOperationalOverview()
    {
        using var client = CreateClient();
        var email = $"administrator-{Guid.NewGuid():N}@example.com";
        await RegisterAndAuthenticateAsync(client, email);

        await using (var scope = fixture.Factory.Services.CreateAsyncScope())
        {
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var user = await userManager.FindByEmailAsync(email);
            Assert.NotNull(user);
            var roleResult = await userManager.AddToRoleAsync(user, RoleNames.Administrator);
            Assert.True(roleResult.Succeeded);
        }

        var loginResponse = await client.PostAsJsonAsync(AuthRoot + "/login", new LoginRequest(email, "AccessiUX_2026!"));
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        var session = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(session);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", session.AccessToken);

        var response = await client.GetAsync($"{AdminRoot}/overview");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var overview = await response.Content.ReadFromJsonAsync<AdminOverviewDto>();
        Assert.NotNull(overview);
        Assert.True(overview.TotalUsers >= 1);
        Assert.True(overview.ActiveUsers >= 1);
        Assert.True(overview.Sellers >= 0);
        Assert.True(overview.Products >= 0);
        Assert.True(overview.Orders >= 0);
    }

    private HttpClient CreateClient() => fixture.Factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });

    private static async Task RegisterAndAuthenticateAsync(HttpClient client, string email)
    {
        var response = await client.PostAsJsonAsync(AuthRoot + "/register", new RegisterRequest(email, "AccessiUX_2026!", "Admin Test User"));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var session = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(session);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", session.AccessToken);
    }
}
