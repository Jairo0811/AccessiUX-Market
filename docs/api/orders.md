# Orders API

Fase 6 exposes authenticated order history, order detail, reversible cancellation, explicit purchase completion, and accessible invoice data aligned with `AM-UX-001`.

## Order states

AccessiUX Market currently uses three persisted order states:

- `Pending`: the order exists and can still be completed or, while the cancellation window is open, cancelled;
- `Confirmed`: shown in the UI as **Compra realizada**; cancellation is disabled and the invoice becomes available;
- `Cancelled`: the order was cancelled and its inventory was restored.

`Confirmed` is the technical enum value already present in the domain. No database migration is required for the purchase-completion feature.

## Cancellation policy

The cancellation window is configured with `Orders:CancellationWindowMinutes` and defaults to **30 minutes**.

The server is authoritative. A client must not decide cancellability from local time alone; it must use `canCancel`, `cancelUntilUtc`, and `cancellationMessage` returned by the API.

Cancellation is accepted only while the order is `Pending` and the configured window has not expired. A successful cancellation changes the order to `Cancelled` and restores every ordered product quantity in the same serializable SQL transaction.

Marking a purchase as completed changes the order to `Confirmed` and permanently disables cancellation.

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
- `canComplete`
- `invoiceAvailable`
- `cancelUntilUtc`
- `cancellationMessage`
- `completedAtUtc`

## `GET /api/v1/orders/{orderId}`

Requires authentication and ownership of the order. Returns order totals, immutable item snapshots, delivery address snapshot, payment-method selection, status, completion metadata, invoice availability, and cancellation metadata.

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
- `409`: cancellation is no longer valid, the window expired, or the order was already cancelled/completed.

## `POST /api/v1/orders/{orderId}/complete`

Requires authentication and ownership of the order.

Transitions a `Pending` order to `Confirmed`, which the UI presents as **Compra realizada**. This action is explicit because AccessiUX Market does not currently integrate a real payment processor or carrier event that could authoritatively close the transaction automatically.

Successful response:

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "orderNumber": "AUX-20260906-ABC12345",
  "status": "Confirmed",
  "completedAtUtc": "2026-09-06T19:10:00Z",
  "message": "Purchase marked as completed. Cancellation is now disabled and the invoice is available."
}
```

Possible outcomes:

- `200`: purchase marked completed;
- `404`: order is not owned by the authenticated user or does not exist;
- `409`: order was already completed, cancelled, or cannot transition from its current state.

## `GET /api/v1/orders/{orderId}/invoice`

Requires authentication and ownership of the order. The invoice is available only for `Confirmed` orders.

The response is a server-authoritative snapshot containing:

- `invoiceNumber` derived from the immutable order number;
- `orderId` and `orderNumber`;
- completion/issue timestamp;
- currency;
- subtotal, shipping, tax, and total;
- payment-method selection;
- delivery/customer snapshot;
- immutable order-item snapshots.

The Angular UI renders this data as a semantic, keyboard-accessible invoice with a real table, labeled totals, screen-reader-friendly structure, and print styling. Users can print it or use the browser's **Save as PDF** option.

The invoice is a commercial purchase document for the portfolio application. It deliberately does **not** pretend to be a Dominican NCF/e-CF tax receipt because AccessiUX Market is not integrated with DGII fiscal numbering or an authorized electronic invoicing provider.

Possible outcomes:

- `200`: completed-order invoice returned;
- `404`: order is not owned by the authenticated user or does not exist;
- `409`: purchase has not been marked completed or the order was cancelled.

## Transaction semantics

Cancellation uses SQL Server `Serializable` isolation and executes through EF Core's configured execution strategy. Order state and inventory restoration are committed atomically.

Purchase completion also uses `Serializable` isolation so a completion and a cancellation cannot both win concurrently. Completion does not alter inventory; the inventory reduction already happened transactionally during checkout.
