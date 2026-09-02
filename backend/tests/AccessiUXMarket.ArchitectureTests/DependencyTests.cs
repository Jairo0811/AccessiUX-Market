using System.Reflection;
using AccessiUXMarket.Application.Identity;
using AccessiUXMarket.Domain.Identity;
using AccessiUXMarket.Infrastructure.Persistence;

namespace AccessiUXMarket.ArchitectureTests;

public sealed class DependencyTests
{
    [Fact]
    public void Domain_DoesNotReferenceOuterLayers()
    {
        var references = GetReferences(typeof(RoleNames).Assembly);

        Assert.DoesNotContain("AccessiUXMarket.Application", references);
        Assert.DoesNotContain("AccessiUXMarket.Infrastructure", references);
        Assert.DoesNotContain("AccessiUXMarket.Api", references);
    }

    [Fact]
    public void Application_DoesNotReferenceInfrastructureOrApi()
    {
        var references = GetReferences(typeof(IIdentityService).Assembly);

        Assert.DoesNotContain("AccessiUXMarket.Infrastructure", references);
        Assert.DoesNotContain("AccessiUXMarket.Api", references);
    }

    [Fact]
    public void Infrastructure_DoesNotReferenceApi()
    {
        var references = GetReferences(typeof(ApplicationDbContext).Assembly);

        Assert.DoesNotContain("AccessiUXMarket.Api", references);
    }

    private static IReadOnlyCollection<string> GetReferences(Assembly assembly) =>
        assembly.GetReferencedAssemblies()
            .Select(reference => reference.Name ?? string.Empty)
            .ToArray();
}
