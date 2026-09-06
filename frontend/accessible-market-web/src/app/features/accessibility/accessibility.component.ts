import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-accessibility',
  imports: [RouterLink],
  template: `
    <article class="accessibility-page" aria-labelledby="accessibility-title">
      <header class="accessibility-page__header">
        <p class="eyebrow">Accesibilidad por diseño</p>
        <h1 id="accessibility-title">Declaración de accesibilidad</h1>
        <p class="accessibility-page__lead">
          AccessiUX Market adopta voluntariamente NORTIC B2:2017 como referencia dominicana de
          accesibilidad web y mantiene WCAG como base técnica de sus criterios verificables.
        </p>
        <p class="accessibility-page__status" role="status">
          Objetivo de conformidad: nivel AA. Esta declaración describe un objetivo técnico del
          producto y no constituye una certificación oficial NORTIC.
        </p>
      </header>

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
          <li>Comprobaciones de navegación por teclado y foco visible.</li>
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
    .principle-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
    .principle-grid article { padding: 1rem; border: 1px solid var(--border); border-radius: .8rem; }
    .principle-grid h3 { margin-top: 0; }
    li + li { margin-top: .55rem; }
    .accessibility-page a:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
    @media (max-width: 42rem) { .principle-grid { grid-template-columns: 1fr; } }
    @media (forced-colors: active) {
      .accessibility-page__header,
      .accessibility-page section,
      .accessibility-page__note,
      .principle-grid article { border: 2px solid CanvasText; }
    }
  `]
})
export class AccessibilityComponent {}
