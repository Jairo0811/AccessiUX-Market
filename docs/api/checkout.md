# Checkout API

Phase 5 introduces an authenticated checkout flow designed around `AM-UX-006`: critical purchase information is reviewable before the order is created.

Base path: `/api/v1/checkout`

All endpoints require a valid bearer access token. The checkout owner is derived from the authenticated JWT; clients cannot choose another user id.

## POST `/api/v1/checkout/review`

Revalidates the current cart and returns the information that must be reviewed before confirmation.

```json
{
  "address": {
    "recipientName": "Cliente",
    "addressLine1": "Av. Principal 100",
    "addressLine2": "Apto. 2A",
    "city": "Santo Domingo",
    "region": "Distrito Nacional",
    "postalCode": "10127",
    "countryCode": "DO",
    "phone": "8095550101"
  },
  "paymentMethod": "Card"
}
```

Supported payment selections in Phase 5:

- `Card`
- `CashOnDelivery`

`Card` represents the selected payment method only. Phase 5 does **not** collect, store or process card numbers, CVVs or other PCI cardholder data.

The response contains:

- current cart lines and live unit prices;
- current available stock;
- delivery address;
- selected payment method;
- subtotal;
- shipping amount;
- tax amount;
- final total;
- currency;
- `canConfirm`;
- warnings that must be resolved before confirmation.

The review endpoint does not reserve stock and does not create an order. A later confirmation always revalidates inventory and product state.

## POST `/api/v1/checkout/confirm`

Creates the order from the authenticated user's current cart.

The request body is the same shape used by `/review`.

Before committing, the server revalidates:

- the cart is not empty;
- every referenced product still exists;
- every product is still published;
- all products use one currency;
- requested quantities do not exceed live stock.

Confirmation is transactional: order creation, order-item snapshots, stock decrement and cart clearing are committed together. If a business rule fails, none of those mutations should be committed.

A successful confirmation returns `201 Created`:

```json
{
  "orderId": "00000000-0000-0000-0000-000000000000",
  "orderNumber": "AUX-20260906-1234ABCD",
  "total": 3000.00,
  "currency": "DOP",
  "status": "Pending",
  "createdAtUtc": "2026-09-06T18:30:00Z"
}
```

Business-rule failures return `409 Conflict`, including an empty cart, insufficient stock, an unpublished product or an inconsistent cart currency.

## Order snapshots

`Order` and `OrderItem` preserve the purchase-time values needed for later order history and cancellation flows. Product name, slug, unit price, quantity, delivery address and payment selection are stored with the order so subsequent catalog edits do not rewrite purchase history.

## Phase boundaries

Phase 5 creates the order and establishes the checkout consistency boundary. Order history, status transitions and cancellation policy belong to Phase 6. A real external payment-provider integration is also outside this phase; no fake payment authorization is presented as a completed charge.
