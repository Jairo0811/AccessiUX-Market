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

## Tax calculation

Tax is calculated by the backend from the delivery country. The client never submits a trusted tax amount.

### Dominican Republic (`DO`)

AccessiUX Market applies the standard **18% ITBIS** to the taxable checkout base. The current taxable base is:

```text
subtotal + shipping amount
```

Shipping is currently `0.00`, so the effective calculation is `subtotal × 18%`. Tax is rounded to two decimal places using midpoint rounding away from zero.

Example for a DOP 3,000.00 subtotal:

```text
Subtotal: DOP 3,000.00
Envío:    DOP     0.00
ITBIS:    DOP   540.00
Total:    DOP 3,540.00
```

The calculated tax is persisted in the order snapshot through `TaxAmount`, and the order total remains `Subtotal + ShippingAmount + TaxAmount`.

### United States (`US`)

AccessiUX Market does not use a fixed nationwide sales-tax percentage for United States addresses. Sales tax depends on state and, where applicable, local jurisdiction. Until state/local tax rules are implemented, `/review` returns a warning with `canConfirm: false`, and a direct `/confirm` attempt is rejected with `409 Conflict`.

This deliberately avoids treating an unsupported United States address as tax-free.

## POST `/api/v1/checkout/confirm`

Creates the order from the authenticated user's current cart.

The request body is the same shape used by `/review`.

Before committing, the server revalidates:

- the cart is not empty;
- every referenced product still exists;
- every product is still published;
- all products use one currency;
- requested quantities do not exceed live stock;
- a server-side tax rule exists for the selected delivery country.

Confirmation is transactional: order creation, order-item snapshots, stock decrement and cart clearing are committed together. If a business rule fails, none of those mutations should be committed.

A successful Dominican Republic confirmation returns `201 Created`; for example, a DOP 3,000.00 subtotal with 18% ITBIS produces:

```json
{
  "orderId": "00000000-0000-0000-0000-000000000000",
  "orderNumber": "AUX-20260906-1234ABCD",
  "total": 3540.00,
  "currency": "DOP",
  "status": "Pending",
  "createdAtUtc": "2026-09-06T18:30:00Z"
}
```

Business-rule failures return `409 Conflict`, including an empty cart, insufficient stock, an unpublished product, an inconsistent cart currency or a delivery country without a configured tax rule.

## Order snapshots

`Order` and `OrderItem` preserve the purchase-time values needed for later order history and cancellation flows. Product name, slug, unit price, quantity, delivery address, payment selection, subtotal, shipping amount and tax amount are stored with the order so subsequent catalog or tax-rule edits do not rewrite purchase history.

Existing orders are historical snapshots and are not recalculated retroactively when tax rules change.

## Phase boundaries

Phase 5 creates the order and establishes the checkout consistency boundary. Order history, status transitions and cancellation policy belong to Phase 6. A real external payment-provider integration is also outside this phase; no fake payment authorization is presented as a completed charge.
