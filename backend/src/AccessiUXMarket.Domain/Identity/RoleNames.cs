namespace AccessiUXMarket.Domain.Identity;

public static class RoleNames
{
    public const string Customer = "Customer";
    public const string Seller = "Seller";
    public const string Administrator = "Administrator";

    public static readonly IReadOnlyCollection<string> All =
    [
        Customer,
        Seller,
        Administrator
    ];
}
