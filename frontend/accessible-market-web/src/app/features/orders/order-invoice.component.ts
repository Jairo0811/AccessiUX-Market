import { CommonModule, DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderInvoice } from '../../core/orders/order.models';
import { OrderService } from '../../core/orders/order.service';

@Component({
  selector: 'app-order-invoice',
  standalone: true,
  imports: [CommonModule, RouterLink],
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="invoice-page" aria-labelledby="invoice-page-title">
      <div class="invoice-actions" aria-label="Acciones de la factura">
        <a class="invoice-back" [routerLink]="['/orders', orderId]">← Volver al pedido</a>
        @if (invoice) {
          <button type="button" class="invoice-print-button" (click)="printInvoice()">
            Imprimir o guardar como PDF
          </button>
        }
      </div>

      <p class="invoice-live" aria-live="polite">{{ liveMessage }}</p>

      @if (loading) {
        <div class="invoice-loading" role="status">Cargando factura accesible…</div>
      } @else if (errorMessage) {
        <section class="invoice-error" role="alert" aria-labelledby="invoice-error-title">
          <h1 id="invoice-error-title">Factura no disponible</h1>
          <p>{{ errorMessage }}</p>
          <a [routerLink]="['/orders', orderId]">Volver al detalle del pedido</a>
        </section>
      } @else if (invoice) {
        <article class="invoice-document" aria-labelledby="invoice-page-title">
          <header class="invoice-header">
            <div class="invoice-brand">
              <img class="invoice-brand__mark" src="branding/accessiux-mark.svg" alt="">
              <div>
                <strong>AccessiUX Market</strong>
                <span>Comercio electrónico accesible y usable</span>
              </div>
            </div>

            <div class="invoice-heading">
              <p class="invoice-kicker">Factura de compra</p>
              <h1 id="invoice-page-title">{{ invoice.invoiceNumber }}</h1>
              <span class="invoice-status">Compra realizada</span>
            </div>
          </header>

          <p class="invoice-disclaimer">
            Documento comercial de AccessiUX Market. No sustituye un comprobante fiscal NCF/e-CF emitido por un proveedor autorizado ante la DGII.
          </p>

          <section class="invoice-meta" aria-labelledby="invoice-meta-title">
            <h2 id="invoice-meta-title">Información de la compra</h2>
            <dl>
              <div><dt>Número de pedido</dt><dd>{{ invoice.orderNumber }}</dd></div>
              <div><dt>Fecha de emisión</dt><dd>{{ formatIssuedAt(invoice.issuedAtUtc) }}</dd></div>
              <div><dt>Método de pago</dt><dd>{{ paymentLabel(invoice.paymentMethod) }}</dd></div>
              <div><dt>Moneda</dt><dd>{{ invoice.currency }}</dd></div>
            </dl>
          </section>

          <section class="invoice-customer" aria-labelledby="invoice-customer-title">
            <h2 id="invoice-customer-title">Facturado y entregado a</h2>
            <address>
              <strong>{{ invoice.address.recipientName }}</strong><br>
              {{ invoice.address.addressLine1 }}<br>
              @if (invoice.address.addressLine2) { {{ invoice.address.addressLine2 }}<br> }
              {{ invoice.address.city }}, {{ invoice.address.region }} {{ invoice.address.postalCode }}<br>
              {{ countryLabel(invoice.address.countryCode) }}<br>
              Teléfono: {{ invoice.address.phone }}
            </address>
          </section>

          <section class="invoice-items" aria-labelledby="invoice-items-title">
            <h2 id="invoice-items-title">Artículos facturados</h2>
            <div class="invoice-table-wrap" tabindex="0" aria-label="Tabla desplazable de artículos facturados">
              <table>
                <caption class="invoice-sr-only">Detalle de productos, cantidades, precios unitarios e importes facturados.</caption>
                <thead>
                  <tr>
                    <th scope="col">Producto</th>
                    <th scope="col">Cantidad</th>
                    <th scope="col">Precio unitario</th>
                    <th scope="col">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of invoice.items; track item.productId) {
                    <tr>
                      <th scope="row">{{ item.name }}</th>
                      <td>{{ item.quantity }}</td>
                      <td>{{ formatMoney(item.unitPrice, invoice.currency) }}</td>
                      <td>{{ formatMoney(item.lineTotal, invoice.currency) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>

          <section class="invoice-totals" aria-labelledby="invoice-totals-title">
            <h2 id="invoice-totals-title">Totales</h2>
            <dl>
              <div><dt>Subtotal</dt><dd>{{ formatMoney(invoice.subtotal, invoice.currency) }}</dd></div>
              <div><dt>Envío</dt><dd>{{ formatMoney(invoice.shippingAmount, invoice.currency) }}</dd></div>
              <div><dt>{{ taxLabel(invoice) }}</dt><dd>{{ formatMoney(invoice.taxAmount, invoice.currency) }}</dd></div>
              <div class="invoice-total"><dt>Total de la compra</dt><dd>{{ formatMoney(invoice.total, invoice.currency) }}</dd></div>
            </dl>
          </section>

          <footer class="invoice-footer-note">
            <strong>Gracias por comprar en AccessiUX Market.</strong>
            <span>Documento diseñado para una lectura clara con teclado, lector de pantalla, alto contraste e impresión.</span>
          </footer>
        </article>
      }
    </section>
  `,
  styles: [`
    .invoice-page { max-width: 68rem; margin: 0 auto; padding: 1rem 0 4rem; color: var(--ink-900); }
    .invoice-actions { margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    .invoice-back { min-height: 44px; display: inline-flex; align-items: center; font-weight: 750; }
    .invoice-print-button { min-height: 44px; padding: .75rem 1rem; border: 2px solid var(--navy-900); border-radius: .65rem; color: #fff; background: var(--navy-900); font: inherit; font-weight: 800; cursor: pointer; }
    .invoice-document { padding: clamp(1.4rem,4vw,3rem); display: grid; gap: 1.5rem; border: 1px solid var(--border-strong); border-radius: 1.25rem; background: #fff; box-shadow: var(--shadow-md); }
    .invoice-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 2rem; padding-bottom: 1.4rem; border-bottom: 2px solid var(--navy-900); }
    .invoice-brand { display: flex; align-items: center; gap: .8rem; }
    .invoice-brand__mark { width: 3rem; height: 3rem; flex: 0 0 3rem; display: block; }
    .invoice-brand > div { display: grid; }
    .invoice-brand strong { color: var(--navy-900); font-size: 1.25rem; }
    .invoice-brand span { color: var(--ink-600); font-size: .88rem; }
    .invoice-heading { text-align: right; }
    .invoice-kicker { margin: 0; color: #2845ba; font-size: .78rem; font-weight: 850; letter-spacing: .1em; text-transform: uppercase; }
    .invoice-heading h1 { margin: .25rem 0 .55rem; color: var(--navy-900); font-size: clamp(1.7rem,4vw,2.5rem); overflow-wrap: anywhere; }
    .invoice-status { display: inline-flex; padding: .35rem .7rem; border-radius: 999px; color: #0b6245; background: #edf9f4; font-weight: 800; }
    .invoice-disclaimer { margin: 0; padding: .85rem 1rem; border-left: .3rem solid #6b7280; background: #f7f8fa; color: var(--ink-700); }
    .invoice-meta h2, .invoice-customer h2, .invoice-items h2, .invoice-totals h2 { margin: 0 0 .8rem; color: var(--navy-900); font-size: 1.15rem; }
    .invoice-meta dl, .invoice-totals dl { margin: 0; display: grid; gap: .55rem; }
    .invoice-meta dl { grid-template-columns: repeat(2,minmax(0,1fr)); }
    .invoice-meta dl > div { padding: .75rem; border: 1px solid var(--border); border-radius: .65rem; }
    .invoice-meta dt { color: var(--ink-600); font-size: .82rem; font-weight: 750; }
    .invoice-meta dd { margin: .2rem 0 0; font-weight: 750; overflow-wrap: anywhere; }
    .invoice-customer address { margin: 0; line-height: 1.65; font-style: normal; }
    .invoice-table-wrap { overflow-x: auto; border: 1px solid var(--border-strong); border-radius: .75rem; }
    .invoice-table-wrap:focus { outline: 3px solid var(--focus); outline-offset: 3px; }
    .invoice-items table { width: 100%; min-width: 40rem; border-collapse: collapse; }
    .invoice-items th, .invoice-items td { padding: .85rem; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }
    .invoice-items thead th { color: #fff; background: var(--navy-900); }
    .invoice-items tbody th { color: var(--navy-900); }
    .invoice-items tbody tr:last-child th, .invoice-items tbody tr:last-child td { border-bottom: 0; }
    .invoice-totals { margin-left: auto; width: min(100%,26rem); }
    .invoice-totals dl > div { display: flex; justify-content: space-between; gap: 1rem; padding: .4rem 0; }
    .invoice-totals dd { margin: 0; font-weight: 750; }
    .invoice-totals .invoice-total { margin-top: .45rem; padding-top: .8rem; border-top: 2px solid var(--navy-900); color: var(--navy-900); font-size: 1.12rem; font-weight: 900; }
    .invoice-footer-note { padding-top: 1.25rem; display: grid; gap: .25rem; border-top: 1px solid var(--border); color: var(--ink-700); }
    .invoice-footer-note strong { color: var(--navy-900); }
    .invoice-loading, .invoice-error { padding: 1.5rem; border: 1px solid var(--border-strong); border-radius: .9rem; background: #fff; }
    .invoice-live:empty { display: none; }
    .invoice-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
    @media (max-width: 44rem) {
      .invoice-header { flex-direction: column; }
      .invoice-heading { text-align: left; }
      .invoice-meta dl { grid-template-columns: 1fr; }
    }
    @media print {
      @page { size: A4 portrait; margin: 8mm 10mm; }
      html, body { margin: 0 !important; padding: 0 !important; min-height: auto !important; background: #fff !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .site-header, .site-footer, .skip-link, .invoice-actions, .invoice-live { display: none !important; }
      .app-shell { width: 100% !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; background: #fff !important; }
      .invoice-page { max-width: none !important; margin: 0 !important; padding: 0 !important; background: #fff !important; }
      .invoice-document { padding: 0 !important; gap: 6mm !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; font-size: 9.5pt; line-height: 1.32; }
      .invoice-header { gap: 10mm; padding-bottom: 4mm; break-inside: avoid; }
      .invoice-brand__mark { width: 10mm; height: 10mm; flex-basis: 10mm; }
      .invoice-brand strong { font-size: 13pt; }
      .invoice-brand span { font-size: 8.5pt; }
      .invoice-kicker { font-size: 7.5pt; }
      .invoice-heading h1 { margin: 1mm 0 2mm; font-size: 17pt; }
      .invoice-status { padding: 1.5mm 3mm; border: 1px solid currentColor; font-size: 8.5pt; }
      .invoice-disclaimer { padding: 3mm 4mm; break-inside: avoid; }
      .invoice-meta, .invoice-customer, .invoice-totals, .invoice-footer-note { break-inside: avoid; }
      .invoice-meta h2, .invoice-customer h2, .invoice-items h2, .invoice-totals h2 { margin-bottom: 2.5mm; font-size: 11pt; }
      .invoice-meta dl { gap: 2mm; }
      .invoice-meta dl > div { padding: 2.5mm 3mm; border-radius: 2mm; }
      .invoice-meta dt { font-size: 7.5pt; }
      .invoice-meta dd { margin-top: .5mm; }
      .invoice-customer address { line-height: 1.38; }
      .invoice-table-wrap { overflow: visible !important; border-radius: 2mm; }
      .invoice-items table { min-width: 0 !important; font-size: 8.5pt; }
      .invoice-items thead { display: table-header-group; }
      .invoice-items tr { break-inside: avoid; }
      .invoice-items th, .invoice-items td { padding: 2.5mm 3mm; }
      .invoice-totals { width: 48%; min-width: 72mm; }
      .invoice-totals dl { gap: 0; }
      .invoice-totals dl > div { padding: 1.4mm 0; }
      .invoice-totals .invoice-total { margin-top: 1mm; padding-top: 2.2mm; font-size: 10.5pt; }
      .invoice-footer-note { padding-top: 3mm; gap: 1mm; font-size: 8.5pt; }
    }
  `]
})
export class OrderInvoiceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ordersService = inject(OrderService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly document = inject(DOCUMENT);

  orderId = '';
  invoice: OrderInvoice | null = null;
  loading = true;
  errorMessage = '';
  liveMessage = '';

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.orderId) {
      this.loading = false;
      this.errorMessage = 'El identificador del pedido no es válido.';
      return;
    }

    this.ordersService.getInvoice(this.orderId).subscribe({
      next: invoice => {
        this.invoice = invoice;
        this.loading = false;
        this.liveMessage = `Factura ${invoice.invoiceNumber} cargada correctamente.`;
        this.changeDetector.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = this.readError(error, 'La factura no está disponible para este pedido.');
        this.changeDetector.markForCheck();
      }
    });
  }

  printInvoice(): void {
    this.document.defaultView?.print();
  }

  formatIssuedAt(value: string): string {
    return new Intl.DateTimeFormat('es-DO', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'America/Santo_Domingo'
    }).format(new Date(value));
  }

  formatMoney(value: number, currency: string): string {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency,
      currencyDisplay: 'code',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value).replace(/\s+/g, ' ');
  }

  paymentLabel(paymentMethod: string): string {
    switch (paymentMethod) {
      case 'CashOnDelivery': return 'Pago contra entrega';
      case 'Card': return 'Tarjeta';
      default: return paymentMethod;
    }
  }

  countryLabel(countryCode: string): string {
    switch (countryCode) {
      case 'DO': return 'República Dominicana';
      case 'US': return 'Estados Unidos';
      default: return countryCode;
    }
  }

  taxLabel(invoice: OrderInvoice): string {
    return invoice.address.countryCode === 'DO' ? 'ITBIS (18%)' : 'Impuestos';
  }

  private readError(error: HttpErrorResponse, fallback: string): string {
    return typeof error.error?.message === 'string' ? error.error.message : fallback;
  }
}
