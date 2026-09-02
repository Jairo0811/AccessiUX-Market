using AccessiUXMarket.Domain.Identity;

namespace AccessiUXMarket.UnitTests;

public sealed class RefreshTokenTests
{
    [Fact]
    public void Create_WithValidDates_CreatesActiveToken()
    {
        var now = new DateTimeOffset(2026, 9, 2, 12, 0, 0, TimeSpan.Zero);

        var token = RefreshToken.Create(
            Guid.NewGuid(),
            new string('A', 64),
            Guid.NewGuid(),
            now,
            now.AddDays(7),
            "127.0.0.1",
            "unit-test");

        Assert.True(token.IsActive(now));
        Assert.Null(token.RevokedAtUtc);
    }

    [Fact]
    public void Rotate_RevokesTokenAndRecordsReplacementHash()
    {
        var now = new DateTimeOffset(2026, 9, 2, 12, 0, 0, TimeSpan.Zero);
        var token = RefreshToken.Create(
            Guid.NewGuid(),
            new string('A', 64),
            Guid.NewGuid(),
            now,
            now.AddDays(7),
            "127.0.0.1",
            null);

        token.Rotate(now.AddMinutes(5), "127.0.0.2", new string('B', 64));

        Assert.False(token.IsActive(now.AddMinutes(5)));
        Assert.Equal(new string('B', 64), token.ReplacedByTokenHash);
        Assert.Equal("Rotated", token.RevocationReason);
    }

    [Fact]
    public void Create_WhenExpiryIsNotAfterCreation_Throws()
    {
        var now = new DateTimeOffset(2026, 9, 2, 12, 0, 0, TimeSpan.Zero);

        Assert.Throws<ArgumentOutOfRangeException>(() => RefreshToken.Create(
            Guid.NewGuid(),
            new string('A', 64),
            Guid.NewGuid(),
            now,
            now,
            "127.0.0.1",
            null));
    }
}
