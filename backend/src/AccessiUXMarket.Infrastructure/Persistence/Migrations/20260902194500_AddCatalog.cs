using System;
using AccessiUXMarket.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AccessiUXMarket.Infrastructure.Persistence.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260902194500_AddCatalog")]
public partial class AddCatalog : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(name: "Categories", columns: table => new
        {
            Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            Name = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
            Slug = table.Column<string>(type: "nvarchar(140)", maxLength: 140, nullable: false),
            Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
            IsActive = table.Column<bool>(type: "bit", nullable: false),
            CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
        }, constraints: table => table.PrimaryKey("PK_Categories", x => x.Id));

        migrationBuilder.CreateTable(name: "SellerProfiles", columns: table => new
        {
            Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            DisplayName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
            Slug = table.Column<string>(type: "nvarchar(140)", maxLength: 140, nullable: false),
            Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
            IsActive = table.Column<bool>(type: "bit", nullable: false),
            CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
        }, constraints: table =>
        {
            table.PrimaryKey("PK_SellerProfiles", x => x.Id);
            table.ForeignKey("FK_SellerProfiles_Users_UserId", x => x.UserId, "Users", "Id", onDelete: ReferentialAction.Restrict);
        });

        migrationBuilder.CreateTable(name: "Products", columns: table => new
        {
            Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            SellerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            CategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            Name = table.Column<string>(type: "nvarchar(180)", maxLength: 180, nullable: false),
            Slug = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
            Description = table.Column<string>(type: "nvarchar(max)", maxLength: 5000, nullable: false),
            Price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
            Currency = table.Column<string>(type: "nchar(3)", fixedLength: true, maxLength: 3, nullable: false),
            StockQuantity = table.Column<int>(type: "int", nullable: false),
            Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
            CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
            UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
        }, constraints: table =>
        {
            table.PrimaryKey("PK_Products", x => x.Id);
            table.ForeignKey("FK_Products_Categories_CategoryId", x => x.CategoryId, "Categories", "Id", onDelete: ReferentialAction.Restrict);
            table.ForeignKey("FK_Products_SellerProfiles_SellerId", x => x.SellerId, "SellerProfiles", "Id", onDelete: ReferentialAction.Restrict);
        });

        migrationBuilder.CreateIndex("IX_Categories_Slug", "Categories", "Slug", unique: true);
        migrationBuilder.CreateIndex("IX_SellerProfiles_Slug", "SellerProfiles", "Slug", unique: true);
        migrationBuilder.CreateIndex("IX_SellerProfiles_UserId", "SellerProfiles", "UserId", unique: true);
        migrationBuilder.CreateIndex("IX_Products_Slug", "Products", "Slug", unique: true);
        migrationBuilder.CreateIndex("IX_Products_CategoryId_Status", "Products", new[] { "CategoryId", "Status" });
        migrationBuilder.CreateIndex("IX_Products_SellerId_Status", "Products", new[] { "SellerId", "Status" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable("Products");
        migrationBuilder.DropTable("Categories");
        migrationBuilder.DropTable("SellerProfiles");
    }
}
