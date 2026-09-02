using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AccessiUXMarket.Application.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace AccessiUXMarket.Infrastructure.Identity;

internal interface IJwtTokenFactory
{
    AccessToken Create(ApplicationUser user, IReadOnlyCollection<string> roles);
}

internal sealed record AccessToken(string Value, DateTimeOffset ExpiresAtUtc);

internal sealed class JwtTokenFactory(IOptions<JwtOptions> options, TimeProvider timeProvider)
    : IJwtTokenFactory
{
    private readonly JwtOptions _options = options.Value;

    public AccessToken Create(ApplicationUser user, IReadOnlyCollection<string> roles)
    {
        var now = timeProvider.GetUtcNow();
        var expiresAtUtc = now.AddMinutes(_options.AccessTokenMinutes);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.Name, user.FullName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: now.UtcDateTime,
            expires: expiresAtUtc.UtcDateTime,
            signingCredentials: credentials);

        return new AccessToken(new JwtSecurityTokenHandler().WriteToken(token), expiresAtUtc);
    }
}
