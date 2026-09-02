import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <section class="hero" aria-labelledby="hero-title">
      <p class="eyebrow">Comprar sin barreras</p>
      <h1 id="hero-title">Una experiencia de compra clara, rápida y accesible.</h1>
      <p class="hero__copy">
        AccessiUX Market está diseñado para que todas las personas puedan encontrar,
        comprender y comprar productos con confianza.
      </p>
      <div class="button-row">
        <a class="button" routerLink="/register">Crear una cuenta</a>
        <a class="button button--secondary" routerLink="/login">Iniciar sesión</a>
      </div>
    </section>
    <section class="benefits" aria-labelledby="benefits-title">
      <h2 id="benefits-title">Accesibilidad desde el diseño</h2>
      <div class="card-grid">
        <article class="card">
          <h3>Navegación predecible</h3>
          <p>Jerarquías claras, foco visible y compatibilidad completa con teclado.</p>
        </article>
        <article class="card">
          <h3>Información comprensible</h3>
          <p>Lenguaje directo y mensajes de estado que explican qué ocurrió.</p>
        </article>
        <article class="card">
          <h3>Privacidad por defecto</h3>
          <p>Sesiones seguras y datos personales tratados con responsabilidad.</p>
        </article>
      </div>
    </section>
  `,
})
export class HomeComponent {}
