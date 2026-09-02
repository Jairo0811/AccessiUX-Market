namespace AccessiUXMarket.Domain.Identity;

public sealed class RefreshToken
{
    private RefreshToken()
    {
    }

    private RefreshToken(
        Guid userId,
        string tokenHash,
        Guid familyId,
        DateTimeOffset createdAtUtc,
        DateTimeOffset expiresAtUtc,
        string createdByIp,
        string? userAgent)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        TokenHash = tokenHash;
        FamilyId = familyId;
        CreatedAtUtc = createdAtUtc;
        ExpiresAtUtc = expiresAtUtc;
        CreatedByIp = createdByIp;
        UserAgent = userAgent;
    }

    public Guid Id { get; private set; }

    public Guid UserId { get; private set; }

    public string TokenHash { get; private set; } = string.Empty;

    public Guid FamilyId { get; private set; }

    public DateTimeOffset CreatedAtUtc { get; private set; }

    public DateTimeOffset ExpiresAtUtc { get; private set; }

    public string CreatedByIp { get; private set; } = string.Empty;

    public string? UserAgent { get; private set; }

    public DateTimeOffset? RevokedAtUtc { get; private set; }

    public string? RevokedByIp { get; private set; }

    public string? RevocationReason { get; private set; }

    public string? ReplacedByTokenHash { get; private set; }

    public byte[] RowVersion { get; private set; } = [];

    public bool IsActive(DateTimeOffset now) => RevokedAtUtc is null && ExpiresAtUtc > now;

    public static RefreshToken Create(
        Guid userId,
        string tokenHash,
        Guid familyId,
        DateTimeOffset createdAtUtc,
        DateTimeOffset expiresAtUtc,
        string createdByIp,
        string? userAgent)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(tokenHash);
        ArgumentException.ThrowIfNullOrWhiteSpace(createdByIp);

        if (expiresAtUtc <= createdAtUtc)
        {
            throw new ArgumentOutOfRangeException(nameof(expiresAtUtc), "The token must expire after it is created.");
        }

        return new RefreshToken(
            userId,
            tokenHash,
            familyId,
            createdAtUtc,
            expiresAtUtc,
            createdByIp,
            userAgent);
    }

    public void Rotate(
        DateTimeOffset revokedAtUtc,
        string revokedByIp,
        string replacementTokenHash)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(replacementTokenHash);
        Revoke(revokedAtUtc, revokedByIp, "Rotated");
        ReplacedByTokenHash = replacementTokenHash;
    }

    public void Revoke(DateTimeOffset revokedAtUtc, string revokedByIp, string reason)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(revokedByIp);
        ArgumentException.ThrowIfNullOrWhiteSpace(reason);

        if (RevokedAtUtc is not null)
        {
            return;
        }

        RevokedAtUtc = revokedAtUtc;
        RevokedByIp = revokedByIp;
        RevocationReason = reason;
    }
}
