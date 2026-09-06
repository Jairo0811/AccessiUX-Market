import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { CartService } from '../../core/cart/cart.service';
import { CatalogService } from '../../core/catalog/catalog.service';

@Component({ selector: 'app-product-detail', imports: [AsyncPipe, CurrencyPipe, RouterLink], template: `
  <a routerLink="/catalog">← Volver al catálogo</a>
  @if (detail$ | async; as detail) {
    <article aria-labelledby="product-title">
      <p class="eyebrow">Producto</p>
      <h1 id="product-title">{{ detail.product.name }}</h1>
      <p>{{ detail.product.description }}</p>
      <p><strong>{{ detail.product.price | currency:detail.product.currency:'symbol':'1.2-2' }}</strong></p>
      <p role="status">{{ detail.product.stockQuantity }} unidades disponibles.</p>

      @if (auth.isAuthenticated()) {
        <button type="button" [disabled]="adding() || detail.product.stockQuantity < 1" (click)="addToCart(detail.product.id, detail.product.name)">
          {{ adding() ? 'Agregando…' : 'Agregar al carrito' }}
        </button>
        <a routerLink="/cart">Ver carrito</a>
      } @else {
        <p><a routerLink="/login">Inicia sesión</a> para agregar este producto al carrito.</p>
      }
      <p aria-live="polite">{{ cartStatus() }}</p>
      @if (cartError()) { <p role="alert">{{ cartError() }}</p> }

      <section aria-labelledby="seller-policies-title" class="card">
        <p class="eyebrow">Información comercial</p>
        <h2 id="seller-policies-title">Políticas del vendedor</h2>
        <p>Vendido por <strong>{{ detail.seller.displayName }}</strong>.</p>
        <dl>
          <div>
            <dt><strong>Garantía</strong></dt>
            <dd>{{ detail.seller.warrantyPolicy ?? 'El vendedor todavía no ha publicado su política de garantía.' }}</dd>
          </div>
          <div>
            <dt><strong>Envío</strong></dt>
            <dd>{{ detail.seller.shippingPolicy ?? 'El vendedor todavía no ha publicado su política de envío.' }}</dd>
          </div>
          <div>
            <dt><strong>Devoluciones</strong></dt>
            <dd>{{ detail.seller.returnPolicy ?? 'El vendedor todavía no ha publicado su política de devoluciones.' }}</dd>
          </div>
        </dl>
      </section>
    </article>
  }
` })
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
