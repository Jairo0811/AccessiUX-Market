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
    <section class="catalog-page" aria-labelledby="catalog-title">
      <header class="catalog-hero">
        <div>
          <p class="eyebrow">Catálogo</p>
          <h1 id="catalog-title">Encuentra productos accesibles</h1>
          <p>Busca, filtra y descubre productos publicados por vendedores de AccessiUX Market.</p>
        </div>
        <div class="catalog-hero__badge" aria-hidden="true">
          <span>⌕</span>
          <strong>Explora sin barreras</strong>
        </div>
      </header>

      <div class="catalog-layout">
        <aside class="filter-panel" aria-labelledby="filters-title">
          <div class="filter-panel__heading">
            <div>
              <p class="section-kicker">Personaliza tu búsqueda</p>
              <h2 id="filters-title">Filtros</h2>
            </div>
            <button class="filter-reset" type="button" (click)="clearFilters()">Limpiar</button>
          </div>

          <form [formGroup]="filters" (ngSubmit)="applyFilters()" aria-label="Filtros del catálogo">
            <div class="catalog-field catalog-field--search">
              <label for="catalog-query">Buscar productos</label>
              <div class="search-input">
                <span aria-hidden="true">⌕</span>
                <input id="catalog-query" type="search" formControlName="q" placeholder="Nombre o descripción" />
              </div>
            </div>

            <div class="catalog-field">
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

            <fieldset class="price-fieldset">
              <legend>Rango de precio</legend>
              <div class="price-grid">
                <div class="catalog-field">
                  <label for="catalog-min-price">Mínimo</label>
                  <input id="catalog-min-price" type="number" min="0" step="0.01" formControlName="minPrice" placeholder="RD$ 0" />
                </div>
                <div class="catalog-field">
                  <label for="catalog-max-price">Máximo</label>
                  <input id="catalog-max-price" type="number" min="0" step="0.01" formControlName="maxPrice" placeholder="Sin límite" />
                </div>
              </div>
            </fieldset>

            <div class="catalog-field">
              <label for="catalog-stock">Disponibilidad</label>
              <select id="catalog-stock" formControlName="inStock">
                <option value="">Cualquier disponibilidad</option>
                <option value="true">En existencia</option>
                <option value="false">Agotados</option>
              </select>
            </div>

            <div class="catalog-field">
              <label for="catalog-sort">Ordenar por</label>
              <select id="catalog-sort" formControlName="sort">
                <option value="relevance">Relevancia</option>
                <option value="newest">Más recientes</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="name">Nombre</option>
              </select>
            </div>

            <button class="apply-button" type="submit">Aplicar filtros <span aria-hidden="true">→</span></button>
          </form>
        </aside>

        <div class="catalog-results">
          @if (result$ | async; as result) {
            <div class="results-toolbar">
              <div>
                <p class="section-kicker">Resultados</p>
                <p class="results-count" role="status" aria-live="polite">
                  <strong>{{ result.totalCount }}</strong> producto(s) encontrado(s)
                </p>
              </div>
              @if (result.facets.minPrice !== null && result.facets.maxPrice !== null) {
                <p class="price-range">
                  Rango: {{ result.facets.minPrice | currency:'DOP':'symbol':'1.2-2' }} – {{ result.facets.maxPrice | currency:'DOP':'symbol':'1.2-2' }}
                </p>
              }
            </div>

            @if (result.items.length === 0) {
              <div class="empty-state">
                <div class="empty-state__icon" aria-hidden="true">⌕</div>
                <h2>No encontramos productos</h2>
                <p>Prueba ampliando la búsqueda o eliminando algunos filtros.</p>
                <button type="button" class="empty-state__button" (click)="clearFilters()">Restablecer filtros</button>
              </div>
            } @else {
              <div class="product-grid">
                @for (product of result.items; track product.id) {
                  <article class="product-card">
                    <div class="product-card__visual" aria-hidden="true">
                      <span>{{ product.name.charAt(0) }}</span>
                    </div>
                    <div class="product-card__body">
                      <div class="product-card__meta">
                        <span class="stock-pill" [class.stock-pill--out]="product.stockQuantity <= 0">
                          {{ product.stockQuantity > 0 ? 'Disponible' : 'Agotado' }}
                        </span>
                      </div>
                      <h2><a [routerLink]="['/products', product.slug]">{{ product.name }}</a></h2>
                      <p class="product-card__description">{{ product.description }}</p>
                      <div class="product-card__footer">
                        <strong class="product-price">{{ product.price | currency:product.currency:'symbol':'1.2-2' }}</strong>
                        <span>{{ product.stockQuantity > 0 ? product.stockQuantity + ' en stock' : 'Sin existencias' }}</span>
                      </div>
                      <a class="product-card__cta" [routerLink]="['/products', product.slug]">
                        Ver producto <span aria-hidden="true">→</span>
                      </a>
                    </div>
                  </article>
                }
              </div>
            }

            @if (result.totalPages > 1) {
              <nav class="pagination" aria-label="Paginación del catálogo">
                <button type="button" [disabled]="result.page <= 1" (click)="goToPage(result.page - 1)">← Anterior</button>
                <span>Página <strong>{{ result.page }}</strong> de {{ result.totalPages }}</span>
                <button type="button" [disabled]="result.page >= result.totalPages" (click)="goToPage(result.page + 1)">Siguiente →</button>
              </nav>
            }
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .catalog-page { display: grid; gap: 1.6rem; }
    .catalog-hero { padding: 2.4rem 2.6rem; display: flex; justify-content: space-between; align-items: center; gap: 2rem; border: 1px solid #d8e3f0; border-radius: 1.6rem; background: radial-gradient(circle at 90% 20%, rgb(124 58 237 / 14%), transparent 18rem), radial-gradient(circle at 7% 80%, rgb(18 212 226 / 12%), transparent 18rem), #fff; box-shadow: 0 1.25rem 3rem rgb(11 39 79 / 10%); }
    .catalog-hero h1 { margin: .35rem 0 .6rem; color: #081c3d; font-size: clamp(2rem, 4vw, 3.4rem); line-height: 1.03; letter-spacing: -.04em; }
    .catalog-hero p:not(.eyebrow) { max-width: 45rem; margin: 0; color: #52657b; font-size: 1.05rem; }
    .catalog-hero__badge { min-width: 12rem; padding: .9rem 1.1rem; display: flex; align-items: center; gap: .75rem; border: 1px solid rgb(124 58 237 / 18%); border-radius: 1rem; color: #0d2b57; background: rgb(255 255 255 / 82%); box-shadow: 0 .8rem 2rem rgb(11 39 79 / 9%); }
    .catalog-hero__badge span { display: grid; width: 2.2rem; height: 2.2rem; place-items: center; border-radius: .7rem; color: #fff; background: linear-gradient(145deg,#1684ff,#7c3aed); }
    .catalog-layout { display: grid; grid-template-columns: minmax(16rem, 19rem) minmax(0, 1fr); align-items: start; gap: 1.5rem; }
    .filter-panel { position: sticky; top: 6.4rem; padding: 1.35rem; border: 1px solid #d8e3f0; border-radius: 1.3rem; background: #fff; box-shadow: 0 .8rem 2.4rem rgb(11 39 79 / 8%); }
    .filter-panel__heading { margin-bottom: 1.2rem; display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
    .filter-panel h2 { margin: .2rem 0 0; color: #081c3d; font-size: 1.55rem; }
    .filter-reset { padding: .2rem 0; border: 0; color: #0b5fad; background: transparent; font-weight: 800; text-decoration: underline; text-underline-offset: .2em; cursor: pointer; }
    .filter-panel form { display: grid; gap: 1rem; }
    .catalog-field { display: grid; gap: .38rem; }
    .catalog-field label, .price-fieldset legend { color: #10233f; font-size: .9rem; font-weight: 800; }
    .catalog-field input, .catalog-field select { width: 100%; min-height: 2.9rem; padding: .65rem .75rem; border: 1.5px solid #b9c9da; border-radius: .7rem; color: #10233f; background: #fff; }
    .search-input { position: relative; }
    .search-input span { position: absolute; left: .8rem; top: 50%; transform: translateY(-50%); color: #52657b; }
    .search-input input { padding-left: 2.1rem; }
    .price-fieldset { margin: 0; padding: 0; border: 0; }
    .price-grid { margin-top: .38rem; display: grid; grid-template-columns: 1fr 1fr; gap: .65rem; }
    .apply-button { min-height: 3rem; margin-top: .25rem; padding: .7rem 1rem; display: flex; align-items: center; justify-content: center; gap: .5rem; border: 0; border-radius: .75rem; color: #fff; background: linear-gradient(100deg,#5c21f2 0%,#2563eb 48%,#0eced8 100%); box-shadow: 0 .75rem 1.5rem rgb(37 99 235 / 22%); font-weight: 850; cursor: pointer; }
    .catalog-results { min-width: 0; }
    .results-toolbar { min-height: 4.8rem; margin-bottom: 1rem; padding: .9rem 1.1rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; border: 1px solid #d8e3f0; border-radius: 1rem; background: rgb(255 255 255 / 76%); }
    .results-count, .price-range { margin: .2rem 0 0; color: #52657b; }
    .results-count strong { color: #081c3d; }
    .price-range { font-size: .9rem; }
    .product-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 1rem; }
    .product-card { min-width: 0; overflow: hidden; border: 1px solid #d8e3f0; border-radius: 1.2rem; background: #fff; box-shadow: 0 .7rem 2rem rgb(11 39 79 / 7%); transition: transform 160ms ease, box-shadow 160ms ease; }
    .product-card:hover { transform: translateY(-2px); box-shadow: 0 1.2rem 2.6rem rgb(11 39 79 / 12%); }
    .product-card__visual { min-height: 10.5rem; display: grid; place-items: center; background: radial-gradient(circle at 75% 20%,rgb(124 58 237 / 18%),transparent 8rem), linear-gradient(135deg,#e9fbff,#edf2ff 55%,#f3eaff); }
    .product-card__visual span { display: grid; width: 4.4rem; height: 4.4rem; place-items: center; border-radius: 1.3rem; color: #fff; background: linear-gradient(145deg,#1684ff,#7c3aed); box-shadow: 0 1rem 2rem rgb(44 74 170 / 22%); font-size: 2rem; font-weight: 900; }
    .product-card__body { padding: 1.1rem; }
    .product-card__meta { display: flex; justify-content: flex-end; }
    .stock-pill { padding: .25rem .55rem; border-radius: 999px; color: #0a6247; background: #e7f8f1; font-size: .72rem; font-weight: 850; }
    .stock-pill--out { color: #8a1b1b; background: #fff0f0; }
    .product-card h2 { margin: .55rem 0 .45rem; font-size: 1.12rem; line-height: 1.25; }
    .product-card h2 a { color: #081c3d; text-decoration: none; }
    .product-card h2 a:hover { text-decoration: underline; }
    .product-card__description { min-height: 3.1rem; margin: 0 0 .9rem; display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; color: #52657b; font-size: .9rem; }
    .product-card__footer { padding-top: .8rem; display: flex; align-items: flex-end; justify-content: space-between; gap: .7rem; border-top: 1px solid #e7eef6; }
    .product-card__footer span { color: #52657b; font-size: .75rem; }
    .product-price { color: #081c3d; font-size: 1.2rem; }
    .product-card__cta { margin-top: .9rem; min-height: 2.7rem; display: flex; align-items: center; justify-content: center; gap: .4rem; border: 1.5px solid #0d2b57; border-radius: .7rem; color: #0d2b57; font-weight: 800; text-decoration: none; }
    .product-card__cta:hover { color: #fff; background: #0d2b57; }
    .empty-state { min-height: 24rem; padding: 3rem 1.2rem; display: grid; place-items: center; align-content: center; text-align: center; border: 1px dashed #b9c9da; border-radius: 1.3rem; background: rgb(255 255 255 / 68%); }
    .empty-state__icon { display: grid; width: 4.5rem; height: 4.5rem; place-items: center; border-radius: 1.25rem; color: #fff; background: linear-gradient(145deg,#1684ff,#7c3aed); font-size: 2rem; }
    .empty-state h2 { margin: 1rem 0 .2rem; color: #081c3d; }
    .empty-state p { margin: 0 0 1rem; color: #52657b; }
    .empty-state__button { min-height: 2.7rem; padding: .6rem 1rem; border: 0; border-radius: .7rem; color: #fff; background: #0d2b57; font-weight: 800; cursor: pointer; }
    .pagination { margin-top: 1.4rem; padding: .9rem 1rem; display: flex; align-items: center; justify-content: center; gap: 1rem; border: 1px solid #d8e3f0; border-radius: 1rem; background: #fff; }
    .pagination button { min-height: 2.5rem; padding: .5rem .8rem; border: 1px solid #b9c9da; border-radius: .65rem; color: #0d2b57; background: #fff; font-weight: 750; cursor: pointer; }
    .pagination button:disabled { opacity: .45; cursor: not-allowed; }
    :is(input, select, button, a):focus-visible { outline: 3px solid #ffb703; outline-offset: 3px; }
    @media (max-width: 70rem) { .product-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } }
    @media (max-width: 52rem) { .catalog-hero { padding: 1.5rem; align-items: flex-start; flex-direction: column; } .catalog-layout { grid-template-columns: 1fr; } .filter-panel { position: static; } }
    @media (max-width: 36rem) { .product-grid, .price-grid { grid-template-columns: 1fr; } .results-toolbar, .pagination { align-items: stretch; flex-direction: column; } .pagination { text-align: center; } }
    @media (forced-colors: active) { .product-card, .filter-panel, .catalog-hero, .results-toolbar { border: 2px solid CanvasText; } .apply-button, .empty-state__button { border: 2px solid ButtonText; } }
    @media (prefers-reduced-motion: reduce) { .product-card, .apply-button { transition: none; } .product-card:hover { transform: none; } }
  `]
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
