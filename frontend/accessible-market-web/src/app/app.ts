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
          <span aria-hidden="true">A</span> AccessiUX Market
        </a>
        <div class="nav__actions">
          <a routerLink="/catalog">Catálogo</a>
          @if (auth.isAuthenticated()) {
            <a routerLink="/seller">Vender</a>
            <a routerLink="/account">Mi cuenta</a>
            <button class="link-button" type="button" (click)="logout()">Cerrar sesión</button>
          } @else {
            <a routerLink="/login">Iniciar sesión</a>
            <a class="button button--small" routerLink="/register">Crear cuenta</a>
          }
        </div>
      </nav>
    </header>
    <main id="main-content" class="app-shell" tabindex="-1">
      <router-outlet />
    </main>
    <footer class="site-footer">
      <p>AccessiUX Market · Comercio electrónico accesible y usable.</p>
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
