using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using AccessiUXMarket.Application.Identity;
using AccessiUXMarket.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace AccessiUXMarket.IntegrationTests;

public sealed class AuthEndpointsTests(IdentityApiFixture fixture) : IClassFixture<IdentityApiFixture>
{
    private const string ApiRoot = "/api/v1/auth";

    [Fact]
    public async Task Register_ThenMe_ReturnsAuthenticatedCustomerWithoutExposingRefreshToken()
    {
        using var client = CreateClient();
        var email = UniqueEmail();

        var registerResponse = await RegisterAsync(client, email);

        Assert.Equal(HttpStatusCode.Created, registerResponse.StatusCode);
        var body = await registerResponse.Content.ReadAsStringAsync();
        Assert.DoesNotContain("refreshToken", body, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("HttpOnly", GetRefreshCookie(registerResponse), StringComparison.OrdinalIgnoreCase);

        var session = JsonSerializer.Deserialize<AuthResponse>(body, JsonOptions());
        Assert.NotNull(session);
        Assert.Contains("Customer", session.User.Roles);

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", session.AccessToken);
        var meResponse = await client.GetAsync($"{ApiRoot}/me");

        Assert.Equal(HttpStatusCode.OK, meResponse.StatusCode);
        var user = await meResponse.Content.ReadFromJsonAsync<CurrentUser>();
        Assert.Equal(email, user?.Email);
    }

    [Fact]
    public async Task RegisteringDuplicateEmail_ReturnsConflict()
    {
        using var firstClient = CreateClient();
        using var secondClient = CreateClient();
        var email = UniqueEmail();
        Assert.Equal(HttpStatusCode.Created, (await RegisterAsync(firstClient, email)).StatusCode);

        var duplicateResponse = await RegisterAsync(secondClient, email);

        Assert.Equal(HttpStatusCode.Conflict, duplicateResponse.StatusCode);
    }

    [Fact]
    public async Task Refresh_RotatesToken_AndReuseRevokesTheTokenFamily()
    {
        using var client = CreateClient();
        var registerResponse = await RegisterAsync(client, UniqueEmail());
        var originalCookie = GetRefreshCookie(registerResponse).Split(';', 2)[0];

        var refreshResponse = await PostWithOriginAsync(client, $"{ApiRoot}/refresh");
        Assert.Equal(HttpStatusCode.OK, refreshResponse.StatusCode);

        using var replayClient = fixture.Factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            HandleCookies = false
        });
        replayClient.DefaultRequestHeaders.Add("Cookie", originalCookie);
        var replayResponse = await PostWithOriginAsync(replayClient, $"{ApiRoot}/refresh");
        Assert.Equal(HttpStatusCode.Unauthorized, replayResponse.StatusCode);

        var familyResponse = await PostWithOriginAsync(client, $"{ApiRoot}/refresh");
        Assert.Equal(HttpStatusCode.Unauthorized, familyResponse.StatusCode);
    }

    [Fact]
    public async Task Logout_RevokesRefreshToken()
    {
        using var client = CreateClient();
        var registerResponse = await RegisterAsync(client, UniqueEmail());
        var session = await registerResponse.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(session);
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", session.AccessToken);

        var logoutResponse = await PostWithOriginAsync(client, $"{ApiRoot}/logout");
        Assert.Equal(HttpStatusCode.NoContent, logoutResponse.StatusCode);

        var refreshResponse = await PostWithOriginAsync(client, $"{ApiRoot}/refresh");
        Assert.Equal(HttpStatusCode.Unauthorized, refreshResponse.StatusCode);
    }

    [Fact]
    public async Task Refresh_FromUntrustedOrigin_IsRejected()
    {
        using var client = CreateClient();
        Assert.Equal(
            HttpStatusCode.Created,
            (await RegisterAsync(client, UniqueEmail())).StatusCode);

        using var request = new HttpRequestMessage(HttpMethod.Post, $"{ApiRoot}/refresh")
        {
            Content = JsonContent.Create(new { })
        };
        request.Headers.Add("Origin", "https://attacker.example");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task RepeatedInvalidPasswords_LockTheAccountWithoutDisclosingItsState()
    {
        using var client = CreateClient();
        var email = UniqueEmail();
        Assert.Equal(HttpStatusCode.Created, (await RegisterAsync(client, email)).StatusCode);

        for (var attempt = 0; attempt < 5; attempt++)
        {
            using var attemptClient = CreateClient();
            var response = await attemptClient.PostAsJsonAsync(
                $"{ApiRoot}/login",
                new LoginRequest(email, "Incorrect_2026!"));
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        using var validPasswordClient = CreateClient();
        var lockedResponse = await validPasswordClient.PostAsJsonAsync(
            $"{ApiRoot}/login",
            new LoginRequest(email, "AccessiUX_2026!"));

        Assert.Equal(HttpStatusCode.Unauthorized, lockedResponse.StatusCode);
    }

    [Fact]
    public async Task PasswordReset_ChangesPassword_AndForgotPasswordDoesNotEnumerateAccounts()
    {
        using var client = CreateClient();
        var email = UniqueEmail();
        Assert.Equal(HttpStatusCode.Created, (await RegisterAsync(client, email)).StatusCode);

        var knownResponse = await client.PostAsJsonAsync(
            $"{ApiRoot}/forgot-password",
            new ForgotPasswordRequest(email));
        var unknownResponse = await client.PostAsJsonAsync(
            $"{ApiRoot}/forgot-password",
            new ForgotPasswordRequest(UniqueEmail()));
        Assert.Equal(HttpStatusCode.Accepted, knownResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Accepted, unknownResponse.StatusCode);

        string resetToken;
        using (var scope = fixture.Factory.Services.CreateScope())
        {
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var user = await userManager.FindByEmailAsync(email);
            Assert.NotNull(user);
            resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
        }

        var resetResponse = await client.PostAsJsonAsync(
            $"{ApiRoot}/reset-password",
            new ResetPasswordRequest(email, resetToken, "NewAccessiUX_2026!"));
        Assert.Equal(HttpStatusCode.NoContent, resetResponse.StatusCode);

        using var loginClient = CreateClient();
        var loginResponse = await loginClient.PostAsJsonAsync(
            $"{ApiRoot}/login",
            new LoginRequest(email, "NewAccessiUX_2026!"));
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
    }

    private HttpClient CreateClient() => fixture.Factory.CreateClient(
        new WebApplicationFactoryClientOptions { HandleCookies = true });

    private static Task<HttpResponseMessage> RegisterAsync(HttpClient client, string email) =>
        client.PostAsJsonAsync(
            $"{ApiRoot}/register",
            new RegisterRequest(email, "AccessiUX_2026!", "Integration User"));

    private static async Task<HttpResponseMessage> PostWithOriginAsync(HttpClient client, string url)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = JsonContent.Create(new { })
        };
        request.Headers.Add("Origin", "http://localhost:4200");
        return await client.SendAsync(request);
    }

    private static string GetRefreshCookie(HttpResponseMessage response) =>
        response.Headers.GetValues("Set-Cookie")
            .Single(value => value.StartsWith("accessiux_refresh=", StringComparison.Ordinal));

    private static string UniqueEmail() => $"user-{Guid.NewGuid():N}@example.com";

    private static JsonSerializerOptions JsonOptions() => new(JsonSerializerDefaults.Web);
}
