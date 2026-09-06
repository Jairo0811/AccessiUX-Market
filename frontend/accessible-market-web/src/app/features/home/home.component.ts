import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

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
  `,
})
export class HomeComponent {}
