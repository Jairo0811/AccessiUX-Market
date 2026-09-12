import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Cart, CartItem } from '../../core/cart/cart.models';
import { CartService } from '../../core/cart/cart.service';

@Component({
  selector: 'app-cart',
  imports: [CurrencyPipe, RouterLink],
  template: `
    <section class="cart-page" aria-labelledby="cart-title">
      <div class="cart-heading">
        <p class="eyebrow">Compra</p>
        <h1 id="cart-title">Mi carrito</h1>
        <p>Revisa cantidades y disponibilidad antes de continuar al checkout.</p>
      </div>

      <p class="cart-status" role="status" aria-live="polite">{{ status() }}</p>
      @if (error()) { <p class="cart-error" role="alert">{{ error() }}</p> }

      @if (loading()) {
        <div class="card loading-card"><p>Cargando carrito…</p></div>
      } @else if (cart(); as currentCart) {
        @if (currentCart.items.length === 0) {
          <div class="card empty-cart">
            <div class="empty-cart__icon" aria-hidden="true">🛒</div>
            <h2>Tu carrito está vacío</h2>
            <p>Explora el catálogo y agrega productos para continuar.</p>
            <a class="button button--gradient" routerLink="/catalog">Explorar catálogo</a>
          </div>
        } @else {
          <div class="cart-layout">
            <ul class="cart-items" aria-label="Productos en el carrito">
              @for (item of currentCart.items; track item.productId) {
                <li>
                  <article class="card cart-item" [attr.aria-labelledby]="'cart-product-' + item.productId">
                    <div class="cart-item__info">
                      <p class="cart-item__kicker">Producto</p>
                      <h2 [id]="'cart-product-' + item.productId">
                        <a [routerLink]="['/products', item.slug]">{{ item.name }}</a>
                      </h2>
                      <p class="cart-item__price">{{ item.unitPrice | currency:item.currency:'symbol':'1.2-2' }} por unidad</p>
                      <span class="stock-pill">{{ item.availableStock }} disponibles</span>
                    </div>

                    <div class="cart-item__controls">
                      <div class="quantity-field">
                        <label [for]="'quantity-' + item.productId">Cantidad</label>
                        <input
                          [id]="'quantity-' + item.productId"
                          class="quantity-input"
                          type="number"
                          min="1"
                          [max]="maxQuantity(item)"
                          [value]="item.quantity"
                          (change)="updateQuantity(item, $event)"
                        />
                      </div>

                      <div class="line-total">
                        <span>Total de línea</span>
                        <strong>{{ item.lineTotal | currency:item.currency:'symbol':'1.2-2' }}</strong>
                      </div>

                      <button class="button button--danger" type="button" (click)="remove(item)">
                        Eliminar producto
                      </button>
                    </div>
                  </article>
                </li>
              }
            </ul>

            <aside class="card cart-summary" aria-labelledby="cart-summary-title">
              <p class="eyebrow">Resumen</p>
              <h2 id="cart-summary-title">Tu compra</h2>

              <div class="summary-row">
                <span>Artículos</span>
                <strong>{{ currentCart.totalQuantity }}</strong>
              </div>

              <div class="summary-row summary-row--total">
                <span>Subtotal</span>
                <strong>{{ currentCart.subtotal | currency:currentCart.currency:'symbol':'1.2-2' }}</strong>
              </div>

              <p class="summary-note">Envío, impuestos y total final permanecerán visibles para revisión antes de confirmar la compra.</p>

              <div class="summary-actions">
                <a class="button button--gradient" routerLink="/checkout">Continuar al checkout</a>
                <button class="button button--secondary" type="button" (click)="clear()">Vaciar carrito</button>
              </div>
            </aside>
          </div>
        }
      }
    </section>
  `,
  styles: [`
    .cart-page {
      display: grid;
      gap: 1rem;
    }

    .cart-heading {
      max-width: 52rem;
    }

    .cart-heading h1 {
      margin: 0.45rem 0 0.75rem;
      color: var(--navy-900);
      font-size: clamp(2.2rem, 4.5vw, 3.7rem);
      line-height: 1.02;
      letter-spacing: -0.04em;
    }

    .cart-heading > p:last-child,
    .summary-note,
    .empty-cart > p,
    .cart-item__price {
      color: var(--ink-700);
    }

    .cart-status,
    .cart-error {
      min-height: 1.5rem;
      margin: 0;
      font-weight: 700;
    }

    .cart-status {
      color: var(--success);
    }

    .cart-error {
      color: var(--danger);
    }

    .cart-layout {
      display: grid;
      grid-template-columns: minmax(0, 1.7fr) minmax(19rem, 0.78fr);
      gap: 1.35rem;
      align-items: start;
    }

    .cart-items {
      margin: 0;
      padding: 0;
      display: grid;
      gap: 1rem;
      list-style: none;
    }

    .cart-item {
      padding: clamp(1.25rem, 2.5vw, 1.7rem);
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(15rem, 0.8fr);
      gap: 1.5rem;
      border-radius: 1.25rem;
      box-shadow: var(--shadow-sm);
    }

    .cart-item__kicker {
      margin: 0 0 0.3rem;
      color: #2845ba;
      font-size: 0.72rem;
      font-weight: 900;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    .cart-item h2 {
      margin: 0;
      font-size: clamp(1.3rem, 2.2vw, 1.7rem);
      line-height: 1.18;
      letter-spacing: -0.025em;
    }

    .cart-item h2 a {
      color: #185ca7;
      text-decoration-thickness: 0.08em;
    }

    .cart-item__price {
      margin: 0.75rem 0 0.7rem;
      font-weight: 600;
    }

    .stock-pill {
      display: inline-flex;
      align-items: center;
      min-height: 2rem;
      padding: 0.32rem 0.7rem;
      border-radius: 999px;
      color: #0b6749;
      background: #e8f8ef;
      font-size: 0.85rem;
      font-weight: 800;
    }

    .cart-item__controls {
      display: grid;
      gap: 0.95rem;
      align-content: start;
    }

    .quantity-field {
      display: grid;
      gap: 0.4rem;
    }

    .quantity-field label {
      color: var(--navy-900);
      font-weight: 800;
    }

    .quantity-input {
      width: 7rem;
      min-height: 3rem;
      padding: 0.65rem 0.8rem;
      border: 1.5px solid var(--border-strong);
      border-radius: 0.75rem;
      color: var(--navy-900);
      background: #fff;
      font-weight: 700;
    }

    .quantity-input:focus {
      outline: 3px solid rgb(255 183 3 / 42%);
      outline-offset: 2px;
      border-color: #5c87ff;
    }

    .line-total {
      display: grid;
      gap: 0.15rem;
      padding: 0.85rem 0;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }

    .line-total span {
      color: var(--ink-600);
      font-size: 0.88rem;
    }

    .line-total strong {
      color: var(--navy-900);
      font-size: 1.15rem;
    }

    .button--danger {
      width: fit-content;
      color: #8c1d18;
      background: #fff6f5;
      border-color: #efb7b2;
    }

    .button--danger:hover {
      color: #76140f;
      background: #ffe9e7;
    }

    .cart-summary {
      position: sticky;
      top: 6.2rem;
      padding: 1.45rem;
      border-radius: 1.25rem;
      box-shadow: var(--shadow-md);
    }

    .cart-summary h2 {
      margin: 0.35rem 0 1rem;
      color: var(--navy-900);
      font-size: 1.65rem;
      letter-spacing: -0.025em;
    }

    .summary-row {
      padding: 0.8rem 0;
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      border-bottom: 1px solid var(--border);
    }

    .summary-row--total {
      font-size: 1.08rem;
    }

    .summary-row--total strong {
      color: var(--navy-900);
      font-size: 1.25rem;
    }

    .summary-note {
      margin: 1rem 0 0;
      font-size: 0.93rem;
      line-height: 1.6;
    }

    .summary-actions {
      margin-top: 1.2rem;
      display: grid;
      gap: 0.7rem;
    }

    .summary-actions .button {
      width: 100%;
    }

    .loading-card,
    .empty-cart {
      padding: 2rem;
      border-radius: 1.25rem;
    }

    .empty-cart {
      max-width: 44rem;
      text-align: center;
    }

    .empty-cart__icon {
      margin-bottom: 0.8rem;
      font-size: 2.2rem;
    }

    .empty-cart h2 {
      margin: 0 0 0.4rem;
      color: var(--navy-900);
    }

    @media (max-width: 960px) {
      .cart-layout {
        grid-template-columns: 1fr;
      }

      .cart-summary {
        position: static;
      }
    }

    @media (max-width: 680px) {
      .cart-item {
        grid-template-columns: 1fr;
      }

      .button--danger {
        width: 100%;
      }
    }
  `],
})
export class CartComponent implements OnInit {
  private readonly cartService = inject(CartService);
  readonly cart = signal<Cart | null>(null);
  readonly loading = signal(true);
  readonly status = signal('');
  readonly error = signal('');

  ngOnInit(): void {
    this.load();
  }

  maxQuantity(item: CartItem): number {
    return Math.min(item.availableStock, 99);
  }

  updateQuantity(item: CartItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const quantity = Number(input.value);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > this.maxQuantity(item)) {
      input.value = String(item.quantity);
      this.error.set(`La cantidad de ${item.name} debe estar entre 1 y ${this.maxQuantity(item)}.`);
      return;
    }

    this.error.set('');
    this.cartService.update(item.productId, { quantity }).subscribe({
      next: cart => {
        this.cart.set(cart);
        this.status.set(`Cantidad de ${item.name} actualizada a ${quantity}.`);
      },
      error: error => this.error.set(this.describeError(error)),
    });
  }

  remove(item: CartItem): void {
    this.error.set('');
    this.cartService.remove(item.productId).subscribe({
      next: cart => {
        this.cart.set(cart);
        this.status.set(`${item.name} fue eliminado del carrito.`);
      },
      error: error => this.error.set(this.describeError(error)),
    });
  }

  clear(): void {
    if (!window.confirm('¿Quieres vaciar todo el carrito?')) return;

    this.error.set('');
    this.cartService.clear().subscribe({
      next: () => {
        this.cart.set({ items: [], totalQuantity: 0, subtotal: 0, currency: 'DOP' });
        this.status.set('El carrito fue vaciado.');
      },
      error: error => this.error.set(this.describeError(error)),
    });
  }

  private load(): void {
    this.cartService.get().subscribe({
      next: cart => {
        this.cart.set(cart);
        this.loading.set(false);
      },
      error: error => {
        this.error.set(this.describeError(error));
        this.loading.set(false);
      },
    });
  }

  private describeError(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') return error.error.message;
    return 'No se pudo actualizar el carrito. Inténtalo de nuevo.';
  }
}
