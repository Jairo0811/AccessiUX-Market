import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-card" aria-labelledby="forgot-title">
      <p class="eyebrow">Recupera el acceso</p>
      <h1 id="forgot-title">Restablecer contraseña</h1>
      <p>Te enviaremos instrucciones si existe una cuenta asociada al correo.</p>

      @if (message()) {
        <div class="alert" role="status">{{ message() }}</div>
      }
      @if (errorMessage()) {
        <div class="alert alert--error" role="alert">{{ errorMessage() }}</div>
      }

      <form (ngSubmit)="submit()" novalidate>
        <div class="field">
          <label for="forgot-email">Correo electrónico</label>
          <input id="forgot-email" type="email" [formControl]="email" autocomplete="email"
            [attr.aria-invalid]="email.invalid && email.touched" aria-describedby="forgot-email-error">
          @if (email.invalid && email.touched) {
            <p id="forgot-email-error" class="field-error">Escribe un correo electrónico válido.</p>
          }
        </div>
        <button class="button button--full" type="submit" [disabled]="isSubmitting()">
          {{ isSubmitting() ? 'Enviando…' : 'Enviar instrucciones' }}
        </button>
      </form>
      <p class="auth-card__footer"><a routerLink="/login">Volver a iniciar sesión</a></p>
    </section>
  `,
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);

  readonly email = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] });
  readonly isSubmitting = signal(false);
  readonly message = signal('');
  readonly errorMessage = signal('');

  submit(): void {
    this.message.set('');
    this.errorMessage.set('');
    if (this.email.invalid) {
      this.email.markAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.auth.requestPasswordReset(this.email.value)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => this.message.set('Si la cuenta existe, recibirás instrucciones para restablecer la contraseña.'),
        error: (error: unknown) => this.errorMessage.set(this.auth.describeError(error)),
      });
  }
}
