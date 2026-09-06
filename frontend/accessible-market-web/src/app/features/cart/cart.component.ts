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
    <section aria-labelledby="cart-title">
      <p class="eyebrow">Compra</p>
      <h1 id="cart-title">Mi carrito</h1>
      <p>Revisa cantidades y disponibilidad antes de continuar al checkout.</p>

      <p role="status" aria-live="polite">{{ status() }}</p>
      @if (error()) { <p role="alert">{{ error() }}</p> }

      @if (loading()) {
        <p>Cargando carrito…</p>
      } @else if (cart(); as currentCart) {
        @if (currentCart.items.length === 0) {
          <div>
            <h2>Tu carrito está vacío</h2>
            <p>Explora el catálogo y agrega productos para continuar.</p>
            <a class="button" routerLink="/catalog">Explorar catálogo</a>
          </div>
        } @else {
          <ul aria-label="Productos en el carrito">
            @for (item of currentCart.items; track item.productId) {
              <li>
                <article [attr.aria-labelledby]="'cart-product-' + item.productId">
                  <h2 [id]="'cart-product-' + item.productId">
                    <a [routerLink]="['/products', item.slug]">{{ item.name }}</a>
                  </h2>
                  <p>{{ item.unitPrice | currency:item.currency:'symbol':'1.2-2' }} por unidad</p>
                  <p>{{ item.availableStock }} disponibles</p>

                  <label [for]="'quantity-' + item.productId">Cantidad</label>
                  <input
                    [id]="'quantity-' + item.productId"
                    type="number"
                    min="1"
                    [max]="maxQuantity(item)"
                    [value]="item.quantity"
                    (change)="updateQuantity(item, $event)"
                  />

                  <p><strong>Total de línea: {{ item.lineTotal | currency:item.currency:'symbol':'1.2-2' }}</strong></p>
                  <button type="button" (click)="remove(item)">Eliminar {{ item.name }}</button>
                </article>
              </li>
            }
          </ul>

          <section aria-labelledby="cart-summary-title">
            <h2 id="cart-summary-title">Resumen</h2>
            <p>{{ currentCart.totalQuantity }} artículo(s)</p>
            <p><strong>Subtotal: {{ currentCart.subtotal | currency:currentCart.currency:'symbol':'1.2-2' }}</strong></p>
            <p>Impuestos, envío y total final se calcularán en el checkout.</p>
            <button type="button" (click)="clear()">Vaciar carrito</button>
          </section>
        }
      }
    </section>
  `,
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
