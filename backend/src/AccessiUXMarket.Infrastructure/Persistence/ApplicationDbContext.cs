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
    }
}
