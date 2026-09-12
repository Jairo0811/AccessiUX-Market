import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { AdminService } from '../../core/admin/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [AsyncPipe],
  template: `
    <section class="admin-dashboard" aria-labelledby="admin-title">
      <header class="admin-hero">
        <div>
          <p class="eyebrow">Administración</p>
          <h1 id="admin-title">Panel de administración</h1>
          <p>
            Vista protegida para supervisar el estado general de AccessiUX Market sin exponer datos sensibles.
          </p>
        </div>
        <span class="admin-badge" aria-label="Acceso exclusivo para administradores">Administrador</span>
      </header>

      @if (errorMessage()) {
        <div class="alert alert--error" role="alert">{{ errorMessage() }}</div>
      }

      @if (overview$ | async; as overview) {
        <section aria-labelledby="admin-overview-title">
          <div class="section-heading section-heading--compact">
            <div>
              <p class="section-kicker">Resumen operativo</p>
              <h2 id="admin-overview-title">Estado de la plataforma</h2>
            </div>
            <p class="section-heading__copy">Indicadores calculados directamente desde la base de datos.</p>
          </div>

          <div class="admin-stats">
            <article class="admin-stat">
              <span>Usuarios</span>
              <strong>{{ overview.totalUsers }}</strong>
              <small>{{ overview.activeUsers }} activos</small>
            </article>
            <article class="admin-stat">
              <span>Vendedores</span>
              <strong>{{ overview.sellers }}</strong>
              <small>perfiles activos</small>
            </article>
            <article class="admin-stat">
              <span>Productos</span>
              <strong>{{ overview.products }}</strong>
              <small>{{ overview.publishedProducts }} publicados</small>
            </article>
            <article class="admin-stat">
              <span>Pedidos</span>
              <strong>{{ overview.orders }}</strong>
              <small>registrados</small>
            </article>
          </div>
        </section>

        <section class="admin-note" aria-labelledby="admin-scope-title">
          <div class="admin-note__icon" aria-hidden="true">✓</div>
          <div>
            <h2 id="admin-scope-title">Privilegios administrativos activos</h2>
            <p>
              Esta ruta y su API requieren el rol <strong>Administrator</strong>. El panel es deliberadamente
              de solo lectura por ahora: no permite modificar usuarios, pedidos ni inventario sin un caso de uso
              administrativo explícito y auditado.
            </p>
          </div>
        </section>
      }
    </section>
  `,
  styles: [`
    .admin-dashboard { display: grid; gap: 2rem; }
    .admin-hero {
      padding: clamp(1.5rem,4vw,2.5rem);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 2rem;
      border: 1px solid var(--border);
      border-radius: 1.5rem;
      background: linear-gradient(135deg,#fff 0%,#eef7ff 56%,#f1ebff 100%);
      box-shadow: var(--shadow-sm);
    }
    .admin-hero h1 {
      margin: .35rem 0 .7rem;
      color: var(--navy-900);
      font-size: clamp(2rem,5vw,3.2rem);
      line-height: 1.05;
      letter-spacing: -.045em;
    }
    .admin-hero p:last-child { max-width: 48rem; margin: 0; color: var(--ink-600); }
    .admin-badge {
      flex: 0 0 auto;
      padding: .55rem .8rem;
      border: 1px solid #c7b8f5;
      border-radius: 999px;
      color: #4d238d;
      background: #f2ebff;
      font-size: .78rem;
      font-weight: 900;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    .admin-stats {
      display: grid;
      grid-template-columns: repeat(4,minmax(0,1fr));
      gap: 1rem;
    }
    .admin-stat {
      min-height: 10rem;
      padding: 1.3rem;
      display: grid;
      align-content: center;
      gap: .25rem;
      border: 1px solid var(--border);
      border-radius: 1.15rem;
      background: #fff;
      box-shadow: var(--shadow-sm);
    }
    .admin-stat span { color: var(--ink-600); font-weight: 800; }
    .admin-stat strong { color: var(--navy-900); font-size: 2.4rem; line-height: 1; }
    .admin-stat small { color: var(--ink-600); }
    .admin-note {
      padding: 1.35rem;
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      border: 1px solid #b7e8dc;
      border-radius: 1rem;
      background: #f1fbf7;
    }
    .admin-note__icon {
      flex: 0 0 auto;
      width: 2.4rem;
      height: 2.4rem;
      display: grid;
      place-items: center;
      border-radius: 50%;
      color: #fff;
      background: var(--success);
      font-weight: 900;
    }
    .admin-note h2 { margin: 0 0 .35rem; color: var(--navy-900); font-size: 1.15rem; }
    .admin-note p { margin: 0; color: var(--ink-700); }
    @media (max-width: 62rem) { .admin-stats { grid-template-columns: repeat(2,minmax(0,1fr)); } }
    @media (max-width: 40rem) {
      .admin-hero { flex-direction: column; }
      .admin-stats { grid-template-columns: 1fr; }
    }
  `],
})
export class AdminDashboardComponent {
  private readonly admin = inject(AdminService);
  readonly errorMessage = signal('');
  readonly overview$ = this.admin.overview().pipe(
    catchError(() => {
      this.errorMessage.set('No se pudo cargar el resumen administrativo.');
      return of(null);
    }),
  );
}
