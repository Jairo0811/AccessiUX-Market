import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccessibilityPreferencesService } from '../../core/accessibility/accessibility-preferences.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <section class="hero hero--market" aria-labelledby="hero-title">
      <div class="hero__content">
        <p class="eyebrow">Comprar sin barreras</p>
        <h1 id="hero-title">
          Una experiencia de compra <span class="hero__accent">clara, rápida y accesible.</span>
        </h1>
        <p class="hero__copy">
          AccessiUX Market está diseñado para que todas las personas puedan encontrar,
          comprender y comprar productos con confianza.
        </p>

        <div class="button-row hero__actions">
          <a class="button button--gradient" routerLink="/register">
            Crear una cuenta <span aria-hidden="true">→</span>
          </a>
          <a class="button button--secondary" routerLink="/login">Iniciar sesión</a>
        </div>

        <ul class="trust-list" aria-label="Beneficios principales">
          <li>
            <span class="trust-list__icon" aria-hidden="true">✓</span>
            Compra clara y segura
          </li>
          <li>
            <span class="trust-list__icon" aria-hidden="true">⌨</span>
            Navegación por teclado
          </li>
          <li>
            <span class="trust-list__icon" aria-hidden="true">♡</span>
            Mercado más inclusivo
          </li>
        </ul>
      </div>

      <div class="hero-visual" aria-hidden="true">
        <div class="hero-visual__glow"></div>
        <div class="hero-visual__orbit hero-visual__orbit--one"></div>
        <div class="hero-visual__orbit hero-visual__orbit--two"></div>

        <div class="hero-visual__core">
          <svg viewBox="0 0 220 220" focusable="false">
            <defs>
              <linearGradient id="bagGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#11d8e7" />
                <stop offset="0.5" stop-color="#1684ff" />
                <stop offset="1" stop-color="#8b3dff" />
              </linearGradient>
              <linearGradient id="bagGlow" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" stop-color="#0dd3c5" />
                <stop offset="1" stop-color="#c36cff" />
              </linearGradient>
            </defs>
            <path d="M68 77V61c0-25 18-43 42-43s42 18 42 43v16" fill="none" stroke="url(#bagGlow)" stroke-width="18" stroke-linecap="round" />
            <path d="M51 72h118l17 118H34L51 72Z" fill="#081a40" stroke="url(#bagGradient)" stroke-width="10" stroke-linejoin="round" />
            <path d="m110 84-39 70h78l-39-70Z" fill="none" stroke="url(#bagGradient)" stroke-width="12" stroke-linejoin="round" />
            <circle cx="110" cy="116" r="9" fill="#dffcff" />
            <path d="M84 151c11-13 19-19 26-19s15 6 26 19" fill="none" stroke="#dffcff" stroke-width="9" stroke-linecap="round" />
          </svg>
        </div>

        <div class="floating-chip floating-chip--accessibility">
          <span class="floating-chip__symbol">♿</span>
          <span>Accesible</span>
        </div>
        <div class="floating-chip floating-chip--keyboard">
          <span class="floating-chip__symbol">⌨</span>
          <span>Teclado</span>
        </div>
        <div class="floating-chip floating-chip--screenreader">
          <span class="floating-chip__symbol">◉</span>
          <span>Lectores</span>
        </div>
        <div class="floating-chip floating-chip--contrast">
          <span class="floating-chip__symbol">Aa</span>
          <span>Contraste</span>
        </div>

        <div class="hero-visual__platform">
          <span>Accesible</span><span>Usable</span><span>Confiable</span>
        </div>
      </div>
    </section>

    <section class="benefits benefits--showcase" aria-labelledby="benefits-title">
      <div class="section-heading">
        <div>
          <p class="section-kicker">Diseñado para incluir</p>
          <h2 id="benefits-title">Accesibilidad desde el diseño</h2>
        </div>
        <p class="section-heading__copy">Más que un mercado: una experiencia pensada para todas las personas.</p>
      </div>

      <div class="feature-grid">
        <article class="feature-card">
          <div class="feature-card__icon feature-card__icon--cyan" aria-hidden="true">◐</div>
          <div>
            <h3>Contraste legible</h3>
            <p>Jerarquías claras y combinaciones de color pensadas para una mejor lectura.</p>
          </div>
        </article>

        <article class="feature-card">
          <div class="feature-card__icon feature-card__icon--blue" aria-hidden="true">⌨</div>
          <div>
            <h3>Navegación por teclado</h3>
            <p>Recorre acciones esenciales sin depender de un mouse y con foco siempre visible.</p>
          </div>
        </article>

        <article class="feature-card">
          <div class="feature-card__icon feature-card__icon--violet" aria-hidden="true">◉</div>
          <div>
            <h3>Lectores de pantalla</h3>
            <p>Estructura semántica y mensajes de estado compatibles con tecnologías de asistencia.</p>
          </div>
        </article>

        <article class="feature-card">
          <div class="feature-card__icon feature-card__icon--teal" aria-hidden="true">Aa</div>
          <div>
            <h3>Tipografía comprensible</h3>
            <p>Textos directos, tamaños cómodos y una interfaz que prioriza comprensión.</p>
          </div>
        </article>
      </div>
    </section>

    <section class="market-preview" aria-labelledby="market-preview-title">
      <div class="section-heading section-heading--compact">
        <div>
          <p class="section-kicker">Explora sin complicaciones</p>
          <h2 id="market-preview-title">Un marketplace preparado para crecer</h2>
        </div>
        <a class="text-link text-link--arrow" routerLink="/catalog">Ver todo el catálogo <span aria-hidden="true">→</span></a>
      </div>

      <div class="preview-grid">
        <a class="preview-card preview-card--cyan" routerLink="/catalog">
          <span class="preview-card__eyebrow">Tecnología</span>
          <strong>Productos que facilitan el día a día</strong>
          <span class="preview-card__cta">Explorar categoría →</span>
        </a>
        <a class="preview-card preview-card--blue" routerLink="/catalog">
          <span class="preview-card__eyebrow">Ergonomía</span>
          <strong>Opciones pensadas para comodidad y control</strong>
          <span class="preview-card__cta">Explorar categoría →</span>
        </a>
        <a class="preview-card preview-card--violet" routerLink="/catalog">
          <span class="preview-card__eyebrow">Accesibilidad</span>
          <strong>Herramientas para experiencias más inclusivas</strong>
          <span class="preview-card__cta">Explorar categoría →</span>
        </a>
      </div>
    </section>

    <div class="home-a11y">
      @if (accessibilityPanelOpen) {
        <aside
          id="home-accessibility-panel"
          class="home-a11y__panel"
          role="region"
          aria-labelledby="home-accessibility-title"
          (keydown.escape)="closeAccessibilityPanel()"
        >
          <div class="home-a11y__header">
            <div>
              <p class="home-a11y__eyebrow">Ajustes rápidos</p>
              <h2 id="home-accessibility-title">Accesibilidad</h2>
            </div>
            <button
              class="home-a11y__close"
              type="button"
              aria-label="Cerrar opciones de accesibilidad"
              (click)="closeAccessibilityPanel()"
            >
              ×
            </button>
          </div>

          <p class="home-a11y__intro">
            Personaliza la lectura sin salir de esta página. Los cambios se guardan para tu próxima visita.
          </p>

          <div class="home-a11y__options" aria-label="Preferencias rápidas de accesibilidad">
            <button
              class="home-a11y__option"
              type="button"
              [attr.aria-pressed]="accessibility.largeText()"
              (click)="accessibility.setLargeText(!accessibility.largeText())"
            >
              <span>
                <strong>Texto grande</strong>
                <small>Aumenta el tamaño de lectura.</small>
              </span>
              <b>{{ accessibility.largeText() ? 'Activado' : 'Desactivado' }}</b>
            </button>

            <button
              class="home-a11y__option"
              type="button"
              [attr.aria-pressed]="accessibility.highContrast()"
              (click)="accessibility.setHighContrast(!accessibility.highContrast())"
            >
              <span>
                <strong>Alto contraste</strong>
                <small>Refuerza texto, bordes y controles.</small>
              </span>
              <b>{{ accessibility.highContrast() ? 'Activado' : 'Desactivado' }}</b>
            </button>

            <button
              class="home-a11y__option"
              type="button"
              [attr.aria-pressed]="accessibility.simpleReadingMode()"
              (click)="accessibility.setSimpleReadingMode(!accessibility.simpleReadingMode())"
            >
              <span>
                <strong>Lectura simple</strong>
                <small>Reduce elementos visuales no esenciales.</small>
              </span>
              <b>{{ accessibility.simpleReadingMode() ? 'Activado' : 'Desactivado' }}</b>
            </button>

            <button
              class="home-a11y__option"
              type="button"
              [attr.aria-pressed]="accessibility.reducedMotion()"
              (click)="accessibility.setReducedMotion(!accessibility.reducedMotion())"
            >
              <span>
                <strong>Reducir movimiento</strong>
                <small>Minimiza animaciones y transiciones.</small>
              </span>
              <b>{{ accessibility.reducedMotion() ? 'Activado' : 'Desactivado' }}</b>
            </button>
          </div>

          <div class="home-a11y__footer">
            <button class="home-a11y__reset" type="button" (click)="accessibility.reset()">
              Restablecer
            </button>
            <a routerLink="/accessibility">Ver todas las opciones</a>
          </div>
        </aside>
      }

      <button
        class="home-a11y__trigger"
        type="button"
        aria-controls="home-accessibility-panel"
        [attr.aria-expanded]="accessibilityPanelOpen"
        (click)="toggleAccessibilityPanel()"
      >
        <span class="home-a11y__trigger-icon" aria-hidden="true">♿</span>
        <span>Accesibilidad</span>
      </button>
    </div>
  `,
  styles: [`
    .home-a11y {
      position: fixed;
      right: clamp(1rem, 2.5vw, 2rem);
      bottom: clamp(1rem, 2.5vw, 2rem);
      z-index: 45;
      display: grid;
      justify-items: end;
      gap: .75rem;
    }

    .home-a11y__trigger {
      min-height: 3.35rem;
      padding: .72rem 1rem;
      display: inline-flex;
      align-items: center;
      gap: .65rem;
      border: 2px solid #ffffff;
      border-radius: 999px;
      color: #ffffff;
      background: #081c3d;
      box-shadow: 0 1rem 2.6rem rgb(2 12 31 / 25%);
      font-weight: 850;
      cursor: pointer;
    }

    .home-a11y__trigger:hover {
      background: #123d73;
    }

    .home-a11y__trigger-icon {
      display: grid;
      width: 1.85rem;
      height: 1.85rem;
      place-items: center;
      border-radius: 50%;
      color: #06152f;
      background: #8cecf3;
      font-size: 1.05rem;
    }

    .home-a11y__panel {
      width: min(25rem, calc(100vw - 2rem));
      max-height: min(38rem, calc(100vh - 6rem));
      overflow: auto;
      padding: 1.15rem;
      border: 2px solid #b9c9da;
      border-radius: 1.15rem;
      color: #10233f;
      background: #ffffff;
      box-shadow: 0 1.6rem 4rem rgb(2 12 31 / 24%);
    }

    .home-a11y__header,
    .home-a11y__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .home-a11y__header h2 {
      margin: .1rem 0 0;
      color: #081c3d;
      font-size: 1.45rem;
    }

    .home-a11y__eyebrow {
      margin: 0;
      color: #244ec5;
      font-size: .72rem;
      font-weight: 900;
      letter-spacing: .12em;
      text-transform: uppercase;
    }

    .home-a11y__close {
      width: 2.6rem;
      height: 2.6rem;
      border: 2px solid #70839a;
      border-radius: .75rem;
      color: #081c3d;
      background: #ffffff;
      font-size: 1.55rem;
      line-height: 1;
      cursor: pointer;
    }

    .home-a11y__intro {
      margin: .9rem 0 1rem;
      color: #324761;
      font-size: .92rem;
    }

    .home-a11y__options {
      display: grid;
      gap: .55rem;
    }

    .home-a11y__option {
      width: 100%;
      min-height: 4.35rem;
      padding: .78rem .82rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: .9rem;
      border: 2px solid #d8e3f0;
      border-radius: .8rem;
      color: #10233f;
      background: #f6f9ff;
      text-align: left;
      cursor: pointer;
    }

    .home-a11y__option:hover {
      border-color: #70839a;
    }

    .home-a11y__option[aria-pressed='true'] {
      border-color: #117a55;
      background: #eef9f3;
    }

    .home-a11y__option span {
      display: grid;
      gap: .12rem;
    }

    .home-a11y__option strong {
      color: #081c3d;
      font-size: .94rem;
    }

    .home-a11y__option small {
      color: #52657b;
      font-size: .78rem;
      font-weight: 500;
    }

    .home-a11y__option b {
      flex: 0 0 auto;
      color: #244ec5;
      font-size: .72rem;
      text-transform: uppercase;
    }

    .home-a11y__option[aria-pressed='true'] b {
      color: #117a55;
    }

    .home-a11y__footer {
      margin-top: 1rem;
      padding-top: .9rem;
      border-top: 1px solid #d8e3f0;
    }

    .home-a11y__footer a {
      color: #0b5fad;
      font-weight: 800;
    }

    .home-a11y__reset {
      min-height: 2.7rem;
      padding: .55rem .8rem;
      border: 2px solid #70839a;
      border-radius: .7rem;
      color: #081c3d;
      background: #ffffff;
      font-weight: 800;
      cursor: pointer;
    }

    .home-a11y button:focus-visible,
    .home-a11y a:focus-visible {
      outline: 4px solid #ffb703;
      outline-offset: 3px;
    }

    @media (max-width: 36rem) {
      .home-a11y {
        right: .7rem;
        bottom: .7rem;
      }

      .home-a11y__trigger {
        min-height: 3rem;
        padding: .62rem .8rem;
      }

      .home-a11y__panel {
        width: calc(100vw - 1.4rem);
      }

      .home-a11y__option {
        align-items: flex-start;
        flex-direction: column;
        gap: .35rem;
      }

      .home-a11y__footer {
        align-items: flex-start;
        flex-direction: column;
      }
    }

    @media (forced-colors: active) {
      .home-a11y__trigger,
      .home-a11y__panel,
      .home-a11y__option,
      .home-a11y__close,
      .home-a11y__reset {
        border: 2px solid ButtonText;
        color: ButtonText;
        background: Canvas;
        forced-color-adjust: auto;
      }

      .home-a11y__trigger-icon,
      .home-a11y__option b,
      .home-a11y__option strong,
      .home-a11y__option small,
      .home-a11y__header h2,
      .home-a11y__eyebrow,
      .home-a11y__intro {
        color: CanvasText;
        background: Canvas;
      }
    }
  `],
})
export class HomeComponent {
  readonly accessibility = inject(AccessibilityPreferencesService);
  accessibilityPanelOpen = false;

  toggleAccessibilityPanel(): void {
    this.accessibilityPanelOpen = !this.accessibilityPanelOpen;
  }

  closeAccessibilityPanel(): void {
    this.accessibilityPanelOpen = false;
  }
}
