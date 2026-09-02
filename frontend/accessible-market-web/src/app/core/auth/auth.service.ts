import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, shareReplay, tap, throwError } from 'rxjs';
import { ApiProblem, AuthResponse, CurrentUser, LoginRequest, RegisterRequest } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/auth';
  private readonly accessTokenState = signal<string | null>(null);
  private readonly currentUserState = signal<CurrentUser | null>(null);
  private refreshInFlight: Observable<boolean> | null = null;

  readonly currentUser = this.currentUserState.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserState() !== null);

  get accessToken(): string | null {
    return this.accessTokenState();
  }

  register(request: RegisterRequest): Observable<CurrentUser> {
    return this.createSession('register', request);
  }

  login(request: LoginRequest): Observable<CurrentUser> {
    return this.createSession('login', request);
  }

  restoreSession(): Observable<boolean> {
    if (this.isAuthenticated()) {
      return of(true);
    }

    return this.refreshSession();
  }

  refreshSession(): Observable<boolean> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    this.refreshInFlight = this.http
      .post<AuthResponse>(`${this.apiUrl}/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((response) => this.storeSession(response)),
        map(() => true),
        catchError(() => {
          this.clearSession();
          return of(false);
        }),
        finalize(() => this.refreshInFlight = null),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.refreshInFlight;
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .pipe(finalize(() => this.clearSession()));
  }

  requestPasswordReset(email: string): Observable<void> {
    return this.http
      .post<unknown>(`${this.apiUrl}/forgot-password`, { email })
      .pipe(map(() => undefined));
  }

  resetPassword(email: string, token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/reset-password`, {
      email,
      token,
      newPassword,
    });
  }

  describeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No se pudo completar la solicitud. Inténtalo de nuevo.';
    }

    const problem = error.error as ApiProblem | null;
    const validationMessage = problem?.errors
      ? Object.values(problem.errors).flat().at(0)
      : undefined;
    return validationMessage ?? problem?.detail ?? this.messageForStatus(error.status);
  }

  private createSession(
    endpoint: 'register' | 'login',
    request: RegisterRequest | LoginRequest,
  ): Observable<CurrentUser> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/${endpoint}`, request, { withCredentials: true })
      .pipe(
        tap((response) => this.storeSession(response)),
        map((response) => response.user),
        catchError((error: unknown) => throwError(() => error)),
      );
  }

  private storeSession(response: AuthResponse): void {
    this.accessTokenState.set(response.accessToken);
    this.currentUserState.set(response.user);
  }

  private clearSession(): void {
    this.accessTokenState.set(null);
    this.currentUserState.set(null);
  }

  private messageForStatus(status: number): string {
    if (status === 0) {
      return 'No se pudo conectar con el servidor.';
    }
    if (status === 401) {
      return 'Las credenciales no son válidas.';
    }
    if (status === 409) {
      return 'Ya existe una cuenta con ese correo electrónico.';
    }
    if (status === 429) {
      return 'Se realizaron demasiados intentos. Espera un momento e inténtalo de nuevo.';
    }
    return 'No se pudo completar la solicitud. Inténtalo de nuevo.';
  }
}
