import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface AdminOverview {
  readonly totalUsers: number;
  readonly activeUsers: number;
  readonly sellers: number;
  readonly products: number;
  readonly publishedProducts: number;
  readonly orders: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/admin';

  overview(): Observable<AdminOverview> {
    return this.http.get<AdminOverview>(`${this.baseUrl}/overview`);
  }
}
