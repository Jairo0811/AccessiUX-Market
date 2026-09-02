import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { strongPassword } from '../../shared/forms/password.validator';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-card" aria-labelledby="register-title">
      <p class="eyebrow">Tu mercado, a tu manera</p>
      <h1 id="register-title">Crear una cuenta</h1>
      <p>Completa los datos. Todos los campos son obligatorios.</p>

      @if (errorMessage()) {
        <div class="alert alert--error" role="alert">{{ errorMessage() }}</div>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="field">
          <label for="register-name">Nombre completo</label>
          <input id="register-name" formControlName="fullName" autocomplete="name"
            [attr.aria-invalid]="showError('fullName')" [attr.aria-describedby]="showError('fullName') ? 'register-name-error' : null">
          @if (showError('fullName')) {
            <p id="register-name-error" class="field-error">Escribe un nombre de 2 a 120 caracteres.</p>
          }
        </div>
        <div class="field">
          <label for="register-email">Correo electrónico</label>
          <input id="register-email" type="email" formControlName="email" autocomplete="email"
            [attr.aria-invalid]="showError('email')" [attr.aria-describedby]="showError('email') ? 'register-email-error' : null">
          @if (showError('email')) {
            <p id="register-email-error" class="field-error">Escribe un correo electrónico válido.</p>
          }
        </div>
        <div class="field">
          <label for="register-password">Contraseña</label>
          <input id="register-password" type="password" formControlName="password" autocomplete="new-password"
            [attr.aria-invalid]="showError('password')" aria-describedby="password-help register-password-error">
          <p id="password-help" class="field-help">Usa 12 o más caracteres con mayúscula, minúscula, número y símbolo.</p>
          @if (showError('password')) {
            <p id="register-password-error" class="field-error">La contraseña no cumple los requisitos.</p>
          }
        </div>
        <button class="button button--full" type="submit" [disabled]="isSubmitting()">
          {{ isSubmitting() ? 'Creando cuenta…' : 'Crear cuenta' }}
        </button>
      </form>
      <p class="auth-card__footer">¿Ya tienes cuenta? <a routerLink="/login">Iniciar sesión</a></p>
    </section>
  `,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly errorMessage = signal('');
  readonly isSubmitting = signal(false);
  readonly form = new FormGroup({
    fullName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(120)],
    }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, strongPassword] }),
  });

  showError(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  submit(): void {
    this.errorMessage.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.auth.register(this.form.getRawValue())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => void this.router.navigate(['/account']),
        error: (error: unknown) => this.errorMessage.set(this.auth.describeError(error)),
      });
  }
}
