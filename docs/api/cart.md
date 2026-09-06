# Cart API

Phase 4 introduces a persistent cart scoped to the authenticated user.

Base path: `/api/v1/cart`

All endpoints require a valid bearer access token.

## GET `/api/v1/cart`

Returns the current cart.

```json
{
  "items": [
    {
      "productId": "00000000-0000-0000-0000-000000000000",
      "name": "Producto",
      "slug": "producto",
      "unitPrice": 1250.00,
      "currency": "DOP",
      "quantity": 2,
      "availableStock": 5,
      "lineTotal": 2500.00
    }
  ],
  "totalQuantity": 2,
  "subtotal": 2500.00,
  "currency": "DOP"
}
```

## POST `/api/v1/cart/items`

Adds a published product to the cart. Adding the same product again increments the existing line instead of creating a duplicate.

```json
{
  "productId": "00000000-0000-0000-0000-000000000000",
  "quantity": 1
}
```

Rules:

- quantity must be between `1` and `99`;
- the product must be published and in stock;
- resulting quantity cannot exceed current stock;
- products with different currencies cannot coexist in the same cart.

Returns `409 Conflict` when a business rule prevents the operation.

## PUT `/api/v1/cart/items/{productId}`

Replaces the quantity of one existing line.

```json
{
  "quantity": 3
}
```

Returns `404 Not Found` if the line does not belong to the current user.

## DELETE `/api/v1/cart/items/{productId}`

Removes one product from the current user's cart. The operation is idempotent.

## DELETE `/api/v1/cart`

Clears the current user's cart and returns `204 No Content`.

## Security and consistency

The user identifier is derived exclusively from the authenticated JWT; clients cannot submit or override a cart owner id. Prices and stock are read from the current server-side product record instead of accepting client-provided values. Checkout must revalidate availability and totals before creating an order.
