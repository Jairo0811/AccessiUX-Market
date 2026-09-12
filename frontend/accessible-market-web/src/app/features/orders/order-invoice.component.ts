import { CommonModule, DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AccessibilityPreferencesService } from '../../core/accessibility/accessibility-preferences.service';
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

      @if (invoice) {
        <fieldset class="invoice-reading-tools" aria-describedby="invoice-reading-help">
          <legend>Opciones de lectura de esta factura</legend>
          <p id="invoice-reading-help">
            Estos ajustes son los mismos de AccessiUX Market y se guardan para las demás pantallas.
          </p>
          <div class="invoice-reading-tools__options">
            <label class="invoice-preference" for="invoice-large-text">
              <input
                id="invoice-large-text"
                type="checkbox"
                [checked]="preferences.largeText()"
                (change)="setLargeText($event)"
              />
              <span><strong>Texto grande</strong><small>Aumenta tamaño y espaciado para facilitar la lectura.</small></span>
            </label>

            <label class="invoice-preference" for="invoice-high-contrast">
              <input
                id="invoice-high-contrast"
                type="checkbox"
                [checked]="preferences.highContrast()"
                (change)="setHighContrast($event)"
              />
              <span><strong>Alto contraste</strong><small>Refuerza texto, bordes y estados sin depender del color.</small></span>
            </label>

            <label class="invoice-preference" for="invoice-simple-reading">
              <input
                id="invoice-simple-reading"
                type="checkbox"
                [checked]="preferences.simpleReadingMode()"
                (change)="setSimpleReadingMode($event)"
              />
              <span><strong>Lectura simple</strong><small>Reduce decoración y mantiene solo la jerarquía esencial.</small></span>
            </label>

            <a class="invoice-accessibility-link" routerLink="/accessibility">Ver todas las preferencias de accesibilidad</a>
          </div>
        </fieldset>
      }

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
        <article
          class="invoice-document"
          aria-labelledby="invoice-page-title"
          aria-describedby="invoice-accessible-summary invoice-disclaimer"
        >
          <p id="invoice-accessible-summary" class="invoice-sr-only">
            Factura {{ invoice.invoiceNumber }}. Estado: compra realizada. Total de la compra:
            {{ formatMoney(invoice.total, invoice.currency) }}. Método de pago:
            {{ paymentLabel(invoice.paymentMethod) }}. Facturada a {{ invoice.address.recipientName }}.
          </p>

          <header class="invoice-header">
            <div class="invoice-brand">
              <svg class="invoice-brand__mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
                <defs>
                  <linearGradient id="invoice-brand-bg" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#12d4e2" />
                    <stop offset="0.5" stop-color="#1684ff" />
                    <stop offset="1" stop-color="#7c3aed" />
                  </linearGradient>
                </defs>
                <rect x="2" y="2" width="60" height="60" rx="18" fill="#0b2147" />
                <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#invoice-brand-bg)" opacity="0.22" />
                <path d="M32 10 13 21v22l19 11 19-11V21L32 10Z" fill="none" stroke="#d9fbff" stroke-width="3.2" stroke-linejoin="round" />
                <path d="M23 42 32 22l9 20M25.5 35h13" fill="none" stroke="#ffffff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" />
                <circle cx="32" cy="29" r="2.7" fill="#ffffff" />
              </svg>
              <div>
                <strong>AccessiUX Market</strong>
                <span>Comercio electrónico accesible y usable</span>
              </div>
            </div>

            <div class="invoice-heading">
              <p class="invoice-kicker">Factura de compra</p>
              <h1 id="invoice-page-title">{{ invoice.invoiceNumber }}</h1>
              <span class="invoice-status"><span class="invoice-status__label">Estado:</span> Compra realizada</span>
            </div>
          </header>

          <p id="invoice-disclaimer" class="invoice-disclaimer">
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
    .invoice-reading-tools { margin: 0 0 1rem; padding: 1rem; border: 2px solid var(--border-strong); border-radius: .9rem; background: var(--surface); }
    .invoice-reading-tools legend { padding: 0 .35rem; color: var(--navy-900); font-weight: 850; }
    .invoice-reading-tools > p { margin: 0 0 .85rem; color: var(--ink-700); }
    .invoice-reading-tools__options { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: .75rem; }
    .invoice-preference { min-height: 56px; padding: .75rem; display: grid; grid-template-columns: auto 1fr; align-items: start; gap: .65rem; border: 1px solid var(--border-strong); border-radius: .7rem; background: #fff; cursor: pointer; }
    .invoice-preference:has(input:checked) { border-width: 2px; border-color: var(--blue); background: var(--surface-tint); }
    .invoice-preference input { width: 1.3rem; height: 1.3rem; margin-top: .15rem; }
    .invoice-preference span { display: grid; gap: .15rem; }
    .invoice-preference strong { color: var(--navy-900); }
    .invoice-preference small { color: var(--ink-700); line-height: 1.4; }
    .invoice-accessibility-link { min-height: 48px; grid-column: 1 / -1; display: inline-flex; align-items: center; width: fit-content; font-weight: 800; }
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
    .invoice-status { display: inline-flex; gap: .35rem; padding: .4rem .75rem; border: 2px solid #0b6245; border-radius: 999px; color: #0b6245; background: #edf9f4; font-weight: 800; }
    .invoice-status__label { font-weight: 900; }
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
    .invoice-totals .invoice-total { margin-top: .45rem; padding-top: .8rem; border-top: 3px double var(--navy-900); color: var(--navy-900); font-size: 1.12rem; font-weight: 900; }
    .invoice-footer-note { padding-top: 1.25rem; display: grid; gap: .25rem; border-top: 1px solid var(--border); color: var(--ink-700); }
    .invoice-footer-note strong { color: var(--navy-900); }
    .invoice-loading, .invoice-error { padding: 1.5rem; border: 1px solid var(--border-strong); border-radius: .9rem; background: #fff; }
    .invoice-live:empty { display: none; }
    .invoice-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
    .invoice-page a:focus-visible, .invoice-page button:focus-visible, .invoice-page input:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
    :root[data-large-text] .invoice-document { font-size: 1.16rem; line-height: 1.72; }
    :root[data-large-text] .invoice-meta dt { font-size: .95rem; }
    :root[data-large-text] .invoice-items table { font-size: 1.05rem; }
    :root[data-high-contrast] .invoice-document, :root[data-high-contrast] .invoice-reading-tools, :root[data-high-contrast] .invoice-meta dl > div, :root[data-high-contrast] .invoice-table-wrap { border-color: #000; border-width: 2px; }
    :root[data-high-contrast] .invoice-document, :root[data-high-contrast] .invoice-reading-tools, :root[data-high-contrast] .invoice-meta dl > div, :root[data-high-contrast] .invoice-preference { color: #000; background: #fff; }
    :root[data-high-contrast] .invoice-items thead th { color: #fff; background: #000; }
    :root[data-high-contrast] .invoice-status { color: #000; border-color: #000; background: #fff; }
    :root[data-high-contrast] .invoice-page a { color: #000; text-decoration-thickness: .15em; }
    :root[data-simple-reading] .invoice-document { box-shadow: none; border-width: 2px; border-radius: .45rem; }
    :root[data-simple-reading] .invoice-brand__mark { display: none; }
    :root[data-simple-reading] .invoice-status, :root[data-simple-reading] .invoice-meta dl > div, :root[data-simple-reading] .invoice-table-wrap { border-radius: .2rem; }
    @media (max-width: 52rem) {
      .invoice-reading-tools__options { grid-template-columns: 1fr; }
    }
    @media (max-width: 44rem) {
      .invoice-header { flex-direction: column; }
      .invoice-heading { text-align: left; }
      .invoice-meta dl { grid-template-columns: 1fr; }
    }
    @media (prefers-contrast: more) {
      .invoice-document, .invoice-reading-tools, .invoice-meta dl > div, .invoice-table-wrap { border-color: var(--navy-900); border-width: 2px; }
      .invoice-page a { text-decoration-thickness: .13em; }
    }
    @media (forced-colors: active) {
      .invoice-document, .invoice-reading-tools, .invoice-preference, .invoice-meta dl > div, .invoice-table-wrap, .invoice-status { border: 2px solid CanvasText; }
      .invoice-items thead th { color: Canvas; background: CanvasText; forced-color-adjust: none; }
      .invoice-brand__mark { forced-color-adjust: auto; }
    }
    @media print {
      @page { size: A4 portrait; margin: 8mm 10mm; }
      html, body { margin: 0 !important; padding: 0 !important; min-height: auto !important; background: #fff !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .site-header, .site-footer, .skip-link, .invoice-actions, .invoice-reading-tools, .invoice-live { display: none !important; }
      .app-shell { width: 100% !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; background: #fff !important; }
      .invoice-page { max-width: none !important; margin: 0 !important; padding: 0 !important; background: #fff !important; }
      .invoice-document { padding: 0 !important; gap: 5.5mm !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; font-size: 10.5pt; line-height: 1.38; }
      .invoice-header { gap: 10mm; padding-bottom: 4mm; break-inside: avoid; }
      .invoice-brand__mark { width: 10mm; height: 10mm; flex-basis: 10mm; }
      .invoice-brand strong { font-size: 13.5pt; }
      .invoice-brand span { font-size: 9pt; }
      .invoice-kicker { font-size: 8.5pt; }
      .invoice-heading h1 { margin: 1mm 0 2mm; font-size: 17pt; }
      .invoice-status { padding: 1.5mm 3mm; border: 1.5px solid currentColor; font-size: 9pt; }
      .invoice-disclaimer { padding: 3mm 4mm; break-inside: avoid; }
      .invoice-meta, .invoice-customer, .invoice-totals, .invoice-footer-note { break-inside: avoid; }
      .invoice-meta h2, .invoice-customer h2, .invoice-items h2, .invoice-totals h2 { margin-bottom: 2.5mm; font-size: 11.5pt; }
      .invoice-meta dl { gap: 2mm; }
      .invoice-meta dl > div { padding: 2.5mm 3mm; border-radius: 2mm; }
      .invoice-meta dt { font-size: 8.5pt; }
      .invoice-meta dd { margin-top: .5mm; }
      .invoice-customer address { line-height: 1.42; }
      .invoice-table-wrap { overflow: visible !important; border-radius: 2mm; }
      .invoice-items table { min-width: 0 !important; font-size: 9.5pt; }
      .invoice-items thead { display: table-header-group; }
      .invoice-items tr { break-inside: avoid; }
      .invoice-items th, .invoice-items td { padding: 2.5mm 3mm; }
      .invoice-totals { width: 50%; min-width: 76mm; }
      .invoice-totals dl { gap: 0; }
      .invoice-totals dl > div { padding: 1.5mm 0; }
      .invoice-totals .invoice-total { margin-top: 1mm; padding-top: 2.2mm; font-size: 11pt; }
      .invoice-footer-note { padding-top: 3mm; gap: 1mm; font-size: 9pt; }
      :root[data-large-text] .invoice-document { font-size: 12.5pt !important; line-height: 1.5; gap: 7mm !important; }
      :root[data-large-text] .invoice-meta dt { font-size: 10pt; }
      :root[data-large-text] .invoice-items table { font-size: 11pt; }
      :root[data-large-text] .invoice-meta h2, :root[data-large-text] .invoice-customer h2, :root[data-large-text] .invoice-items h2, :root[data-large-text] .invoice-totals h2 { font-size: 13pt; }
    }
  `]
})
export class OrderInvoiceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ordersService = inject(OrderService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly document = inject(DOCUMENT);

  readonly preferences = inject(AccessibilityPreferencesService);

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

  setLargeText(event: Event): void {
    const enabled = this.checked(event);
    this.preferences.setLargeText(enabled);
    this.liveMessage = `Texto grande ${enabled ? 'activado' : 'desactivado'} para AccessiUX Market.`;
  }

  setHighContrast(event: Event): void {
    const enabled = this.checked(event);
    this.preferences.setHighContrast(enabled);
    this.liveMessage = `Alto contraste ${enabled ? 'activado' : 'desactivado'} para AccessiUX Market.`;
  }

  setSimpleReadingMode(event: Event): void {
    const enabled = this.checked(event);
    this.preferences.setSimpleReadingMode(enabled);
    this.liveMessage = `Lectura simple ${enabled ? 'activada' : 'desactivada'} para AccessiUX Market.`;
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

  private checked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  private readError(error: HttpErrorResponse, fallback: string): string {
    return typeof error.error?.message === 'string' ? error.error.message : fallback;
  }
}
