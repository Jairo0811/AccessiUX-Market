# Fase 6 — Diseño de pedidos y cancelaciones

## Decisiones

- `Order` conserva la regla de cancelación en el dominio.
- `OrderService` resuelve consultas y orquesta la reversión transaccional.
- La política temporal se inyecta mediante `OrderPolicyOptions`.
- El cliente Angular no replica reglas de negocio; consume metadata de cancelación desde API.
- No se añade una segunda reserva de inventario: Checkout ya descuenta stock y Fase 6 revierte ese descuento si la cancelación es válida.

## Consistencia

`POST /api/v1/orders/{orderId}/cancel` usa:

1. execution strategy de EF Core;
2. transacción SQL Server `Serializable`;
3. lectura del pedido con sus líneas;
4. validación de ownership, estado y ventana;
5. transición a `Cancelled`;
6. restitución de stock;
7. `SaveChanges` y commit atómicos.

La operación devuelve `409 Conflict` cuando la reversión ya no es válida y `404` cuando el recurso no pertenece al usuario autenticado.
