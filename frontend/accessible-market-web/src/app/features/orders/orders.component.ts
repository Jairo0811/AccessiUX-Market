import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderDetail, OrderSummary } from '../../core/orders/order.models';
import { OrderService } from '../../core/orders/order.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="orders-shell" aria-labelledby="orders-title">
      <header class="page-header">
        <p class="eyebrow">Mi cuenta</p>
        <h1 id="orders-title">Mis pedidos</h1>
        <p>Consulta el estado de tus compras y verifica claramente si todavía pueden cancelarse.</p>
      </header>

      <p class="sr-status" aria-live="polite">{{ liveMessage }}</p>

      @if (loading) {
        <p role="status">Cargando tus pedidos…</p>
      } @else if (errorMessage) {
        <div class="notice error" role="alert">
          <strong>No pudimos cargar tus pedidos.</strong>
          <span>{{ errorMessage }}</span>
        </div>
      } @else if (orders.length === 0) {
        <section class="empty-state" aria-labelledby="empty-orders-title">
          <h2 id="empty-orders-title">Todavía no tienes pedidos</h2>
          <p>Cuando completes una compra, aparecerá aquí con su estado y opciones disponibles.</p>
          <a routerLink="/catalog" class="primary-link">Explorar catálogo</a>
        </section>
      } @else {
        <div class="order-list" aria-label="Historial de pedidos">
          @for (order of orders; track order.id) {
            <article class="order-card">
              <div class="order-card__heading">
                <div>
                  <p class="label">Pedido</p>
                  <h2>{{ order.orderNumber }}</h2>
                </div>
                <span class="status" [class.cancelled]="order.status === 'Cancelled'">{{ statusLabel(order.status) }}</span>
              </div>

              <dl class="summary-grid">
                <div><dt>Fecha</dt><dd>{{ order.createdAtUtc | date:'medium' }}</dd></div>
                <div><dt>Artículos</dt><dd>{{ order.itemCount }}</dd></div>
                <div><dt>Total</dt><dd>{{ order.total | currency:order.currency:'symbol':'1.2-2' }}</dd></div>
              </dl>

              <p class="policy" [class.available]="order.canCancel">
                <strong>{{ order.canCancel ? 'Cancelación disponible.' : 'Cancelación no disponible.' }}</strong>
                {{ friendlyCancellationMessage(order) }}
              </p>

              <a class="secondary-link" [routerLink]="['/orders', order.id]" [attr.aria-label]="'Ver detalle del pedido ' + order.orderNumber">
                Ver detalle
              </a>
            </article>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; }
    .orders-shell { max-width: 980px; margin: 0 auto; padding: 2rem 1rem 4rem; }
    .page-header { margin-bottom: 1.5rem; }
    .eyebrow, .label { margin: 0 0 .35rem; font-size: .82rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
    h1, h2 { line-height: 1.2; }
    h1 { margin: 0 0 .75rem; }
    h2 { margin: 0; font-size: 1.2rem; overflow-wrap: anywhere; }
    .order-list { display: grid; gap: 1rem; }
    .order-card, .empty-state { border: 1px solid currentColor; border-radius: .9rem; padding: 1.25rem; }
    .order-card__heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
    .status { border: 1px solid currentColor; border-radius: 999px; padding: .25rem .65rem; font-weight: 700; white-space: nowrap; }
    .status.cancelled { text-decoration: line-through; }
    .summary-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .75rem; margin: 1rem 0; }
    dt { font-size: .85rem; font-weight: 700; }
    dd { margin: .2rem 0 0; }
    .policy { padding: .8rem; border-left: .3rem solid currentColor; background: rgba(127,127,127,.08); }
    .policy.available { font-weight: 500; }
    .primary-link, .secondary-link { display: inline-block; min-height: 44px; padding: .7rem 1rem; border: 2px solid currentColor; border-radius: .55rem; font-weight: 700; text-decoration: none; }
    .notice { display: grid; gap: .35rem; padding: 1rem; border: 2px solid currentColor; border-radius: .65rem; }
    .sr-status:empty { display: none; }
    @media (max-width: 640px) {
      .summary-grid { grid-template-columns: 1fr; }
      .order-card__heading { flex-direction: column; }
    }
  `]
})
export class OrdersComponent implements OnInit {
  private readonly ordersService = inject(OrderService);

  orders: OrderSummary[] = [];
  loading = true;
  errorMessage = '';
  liveMessage = '';

  ngOnInit(): void {
    this.ordersService.getOrders().subscribe({
      next: orders => {
        this.orders = orders;
        this.loading = false;
        this.liveMessage = orders.length === 1 ? 'Se cargó 1 pedido.' : `Se cargaron ${orders.length} pedidos.`;
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = this.readError(error, 'Intenta nuevamente en unos segundos.');
      }
    });
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'Pending': return 'Pendiente';
      case 'Confirmed': return 'Confirmado';
      case 'Cancelled': return 'Cancelado';
      default: return status;
    }
  }

  friendlyCancellationMessage(order: OrderSummary): string {
    if (order.canCancel) {
      return `Disponible hasta ${new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(order.cancelUntilUtc))}.`;
    }

    if (order.status === 'Cancelled') return 'Este pedido ya fue cancelado.';
    return order.cancellationMessage;
  }

  private readError(error: HttpErrorResponse, fallback: string): string {
    return typeof error.error?.message === 'string' ? error.error.message : fallback;
  }
}

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="detail-shell" aria-labelledby="order-title">
      <a routerLink="/orders" class="back-link">← Volver a mis pedidos</a>
      <p class="sr-status" aria-live="polite">{{ liveMessage }}</p>

      @if (loading) {
        <p role="status">Cargando detalle del pedido…</p>
      } @else if (errorMessage) {
        <div class="notice" role="alert"><strong>No pudimos cargar el pedido.</strong> {{ errorMessage }}</div>
      } @else if (order) {
        <header class="page-header">
          <p class="eyebrow">Pedido</p>
          <h1 id="order-title">{{ order.orderNumber }}</h1>
          <p><strong>Estado:</strong> {{ statusLabel(order.status) }}</p>
        </header>

        <section class="policy-card" aria-labelledby="cancellation-title">
          <h2 id="cancellation-title">Control de cancelación</h2>
          <p id="cancellation-policy">{{ friendlyCancellationMessage(order) }}</p>

          @if (actionErrorMessage) {
            <p class="notice" role="alert">{{ actionErrorMessage }}</p>
          }

          @if (order.canCancel && !confirmingCancellation) {
            <button type="button" class="danger-button" (click)="confirmingCancellation = true" aria-describedby="cancellation-policy">
              Cancelar pedido
            </button>
          }

          @if (order.canCancel && confirmingCancellation) {
            <div class="confirmation" role="group" aria-labelledby="confirm-cancel-title">
              <h3 id="confirm-cancel-title">¿Confirmas la cancelación?</h3>
              <p>Esta acción cancelará el pedido y devolverá las unidades reservadas al inventario.</p>
              <div class="button-row">
                <button type="button" class="danger-button" (click)="cancelOrder()" [disabled]="cancelling">
                  {{ cancelling ? 'Cancelando…' : 'Sí, cancelar pedido' }}
                </button>
                <button type="button" class="secondary-button" (click)="confirmingCancellation = false" [disabled]="cancelling">
                  Conservar pedido
                </button>
              </div>
            </div>
          }
        </section>

        <div class="detail-grid">
          <section class="card" aria-labelledby="items-title">
            <h2 id="items-title">Artículos</h2>
            <ul class="item-list">
              @for (item of order.items; track item.productId) {
                <li>
                  <div>
                    <a [routerLink]="['/products', item.slug]">{{ item.name }}</a>
                    <span>Cantidad: {{ item.quantity }}</span>
                  </div>
                  <strong>{{ item.lineTotal | currency:order.currency:'symbol':'1.2-2' }}</strong>
                </li>
              }
            </ul>
          </section>

          <section class="card" aria-labelledby="totals-title">
            <h2 id="totals-title">Resumen</h2>
            <dl class="totals">
              <div><dt>Subtotal</dt><dd>{{ order.subtotal | currency:order.currency:'symbol':'1.2-2' }}</dd></div>
              <div><dt>Envío</dt><dd>{{ order.shippingAmount | currency:order.currency:'symbol':'1.2-2' }}</dd></div>
              <div><dt>Impuestos</dt><dd>{{ order.taxAmount | currency:order.currency:'symbol':'1.2-2' }}</dd></div>
              <div class="total"><dt>Total</dt><dd>{{ order.total | currency:order.currency:'symbol':'1.2-2' }}</dd></div>
            </dl>
          </section>

          <section class="card" aria-labelledby="delivery-title">
            <h2 id="delivery-title">Entrega</h2>
            <address>
              {{ order.address.recipientName }}<br>
              {{ order.address.addressLine1 }}<br>
              @if (order.address.addressLine2) { {{ order.address.addressLine2 }}<br> }
              {{ order.address.city }}, {{ order.address.region }} {{ order.address.postalCode }}<br>
              {{ order.address.countryCode }}<br>
              {{ order.address.phone }}
            </address>
          </section>

          <section class="card" aria-labelledby="payment-title">
            <h2 id="payment-title">Método de pago</h2>
            <p>{{ order.paymentMethod }}</p>
            <p class="muted">AccessiUX Market conserva únicamente la selección del método; no almacena datos de tarjeta.</p>
          </section>
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; }
    .detail-shell { max-width: 980px; margin: 0 auto; padding: 2rem 1rem 4rem; }
    .back-link { display: inline-block; margin-bottom: 1.25rem; min-height: 44px; padding: .6rem 0; font-weight: 700; }
    .eyebrow { margin: 0 0 .35rem; font-size: .82rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
    h1 { margin: 0 0 .5rem; overflow-wrap: anywhere; }
    .policy-card, .card, .notice { border: 1px solid currentColor; border-radius: .85rem; padding: 1.2rem; }
    .policy-card { margin: 1.25rem 0; border-width: 2px; }
    .detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
    .item-list { list-style: none; padding: 0; margin: 0; }
    .item-list li { display: flex; justify-content: space-between; gap: 1rem; padding: .8rem 0; border-bottom: 1px solid currentColor; }
    .item-list li:last-child { border-bottom: 0; }
    .item-list span { display: block; margin-top: .25rem; }
    .totals { margin: 0; }
    .totals div { display: flex; justify-content: space-between; gap: 1rem; padding: .35rem 0; }
    .totals dd { margin: 0; }
    .totals .total { margin-top: .4rem; padding-top: .75rem; border-top: 2px solid currentColor; font-weight: 800; }
    address { font-style: normal; line-height: 1.6; }
    .button-row { display: flex; flex-wrap: wrap; gap: .75rem; }
    button { min-height: 44px; padding: .7rem 1rem; border: 2px solid currentColor; border-radius: .55rem; font: inherit; font-weight: 700; cursor: pointer; }
    button:disabled { cursor: wait; opacity: .65; }
    .danger-button { font-weight: 800; }
    .confirmation { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid currentColor; }
    .muted { opacity: .78; }
    .sr-status:empty { display: none; }
    @media (max-width: 720px) { .detail-grid { grid-template-columns: 1fr; } }
  `]
})
export class OrderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ordersService = inject(OrderService);

  order: OrderDetail | null = null;
  loading = true;
  cancelling = false;
  confirmingCancellation = false;
  errorMessage = '';
  actionErrorMessage = '';
  liveMessage = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      this.errorMessage = 'El identificador del pedido no es válido.';
      return;
    }

    this.loadOrder(id);
  }

  cancelOrder(): void {
    if (!this.order || !this.order.canCancel || this.cancelling) return;

    const id = this.order.id;
    this.cancelling = true;
    this.actionErrorMessage = '';

    this.ordersService.cancel(id).subscribe({
      next: result => {
        this.liveMessage = `Pedido ${result.orderNumber} cancelado correctamente.`;
        this.confirmingCancellation = false;
        this.cancelling = false;
        this.loadOrder(id, false);
      },
      error: (error: HttpErrorResponse) => {
        this.cancelling = false;
        this.confirmingCancellation = false;
        this.actionErrorMessage = this.readError(error, 'No fue posible cancelar el pedido. Actualizamos su estado para que puedas revisarlo.');
        this.liveMessage = this.actionErrorMessage;
        this.loadOrder(id, false);
      }
    });
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'Pending': return 'Pendiente';
      case 'Confirmed': return 'Confirmado';
      case 'Cancelled': return 'Cancelado';
      default: return status;
    }
  }

  friendlyCancellationMessage(order: OrderDetail): string {
    if (order.canCancel) {
      return `Puedes cancelar este pedido hasta ${new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(order.cancelUntilUtc))}. Después de ese momento la opción se bloqueará.`;
    }

    if (order.status === 'Cancelled' && order.cancelledAtUtc) {
      return `Este pedido fue cancelado el ${new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(order.cancelledAtUtc))}.`;
    }

    return order.cancellationMessage;
  }

  private loadOrder(id: string, showLoading = true): void {
    if (showLoading) this.loading = true;

    this.ordersService.getOrder(id).subscribe({
      next: order => {
        this.order = order;
        this.errorMessage = '';
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = this.readError(error, 'Pedido no encontrado o no disponible para esta cuenta.');
      }
    });
  }

  private readError(error: HttpErrorResponse, fallback: string): string {
    return typeof error.error?.message === 'string' ? error.error.message : fallback;
  }
}
