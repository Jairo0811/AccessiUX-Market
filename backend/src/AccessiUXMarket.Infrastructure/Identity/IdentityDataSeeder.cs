using AccessiUXMarket.Domain.Identity;
using Microsoft.AspNetCore.Identity;

namespace AccessiUXMarket.Infrastructure.Identity;

internal sealed class IdentityDataSeeder(
    RoleManager<IdentityRole<Guid>> roleManager,
    UserManager<ApplicationUser> userManager,
    TimeProvider timeProvider)
{
    private const string DemoPassword = "AccessiUX#2026!";

    private static readonly DemoAccount[] DemoAccounts =
    [
        new("customer@accessiux.local", "Cliente Demo", [RoleNames.Customer]),
        new("seller@accessiux.local", "Vendedor Demo", [RoleNames.Customer, RoleNames.Seller]),
        new("admin@accessiux.local", "Administrador Demo", [RoleNames.Customer, RoleNames.Administrator])
    ];

    public async Task SeedRolesAsync()
    {
        foreach (var roleName in RoleNames.All)
        {
            if (await roleManager.RoleExistsAsync(roleName))
            {
                continue;
            }

            var result = await roleManager.CreateAsync(new IdentityRole<Guid>(roleName));
            EnsureSucceeded(result, $"Could not seed role {roleName}.");
        }
    }

    public async Task SeedDemoUsersAsync(CancellationToken cancellationToken = default)
    {
        foreach (var account in DemoAccounts)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var user = await userManager.FindByEmailAsync(account.Email);
            if (user is null)
            {
                user = new ApplicationUser
                {
                    Id = Guid.NewGuid(),
                    Email = account.Email,
                    UserName = account.Email,
                    FullName = account.FullName,
                    EmailConfirmed = true,
                    CreatedAtUtc = timeProvider.GetUtcNow(),
                    IsActive = true
                };

                var creationResult = await userManager.CreateAsync(user, DemoPassword);
                EnsureSucceeded(creationResult, $"Could not seed demo account {account.Email}.");
            }

            foreach (var roleName in account.Roles)
            {
                if (await userManager.IsInRoleAsync(user, roleName))
                {
                    continue;
                }

                var roleResult = await userManager.AddToRoleAsync(user, roleName);
                EnsureSucceeded(roleResult, $"Could not assign role {roleName} to demo account {account.Email}.");
            }
        }
    }

    private static void EnsureSucceeded(IdentityResult result, string message)
    {
        if (result.Succeeded)
        {
            return;
        }

        var errors = string.Join(", ", result.Errors.Select(error => error.Code));
        throw new InvalidOperationException($"{message} Errors: {errors}");
    }

    private sealed record DemoAccount(string Email, string FullName, string[] Roles);
}
