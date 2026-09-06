import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccessibilityPreferencesService } from '../../core/accessibility/accessibility-preferences.service';

@Component({
  selector: 'app-accessibility',
  imports: [RouterLink],
  template: `
    <article class="accessibility-page" aria-labelledby="accessibility-title">
      <header class="accessibility-page__header">
        <p class="eyebrow">Accesibilidad por diseño</p>
        <h1 id="accessibility-title">Accesibilidad y preferencias</h1>
        <p class="accessibility-page__lead">
          Personaliza la presentación sin perder funciones esenciales de compra. Tus preferencias se
          conservan en este navegador y pueden restablecerse cuando quieras.
        </p>
        <p class="accessibility-page__status">
          Objetivo de conformidad: nivel AA. AccessiUX Market adopta WCAG como base técnica y utiliza
          NORTIC B2:2017 como referencia dominicana voluntaria; esto no constituye una certificación oficial.
        </p>
      </header>

      <section class="preferences-panel" aria-labelledby="preferences-title">
        <div class="section-heading">
          <div>
            <p class="section-kicker">AM-UX-003</p>
            <h2 id="preferences-title">Preferencias de accesibilidad</h2>
          </div>
          <button class="button button--secondary" type="button" (click)="resetPreferences()">
            Restablecer preferencias
          </button>
        </div>

        <p id="preferences-help">
          Estas opciones complementan las preferencias del sistema operativo. No sustituyen el zoom del navegador,
          lectores de pantalla ni otras tecnologías asistivas.
        </p>

        <fieldset aria-describedby="preferences-help">
          <legend>Elige cómo quieres ver y recorrer la interfaz</legend>

          <label class="preference-option" for="simple-reading-mode">
            <input
              id="simple-reading-mode"
              type="checkbox"
              [checked]="preferences.simpleReadingMode()"
              (change)="setSimpleReadingMode($event)"
            />
            <span>
              <strong>Modo de Lectura Simple</strong>
              <small>Reduce elementos decorativos, densidad promocional y efectos visuales sin ocultar acciones esenciales.</small>
            </span>
          </label>

          <label class="preference-option" for="reduced-motion">
            <input
              id="reduced-motion"
              type="checkbox"
              [checked]="preferences.reducedMotion()"
              (change)="setReducedMotion($event)"
            />
            <span>
              <strong>Reducir movimiento</strong>
              <small>Desactiva transiciones y desplazamiento suave aunque el sistema operativo no lo solicite.</small>
            </span>
          </label>

          <label class="preference-option" for="high-contrast">
            <input
              id="high-contrast"
              type="checkbox"
              [checked]="preferences.highContrast()"
              (change)="setHighContrast($event)"
            />
            <span>
              <strong>Aumentar contraste</strong>
              <small>Refuerza bordes, texto y superficies para distinguir mejor controles y contenido.</small>
            </span>
          </label>

          <label class="preference-option" for="large-text">
            <input
              id="large-text"
              type="checkbox"
              [checked]="preferences.largeText()"
              (change)="setLargeText($event)"
            />
            <span>
              <strong>Texto más grande</strong>
              <small>Aumenta la escala tipográfica de la aplicación sin desactivar el zoom del navegador.</small>
            </span>
          </label>
        </fieldset>

        <p class="preferences-announcement" role="status" aria-live="polite">{{ announcement() }}</p>
      </section>

      <section aria-labelledby="principles-title">
        <h2 id="principles-title">Principios que aplicamos</h2>
        <div class="principle-grid">
          <article>
            <h3>Perceptible</h3>
            <p>Alternativas textuales, contraste suficiente y contenido que puede ampliarse sin perder funcionalidad.</p>
          </article>
          <article>
            <h3>Operable</h3>
            <p>Navegación por teclado, foco visible, enlace para saltar al contenido y ausencia de trampas de foco.</p>
          </article>
          <article>
            <h3>Comprensible</h3>
            <p>Etiquetas claras, navegación coherente, mensajes de error textuales y prevención de errores antes de confirmar compras.</p>
          </article>
          <article>
            <h3>Robusto</h3>
            <p>HTML semántico, nombres accesibles y estados que pueden ser interpretados por tecnologías asistivas.</p>
          </article>
        </div>
      </section>

      <section aria-labelledby="keyboard-title">
        <h2 id="keyboard-title">Navegación por teclado y gestión de foco</h2>
        <p>
          El enlace “Saltar al contenido principal” permite evitar la navegación repetitiva. Después de una
          navegación interna, el foco se traslada al contenido principal para que el cambio de vista sea predecible
          para usuarios de teclado y tecnologías asistivas.
        </p>
      </section>

      <section aria-labelledby="checkout-title">
        <h2 id="checkout-title">Compras con prevención de errores</h2>
        <p>
          Antes de crear un pedido, el checkout ofrece una etapa de revisión para comprobar dirección,
          método de pago, productos y total. La confirmación final requiere una acción explícita del usuario.
        </p>
      </section>

      <section aria-labelledby="verification-title">
        <h2 id="verification-title">Cómo verificamos la accesibilidad</h2>
        <ul>
          <li>Pruebas automatizadas con Playwright y axe-core.</li>
          <li>Comprobaciones de navegación por teclado, skip link y foco después de cambios de ruta.</li>
          <li>Persistencia y aplicación de preferencias de accesibilidad.</li>
          <li>Controles de formularios con etiquetas o nombres accesibles.</li>
          <li>Revisión del flujo completo, no únicamente de páginas aisladas.</li>
          <li>Pruebas de regresión dentro de integración continua.</li>
        </ul>
      </section>

      <aside class="accessibility-page__note" aria-labelledby="scope-title">
        <h2 id="scope-title">Alcance</h2>
        <p>
          NORTIC B2:2017 fue creada para los medios web del Estado dominicano. AccessiUX Market no se
          presenta como portal gubernamental ni como producto certificado; utiliza la norma como referencia
          de buenas prácticas dominicanas de accesibilidad.
        </p>
      </aside>

      <p><a routerLink="/catalog">Volver al catálogo</a></p>
    </article>
  `,
  styles: [`
    .accessibility-page {
      width: min(64rem, 100%);
      margin-inline: auto;
      display: grid;
      gap: 2rem;
    }
    .accessibility-page__header,
    .accessibility-page section,
    .accessibility-page__note {
      padding: clamp(1.25rem, 3vw, 2rem);
      border: 1px solid var(--border);
      border-radius: 1rem;
      background: var(--surface);
      box-shadow: var(--shadow-sm);
    }
    .accessibility-page__header {
      background: linear-gradient(135deg, #fff, #eef7ff);
    }
    h1, h2, h3 { color: var(--navy-900); }
    h1 { margin: .45rem 0 1rem; font-size: clamp(2.2rem, 5vw, 4rem); line-height: 1; }
    h2 { margin-top: 0; }
    .accessibility-page__lead { max-width: 52rem; font-size: 1.12rem; color: var(--ink-700); }
    .accessibility-page__status {
      margin-top: 1.25rem;
      padding: .9rem 1rem;
      border-left: .3rem solid var(--blue);
      background: var(--surface-tint);
      font-weight: 700;
    }
    .section-heading {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 1rem;
    }
    .section-heading h2 { margin-bottom: .35rem; }
    .preferences-panel fieldset {
      margin: 1.25rem 0 0;
      padding: 0;
      display: grid;
      gap: .8rem;
      border: 0;
    }
    .preferences-panel legend {
      margin-bottom: .75rem;
      font-weight: 800;
      color: var(--navy-900);
    }
    .preference-option {
      min-height: 4.5rem;
      padding: 1rem;
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: start;
      gap: .9rem;
      border: 2px solid var(--border-strong);
      border-radius: .85rem;
      background: var(--surface);
      cursor: pointer;
    }
    .preference-option:has(input:checked) {
      border-color: var(--blue);
      background: var(--surface-tint);
    }
    .preference-option input {
      width: 1.25rem;
      height: 1.25rem;
      margin-top: .15rem;
    }
    .preference-option span { display: grid; gap: .25rem; }
    .preference-option strong { color: var(--navy-900); }
    .preference-option small { color: var(--ink-700); font-size: .92rem; }
    .preferences-announcement {
      min-height: 1.5rem;
      margin: 1rem 0 0;
      font-weight: 700;
    }
    .principle-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
    .principle-grid article { padding: 1rem; border: 1px solid var(--border); border-radius: .8rem; }
    .principle-grid h3 { margin-top: 0; }
    li + li { margin-top: .55rem; }
    .accessibility-page a:focus-visible,
    .accessibility-page button:focus-visible,
    .accessibility-page input:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
    @media (max-width: 42rem) {
      .principle-grid { grid-template-columns: 1fr; }
      .section-heading { flex-direction: column; }
    }
    @media (forced-colors: active) {
      .accessibility-page__header,
      .accessibility-page section,
      .accessibility-page__note,
      .principle-grid article,
      .preference-option { border: 2px solid CanvasText; }
    }
  `]
})
export class AccessibilityComponent {
  readonly preferences = inject(AccessibilityPreferencesService);
  readonly announcement = signal('');

  setSimpleReadingMode(event: Event): void {
    const enabled = this.checked(event);
    this.preferences.setSimpleReadingMode(enabled);
    this.announcement.set(`Modo de Lectura Simple ${enabled ? 'activado' : 'desactivado'}.`);
  }

  setReducedMotion(event: Event): void {
    const enabled = this.checked(event);
    this.preferences.setReducedMotion(enabled);
    this.announcement.set(`Reducción de movimiento ${enabled ? 'activada' : 'desactivada'}.`);
  }

  setHighContrast(event: Event): void {
    const enabled = this.checked(event);
    this.preferences.setHighContrast(enabled);
    this.announcement.set(`Contraste aumentado ${enabled ? 'activado' : 'desactivado'}.`);
  }

  setLargeText(event: Event): void {
    const enabled = this.checked(event);
    this.preferences.setLargeText(enabled);
    this.announcement.set(`Texto más grande ${enabled ? 'activado' : 'desactivado'}.`);
  }

  resetPreferences(): void {
    this.preferences.reset();
    this.announcement.set('Preferencias de accesibilidad restablecidas.');
  }

  private checked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }
}
