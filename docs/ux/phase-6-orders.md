# Fase 6 — Pedidos y cancelaciones

## Objetivo

Implementar `AM-UX-001 — Order reversibility` como comportamiento verificable de producto.

El usuario debe poder:

1. localizar sus pedidos desde navegación autenticada;
2. consultar estado, artículos, dirección, método de pago y totales;
3. identificar sin ambigüedad si un pedido todavía puede cancelarse;
4. conocer la fecha/hora límite de cancelación cuando la acción está disponible;
5. confirmar explícitamente la cancelación antes de ejecutarla;
6. recibir feedback accesible de éxito o conflicto;
7. ver el pedido actualizado como `Cancelled` después de completar la acción.

## Autoridad del servidor

La interfaz no infiere la política. El backend devuelve:

- `canCancel`;
- `cancelUntilUtc`;
- `cancellationMessage`.

Esto evita inconsistencias entre clientes, zonas horarias y estado real del pedido.

## Regla inicial

La ventana predeterminada es de **30 minutos** desde `CreatedAtUtc`, configurable mediante `Orders:CancellationWindowMinutes`.

Solo los pedidos en estado `Pending` son cancelables. La política queda preparada para que un flujo de fulfillment posterior cambie el estado y bloquee la reversión incluso antes del vencimiento temporal.

## Reversión de inventario

Cancelar un pedido revierte las cantidades de todos sus `OrderItem` hacia los productos correspondientes. Cambio de estado y restitución de stock se ejecutan en una única transacción `Serializable` a través de la execution strategy de EF Core.

## Accesibilidad y prevención de errores

La UI ofrece un paso de confirmación explícito antes de cancelar y comunica cambios mediante regiones `aria-live` / `role="alert"` según corresponda. Los controles mantienen objetivos interactivos de al menos 44 px y son operables mediante teclado.

## Evidencia requerida para cierre

- pruebas unitarias de ventana, transición de estado y restitución de inventario;
- pruebas de integración para autenticación, ownership, cancelación, stock y conflictos;
- build Angular;
- Playwright + axe sobre historial/detalle y confirmación de cancelación;
- CI completamente verde antes de merge.
