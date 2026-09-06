import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CheckoutConfirmation, CheckoutRequest, CheckoutReview } from './checkout.models';

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/checkout';

  review(request: CheckoutRequest): Observable<CheckoutReview> {
    return this.http.post<CheckoutReview>(`${this.baseUrl}/review`, request);
  }

  confirm(request: CheckoutRequest): Observable<CheckoutConfirmation> {
    return this.http.post<CheckoutConfirmation>(`${this.baseUrl}/confirm`, request);
  }
}
