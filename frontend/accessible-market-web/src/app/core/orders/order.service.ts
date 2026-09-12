import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { OrderCancellation, OrderCompletion, OrderDetail, OrderInvoice, OrderSummary } from './order.models';

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

  complete(orderId: string): Observable<OrderCompletion> {
    return this.http.post<OrderCompletion>(`${this.baseUrl}/${orderId}/complete`, {});
  }

  getInvoice(orderId: string): Observable<OrderInvoice> {
    return this.http.get<OrderInvoice>(`${this.baseUrl}/${orderId}/invoice`);
  }
}
