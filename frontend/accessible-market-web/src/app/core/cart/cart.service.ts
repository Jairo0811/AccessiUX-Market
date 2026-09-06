import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AddCartItemRequest, Cart, UpdateCartItemRequest } from './cart.models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/cart';

  get(): Observable<Cart> {
    return this.http.get<Cart>(this.baseUrl);
  }

  add(request: AddCartItemRequest): Observable<Cart> {
    return this.http.post<Cart>(`${this.baseUrl}/items`, request);
  }

  update(productId: string, request: UpdateCartItemRequest): Observable<Cart> {
    return this.http.put<Cart>(`${this.baseUrl}/items/${encodeURIComponent(productId)}`, request);
  }

  remove(productId: string): Observable<Cart> {
    return this.http.delete<Cart>(`${this.baseUrl}/items/${encodeURIComponent(productId)}`);
  }

  clear(): Observable<void> {
    return this.http.delete<void>(this.baseUrl);
  }
}
