using AccessiUXMarket.Domain.Catalog;
using AccessiUXMarket.Domain.Identity;
using AccessiUXMarket.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace AccessiUXMarket.Infrastructure.Persistence;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<SellerProfile> SellerProfiles => Set<SellerProfile>();
    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>(entity =>
        {
            entity.ToTable("Users");
            entity.Property(user => user.FullName).HasMaxLength(150).IsRequired();
            entity.Property(user => user.CreatedAtUtc).IsRequired();
            entity.Property(user => user.IsActive).IsRequired();
            entity.HasIndex(user => user.NormalizedEmail)
                .IsUnique()
                .HasDatabaseName("EmailIndex");
        });

        builder.Entity<IdentityRole<Guid>>().ToTable("Roles");
        builder.Entity<IdentityUserRole<Guid>>().ToTable("UserRoles");
        builder.Entity<IdentityUserClaim<Guid>>().ToTable("UserClaims");
        builder.Entity<IdentityUserLogin<Guid>>().ToTable("UserLogins");
        builder.Entity<IdentityRoleClaim<Guid>>().ToTable("RoleClaims");
        builder.Entity<IdentityUserToken<Guid>>().ToTable("UserTokens");

        builder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("RefreshTokens");
            entity.HasKey(token => token.Id);
            entity.Property(token => token.TokenHash).HasMaxLength(64).IsRequired();
            entity.Property(token => token.CreatedByIp).HasMaxLength(45).IsRequired();
            entity.Property(token => token.RevokedByIp).HasMaxLength(45);
            entity.Property(token => token.RevocationReason).HasMaxLength(100);
            entity.Property(token => token.ReplacedByTokenHash).HasMaxLength(64);
            entity.Property(token => token.UserAgent).HasMaxLength(512);
            entity.Property(token => token.RowVersion).IsRowVersion();
            entity.HasIndex(token => token.TokenHash).IsUnique();
            entity.HasIndex(token => new { token.UserId, token.FamilyId });
            entity.HasIndex(token => token.ExpiresAtUtc);
            entity.HasOne<ApplicationUser>()
                .WithMany(user => user.RefreshTokens)
                .HasForeignKey(token => token.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Category>(entity =>
        {
            entity.ToTable("Categories");
            entity.HasKey(category => category.Id);
            entity.Property(category => category.Name).HasMaxLength(120).IsRequired();
            entity.Property(category => category.Slug).HasMaxLength(140).IsRequired();
            entity.Property(category => category.Description).HasMaxLength(1000);
            entity.HasIndex(category => category.Slug).IsUnique();
        });

        builder.Entity<SellerProfile>(entity =>
        {
            entity.ToTable("SellerProfiles");
            entity.HasKey(seller => seller.Id);
            entity.Property(seller => seller.DisplayName).HasMaxLength(120).IsRequired();
            entity.Property(seller => seller.Slug).HasMaxLength(140).IsRequired();
            entity.Property(seller => seller.Description).HasMaxLength(1000);
            entity.HasIndex(seller => seller.UserId).IsUnique();
            entity.HasIndex(seller => seller.Slug).IsUnique();
            entity.HasOne<ApplicationUser>()
                .WithOne()
                .HasForeignKey<SellerProfile>(seller => seller.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Product>(entity =>
        {
            entity.ToTable("Products");
            entity.HasKey(product => product.Id);
            entity.Property(product => product.Name).HasMaxLength(180).IsRequired();
            entity.Property(product => product.Slug).HasMaxLength(200).IsRequired();
            entity.Property(product => product.Description).HasMaxLength(5000).IsRequired();
            entity.Property(product => product.Price).HasPrecision(18, 2).IsRequired();
            entity.Property(product => product.Currency).HasMaxLength(3).IsFixedLength().IsRequired();
            entity.Property(product => product.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
            entity.HasIndex(product => product.Slug).IsUnique();
            entity.HasIndex(product => new { product.CategoryId, product.Status });
            entity.HasIndex(product => new { product.SellerId, product.Status });
            entity.HasOne<SellerProfile>()
                .WithMany()
                .HasForeignKey(product => product.SellerId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<Category>()
                .WithMany()
                .HasForeignKey(product => product.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
