import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Cart } from '../../core/cart/cart.models';
import { CartService } from '../../core/cart/cart.service';
import { CheckoutConfirmation, CheckoutRequest, CheckoutReview } from '../../core/checkout/checkout.models';
import { CheckoutService } from '../../core/checkout/checkout.service';

@Component({
  selector: 'app-checkout',
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink],
  template: `
    <section class="checkout-page" aria-labelledby="checkout-title">
      <header class="checkout-heading">
        <div>
          <p class="eyebrow">Checkout</p>
          <h1 id="checkout-title">Revisa antes de confirmar</h1>
          <p>Dirección, método de pago, productos y totales permanecen visibles antes de crear el pedido.</p>
        </div>
        <a class="text-link--arrow" routerLink="/cart">← Volver al carrito</a>
      </header>

      <p class="sr-status" role="status" aria-live="polite">{{ status() }}</p>
      @if (error()) { <div class="alert alert--error" role="alert">{{ error() }}</div> }

      @if (confirmation(); as completed) {
        <section class="confirmation-card" aria-labelledby="confirmation-title" tabindex="-1">
          <div class="confirmation-card__icon" aria-hidden="true">✓</div>
          <p class="section-kicker">Confirmación</p>
          <h2 id="confirmation-title">Tu pedido fue creado</h2>
          <p>Número de pedido: <strong>{{ completed.orderNumber }}</strong></p>
          <p>Total: <strong>{{ completed.total | currency:completed.currency:'symbol':'1.2-2' }}</strong></p>
          <p>Estado inicial: {{ completed.status }}</p>
          <div class="button-row">
            <a class="button" routerLink="/catalog">Seguir comprando</a>
            <a class="button button--secondary" routerLink="/account">Ir a mi cuenta</a>
          </div>
        </section>
      } @else if (loadingCart()) {
        <div class="content-card" role="status">Cargando tu carrito…</div>
      } @else if (cart(); as currentCart) {
        @if (currentCart.items.length === 0) {
          <section class="content-card" aria-labelledby="empty-checkout-title">
            <h2 id="empty-checkout-title">No hay productos para procesar</h2>
            <p>Agrega productos al carrito antes de iniciar el checkout.</p>
            <a class="button" routerLink="/catalog">Explorar catálogo</a>
          </section>
        } @else {
          <div class="checkout-layout">
            <form class="checkout-form" [formGroup]="form" (ngSubmit)="reviewCheckout()" novalidate>
              <section class="checkout-card" aria-labelledby="address-title" formGroupName="address">
                <div class="checkout-card__heading">
                  <span class="step-number" aria-hidden="true">1</span>
                  <div>
                    <p class="section-kicker">Entrega</p>
                    <h2 id="address-title">Dirección</h2>
                  </div>
                </div>

                <div class="field">
                  <label for="recipient-name">Nombre de quien recibe</label>
                  <input id="recipient-name" type="text" formControlName="recipientName" autocomplete="name" />
                </div>

                <div class="field">
                  <label for="address-line-1">Dirección</label>
                  <input id="address-line-1" type="text" formControlName="addressLine1" autocomplete="address-line1" />
                </div>

                <div class="field">
                  <label for="address-line-2">Apartamento, suite o referencia <span>(opcional)</span></label>
                  <input id="address-line-2" type="text" formControlName="addressLine2" autocomplete="address-line2" />
                </div>

                <div class="field-grid">
                  <div class="field">
                    <label for="city">Ciudad</label>
                    <input id="city" type="text" formControlName="city" autocomplete="address-level2" />
                  </div>
                  <div class="field">
                    <label for="region">Provincia / región</label>
                    <input id="region" type="text" formControlName="region" autocomplete="address-level1" />
                  </div>
                </div>

                <div class="field-grid">
                  <div class="field">
                    <label for="postal-code">Código postal</label>
                    <input id="postal-code" type="text" formControlName="postalCode" autocomplete="postal-code" />
                  </div>
                  <div class="field">
                    <label for="country-code">País</label>
                    <select id="country-code" formControlName="countryCode" autocomplete="country">
                      <option value="DO">República Dominicana</option>
                      <option value="US">Estados Unidos</option>
                    </select>
                  </div>
                </div>

                <div class="field">
                  <label for="phone">Teléfono</label>
                  <input id="phone" type="tel" formControlName="phone" autocomplete="tel" />
                </div>
              </section>

              <fieldset class="checkout-card payment-card">
                <legend>
                  <span class="step-number" aria-hidden="true">2</span>
                  <span><small>Método de pago</small>Elige cómo pagar</span>
                </legend>

                <label class="payment-option">
                  <input type="radio" formControlName="paymentMethod" value="Card" />
                  <span><strong>Tarjeta</strong><small>No ingreses datos de tarjeta en esta pantalla.</small></span>
                </label>

                <label class="payment-option">
                  <input type="radio" formControlName="paymentMethod" value="CashOnDelivery" />
                  <span><strong>Pago contra entrega</strong><small>El pedido quedará pendiente hasta completar el pago.</small></span>
                </label>
              </fieldset>

              <button class="button button--gradient button--full" type="submit" [disabled]="form.invalid || reviewing()">
                {{ reviewing() ? 'Revisando…' : 'Revisar compra' }}
              </button>
            </form>

            <aside class="order-summary" aria-labelledby="summary-title">
              <div class="checkout-card checkout-card--sticky">
                <p class="section-kicker">Tu compra</p>
                <h2 id="summary-title">Resumen</h2>

                <ul class="summary-items">
                  @for (item of currentCart.items; track item.productId) {
                    <li>
                      <span>{{ item.name }} <small>× {{ item.quantity }}</small></span>
                      <strong>{{ item.lineTotal | currency:item.currency:'symbol':'1.2-2' }}</strong>
                    </li>
                  }
                </ul>

                <div class="summary-total">
                  <span>Subtotal</span>
                  <strong>{{ currentCart.subtotal | currency:currentCart.currency:'symbol':'1.2-2' }}</strong>
                </div>

                @if (review(); as checkoutReview) {
                  <div class="review-divider"></div>
                  <dl class="review-totals">
                    <div><dt>Envío</dt><dd>{{ checkoutReview.shippingAmount | currency:checkoutReview.currency:'symbol':'1.2-2' }}</dd></div>
                    <div><dt>Impuestos</dt><dd>{{ checkoutReview.taxAmount | currency:checkoutReview.currency:'symbol':'1.2-2' }}</dd></div>
                    <div class="review-totals__grand"><dt>Total</dt><dd>{{ checkoutReview.total | currency:checkoutReview.currency:'symbol':'1.2-2' }}</dd></div>
                  </dl>

                  <section class="review-block" aria-labelledby="review-address-title">
                    <h3 id="review-address-title">Dirección revisada</h3>
                    <p>{{ checkoutReview.address.recipientName }}<br />{{ checkoutReview.address.addressLine1 }}<br />{{ checkoutReview.address.city }}, {{ checkoutReview.address.region }} · {{ checkoutReview.address.countryCode }}</p>
                  </section>

                  <section class="review-block" aria-labelledby="review-payment-title">
                    <h3 id="review-payment-title">Método de pago</h3>
                    <p>{{ paymentLabel(checkoutReview.paymentMethod) }}</p>
                  </section>

                  @if (checkoutReview.warnings.length > 0) {
                    <div class="alert alert--error" role="alert">
                      <strong>Revisa antes de continuar:</strong>
                      <ul>
                        @for (warning of checkoutReview.warnings; track warning) { <li>{{ warning }}</li> }
                      </ul>
                    </div>
                  }

                  @if (checkoutReview.canConfirm) {
                    <label class="review-confirmation">
                      <input type="checkbox" [checked]="reviewAccepted()" (change)="toggleReviewAccepted($event)" />
                      <span>He revisado la dirección, el método de pago, los productos y el total.</span>
                    </label>
                    <button class="button button--gradient button--full" type="button" [disabled]="!reviewAccepted() || confirming()" (click)="confirmCheckout()">
                      {{ confirming() ? 'Confirmando…' : 'Confirmar compra' }}
                    </button>
                  }
                } @else {
                  <p class="summary-note">Completa tus datos y selecciona “Revisar compra” para ver el total final antes de confirmar.</p>
                }
              </div>
            </aside>
          </div>
        }
      }
    </section>
  `,
  styles: [`
    .checkout-page { display: grid; gap: 1.5rem; }
    .checkout-heading { display: flex; align-items: end; justify-content: space-between; gap: 2rem; }
    .checkout-heading h1 { margin: .35rem 0 .5rem; color: var(--navy-900); font-size: clamp(2.2rem,5vw,3.7rem); letter-spacing: -.045em; }
    .checkout-heading p:not(.eyebrow) { max-width: 48rem; margin: 0; color: var(--ink-600); }
    .checkout-layout { display: grid; grid-template-columns: minmax(0,1.35fr) minmax(20rem,.65fr); gap: 1.5rem; align-items: start; }
    .checkout-form { display: grid; gap: 1.2rem; }
    .checkout-card { padding: 1.4rem; border: 1px solid var(--border); border-radius: 1.25rem; background: #fff; box-shadow: var(--shadow-sm); }
    .checkout-card__heading { display: flex; align-items: center; gap: .85rem; }
    .checkout-card h2 { margin: .15rem 0 0; color: var(--navy-900); }
    .step-number { display: inline-grid; width: 2.5rem; height: 2.5rem; place-items: center; border-radius: .8rem; color: #fff; background: linear-gradient(145deg,var(--blue),var(--violet)); font-weight: 900; }
    .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .field label span { color: var(--ink-600); font-weight: 500; }
    .payment-card { display: grid; gap: .8rem; }
    .payment-card legend { padding: 0; display: flex; align-items: center; gap: .85rem; color: var(--navy-900); font-size: 1.15rem; font-weight: 850; }
    .payment-card legend span:last-child { display: grid; }
    .payment-card legend small { color: #2845ba; font-size: .68rem; letter-spacing: .08em; text-transform: uppercase; }
    .payment-option { padding: 1rem; display: flex; align-items: flex-start; gap: .8rem; border: 1px solid var(--border); border-radius: .9rem; cursor: pointer; }
    .payment-option:has(input:checked) { border-color: #4f46e5; background: #f4f4ff; box-shadow: inset 0 0 0 1px #4f46e5; }
    .payment-option input { margin-top: .25rem; }
    .payment-option span { display: grid; gap: .15rem; }
    .payment-option small { color: var(--ink-600); }
    .checkout-card--sticky { position: sticky; top: 6.6rem; }
    .order-summary h2 { margin: .2rem 0 1rem; color: var(--navy-900); }
    .summary-items { margin: 0; padding: 0; display: grid; gap: .8rem; list-style: none; }
    .summary-items li, .summary-total { display: flex; justify-content: space-between; gap: 1rem; }
    .summary-items li { padding-bottom: .75rem; border-bottom: 1px solid #e7eef6; }
    .summary-items span { color: var(--ink-700); }
    .summary-items small { color: var(--ink-600); }
    .summary-total { margin-top: 1rem; font-size: 1.05rem; }
    .review-divider { margin: 1rem 0; border-top: 1px solid var(--border); }
    .review-totals { margin: 0; display: grid; gap: .45rem; }
    .review-totals div { display: flex; justify-content: space-between; gap: 1rem; }
    .review-totals dd { margin: 0; font-weight: 750; }
    .review-totals__grand { margin-top: .45rem; padding-top: .7rem; border-top: 2px solid var(--navy-900); color: var(--navy-900); font-size: 1.15rem; font-weight: 900; }
    .review-block { margin-top: 1rem; padding: .85rem; border-radius: .8rem; background: var(--surface-tint); }
    .review-block h3 { margin: 0 0 .25rem; color: var(--navy-900); font-size: .9rem; }
    .review-block p { margin: 0; color: var(--ink-700); font-size: .9rem; }
    .review-confirmation { margin-top: 1rem; display: flex; align-items: flex-start; gap: .65rem; color: var(--ink-700); font-weight: 700; }
    .review-confirmation input { margin-top: .25rem; }
    .summary-note { color: var(--ink-600); font-size: .9rem; }
    .confirmation-card { min-height: 26rem; padding: clamp(2rem,5vw,4rem); display: grid; place-items: center; align-content: center; text-align: center; border: 1px solid var(--border); border-radius: 1.6rem; background: radial-gradient(circle at 50% 0,rgb(18 212 226 / 13%),transparent 18rem),#fff; box-shadow: var(--shadow-md); }
    .confirmation-card__icon { display: grid; width: 4.5rem; height: 4.5rem; place-items: center; border-radius: 50%; color: #fff; background: linear-gradient(145deg,#0fc3b6,#1684ff); font-size: 2rem; font-weight: 900; }
    .confirmation-card h2 { margin: .5rem 0; color: var(--navy-900); font-size: clamp(2rem,4vw,3rem); }
    .sr-status:empty { display: none; }
    @media (max-width: 62rem) { .checkout-layout { grid-template-columns: 1fr; } .checkout-card--sticky { position: static; } }
    @media (max-width: 42rem) { .checkout-heading { align-items: flex-start; flex-direction: column; } .field-grid { grid-template-columns: 1fr; } }
    @media (forced-colors: active) { .checkout-card, .confirmation-card, .payment-option { border: 2px solid CanvasText; } }
  `]
})
export class CheckoutComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cartService = inject(CartService);
  private readonly checkoutService = inject(CheckoutService);
  private readonly destroyRef = inject(DestroyRef);

  readonly cart = signal<Cart | null>(null);
  readonly review = signal<CheckoutReview | null>(null);
  readonly confirmation = signal<CheckoutConfirmation | null>(null);
  readonly loadingCart = signal(true);
  readonly reviewing = signal(false);
  readonly confirming = signal(false);
  readonly reviewAccepted = signal(false);
  readonly status = signal('');
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    address: this.fb.nonNullable.group({
      recipientName: ['', [Validators.required, Validators.maxLength(150)]],
      addressLine1: ['', [Validators.required, Validators.maxLength(200)]],
      addressLine2: ['', [Validators.maxLength(200)]],
      city: ['', [Validators.required, Validators.maxLength(120)]],
      region: ['', [Validators.required, Validators.maxLength(120)]],
      postalCode: ['', [Validators.required, Validators.maxLength(20)]],
      countryCode: ['DO', [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]],
      phone: ['', [Validators.required, Validators.maxLength(30)]],
    }),
    paymentMethod: ['Card' as 'Card' | 'CashOnDelivery', Validators.required],
  });

  ngOnInit(): void {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.review()) {
        this.review.set(null);
        this.reviewAccepted.set(false);
        this.status.set('Los datos cambiaron. Revisa la compra nuevamente antes de confirmar.');
      }
    });

    this.cartService.get().subscribe({
      next: cart => {
        this.cart.set(cart);
        this.loadingCart.set(false);
      },
      error: error => {
        this.error.set(this.describeError(error));
        this.loadingCart.set(false);
      },
    });
  }

  reviewCheckout(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Completa los campos obligatorios antes de revisar la compra.');
      return;
    }

    this.error.set('');
    this.reviewing.set(true);
    this.checkoutService.review(this.buildRequest()).subscribe({
      next: review => {
        this.review.set(review);
        this.reviewAccepted.set(false);
        this.reviewing.set(false);
        this.status.set(review.canConfirm ? 'Checkout revisado. Confirma después de verificar toda la información.' : 'El checkout requiere cambios antes de confirmar.');
      },
      error: error => {
        this.error.set(this.describeError(error));
        this.reviewing.set(false);
      },
    });
  }

  confirmCheckout(): void {
    if (!this.review()?.canConfirm || !this.reviewAccepted() || this.confirming()) return;

    this.error.set('');
    this.confirming.set(true);
    this.checkoutService.confirm(this.buildRequest()).subscribe({
      next: confirmation => {
        this.confirmation.set(confirmation);
        this.cart.set({ items: [], totalQuantity: 0, subtotal: 0, currency: confirmation.currency });
        this.review.set(null);
        this.confirming.set(false);
        this.status.set(`Pedido ${confirmation.orderNumber} creado correctamente.`);
      },
      error: error => {
        this.error.set(this.describeError(error));
        this.review.set(null);
        this.reviewAccepted.set(false);
        this.confirming.set(false);
        this.status.set('La información cambió. Revisa el checkout nuevamente.');
        this.reloadCart();
      },
    });
  }

  toggleReviewAccepted(event: Event): void {
    this.reviewAccepted.set((event.target as HTMLInputElement).checked);
  }

  paymentLabel(method: string): string {
    return method === 'CashOnDelivery' ? 'Pago contra entrega' : 'Tarjeta';
  }

  private buildRequest(): CheckoutRequest {
    const value = this.form.getRawValue();
    return {
      address: {
        recipientName: value.address.recipientName.trim(),
        addressLine1: value.address.addressLine1.trim(),
        addressLine2: value.address.addressLine2.trim() || null,
        city: value.address.city.trim(),
        region: value.address.region.trim(),
        postalCode: value.address.postalCode.trim(),
        countryCode: value.address.countryCode.toUpperCase(),
        phone: value.address.phone.trim(),
      },
      paymentMethod: value.paymentMethod,
    };
  }

  private reloadCart(): void {
    this.cartService.get().subscribe({ next: cart => this.cart.set(cart) });
  }

  private describeError(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') return error.error.message;
    return 'No se pudo procesar el checkout. Revisa los datos e inténtalo de nuevo.';
  }
}
