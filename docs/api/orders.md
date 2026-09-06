# Orders API

Fase 6 exposes authenticated order history, order detail, and reversible cancellation aligned with `AM-UX-001`.

## Cancellation policy

The cancellation window is configured with `Orders:CancellationWindowMinutes` and defaults to **30 minutes**.

The server is authoritative. A client must not decide cancellability from local time alone; it must use `canCancel`, `cancelUntilUtc`, and `cancellationMessage` returned by the API.

Cancellation is accepted only while the order is `Pending` and the configured window has not expired. A successful cancellation changes the order to `Cancelled` and restores every ordered product quantity in the same serializable SQL transaction.

## `GET /api/v1/orders`

Requires authentication. Returns the current user's orders newest first.

Each item includes:

- `id`
- `orderNumber`
- `status`
- `total`
- `currency`
- `itemCount`
- `createdAtUtc`
- `updatedAtUtc`
- `canCancel`
- `cancelUntilUtc`
- `cancellationMessage`

## `GET /api/v1/orders/{orderId}`

Requires authentication and ownership of the order. Returns order totals, immutable item snapshots, delivery address snapshot, payment-method selection, status, and cancellation metadata.

Returns `404` when the order does not exist for the authenticated user.

## `POST /api/v1/orders/{orderId}/cancel`

Requires authentication and ownership of the order.

Successful response:

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "orderNumber": "AUX-20260906-ABC12345",
  "status": "Cancelled",
  "cancelledAtUtc": "2026-09-06T19:00:00Z",
  "message": "Order cancelled successfully. Reserved stock was restored."
}
```

Possible outcomes:

- `200`: cancellation completed and stock restored;
- `404`: order is not owned by the authenticated user or does not exist;
- `409`: cancellation is no longer valid, the window expired, or the order was already cancelled.

## Transaction semantics

Cancellation uses SQL Server `Serializable` isolation and executes through EF Core's configured execution strategy. Order state and inventory restoration are committed atomically.
