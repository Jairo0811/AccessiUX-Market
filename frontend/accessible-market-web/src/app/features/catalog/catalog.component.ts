import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../core/catalog/catalog.service';

@Component({
  selector: 'app-catalog', imports: [AsyncPipe, CurrencyPipe, RouterLink],
  template: `
    <section aria-labelledby="catalog-title">
      <p class="eyebrow">Catálogo</p><h1 id="catalog-title">Productos disponibles</h1>
      <p>Explora productos publicados por vendedores de AccessiUX Market.</p>
      @if (products$ | async; as products) {
        @if (products.length === 0) { <p role="status">Todavía no hay productos publicados.</p> }
        <div class="card-grid">
          @for (product of products; track product.id) {
            <article class="card">
              <h2><a [routerLink]="['/products', product.slug]">{{ product.name }}</a></h2>
              <p>{{ product.description }}</p>
              <p><strong>{{ product.price | currency:product.currency:'symbol':'1.2-2' }}</strong></p>
              <p>{{ product.stockQuantity }} disponibles</p>
            </article>
          }
        </div>
      }
    </section>`
})
export class CatalogComponent { private readonly catalog = inject(CatalogService); readonly products$ = this.catalog.products(); }
