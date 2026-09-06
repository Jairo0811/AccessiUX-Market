import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CatalogSearchParams,
  CatalogSearchResult,
  Category,
  CreateProductRequest,
  CreateSellerRequest,
  Product,
  Seller,
  UpdateSellerPoliciesRequest,
} from './catalog.models';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/catalog';

  categories(): Observable<Category[]> { return this.http.get<Category[]>(`${this.baseUrl}/categories`); }
  products(): Observable<Product[]> { return this.http.get<Product[]>(`${this.baseUrl}/products`); }
  search(filters: CatalogSearchParams): Observable<CatalogSearchResult> {
    let params = new HttpParams();
    if (filters.q) params = params.set('q', filters.q);
    if (filters.categoryId) params = params.set('categoryId', filters.categoryId);
    if (filters.minPrice !== undefined) params = params.set('minPrice', filters.minPrice);
    if (filters.maxPrice !== undefined) params = params.set('maxPrice', filters.maxPrice);
    if (filters.inStock !== undefined) params = params.set('inStock', filters.inStock);
    if (filters.sort) params = params.set('sort', filters.sort);
    if (filters.page) params = params.set('page', filters.page);
    if (filters.pageSize) params = params.set('pageSize', filters.pageSize);
    return this.http.get<CatalogSearchResult>(`${this.baseUrl}/search`, { params });
  }
  product(slug: string): Observable<Product> { return this.http.get<Product>(`${this.baseUrl}/products/${encodeURIComponent(slug)}`); }
  sellerById(sellerId: string): Observable<Seller> { return this.http.get<Seller>(`${this.baseUrl}/sellers/id/${encodeURIComponent(sellerId)}`); }
  mySeller(): Observable<Seller> { return this.http.get<Seller>(`${this.baseUrl}/seller/me`); }
  myProducts(): Observable<Product[]> { return this.http.get<Product[]>(`${this.baseUrl}/seller/products`); }
  createSeller(request: CreateSellerRequest): Observable<Seller> { return this.http.post<Seller>(`${this.baseUrl}/seller`, request); }
  updateSellerPolicies(request: UpdateSellerPoliciesRequest): Observable<Seller> { return this.http.put<Seller>(`${this.baseUrl}/seller/policies`, request); }
  createProduct(request: CreateProductRequest): Observable<Product> { return this.http.post<Product>(`${this.baseUrl}/seller/products`, request); }
  publish(productId: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/seller/products/${productId}/publish`, {}); }
}
