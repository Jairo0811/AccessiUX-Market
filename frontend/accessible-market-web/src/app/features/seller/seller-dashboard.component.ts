import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, catchError, finalize, of, shareReplay, switchMap, tap } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Product } from '../../core/catalog/catalog.models';
import { CatalogService } from '../../core/catalog/catalog.service';

@Component({
  selector: 'app-seller-dashboard',
  imports: [AsyncPipe, ReactiveFormsModule],
  template: `
    <section class="seller-dashboard" aria-labelledby="seller-title">
      <header class="seller-hero">
        <div class="seller-hero__copy">
          <p class="eyebrow">Vendedores</p>
          <h1 id="seller-title">Panel de vendedor</h1>
          <p>Administra tu perfil comercial, políticas, catálogo e inventario desde un solo lugar.</p>
        </div>

        @if (seller$ | async; as seller) {
          <div class="seller-hero__identity">
            <span class="seller-role-badge">Vendedor</span>
            <p class="seller-hero__status">Perfil activo: <strong>{{ seller.displayName }}</strong></p>
            <span>accessiux.local/seller/{{ seller.slug }}</span>
          </div>
        }
      </header>

      @if (sellerLoadError()) {
        <div class="alert alert--error" role="alert">{{ sellerLoadError() }}</div>
      }

      @if (seller$ | async; as seller) {
        @if (products$ | async; as products) {
          <section class="seller-stats" aria-label="Resumen de la tienda">
            <article>
              <span>Productos</span>
              <strong>{{ products.length }}</strong>
              <small>total</small>
            </article>
            <article>
              <span>Publicados</span>
              <strong>{{ countByStatus(products, 'Published') }}</strong>
              <small>visibles en catálogo</small>
            </article>
            <article>
              <span>Borradores</span>
              <strong>{{ countByStatus(products, 'Draft') }}</strong>
              <small>pendientes de publicar</small>
            </article>
            <article>
              <span>Inventario</span>
              <strong>{{ totalStock(products) }}</strong>
              <small>unidades disponibles</small>
            </article>
          </section>

          <section class="seller-profile-card" aria-labelledby="seller-profile-title">
            <div>
              <p class="section-kicker">Perfil comercial</p>
              <h2 id="seller-profile-title">{{ seller.displayName }}</h2>
              <p>{{ seller.description || 'Añade una descripción comercial para presentar mejor tu tienda.' }}</p>
            </div>
            <dl>
              <div><dt>Identificador</dt><dd>{{ seller.slug }}</dd></div>
              <div><dt>Estado</dt><dd><span class="status-pill status-pill--active">Activo</span></dd></div>
            </dl>
          </section>

          <div class="seller-workspace">
            <section class="seller-panel" aria-labelledby="new-product-title">
              <div class="seller-panel__heading">
                <div>
                  <p class="section-kicker">Catálogo</p>
                  <h2 id="new-product-title">Crear producto</h2>
                </div>
                <span class="step-badge">Nuevo borrador</span>
              </div>
              <p class="seller-panel__intro">Completa la información esencial. El producto se guarda primero como borrador para prevenir publicaciones accidentales.</p>

              <form [formGroup]="productForm" (ngSubmit)="createProduct()" novalidate>
                <div class="seller-form-grid">
                  <div class="field field--wide">
                    <label for="product-name">Nombre del producto</label>
                    <input id="product-name" formControlName="name" autocomplete="off" />
                  </div>

                  <div class="field field--wide">
                    <label for="product-slug">Identificador</label>
                    <input id="product-slug" formControlName="slug" aria-describedby="product-slug-help" autocomplete="off" />
                    <p class="field-help" id="product-slug-help">Usa minúsculas, números y guiones. Ejemplo: teclado-alto-contraste.</p>
                  </div>

                  <div class="field field--wide">
                    <label for="product-category">Categoría</label>
                    <select id="product-category" formControlName="categoryId">
                      <option value="">Selecciona una categoría</option>
                      @if (categories$ | async; as categories) {
                        @for (category of categories; track category.id) {
                          <option [value]="category.id">{{ category.name }}</option>
                        }
                      }
                    </select>
                  </div>

                  <div class="field field--wide">
                    <label for="product-description">Descripción</label>
                    <textarea id="product-description" formControlName="description" rows="5"></textarea>
                  </div>

                  <div class="field">
                    <label for="product-price">Precio</label>
                    <input id="product-price" type="number" min="0.01" step="0.01" formControlName="price" inputmode="decimal" />
                  </div>

                  <div class="field">
                    <label for="product-currency">Moneda</label>
                    <select id="product-currency" formControlName="currency">
                      <option value="DOP">DOP</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>

                  <div class="field field--wide">
                    <label for="product-stock">Existencias</label>
                    <input id="product-stock" type="number" min="0" step="1" formControlName="stockQuantity" inputmode="numeric" />
                    <p class="field-help">Un producto sin existencias puede guardarse, pero no publicarse.</p>
                  </div>
                </div>

                @if (productStatus()) { <div class="alert" role="status">{{ productStatus() }}</div> }
                @if (productError()) { <div class="alert alert--error" role="alert">{{ productError() }}</div> }

                <div class="seller-form-actions">
                  <button class="button button--gradient" type="submit" [disabled]="productForm.invalid || productSaving()">
                    {{ productSaving() ? 'Guardando…' : 'Guardar borrador' }}
                  </button>
                </div>
              </form>
            </section>

            <section class="seller-panel" aria-labelledby="seller-policies-title">
              <div class="seller-panel__heading">
                <div>
                  <p class="section-kicker">Confianza</p>
                  <h2 id="seller-policies-title">Políticas comerciales</h2>
                </div>
              </div>
              <p class="seller-panel__intro" id="seller-policies-help">Garantía, envío y devoluciones se muestran siempre en este orden en los productos publicados.</p>

              <form [formGroup]="policyForm" (ngSubmit)="savePolicies()" aria-describedby="seller-policies-help" novalidate>
                <div class="field">
                  <label for="warranty-policy">Garantía</label>
                  <textarea id="warranty-policy" formControlName="warrantyPolicy" rows="4"></textarea>
                </div>

                <div class="field">
                  <label for="shipping-policy">Envío</label>
                  <textarea id="shipping-policy" formControlName="shippingPolicy" rows="4"></textarea>
                </div>

                <div class="field">
                  <label for="return-policy">Devoluciones</label>
                  <textarea id="return-policy" formControlName="returnPolicy" rows="4"></textarea>
                </div>

                @if (policyStatus()) { <div class="alert" role="status">{{ policyStatus() }}</div> }
                @if (policyError()) { <div class="alert alert--error" role="alert">{{ policyError() }}</div> }

                <div class="seller-form-actions">
                  <button class="button button--secondary" type="submit" [disabled]="policyForm.invalid || policySaving()">
                    {{ policySaving() ? 'Guardando…' : 'Guardar políticas' }}
                  </button>
                </div>
              </form>
            </section>
          </div>

          <section class="seller-products" aria-labelledby="my-products-title">
            <div class="section-heading section-heading--compact">
              <div>
                <p class="section-kicker">Inventario</p>
                <h2 id="my-products-title">Mis productos</h2>
              </div>
              <p class="section-heading__copy" role="status">{{ products.length }} producto(s).</p>
            </div>

            @if (productsError()) {
              <div class="alert alert--error" role="alert">{{ productsError() }}</div>
            } @else if (products.length === 0) {
              <div class="seller-empty-state">
                <span aria-hidden="true">+</span>
                <div>
                  <h3>Tu catálogo está listo para empezar</h3>
                  <p>Crea tu primer producto con el formulario anterior. Podrás revisarlo como borrador antes de publicarlo.</p>
                </div>
              </div>
            } @else {
              <div class="seller-product-grid">
                @for (product of products; track product.id) {
                  <article class="seller-product-card">
                    <div class="seller-product-card__topline">
                      <span class="status-pill" [class.status-pill--published]="product.status === 'Published'" [class.status-pill--draft]="product.status === 'Draft'">
                        {{ productStatusLabel(product.status) }}
                      </span>
                      <span>{{ product.currency }} {{ product.price }}</span>
                    </div>
                    <h3>{{ product.name }}</h3>
                    <p>{{ product.description }}</p>
                    <dl>
                      <div><dt>Existencias</dt><dd>{{ product.stockQuantity }}</dd></div>
                      <div><dt>Identificador</dt><dd>{{ product.slug }}</dd></div>
                    </dl>
                    @if (product.status === 'Draft') {
                      <button class="button button--small" type="button" (click)="publish(product.id)" [disabled]="product.stockQuantity <= 0 || publishingId() === product.id">
                        {{ publishingId() === product.id ? 'Publicando…' : 'Publicar producto' }}
                      </button>
                    }
                  </article>
                }
              </div>
              @if (publishStatus()) { <div class="alert" role="status">{{ publishStatus() }}</div> }
              @if (publishError()) { <div class="alert alert--error" role="alert">{{ publishError() }}</div> }
            }
          </section>
        }
      } @else if (!sellerLoadError()) {
        <section class="seller-onboarding" aria-labelledby="new-seller-title">
          <div class="seller-onboarding__copy">
            <span class="seller-role-badge">Activa tu tienda</span>
            <p class="section-kicker">Primer paso</p>
            <h2 id="new-seller-title">Crear perfil de vendedor</h2>
            <p>
              Tu cuenta de cliente puede convertirse en vendedor sin perder sus funciones de compra. Al crear el perfil se habilitan las herramientas comerciales.
            </p>
            <ul>
              <li>Publicar y administrar productos.</li>
              <li>Definir políticas de garantía, envío y devoluciones.</li>
              <li>Mantener tus compras y pedidos como cliente.</li>
            </ul>
          </div>

          <form class="seller-onboarding__form" [formGroup]="sellerForm" (ngSubmit)="createSeller()" novalidate>
            <div class="field">
              <label for="seller-name">Nombre público</label>
              <input id="seller-name" formControlName="displayName" autocomplete="organization" />
            </div>

            <div class="field">
              <label for="seller-slug">Identificador</label>
              <input id="seller-slug" formControlName="slug" aria-describedby="seller-slug-help" autocomplete="off" />
              <p class="field-help" id="seller-slug-help">Usa minúsculas, números y guiones.</p>
            </div>

            <div class="field">
              <label for="seller-description">Descripción</label>
              <textarea id="seller-description" formControlName="description" rows="5"></textarea>
            </div>

            @if (sellerStatus()) { <div class="alert" role="status">{{ sellerStatus() }}</div> }
            @if (sellerError()) { <div class="alert alert--error" role="alert">{{ sellerError() }}</div> }

            <button class="button button--gradient button--full" type="submit" [disabled]="sellerForm.invalid || sellerSaving()">
              {{ sellerSaving() ? 'Creando perfil…' : 'Crear perfil de vendedor' }}
            </button>
          </form>
        </section>
      }
    </section>
  `,
  styles: [`
    .seller-dashboard { display: grid; gap: 1.6rem; }
    .seller-hero {
      padding: clamp(1.6rem,4vw,2.7rem);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 2rem;
      border: 1px solid var(--border);
      border-radius: 1.55rem;
      background:
        radial-gradient(circle at 90% 20%,rgb(124 58 237 / 13%),transparent 18rem),
        radial-gradient(circle at 70% 80%,rgb(18 212 226 / 12%),transparent 20rem),
        #fff;
      box-shadow: var(--shadow-sm);
    }
    .seller-hero h1 {
      margin: .35rem 0 .65rem;
      color: var(--navy-900);
      font-size: clamp(2.15rem,5vw,3.6rem);
      line-height: 1;
      letter-spacing: -.05em;
    }
    .seller-hero__copy > p:last-child { max-width: 48rem; margin: 0; color: var(--ink-600); }
    .seller-hero__identity {
      min-width: min(100%,19rem);
      padding: 1rem;
      display: grid;
      gap: .4rem;
      border: 1px solid #c9d9ee;
      border-radius: 1rem;
      background: rgb(255 255 255 / 88%);
      box-shadow: 0 .6rem 1.5rem rgb(19 61 110 / 7%);
    }
    .seller-hero__identity p { margin: .35rem 0 0; }
    .seller-hero__identity > span:last-child { color: var(--ink-600); font-size: .84rem; overflow-wrap: anywhere; }
    .seller-role-badge,
    .step-badge {
      width: fit-content;
      padding: .35rem .6rem;
      border-radius: 999px;
      font-size: .72rem;
      font-weight: 900;
      letter-spacing: .07em;
      text-transform: uppercase;
    }
    .seller-role-badge { color: #075a66; background: #dffafd; border: 1px solid #9ce8ed; }
    .step-badge { color: #4b2a92; background: #f0e9ff; border: 1px solid #d6c5fb; }
    .seller-stats {
      display: grid;
      grid-template-columns: repeat(4,minmax(0,1fr));
      gap: .9rem;
    }
    .seller-stats article {
      min-height: 8.6rem;
      padding: 1.15rem;
      display: grid;
      align-content: center;
      gap: .2rem;
      border: 1px solid var(--border);
      border-radius: 1.05rem;
      background: #fff;
      box-shadow: var(--shadow-sm);
    }
    .seller-stats span { color: var(--ink-600); font-weight: 800; }
    .seller-stats strong { color: var(--navy-900); font-size: 2.2rem; line-height: 1; }
    .seller-stats small { color: var(--ink-600); }
    .seller-profile-card {
      padding: 1.35rem 1.5rem;
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 2rem;
      align-items: center;
      border: 1px solid var(--border);
      border-radius: 1.15rem;
      background: linear-gradient(120deg,#f9fcff,#f2f7ff);
    }
    .seller-profile-card h2 { margin: .2rem 0 .4rem; color: var(--navy-900); }
    .seller-profile-card p { margin: 0; color: var(--ink-700); }
    .seller-profile-card dl,
    .seller-product-card dl { margin: 0; display: grid; gap: .65rem; }
    .seller-profile-card dl div,
    .seller-product-card dl div { display: flex; justify-content: space-between; gap: 1rem; }
    .seller-profile-card dt,
    .seller-product-card dt { color: var(--ink-600); font-weight: 800; }
    .seller-profile-card dd,
    .seller-product-card dd { margin: 0; text-align: right; overflow-wrap: anywhere; }
    .seller-workspace {
      display: grid;
      grid-template-columns: minmax(0,1.25fr) minmax(20rem,.75fr);
      gap: 1rem;
      align-items: start;
    }
    .seller-panel,
    .seller-products,
    .seller-onboarding {
      padding: clamp(1.3rem,3vw,1.8rem);
      border: 1px solid var(--border);
      border-radius: 1.2rem;
      background: #fff;
      box-shadow: var(--shadow-sm);
    }
    .seller-panel__heading { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
    .seller-panel h2,
    .seller-products h2,
    .seller-onboarding h2 { margin: .2rem 0 .35rem; color: var(--navy-900); font-size: 1.55rem; }
    .seller-panel__intro { margin: 0 0 1rem; color: var(--ink-600); }
    .seller-form-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 0 1rem; }
    .field--wide { grid-column: 1 / -1; }
    .seller-form-actions { margin-top: 1rem; display: flex; justify-content: flex-end; }
    .seller-products { display: grid; gap: 1rem; }
    .seller-product-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 1rem; }
    .seller-product-card {
      padding: 1.2rem;
      display: grid;
      align-content: start;
      gap: .85rem;
      border: 1px solid var(--border);
      border-radius: 1rem;
      background: #fff;
    }
    .seller-product-card__topline { display: flex; justify-content: space-between; gap: 1rem; align-items: center; color: var(--ink-600); font-size: .88rem; font-weight: 800; }
    .seller-product-card h3 { margin: 0; color: var(--navy-900); }
    .seller-product-card > p { margin: 0; color: var(--ink-600); }
    .status-pill {
      display: inline-flex;
      width: fit-content;
      padding: .3rem .55rem;
      border: 1px solid var(--border-strong);
      border-radius: 999px;
      background: #f3f6fa;
      font-size: .72rem;
      font-weight: 900;
    }
    .status-pill--active,
    .status-pill--published { color: #0b694a; background: #e9f9f1; border-color: #acdcca; }
    .status-pill--draft { color: #744e05; background: #fff7df; border-color: #ead28c; }
    .seller-empty-state {
      padding: 1.4rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      border: 2px dashed var(--border-strong);
      border-radius: 1rem;
      background: var(--surface-soft);
    }
    .seller-empty-state > span {
      flex: 0 0 auto;
      width: 2.8rem;
      height: 2.8rem;
      display: grid;
      place-items: center;
      border-radius: .8rem;
      color: #fff;
      background: linear-gradient(145deg,var(--blue),var(--violet));
      font-size: 1.5rem;
      font-weight: 900;
    }
    .seller-empty-state h3 { margin: 0 0 .25rem; color: var(--navy-900); }
    .seller-empty-state p { margin: 0; color: var(--ink-600); }
    .seller-onboarding {
      display: grid;
      grid-template-columns: minmax(0,1fr) minmax(19rem,.8fr);
      gap: clamp(2rem,5vw,4rem);
      background: linear-gradient(135deg,#fff,#f3f8ff);
    }
    .seller-onboarding__copy { align-self: center; }
    .seller-onboarding__copy > p { color: var(--ink-700); }
    .seller-onboarding__copy ul { padding-left: 1.25rem; color: var(--ink-700); }
    .seller-onboarding__form { padding: 1.2rem; border: 1px solid var(--border); border-radius: 1rem; background: #fff; }
    @media (max-width: 68rem) {
      .seller-stats { grid-template-columns: repeat(2,minmax(0,1fr)); }
      .seller-workspace,
      .seller-onboarding { grid-template-columns: 1fr; }
      .seller-product-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
    }
    @media (max-width: 48rem) {
      .seller-hero { flex-direction: column; }
      .seller-hero__identity { width: 100%; }
      .seller-profile-card { grid-template-columns: 1fr; gap: 1rem; }
      .seller-stats,
      .seller-product-grid,
      .seller-form-grid { grid-template-columns: 1fr; }
      .field--wide { grid-column: auto; }
      .seller-form-actions .button { width: 100%; }
    }
    @media (forced-colors: active) {
      .seller-hero,
      .seller-panel,
      .seller-products,
      .seller-product-card,
      .seller-onboarding { border: 2px solid CanvasText; }
    }
  `],
})
export class SellerDashboardComponent {
  private readonly catalog = inject(CatalogService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly refresh$ = new BehaviorSubject<void>(undefined);

  readonly sellerForm = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.maxLength(120)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    description: ['', Validators.maxLength(1000)],
  });

  readonly policyForm = this.fb.nonNullable.group({
    warrantyPolicy: ['', [Validators.required, Validators.maxLength(2000)]],
    shippingPolicy: ['', [Validators.required, Validators.maxLength(2000)]],
    returnPolicy: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  readonly productForm = this.fb.nonNullable.group({
    categoryId: ['', Validators.required],
    name: ['', [Validators.required, Validators.maxLength(180)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    description: ['', [Validators.required, Validators.maxLength(5000)]],
    price: [0, [Validators.required, Validators.min(0.01)]],
    currency: ['DOP', [Validators.required, Validators.pattern(/^[A-Z]{3}$/)]],
    stockQuantity: [0, [Validators.required, Validators.min(0)]],
  });

  readonly sellerSaving = signal(false);
  readonly sellerStatus = signal('');
  readonly sellerError = signal('');
  readonly sellerLoadError = signal('');
  readonly productSaving = signal(false);
  readonly productStatus = signal('');
  readonly productError = signal('');
  readonly productsError = signal('');
  readonly publishingId = signal<string | null>(null);
  readonly publishStatus = signal('');
  readonly publishError = signal('');
  readonly policySaving = signal(false);
  readonly policyStatus = signal('');
  readonly policyError = signal('');

  readonly seller$ = this.refresh$.pipe(
    switchMap(() => {
      this.sellerLoadError.set('');
      return this.catalog.mySeller().pipe(
        tap(seller => this.policyForm.patchValue({
          warrantyPolicy: seller.warrantyPolicy ?? '',
          shippingPolicy: seller.shippingPolicy ?? '',
          returnPolicy: seller.returnPolicy ?? '',
        }, { emitEvent: false })),
        catchError((error: unknown) => {
          if (!(error instanceof HttpErrorResponse) || error.status !== 404) {
            this.sellerLoadError.set(this.describeError(error, 'No se pudo cargar el perfil de vendedor.'));
          }
          return of(null);
        }),
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly products$ = this.refresh$.pipe(
    switchMap(() => {
      this.productsError.set('');
      return this.catalog.myProducts().pipe(
        catchError((error: unknown) => {
          this.productsError.set(this.describeError(error, 'No se pudieron cargar tus productos.'));
          return of([] as Product[]);
        }),
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly categories$ = this.catalog.categories().pipe(shareReplay({ bufferSize: 1, refCount: true }));

  createSeller(): void {
    if (this.sellerForm.invalid || this.sellerSaving()) return;
    this.sellerSaving.set(true);
    this.sellerStatus.set('');
    this.sellerError.set('');

    this.catalog.createSeller(this.sellerForm.getRawValue())
      .pipe(
        switchMap(() => this.auth.refreshSession()),
        finalize(() => this.sellerSaving.set(false)),
      )
      .subscribe({
        next: () => {
          this.sellerStatus.set('Tu perfil de vendedor fue creado y los privilegios comerciales están activos.');
          this.refresh$.next();
        },
        error: (error: unknown) => this.sellerError.set(this.describeError(error, 'No se pudo crear el perfil de vendedor.')),
      });
  }

  savePolicies(): void {
    if (this.policyForm.invalid || this.policySaving()) return;
    this.policySaving.set(true);
    this.policyStatus.set('');
    this.policyError.set('');
    this.catalog.updateSellerPolicies(this.policyForm.getRawValue())
      .pipe(finalize(() => this.policySaving.set(false)))
      .subscribe({
        next: seller => {
          this.policyForm.patchValue({
            warrantyPolicy: seller.warrantyPolicy ?? '',
            shippingPolicy: seller.shippingPolicy ?? '',
            returnPolicy: seller.returnPolicy ?? '',
          }, { emitEvent: false });
          this.policyStatus.set('Las políticas comerciales fueron actualizadas.');
        },
        error: (error: unknown) => this.policyError.set(this.describeError(error, 'No se pudieron actualizar las políticas comerciales.')),
      });
  }

  createProduct(): void {
    if (this.productForm.invalid || this.productSaving()) return;
    this.productSaving.set(true);
    this.productStatus.set('');
    this.productError.set('');

    this.catalog.createProduct(this.productForm.getRawValue())
      .pipe(finalize(() => this.productSaving.set(false)))
      .subscribe({
        next: () => {
          this.productForm.reset({ categoryId: '', name: '', slug: '', description: '', price: 0, currency: 'DOP', stockQuantity: 0 });
          this.productStatus.set('El producto se guardó como borrador. Revísalo antes de publicarlo.');
          this.refresh$.next();
        },
        error: (error: unknown) => this.productError.set(this.describeError(error, 'No se pudo crear el producto.')),
      });
  }

  publish(id: string): void {
    if (this.publishingId()) return;
    this.publishingId.set(id);
    this.publishStatus.set('');
    this.publishError.set('');

    this.catalog.publish(id)
      .pipe(finalize(() => this.publishingId.set(null)))
      .subscribe({
        next: () => {
          this.publishStatus.set('El producto ya está publicado en el catálogo.');
          this.refresh$.next();
        },
        error: (error: unknown) => this.publishError.set(this.describeError(error, 'No se pudo publicar el producto.')),
      });
  }

  countByStatus(products: readonly Product[], status: string): number {
    return products.filter(product => product.status === status).length;
  }

  totalStock(products: readonly Product[]): number {
    return products.reduce((total, product) => total + product.stockQuantity, 0);
  }

  productStatusLabel(status: string): string {
    if (status === 'Published') return 'Publicado';
    if (status === 'Draft') return 'Borrador';
    if (status === 'Archived') return 'Archivado';
    return status;
  }

  private describeError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') return error.error.message;
    if (error instanceof HttpErrorResponse && typeof error.error?.detail === 'string') return error.error.detail;
    return fallback;
  }
}
