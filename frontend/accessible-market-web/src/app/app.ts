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
      <nav class="nav" aria-label="Navegación principal" (keydown.escape)="closeNavigation()">
        <a class="brand brand--official" routerLink="/" aria-label="AccessiUX Market, inicio">
          <img
            class="brand__mark"
            src="/branding/accessiux-market-logo.png"
            alt=""
            aria-hidden="true"
          />
          <span class="brand__wordmark" aria-hidden="true">
            <span class="brand__wordmark-accent">AccessiUX</span>
            <span class="brand__wordmark-market">Market</span>
          </span>
        </a>

        <button
          class="nav__toggle"
          type="button"
          aria-controls="primary-nav-actions"
          [attr.aria-expanded]="navigationOpen"
          [attr.aria-label]="navigationOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'"
          (click)="toggleNavigation()"
        >
          <span class="nav__toggle-icon" aria-hidden="true">{{ navigationOpen ? '×' : '☰' }}</span>
          <span>Menú</span>
        </button>

        <div
          id="primary-nav-actions"
          class="nav__actions"
          [class.nav__actions--open]="navigationOpen"
        >
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
          <a class="footer-brand footer-brand--official" routerLink="/" aria-label="AccessiUX Market, inicio">
            <img
              class="footer-brand__mark"
              src="/branding/accessiux-market-logo.png"
              alt=""
              aria-hidden="true"
            />
            <span id="footer-brand-title" class="footer-brand__wordmark" aria-hidden="true">
              <span class="footer-brand__wordmark-accent">AccessiUX</span>
              <span class="footer-brand__wordmark-market">Market</span>
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
        <p>© {{ currentYear }} AccessiUX Market. Comercio electrónico accesible y usable.</p>
        <p>Diseñado para incluir desde el primer clic.</p>
      </div>
    </footer>
  `,
  styles: [`
    .brand--official,
    .footer-brand--official {
      display: inline-flex;
      align-items: center;
      position: relative;
      text-decoration: none;
    }
    .brand__mark {
      display: block;
      width: auto;
      height: 2.75rem;
      max-width: min(19rem, 38vw);
      flex: 0 1 auto;
      object-fit: contain;
    }
    .brand__wordmark,
    .footer-brand__wordmark {
      display: none;
      align-items: baseline;
      gap: .3rem;
      white-space: nowrap;
      font-weight: 900;
      letter-spacing: -.025em;
    }
    .brand__wordmark {
      font-size: clamp(1.05rem, 1.5vw, 1.35rem);
    }
    .brand__wordmark-accent,
    .footer-brand__wordmark-accent {
      color: #fff;
    }
    .brand__wordmark-market,
    .footer-brand__wordmark-market {
      color: #8cecf3;
    }
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
      color: #fff;
    }
    .footer-brand__mark {
      display: block;
      width: auto;
      height: 3.2rem;
      max-width: min(22rem, 48vw);
      flex: 0 1 auto;
      object-fit: contain;
    }
    .footer-brand__wordmark {
      font-size: clamp(1.2rem, 1.8vw, 1.55rem);
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
      .brand__mark { height: 2.35rem; max-width: 14rem; }
      .footer-brand__mark { height: 2.8rem; max-width: 17rem; }
      .site-footer__nav { grid-template-columns: 1fr; }
      .site-footer__bottom { flex-direction: column; }
    }
    @media (forced-colors: active) {
      .brand__mark,
      .footer-brand__mark {
        display: none;
      }
      .brand__wordmark,
      .footer-brand__wordmark {
        display: inline-flex;
      }
      .brand__wordmark-accent,
      .brand__wordmark-market,
      .footer-brand__wordmark-accent,
      .footer-brand__wordmark-market {
        color: LinkText;
      }
      .site-footer,
      .footer-values li { border: 2px solid CanvasText; }
    }
  `]
})
export class AppComponent {
  readonly auth = inject(AuthService);
  readonly accessibilityPreferences = inject(AccessibilityPreferencesService);
  readonly currentYear = new Date().getFullYear();

  navigationOpen = false;

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
        this.closeNavigation();

        if (!this.hasCompletedInitialNavigation) {
          this.hasCompletedInitialNavigation = true;
          return;
        }

        this.focusMainContent();
      });
  }

  toggleNavigation(): void {
    this.navigationOpen = !this.navigationOpen;
  }

  closeNavigation(): void {
    this.navigationOpen = false;
  }

  logout(): void {
    this.closeNavigation();
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
