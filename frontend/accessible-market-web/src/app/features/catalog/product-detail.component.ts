import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { CatalogService } from '../../core/catalog/catalog.service';

@Component({ selector: 'app-product-detail', imports: [AsyncPipe, CurrencyPipe, RouterLink], template: `
  <a routerLink="/catalog">← Volver al catálogo</a>
  @if (product$ | async; as product) {
    <article aria-labelledby="product-title"><p class="eyebrow">Producto</p><h1 id="product-title">{{ product.name }}</h1>
      <p>{{ product.description }}</p><p><strong>{{ product.price | currency:product.currency:'symbol':'1.2-2' }}</strong></p>
      <p role="status">{{ product.stockQuantity }} unidades disponibles.</p>
    </article>
  }
` })
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute); private readonly catalog = inject(CatalogService);
  readonly product$ = this.route.paramMap.pipe(switchMap(params => this.catalog.product(params.get('slug') ?? '')));
}
