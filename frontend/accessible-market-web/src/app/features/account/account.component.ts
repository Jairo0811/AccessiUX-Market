import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-account',
  imports: [RouterLink],
  template: `
    <section class="account-page" aria-labelledby="account-title">
      <header class="content-card account-hero">
        <div>
          <p class="eyebrow">Cuenta</p>
          <h1 id="account-title">Hola, {{ auth.currentUser()?.fullName }}</h1>
          <p class="account-hero__copy">Consulta tu identidad, roles y accesos habilitados dentro de AccessiUX Market.</p>
        </div>
        <div class="role-badges" aria-label="Roles asignados">
          @for (role of auth.currentUser()?.roles ?? []; track role) {
            <span>{{ roleLabel(role) }}</span>
          }
        </div>
      </header>

      @if (accessDenied()) {
        <div class="alert alert--error" role="alert">
          Tu cuenta no tiene el rol necesario para acceder a esa sección.
        </div>
      }

      <div class="account-layout">
        <section class="content-card" aria-labelledby="identity-title">
          <p class="section-kicker">Identidad</p>
          <h2 id="identity-title">Datos de la cuenta</h2>
          <dl class="account-details">
            <div><dt>Correo electrónico</dt><dd>{{ auth.currentUser()?.email }}</dd></div>
            <div><dt>Roles</dt><dd>{{ friendlyRoles() }}</dd></div>
          </dl>
        </section>

        <section class="content-card" aria-labelledby="access-title">
          <p class="section-kicker">Autorización</p>
          <h2 id="access-title">Accesos habilitados</h2>
          <div class="access-grid">
            @if (auth.isCustomer()) {
              <article>
                <strong>Compras</strong>
                <p>Carrito, checkout, historial y cancelación de pedidos cuando corresponda.</p>
                <a routerLink="/orders">Ver mis pedidos</a>
              </article>
            }
            @if (auth.isSeller()) {
              <article>
                <strong>Ventas</strong>
                <p>Perfil comercial, políticas, productos, publicación e inventario propio.</p>
                <a routerLink="/seller">Abrir panel de vendedor</a>
              </article>
            } @else if (auth.isCustomer() && !auth.isAdministrator()) {
              <article>
                <strong>Convertirte en vendedor</strong>
                <p>Puedes activar un perfil comercial sin perder tus privilegios de cliente.</p>
                <a routerLink="/seller">Crear perfil de vendedor</a>
              </article>
            }
            @if (auth.isAdministrator()) {
              <article>
                <strong>Administración</strong>
                <p>Acceso protegido al resumen operativo de usuarios, vendedores, productos y pedidos.</p>
                <a routerLink="/admin">Abrir administración</a>
              </article>
            }
          </div>
        </section>
      </div>

      @if (errorMessage()) {
        <div class="alert alert--error" role="alert">{{ errorMessage() }}</div>
      }
      <button class="button button--secondary" type="button" (click)="logout()" [disabled]="isSubmitting()">
        Cerrar sesión
      </button>
    </section>
  `,
  styles: [`
    .account-page { display: grid; gap: 1rem; }
    .account-hero {
      display: flex;
      justify-content: space-between;
      gap: 2rem;
      align-items: flex-start;
      background: linear-gradient(135deg,#fff,#f2f8ff 62%,#f5efff);
    }
    .account-hero h1 { margin-bottom: .6rem; }
    .account-hero__copy { max-width: 44rem; margin: 0; color: var(--ink-600); }
    .role-badges { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .5rem; }
    .role-badges span {
      padding: .4rem .7rem;
      border: 1px solid #c8d8eb;
      border-radius: 999px;
      color: var(--navy-800);
      background: #f7fbff;
      font-size: .78rem;
      font-weight: 900;
    }
    .account-layout { display: grid; grid-template-columns: minmax(18rem,.75fr) minmax(0,1.25fr); gap: 1rem; }
    .content-card h2 { margin: .2rem 0 1rem; color: var(--navy-900); }
    .access-grid { display: grid; gap: .75rem; }
    .access-grid article {
      padding: 1rem;
      border: 1px solid var(--border);
      border-radius: .85rem;
      background: var(--surface-soft);
    }
    .access-grid strong { color: var(--navy-900); }
    .access-grid p { margin: .3rem 0 .55rem; color: var(--ink-600); }
    .access-grid a { font-weight: 800; }
    @media (max-width: 52rem) {
      .account-hero { flex-direction: column; }
      .role-badges { justify-content: flex-start; }
      .account-layout { grid-template-columns: 1fr; }
    }
  `],
})
export class AccountComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly accessDenied = signal(this.route.snapshot.queryParamMap.get('accessDenied') === '1');

  friendlyRoles(): string {
    return (this.auth.currentUser()?.roles ?? []).map(role => this.roleLabel(role)).join(', ');
  }

  roleLabel(role: string): string {
    if (role === 'Customer') return 'Cliente';
    if (role === 'Seller') return 'Vendedor';
    if (role === 'Administrator') return 'Administrador';
    return role;
  }

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
