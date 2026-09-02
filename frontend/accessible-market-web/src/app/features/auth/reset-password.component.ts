import { Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { strongPassword } from '../../shared/forms/password.validator';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-card" aria-labelledby="reset-title">
      <p class="eyebrow">Crea una nueva clave</p>
      <h1 id="reset-title">Nueva contraseña</h1>
      <p>La nueva contraseña cerrará las demás sesiones de la cuenta.</p>

      @if (errorMessage()) {
        <div class="alert alert--error" role="alert">{{ errorMessage() }}</div>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="field">
          <label for="reset-email">Correo electrónico</label>
          <input id="reset-email" type="email" formControlName="email" autocomplete="email">
        </div>
        <div class="field">
          <label for="reset-token">Código de recuperación</label>
          <textarea id="reset-token" formControlName="token" rows="3" autocomplete="off"></textarea>
        </div>
        <div class="field">
          <label for="reset-password">Nueva contraseña</label>
          <input id="reset-password" type="password" formControlName="newPassword" autocomplete="new-password"
            aria-describedby="reset-password-help">
          <p id="reset-password-help" class="field-help">Usa 12 o más caracteres con mayúscula, minúscula, número y símbolo.</p>
        </div>
        <button class="button button--full" type="submit" [disabled]="isSubmitting()">Guardar contraseña</button>
      </form>
      <p class="auth-card__footer"><a routerLink="/login">Volver a iniciar sesión</a></p>
    </section>
  `,
})
export class ResetPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly form = new FormGroup({
    email: new FormControl(this.route.snapshot.queryParamMap.get('email') ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    token: new FormControl(this.route.snapshot.queryParamMap.get('token') ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    newPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, strongPassword],
    }),
  });

  constructor() {
    if (this.route.snapshot.queryParamMap.has('token')) {
      this.location.replaceState('/reset-password');
    }
  }

  submit(): void {
    this.errorMessage.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Revisa los campos antes de continuar.');
      return;
    }

    this.isSubmitting.set(true);
    const request = this.form.getRawValue();
    this.auth.resetPassword(request.email, request.token, request.newPassword)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => void this.router.navigate(['/login'], { queryParams: { passwordReset: true } }),
        error: (error: unknown) => this.errorMessage.set(this.auth.describeError(error)),
      });
  }
}
