using AccessiUXMarket.Domain.Identity;
using Microsoft.AspNetCore.Identity;

namespace AccessiUXMarket.Infrastructure.Identity;

public sealed class ApplicationUser : IdentityUser<Guid>
{
    public string FullName { get; set; } = string.Empty;

    public DateTimeOffset CreatedAtUtc { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<RefreshToken> RefreshTokens { get; } = new List<RefreshToken>();
}
