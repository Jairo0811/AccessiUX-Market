import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { CatalogService } from '../../core/catalog/catalog.service';

@Component({ selector: 'app-seller-dashboard', imports: [AsyncPipe, ReactiveFormsModule], template: `
<section aria-labelledby="seller-title"><p class="eyebrow">Vendedores</p><h1 id="seller-title">Panel de vendedor</h1>
@if (seller$ | async; as seller) { <p>Perfil activo: <strong>{{ seller.displayName }}</strong></p> } @else {
  <h2>Crear perfil de vendedor</h2><form [formGroup]="sellerForm" (ngSubmit)="createSeller()">
    <label>Nombre público <input formControlName="displayName" /></label><label>Identificador <input formControlName="slug" /></label><label>Descripción <textarea formControlName="description"></textarea></label>
    <button class="button" type="submit" [disabled]="sellerForm.invalid">Crear perfil</button></form>
}
@if (products$ | async; as products) { <h2>Mis productos</h2><p role="status">{{ products.length }} producto(s).</p><div class="card-grid">@for (product of products; track product.id) { <article class="card"><h3>{{ product.name }}</h3><p>Estado: {{ product.status }}</p>@if (product.status === 'Draft') { <button type="button" (click)="publish(product.id)">Publicar</button> }</article> }</div> }
</section>` })
export class SellerDashboardComponent {
  private readonly catalog = inject(CatalogService); private readonly fb = inject(FormBuilder);
  readonly seller$ = this.catalog.mySeller().pipe(catchError(() => of(null))); readonly products$ = this.catalog.myProducts().pipe(catchError(() => of([])));
  readonly sellerForm = this.fb.nonNullable.group({ displayName: ['', [Validators.required, Validators.maxLength(120)]], slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]], description: [''] });
  createSeller(): void { if (this.sellerForm.invalid) return; this.catalog.createSeller(this.sellerForm.getRawValue()).subscribe(() => location.reload()); }
  publish(id: string): void { this.catalog.publish(id).subscribe(() => location.reload()); }
}
