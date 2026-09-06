# Orders infrastructure

`OrderService` owns order queries and transactional cancellation orchestration. Cancellation runs through EF Core's SQL Server execution strategy and restores inventory in the same serializable transaction that changes order state.
