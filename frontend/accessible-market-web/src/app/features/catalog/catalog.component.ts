import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, shareReplay, switchMap, tap } from 'rxjs';
import { CatalogSearchParams } from '../../core/catalog/catalog.models';
import { CatalogService } from '../../core/catalog/catalog.service';

@Component({
  selector: 'app-catalog',
  imports: [AsyncPipe, CurrencyPipe, ReactiveFormsModule, RouterLink],
  template: `
    <section aria-labelledby="catalog-title">
      <p class="eyebrow">Catálogo</p>
      <h1 id="catalog-title">Encuentra productos accesibles</h1>
      <p>Busca, filtra y ordena productos publicados por vendedores de AccessiUX Market.</p>

      <form [formGroup]="filters" (ngSubmit)="applyFilters()" aria-label="Filtros del catálogo">
        <div>
          <label for="catalog-query">Buscar</label>
          <input id="catalog-query" type="search" formControlName="q" placeholder="Nombre o descripción" />
        </div>
        <div>
          <label for="catalog-category">Categoría</label>
          <select id="catalog-category" formControlName="categoryId">
            <option value="">Todas las categorías</option>
            @if (result$ | async; as result) {
              @for (category of result.facets.categories; track category.id) {
                <option [value]="category.id">{{ category.name }} ({{ category.count }})</option>
              }
            }
          </select>
        </div>
        <div>
          <label for="catalog-min-price">Precio mínimo</label>
          <input id="catalog-min-price" type="number" min="0" step="0.01" formControlName="minPrice" />
        </div>
        <div>
          <label for="catalog-max-price">Precio máximo</label>
          <input id="catalog-max-price" type="number" min="0" step="0.01" formControlName="maxPrice" />
        </div>
        <div>
          <label for="catalog-stock">Disponibilidad</label>
          <select id="catalog-stock" formControlName="inStock">
            <option value="">Cualquier disponibilidad</option>
            <option value="true">En existencia</option>
            <option value="false">Agotados</option>
          </select>
        </div>
        <div>
          <label for="catalog-sort">Ordenar por</label>
          <select id="catalog-sort" formControlName="sort">
            <option value="relevance">Relevancia</option>
            <option value="newest">Más recientes</option>
            <option value="price-asc">Precio: menor a mayor</option>
            <option value="price-desc">Precio: mayor a menor</option>
            <option value="name">Nombre</option>
          </select>
        </div>
        <button type="submit">Aplicar filtros</button>
        <button type="button" (click)="clearFilters()">Limpiar</button>
      </form>

      @if (result$ | async; as result) {
        <p role="status" aria-live="polite">{{ result.totalCount }} producto(s) encontrado(s).</p>
        @if (result.facets.minPrice !== null && result.facets.maxPrice !== null) {
          <p>Rango disponible: {{ result.facets.minPrice | currency:'DOP':'symbol':'1.2-2' }} – {{ result.facets.maxPrice | currency:'DOP':'symbol':'1.2-2' }}</p>
        }

        @if (result.items.length === 0) {
          <p>No encontramos productos con esos filtros. Prueba ampliando la búsqueda.</p>
        } @else {
          <div class="card-grid">
            @for (product of result.items; track product.id) {
              <article class="card">
                <h2><a [routerLink]="['/products', product.slug]">{{ product.name }}</a></h2>
                <p>{{ product.description }}</p>
                <p><strong>{{ product.price | currency:product.currency:'symbol':'1.2-2' }}</strong></p>
                <p>{{ product.stockQuantity > 0 ? product.stockQuantity + ' disponibles' : 'Agotado' }}</p>
              </article>
            }
          </div>
        }

        @if (result.totalPages > 1) {
          <nav aria-label="Paginación del catálogo">
            <button type="button" [disabled]="result.page <= 1" (click)="goToPage(result.page - 1)">Anterior</button>
            <span>Página {{ result.page }} de {{ result.totalPages }}</span>
            <button type="button" [disabled]="result.page >= result.totalPages" (click)="goToPage(result.page + 1)">Siguiente</button>
          </nav>
        }
      }
    </section>`
})
export class CatalogComponent {
  private readonly catalog = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly filters = this.fb.nonNullable.group({
    q: '', categoryId: '', minPrice: '', maxPrice: '', inStock: '', sort: 'relevance'
  });

  readonly result$ = this.route.queryParamMap.pipe(
    map(params => this.toSearchParams(params)),
    tap(params => this.filters.patchValue({
      q: params.q ?? '',
      categoryId: params.categoryId ?? '',
      minPrice: params.minPrice?.toString() ?? '',
      maxPrice: params.maxPrice?.toString() ?? '',
      inStock: params.inStock === undefined ? '' : String(params.inStock),
      sort: params.sort ?? 'relevance'
    }, { emitEvent: false })),
    switchMap(params => this.catalog.search(params)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  applyFilters(): void {
    const value = this.filters.getRawValue();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: value.q || null,
        categoryId: value.categoryId || null,
        minPrice: value.minPrice || null,
        maxPrice: value.maxPrice || null,
        inStock: value.inStock || null,
        sort: value.sort === 'relevance' ? null : value.sort,
        page: null
      }
    });
  }

  clearFilters(): void {
    this.filters.reset({ q: '', categoryId: '', minPrice: '', maxPrice: '', inStock: '', sort: 'relevance' });
    void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  goToPage(page: number): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { page }, queryParamsHandling: 'merge' });
  }

  private toSearchParams(params: import('@angular/router').ParamMap): CatalogSearchParams {
    const minPrice = this.numberOrUndefined(params.get('minPrice'));
    const maxPrice = this.numberOrUndefined(params.get('maxPrice'));
    const page = this.numberOrUndefined(params.get('page'));
    const stock = params.get('inStock');
    return {
      q: params.get('q') || undefined,
      categoryId: params.get('categoryId') || undefined,
      minPrice,
      maxPrice,
      inStock: stock === 'true' ? true : stock === 'false' ? false : undefined,
      sort: params.get('sort') || 'relevance',
      page,
      pageSize: 12
    };
  }

  private numberOrUndefined(value: string | null): number | undefined {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
}
