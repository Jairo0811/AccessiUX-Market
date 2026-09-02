import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-account',
  template: `
    <section class="content-card" aria-labelledby="account-title">
      <p class="eyebrow">Cuenta</p>
      <h1 id="account-title">Hola, {{ auth.currentUser()?.fullName }}</h1>
      <dl class="account-details">
        <div><dt>Correo electrónico</dt><dd>{{ auth.currentUser()?.email }}</dd></div>
        <div><dt>Rol</dt><dd>{{ auth.currentUser()?.roles?.join(', ') }}</dd></div>
      </dl>
      @if (errorMessage()) {
        <div class="alert alert--error" role="alert">{{ errorMessage() }}</div>
      }
      <button class="button button--secondary" type="button" (click)="logout()" [disabled]="isSubmitting()">
        Cerrar sesión
      </button>
    </section>
  `,
})
export class AccountComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  logout(): void {
    this.isSubmitting.set(true);
    this.auth.logout()
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => void this.router.navigate(['/']),
        error: (error: unknown) => this.errorMessage.set(this.auth.describeError(error)),
      });
  }
}
