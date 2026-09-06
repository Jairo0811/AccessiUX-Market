import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { OrderCancellation, OrderDetail, OrderSummary } from './order.models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/orders';

  getOrders(): Observable<OrderSummary[]> {
    return this.http.get<OrderSummary[]>(this.baseUrl);
  }

  getOrder(orderId: string): Observable<OrderDetail> {
    return this.http.get<OrderDetail>(`${this.baseUrl}/${orderId}`);
  }

  cancel(orderId: string): Observable<OrderCancellation> {
    return this.http.post<OrderCancellation>(`${this.baseUrl}/${orderId}/cancel`, {});
  }
}
