using AccessiUXMarket.Domain.Identity;
using Microsoft.AspNetCore.Identity;

namespace AccessiUXMarket.Infrastructure.Identity;

internal sealed class IdentityDataSeeder(RoleManager<IdentityRole<Guid>> roleManager)
{
    public async Task SeedAsync()
    {
        foreach (var roleName in RoleNames.All)
        {
            if (await roleManager.RoleExistsAsync(roleName))
            {
                continue;
            }

            var result = await roleManager.CreateAsync(new IdentityRole<Guid>(roleName));
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(error => error.Code));
                throw new InvalidOperationException($"Could not seed role {roleName}. Errors: {errors}");
            }
        }
    }
}
