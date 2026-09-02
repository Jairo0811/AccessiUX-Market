import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-card" aria-labelledby="login-title">
      <p class="eyebrow">Qué bueno verte</p>
      <h1 id="login-title">Iniciar sesión</h1>
      <p>Accede a tu cuenta de AccessiUX Market.</p>

      @if (errorMessage()) {
        <div class="alert alert--error" role="alert" tabindex="-1">{{ errorMessage() }}</div>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="field">
          <label for="login-email">Correo electrónico</label>
          <input id="login-email" type="email" formControlName="email" autocomplete="email"
            [attr.aria-invalid]="showEmailError()" [attr.aria-describedby]="showEmailError() ? 'login-email-error' : null">
          @if (showEmailError()) {
            <p id="login-email-error" class="field-error">Escribe un correo electrónico válido.</p>
          }
        </div>
        <div class="field">
          <label for="login-password">Contraseña</label>
          <input id="login-password" type="password" formControlName="password" autocomplete="current-password"
            [attr.aria-invalid]="showPasswordError()" [attr.aria-describedby]="showPasswordError() ? 'login-password-error' : null">
          @if (showPasswordError()) {
            <p id="login-password-error" class="field-error">La contraseña es obligatoria.</p>
          }
        </div>
        <a class="text-link" routerLink="/forgot-password">¿Olvidaste tu contraseña?</a>
        <button class="button button--full" type="submit" [disabled]="isSubmitting()">
          {{ isSubmitting() ? 'Iniciando…' : 'Iniciar sesión' }}
        </button>
      </form>
      <p class="auth-card__footer">¿Aún no tienes cuenta? <a routerLink="/register">Crear una cuenta</a></p>
    </section>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly errorMessage = signal('');
  readonly isSubmitting = signal(false);
  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  showEmailError(): boolean {
    const control = this.form.controls.email;
    return control.invalid && (control.dirty || control.touched);
  }

  showPasswordError(): boolean {
    const control = this.form.controls.password;
    return control.invalid && (control.dirty || control.touched);
  }

  submit(): void {
    this.errorMessage.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.auth.login(this.form.getRawValue())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/account';
          void this.router.navigateByUrl(returnUrl.startsWith('/') ? returnUrl : '/account');
        },
        error: (error: unknown) => this.errorMessage.set(this.auth.describeError(error)),
      });
  }
}
