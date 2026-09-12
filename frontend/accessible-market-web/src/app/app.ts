import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AccessibilityPreferencesService } from './core/accessibility/accessibility-preferences.service';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
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
          <a routerLink="/catalog" routerLinkActive="active" ariaCurrentWhenActive="page">Catálogo</a>
          <a routerLink="/accessibility" routerLinkActive="active" ariaCurrentWhenActive="page">Accesibilidad</a>
          @if (auth.isAuthenticated()) {
            @if (auth.isCustomer()) {
              <a routerLink="/cart" routerLinkActive="active" ariaCurrentWhenActive="page">Carrito</a>
              <a routerLink="/orders" routerLinkActive="active" ariaCurrentWhenActive="page">Mis pedidos</a>
            }
            @if (auth.isSeller()) {
              <a routerLink="/seller" routerLinkActive="active" ariaCurrentWhenActive="page">Panel de vendedor</a>
            } @else if (!auth.isAdministrator()) {
              <a routerLink="/seller" routerLinkActive="active" ariaCurrentWhenActive="page">Vender</a>
            }
            @if (auth.isAdministrator()) {
              <a routerLink="/admin" routerLinkActive="active" ariaCurrentWhenActive="page">Administración</a>
            }
            <a routerLink="/account" routerLinkActive="active" ariaCurrentWhenActive="page">Mi cuenta</a>
            <button class="link-button" type="button" (click)="logout()">Cerrar sesión</button>
          } @else {
            <a routerLink="/login" routerLinkActive="active" ariaCurrentWhenActive="page">Iniciar sesión</a>
            <a class="button button--small button--gradient" routerLink="/register" routerLinkActive="active" ariaCurrentWhenActive="page">Crear cuenta</a>
          }
        </div>
      </nav>
    </header>

    <main id="main-content" class="app-shell" tabindex="-1">
      <router-outlet />
    </main>

    <footer class="site-footer" aria-labelledby="footer-brand-title">
      <div class="site-footer__glow" aria-hidden="true"></div>
      <div class="site-footer__content">
        <section class="site-footer__brand-block">
          <a class="footer-brand" routerLink="/" aria-label="AccessiUX Market, inicio">
            <span class="footer-brand__mark" aria-hidden="true">
              <svg viewBox="0 0 48 48" focusable="false">
                <path d="M24 4 7 14v20l17 10 17-10V14L24 4Z" fill="none" stroke="currentColor" stroke-width="3"/>
                <path d="M16 31 24 15l8 16M18.5 26h11" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="24" cy="21" r="2.4" fill="currentColor"/>
              </svg>
            </span>
            <span>
              <strong id="footer-brand-title">Accessi<span>UX</span></strong>
              <small>Market</small>
            </span>
          </a>
          <p>
            Un marketplace pensado para comprar con claridad, confianza y menos barreras.
          </p>
          <ul class="footer-values" aria-label="Principios de AccessiUX Market">
            <li>Accesible</li>
            <li>Usable</li>
            <li>Confiable</li>
          </ul>
        </section>

        <nav class="site-footer__nav" aria-label="Navegación del pie de página">
          <section>
            <h2>Explorar</h2>
            <a routerLink="/catalog">Catálogo</a>
            @if (auth.isAuthenticated()) {
              <a routerLink="/account">Mi cuenta</a>
            } @else {
              <a routerLink="/register">Crear cuenta</a>
              <a routerLink="/login">Iniciar sesión</a>
            }
          </section>
          <section>
            <h2>Tu experiencia</h2>
            @if (auth.isAuthenticated()) {
              @if (auth.isCustomer()) {
                <a routerLink="/cart">Carrito</a>
                <a routerLink="/orders">Mis pedidos</a>
              }
              @if (auth.isSeller()) {
                <a routerLink="/seller">Panel de vendedor</a>
              } @else if (!auth.isAdministrator()) {
                <a routerLink="/seller">Vender</a>
              }
              @if (auth.isAdministrator()) {
                <a routerLink="/admin">Administración</a>
              }
            } @else {
              <span>Compra con navegación clara</span>
              <span>Controles compatibles con teclado</span>
              <span>Contenido fácil de comprender</span>
            }
          </section>
          <section>
            <h2>Accesibilidad</h2>
            <a routerLink="/accessibility">Preferencias y declaración</a>
            <span>Foco visible</span>
            <span>Alto contraste</span>
            <span>Lectores de pantalla</span>
          </section>
        </nav>
      </div>

      <div class="site-footer__bottom">
        <p>© 2026 AccessiUX Market. Comercio electrónico accesible y usable.</p>
        <p>Diseñado para incluir desde el primer clic.</p>
      </div>
    </footer>
  `,
  styles: [`
    .site-footer {
      position: relative;
      overflow: hidden;
      margin-top: 2rem;
      padding: 3.4rem 1rem 1.2rem;
      color: #f7fbff;
      background: linear-gradient(110deg,#06152f 0%,#081c3d 48%,#21145b 100%);
      border-top: 1px solid rgb(255 255 255 / 10%);
    }
    .site-footer__glow {
      position: absolute;
      inset: auto auto -10rem -7rem;
      width: 24rem;
      height: 24rem;
      border-radius: 50%;
      background: radial-gradient(circle,rgb(18 212 226 / 18%),transparent 68%);
      pointer-events: none;
    }
    .site-footer__content,
    .site-footer__bottom {
      position: relative;
      z-index: 1;
      width: min(86rem,calc(100% - 1rem));
      margin-inline: auto;
    }
    .site-footer__content {
      display: grid;
      grid-template-columns: minmax(18rem,1.15fr) minmax(0,1.85fr);
      gap: clamp(2rem,6vw,6rem);
      align-items: start;
    }
    .site-footer__brand-block p {
      max-width: 34rem;
      margin: 1rem 0 1.2rem;
      color: #c8d7eb;
      font-size: 1rem;
    }
    .footer-brand {
      display: inline-flex;
      align-items: center;
      gap: .8rem;
      color: #fff;
      text-decoration: none;
    }
    .footer-brand__mark {
      display: grid;
      width: 3.2rem;
      height: 3.2rem;
      place-items: center;
      border: 1px solid rgb(255 255 255 / 15%);
      border-radius: 1rem;
      color: #c7fbff;
      background: linear-gradient(145deg,rgb(18 212 226 / 22%),rgb(124 58 237 / 32%));
    }
    .footer-brand__mark svg { width: 2.25rem; height: 2.25rem; }
    .footer-brand > span:last-child { display: grid; line-height: 1; }
    .footer-brand strong { font-size: 1.3rem; }
    .footer-brand strong span {
      background: linear-gradient(90deg,#12d4e2,#60a5fa 45%,#b26cff);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .footer-brand small {
      margin-top: .32rem;
      color: #8cecf3;
      font-size: .68rem;
      font-weight: 850;
      letter-spacing: .28em;
      text-transform: uppercase;
    }
    .footer-values {
      margin: 0;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      gap: .5rem;
      list-style: none;
    }
    .footer-values li {
      padding: .35rem .65rem;
      border: 1px solid rgb(255 255 255 / 14%);
      border-radius: 999px;
      color: #d8f9ff;
      background: rgb(255 255 255 / 5%);
      font-size: .76rem;
      font-weight: 800;
      letter-spacing: .04em;
      text-transform: uppercase;
    }
    .site-footer__nav {
      display: grid;
      grid-template-columns: repeat(3,minmax(0,1fr));
      gap: 1.5rem;
    }
    .site-footer__nav section { display: grid; align-content: start; gap: .55rem; }
    .site-footer__nav h2 {
      margin: 0 0 .35rem;
      color: #fff;
      font-size: .92rem;
      text-transform: uppercase;
      letter-spacing: .08em;
    }
    .site-footer__nav a,
    .site-footer__nav span {
      color: #c8d7eb;
      font-size: .92rem;
    }
    .site-footer__nav a { text-decoration: none; }
    .site-footer__nav a:hover { color: #8cecf3; text-decoration: underline; }
    .site-footer__bottom {
      margin-top: 2.4rem;
      padding-top: 1.1rem;
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      border-top: 1px solid rgb(255 255 255 / 10%);
      color: #aebfd7;
      font-size: .82rem;
    }
    .site-footer__bottom p { margin: 0; }
    .site-footer a:focus-visible { outline: 3px solid #ffb703; outline-offset: 3px; }
    @media (max-width: 58rem) {
      .site-footer__content { grid-template-columns: 1fr; }
      .site-footer__nav { grid-template-columns: repeat(2,minmax(0,1fr)); }
    }
    @media (max-width: 38rem) {
      .site-footer__nav { grid-template-columns: 1fr; }
      .site-footer__bottom { flex-direction: column; }
    }
    @media (forced-colors: active) {
      .site-footer,
      .footer-brand__mark,
      .footer-values li { border: 2px solid CanvasText; }
    }
  `]
})
export class AppComponent {
  readonly auth = inject(AuthService);
  readonly accessibilityPreferences = inject(AccessibilityPreferencesService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private hasCompletedInitialNavigation = false;

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        if (!this.hasCompletedInitialNavigation) {
          this.hasCompletedInitialNavigation = true;
          return;
        }

        this.focusMainContent();
      });
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => void this.router.navigate(['/']),
      error: () => void this.router.navigate(['/']),
    });
  }

  private focusMainContent(): void {
    const focus = () => this.document.getElementById('main-content')?.focus({ preventScroll: true });
    const view = this.document.defaultView;

    if (view) {
      view.requestAnimationFrame(focus);
      return;
    }

    focus();
  }
}
