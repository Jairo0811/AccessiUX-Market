using Testcontainers.MsSql;

namespace AccessiUXMarket.IntegrationTests;

public sealed class IdentityApiFixture : IAsyncLifetime
{
    private readonly MsSqlContainer _database = new MsSqlBuilder("mcr.microsoft.com/mssql/server:2022-latest")
        .WithPassword("AccessiUX_Test_Only_2026!")
        .Build();

    public TestApplicationFactory Factory { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        await _database.StartAsync();
        Factory = new TestApplicationFactory(_database.GetConnectionString());
        _ = Factory.Services;
    }

    public async Task DisposeAsync()
    {
        await Factory.DisposeAsync();
        await _database.DisposeAsync();
    }
}
