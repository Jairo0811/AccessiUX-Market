using AccessiUXMarket.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AccessiUXMarket.Infrastructure.Persistence.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260906222500_AddSellerPolicies")]
    public partial class AddSellerPolicies : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "WarrantyPolicy",
                table: "SellerProfiles",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ShippingPolicy",
                table: "SellerProfiles",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReturnPolicy",
                table: "SellerProfiles",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "WarrantyPolicy", table: "SellerProfiles");
            migrationBuilder.DropColumn(name: "ShippingPolicy", table: "SellerProfiles");
            migrationBuilder.DropColumn(name: "ReturnPolicy", table: "SellerProfiles");
        }
    }
}
