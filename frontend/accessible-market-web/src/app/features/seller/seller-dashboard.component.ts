import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { CatalogService } from '../../core/catalog/catalog.service';

@Component({
  selector: 'app-seller-dashboard',
  imports: [AsyncPipe, ReactiveFormsModule],
  template: `
    <section aria-labelledby="seller-title">
      <p class="eyebrow">Vendedores</p>
      <h1 id="seller-title">Panel de vendedor</h1>

      @if (seller$ | async; as seller) {
        <p>Perfil activo: <strong>{{ seller.displayName }}</strong></p>

        <section aria-labelledby="new-product-title">
          <h2 id="new-product-title">Crear producto</h2>
          <form [formGroup]="productForm" (ngSubmit)="createProduct()">
            <label for="product-name">Nombre</label>
            <input id="product-name" formControlName="name" />

            <label for="product-slug">Identificador</label>
            <input id="product-slug" formControlName="slug" aria-describedby="product-slug-help" />
            <p id="product-slug-help">Usa minúsculas, números y guiones.</p>

            <label for="product-category">Categoría</label>
            <select id="product-category" formControlName="categoryId">
              <option value="">Selecciona una categoría</option>
              @if (categories$ | async; as categories) {
                @for (category of categories; track category.id) {
                  <option [value]="category.id">{{ category.name }}</option>
                }
              }
            </select>

            <label for="product-description">Descripción</label>
            <textarea id="product-description" formControlName="description"></textarea>

            <label for="product-price">Precio</label>
            <input id="product-price" type="number" min="0.01" step="0.01" formControlName="price" />

            <label for="product-currency">Moneda</label>
            <select id="product-currency" formControlName="currency">
              <option value="DOP">DOP</option>
              <option value="USD">USD</option>
            </select>

            <label for="product-stock">Existencias</label>
            <input id="product-stock" type="number" min="0" step="1" formControlName="stockQuantity" />

            <button class="button" type="submit" [disabled]="productForm.invalid">Guardar borrador</button>
          </form>
        </section>
      } @else {
        <section aria-labelledby="new-seller-title">
          <h2 id="new-seller-title">Crear perfil de vendedor</h2>
          <form [formGroup]="sellerForm" (ngSubmit)="createSeller()">
            <label for="seller-name">Nombre público</label>
            <input id="seller-name" formControlName="displayName" />

            <label for="seller-slug">Identificador</label>
            <input id="seller-slug" formControlName="slug" aria-describedby="seller-slug-help" />
            <p id="seller-slug-help">Usa minúsculas, números y guiones.</p>

            <label for="seller-description">Descripción</label>
            <textarea id="seller-description" formControlName="description"></textarea>
            <button class="button" type="submit" [disabled]="sellerForm.invalid">Crear perfil</button>
          </form>
        </section>
      }

      @if (products$ | async; as products) {
        <section aria-labelledby="my-products-title">
          <h2 id="my-products-title">Mis productos</h2>
          <p role="status">{{ products.length }} producto(s).</p>
          <div class="card-grid">
            @for (product of products; track product.id) {
              <article class="card">
                <h3>{{ product.name }}</h3>
                <p>Estado: {{ product.status }}</p>
                <p>Existencias: {{ product.stockQuantity }}</p>
                @if (product.status === 'Draft') {
                  <button type="button" (click)="publish(product.id)" [disabled]="product.stockQuantity <= 0">Publicar</button>
                }
              </article>
            }
          </div>
        </section>
      }
    </section>
  `,
})
export class SellerDashboardComponent {
  private readonly catalog = inject(CatalogService);
  private readonly fb = inject(FormBuilder);

  readonly seller$ = this.catalog.mySeller().pipe(catchError(() => of(null)));
  readonly products$ = this.catalog.myProducts().pipe(catchError(() => of([])));
  readonly categories$ = this.catalog.categories();

  readonly sellerForm = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.maxLength(120)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    description: ['', Validators.maxLength(1000)],
  });

  readonly productForm = this.fb.nonNullable.group({
    categoryId: ['', Validators.required],
    name: ['', [Validators.required, Validators.maxLength(180)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    description: ['', [Validators.required, Validators.maxLength(5000)]],
    price: [0, [Validators.required, Validators.min(0.01)]],
    currency: ['DOP', [Validators.required, Validators.pattern(/^[A-Z]{3}$/)]],
    stockQuantity: [0, [Validators.required, Validators.min(0)]],
  });

  createSeller(): void {
    if (this.sellerForm.invalid) return;
    this.catalog.createSeller(this.sellerForm.getRawValue()).subscribe(() => location.reload());
  }

  createProduct(): void {
    if (this.productForm.invalid) return;
    this.catalog.createProduct(this.productForm.getRawValue()).subscribe(() => location.reload());
  }

  publish(id: string): void {
    this.catalog.publish(id).subscribe(() => location.reload());
  }
}
