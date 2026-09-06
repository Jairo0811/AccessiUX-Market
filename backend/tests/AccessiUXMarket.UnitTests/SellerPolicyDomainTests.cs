using AccessiUXMarket.Domain.Catalog;

namespace AccessiUXMarket.UnitTests;

public sealed class SellerPolicyDomainTests
{
    [Fact]
    public void Seller_policies_are_trimmed_and_stored()
    {
        var seller = CreateSeller();

        seller.UpdatePolicies(
            "  Garantía limitada de 12 meses.  ",
            "  Envíos en 2 a 4 días laborables.  ",
            "  Devoluciones dentro de 30 días.  ");

        Assert.Equal("Garantía limitada de 12 meses.", seller.WarrantyPolicy);
        Assert.Equal("Envíos en 2 a 4 días laborables.", seller.ShippingPolicy);
        Assert.Equal("Devoluciones dentro de 30 días.", seller.ReturnPolicy);
    }

    [Theory]
    [InlineData("", "Envío", "Devolución")]
    [InlineData("Garantía", " ", "Devolución")]
    [InlineData("Garantía", "Envío", "\t")]
    public void Seller_policies_reject_empty_values(string warranty, string shipping, string returns)
    {
        var seller = CreateSeller();

        Assert.Throws<ArgumentException>(() => seller.UpdatePolicies(warranty, shipping, returns));
    }

    private static SellerProfile CreateSeller() => new(
        Guid.NewGuid(),
        Guid.NewGuid(),
        "Tienda accesible",
        "tienda-accesible",
        "Productos seleccionados.",
        DateTime.UtcNow);
}
