import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet],
  template: `
    <a class="skip-link" href="#main-content">Saltar al contenido principal</a>

    <header class="site-header">
      <nav class="nav" aria-label="Navegación principal">
        <a class="brand" routerLink="/" aria-label="AccessiUX Market, inicio">
          <span class="brand__mark" aria-hidden="true">
            <svg viewBox="0 0 48 48" focusable="false">
              <path d="M24 4 7 14v20l17 10 17-10V14L24 4Z" fill="none" stroke="currentColor" stroke-width="3"/>
              <path d="M16 31 24 15l8 16M18.5 26h11" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="24" cy="21" r="2.4" fill="currentColor"/>
            </svg>
          </span>
          <span class="brand__text">
            <strong>Accessi<span>UX</span></strong>
            <small>Market</small>
          </span>
        </a>

        <div class="nav__actions">
          <a routerLink="/catalog">Catálogo</a>
          @if (auth.isAuthenticated()) {
            <a routerLink="/cart">Carrito</a>
            <a routerLink="/seller">Vender</a>
            <a routerLink="/account">Mi cuenta</a>
            <button class="link-button" type="button" (click)="logout()">Cerrar sesión</button>
          } @else {
            <a routerLink="/login">Iniciar sesión</a>
            <a class="button button--small button--gradient" routerLink="/register">Crear cuenta</a>
          }
        </div>
      </nav>
    </header>

    <main id="main-content" class="app-shell" tabindex="-1">
      <router-outlet />
    </main>

    <footer class="site-footer">
      <div class="site-footer__inner">
        <p><strong>AccessiUX Market</strong> · Comercio electrónico accesible y usable.</p>
        <p>Diseñado para comprar con claridad, confianza y menos barreras.</p>
      </div>
    </footer>
  `,
})
export class AppComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout().subscribe({
      next: () => void this.router.navigate(['/']),
      error: () => void this.router.navigate(['/']),
    });
  }
}
