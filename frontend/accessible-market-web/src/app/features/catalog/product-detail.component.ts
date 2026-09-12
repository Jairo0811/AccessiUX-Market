import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { CartService } from '../../core/cart/cart.service';
import { CatalogService } from '../../core/catalog/catalog.service';

@Component({
  selector: 'app-product-detail',
  imports: [AsyncPipe, CurrencyPipe, RouterLink],
  template: `
    <section class="product-page" aria-labelledby="product-title">
      <a class="product-back" routerLink="/catalog">← Volver al catálogo</a>

      @if (detail$ | async; as detail) {
        <article class="product-hero card">
          <div class="product-copy">
            <p class="eyebrow">Producto</p>
            <h1 id="product-title">{{ detail.product.name }}</h1>
            <p class="product-description">{{ detail.product.description }}</p>

            <div class="product-meta-row">
              <p class="product-price">
                {{ detail.product.price | currency:detail.product.currency:'symbol':'1.2-2' }}
              </p>
              <span class="stock-pill" [class.stock-pill--empty]="detail.product.stockQuantity < 1">
                {{ detail.product.stockQuantity > 0 ? detail.product.stockQuantity + ' disponibles' : 'Sin existencias' }}
              </span>
            </div>

            @if (auth.isAuthenticated()) {
              <div class="product-actions">
                <button
                  class="button button--gradient"
                  type="button"
                  [disabled]="adding() || detail.product.stockQuantity < 1"
                  (click)="addToCart(detail.product.id, detail.product.name)"
                >
                  {{ adding() ? 'Agregando…' : 'Agregar al carrito' }}
                </button>
                <a class="button button--secondary" routerLink="/cart">Ver carrito</a>
              </div>
            } @else {
              <p class="signin-hint"><a routerLink="/login">Inicia sesión</a> para agregar este producto al carrito.</p>
            }

            <p class="product-status" aria-live="polite">{{ cartStatus() }}</p>
            @if (cartError()) { <p class="product-error" role="alert">{{ cartError() }}</p> }
          </div>
        </article>

        <section aria-labelledby="seller-policies-title" class="seller-policies card">
          <p class="eyebrow">Información comercial</p>
          <h2 id="seller-policies-title">Políticas del vendedor</h2>
          <p class="seller-name">Vendido por <strong>{{ detail.seller.displayName }}</strong>.</p>

          <dl class="policy-grid">
            <div class="policy-card">
              <dt>Garantía</dt>
              <dd>{{ detail.seller.warrantyPolicy ?? 'El vendedor todavía no ha publicado su política de garantía.' }}</dd>
            </div>
            <div class="policy-card">
              <dt>Envío</dt>
              <dd>{{ detail.seller.shippingPolicy ?? 'El vendedor todavía no ha publicado su política de envío.' }}</dd>
            </div>
            <div class="policy-card">
              <dt>Devoluciones</dt>
              <dd>{{ detail.seller.returnPolicy ?? 'El vendedor todavía no ha publicado su política de devoluciones.' }}</dd>
            </div>
          </dl>
        </section>
      }
    </section>
  `,
  styles: [`
    .product-page {
      display: grid;
      gap: 1.5rem;
    }

    .product-back {
      width: fit-content;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      color: #245ca8;
      font-weight: 700;
      text-decoration: none;
    }

    .product-back:hover {
      text-decoration: underline;
    }

    .product-hero,
    .seller-policies {
      padding: clamp(1.4rem, 3vw, 2.4rem);
      border-radius: 1.35rem;
      box-shadow: var(--shadow-sm);
    }

    .product-hero {
      position: relative;
      overflow: hidden;
      background:
        radial-gradient(circle at 92% 8%, rgb(124 58 237 / 10%), transparent 19rem),
        radial-gradient(circle at 8% 100%, rgb(18 212 226 / 9%), transparent 18rem),
        var(--surface);
    }

    .product-copy {
      position: relative;
      z-index: 1;
      max-width: 58rem;
    }

    h1 {
      margin: 0.45rem 0 1rem;
      color: var(--navy-900);
      font-size: clamp(2.2rem, 4.6vw, 4rem);
      line-height: 1.02;
      letter-spacing: -0.04em;
      text-wrap: balance;
    }

    .product-description {
      max-width: 48rem;
      margin: 0;
      color: var(--ink-700);
      font-size: 1.08rem;
      line-height: 1.75;
    }

    .product-meta-row {
      margin-top: 1.55rem;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.9rem 1.1rem;
    }

    .product-price {
      margin: 0;
      color: var(--navy-900);
      font-size: clamp(1.6rem, 3vw, 2.2rem);
      font-weight: 900;
      letter-spacing: -0.025em;
    }

    .stock-pill {
      display: inline-flex;
      align-items: center;
      min-height: 2.15rem;
      padding: 0.38rem 0.75rem;
      border-radius: 999px;
      color: #0b6749;
      background: #e8f8ef;
      font-size: 0.88rem;
      font-weight: 800;
    }

    .stock-pill--empty {
      color: var(--danger);
      background: #fff0f0;
    }

    .product-actions {
      margin-top: 1.5rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.8rem;
    }

    .product-status,
    .product-error,
    .signin-hint {
      margin-bottom: 0;
    }

    .product-status {
      color: var(--success);
      font-weight: 700;
    }

    .product-error {
      color: var(--danger);
      font-weight: 700;
    }

    .seller-policies h2 {
      margin: 0.4rem 0 0.65rem;
      color: var(--navy-900);
      font-size: clamp(1.7rem, 3vw, 2.2rem);
      letter-spacing: -0.025em;
    }

    .seller-name {
      margin: 0 0 1.4rem;
      color: var(--ink-700);
    }

    .policy-grid {
      margin: 0;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1rem;
    }

    .policy-card {
      min-width: 0;
      padding: 1.2rem;
      border: 1px solid var(--border);
      border-radius: 1rem;
      background: linear-gradient(180deg, #fff 0%, #f8fbff 100%);
    }

    .policy-card dt {
      margin-bottom: 0.45rem;
      color: var(--navy-900);
      font-weight: 900;
    }

    .policy-card dd {
      margin: 0;
      color: var(--ink-700);
      line-height: 1.65;
    }

    @media (max-width: 850px) {
      .policy-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 560px) {
      .product-actions .button {
        width: 100%;
      }
    }
  `],
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly catalog = inject(CatalogService);
  private readonly cart = inject(CartService);
  readonly auth = inject(AuthService);
  readonly adding = signal(false);
  readonly cartStatus = signal('');
  readonly cartError = signal('');
  readonly detail$ = this.route.paramMap.pipe(
    switchMap(params => this.catalog.product(params.get('slug') ?? '')),
    switchMap(product => this.catalog.sellerById(product.sellerId).pipe(map(seller => ({ product, seller })))),
  );

  addToCart(productId: string, productName: string): void {
    this.adding.set(true);
    this.cartStatus.set('');
    this.cartError.set('');
    this.cart.add({ productId, quantity: 1 }).subscribe({
      next: cart => {
        this.adding.set(false);
        this.cartStatus.set(`${productName} fue agregado. El carrito contiene ${cart.totalQuantity} artículo(s).`);
      },
      error: error => {
        this.adding.set(false);
        this.cartError.set(this.describeError(error));
      },
    });
  }

  private describeError(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') return error.error.message;
    return 'No se pudo agregar el producto al carrito.';
  }
}
