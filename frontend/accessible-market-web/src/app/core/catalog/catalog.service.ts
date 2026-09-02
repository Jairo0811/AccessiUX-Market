import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Category, CreateProductRequest, CreateSellerRequest, Product, Seller } from './catalog.models';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/catalog';
  categories(): Observable<Category[]> { return this.http.get<Category[]>(`${this.baseUrl}/categories`); }
  products(): Observable<Product[]> { return this.http.get<Product[]>(`${this.baseUrl}/products`); }
  product(slug: string): Observable<Product> { return this.http.get<Product>(`${this.baseUrl}/products/${encodeURIComponent(slug)}`); }
  mySeller(): Observable<Seller> { return this.http.get<Seller>(`${this.baseUrl}/seller/me`); }
  myProducts(): Observable<Product[]> { return this.http.get<Product[]>(`${this.baseUrl}/seller/products`); }
  createSeller(request: CreateSellerRequest): Observable<Seller> { return this.http.post<Seller>(`${this.baseUrl}/seller`, request); }
  createProduct(request: CreateProductRequest): Observable<Product> { return this.http.post<Product>(`${this.baseUrl}/seller/products`, request); }
  publish(productId: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/seller/products/${productId}/publish`, {}); }
}
