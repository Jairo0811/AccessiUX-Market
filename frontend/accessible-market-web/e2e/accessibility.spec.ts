import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const emptySearchResult = JSON.stringify({
  items: [], totalCount: 0, page: 1, pageSize: 12, totalPages: 0,
  facets: { categories: [], minPrice: null, maxPrice: null }
});

const publicRoutes = ['/', '/catalog', '/login', '/register', '/forgot-password'];

for (const route of publicRoutes) {
  test(`${route} has no automatically detectable accessibility violations`, async ({ page }) => {
    if (route === '/catalog') {
      await page.route('**/api/v1/catalog/search**', async routeHandler => {
        await routeHandler.fulfill({ status: 200, contentType: 'application/json', body: emptySearchResult });
      });
    }

    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

test('the login form has an accessible name for every control', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  await expect(page.getByLabel('Correo electrónico')).toBeVisible();
  await expect(page.getByLabel('Contraseña', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
});

test('the catalog exposes accessible filters and a clear empty state', async ({ page }) => {
  await page.route('**/api/v1/catalog/search**', async routeHandler => {
    await routeHandler.fulfill({ status: 200, contentType: 'application/json', body: emptySearchResult });
  });
  await page.goto('/catalog');
  await expect(page.getByRole('heading', { name: 'Encuentra productos accesibles' })).toBeVisible();
  await expect(page.getByLabel('Buscar')).toBeVisible();
  await expect(page.getByLabel('Categoría')).toBeVisible();
  await expect(page.getByLabel('Mínimo')).toBeVisible();
  await expect(page.getByLabel('Máximo')).toBeVisible();
  await expect(page.getByLabel('Disponibilidad')).toBeVisible();
  await expect(page.getByLabel('Ordenar por')).toBeVisible();
  await expect(page.getByRole('status')).toContainText('0 producto(s) encontrado(s)');
  await expect(page.getByRole('heading', { name: 'No encontramos productos' })).toBeVisible();
});

test('catalog filters are reflected in the URL', async ({ page }) => {
  await page.route('**/api/v1/catalog/search**', async routeHandler => {
    await routeHandler.fulfill({ status: 200, contentType: 'application/json', body: emptySearchResult });
  });
  await page.goto('/catalog');
  await page.getByLabel('Buscar').fill('teclado');
  await page.getByLabel('Mínimo').fill('500');
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await expect(page).toHaveURL(/q=teclado/);
  await expect(page).toHaveURL(/minPrice=500/);
});

test('the authenticated empty cart is accessible and guides the user back to catalog', async ({ page }) => {
  await mockAuthenticatedCustomer(page);
  await page.route('**/api/v1/cart', async routeHandler => {
    await routeHandler.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [], totalQuantity: 0, subtotal: 0, currency: 'DOP' }),
    });
  });

  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Mi carrito' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tu carrito está vacío' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Explorar catálogo' })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('checkout exposes critical information for review before confirmation', async ({ page }) => {
  await mockAuthenticatedCustomer(page);

  const cart = {
    items: [{
      productId: '22222222-2222-2222-2222-222222222222',
      name: 'Teclado accesible',
      slug: 'teclado-accesible',
      unitPrice: 1500,
      currency: 'DOP',
      quantity: 2,
      availableStock: 4,
      lineTotal: 3000,
    }],
    totalQuantity: 2,
    subtotal: 3000,
    currency: 'DOP',
  };

  await page.route('**/api/v1/cart', async routeHandler => {
    await routeHandler.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cart) });
  });

  await page.route('**/api/v1/checkout/review', async routeHandler => {
    const request = routeHandler.request().postDataJSON();
    await routeHandler.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: cart.items,
        address: request.address,
        paymentMethod: request.paymentMethod,
        subtotal: 3000,
        shippingAmount: 0,
        taxAmount: 0,
        total: 3000,
        currency: 'DOP',
        canConfirm: true,
        warnings: [],
      }),
    });
  });

  await page.goto('/checkout');
  await expect(page.getByRole('heading', { name: 'Revisa antes de confirmar' })).toBeVisible();
  await page.getByLabel('Nombre de quien recibe').fill('Cliente Prueba');
  await page.getByRole('textbox', { name: 'Dirección', exact: true }).fill('Av. Winston Churchill 100');
  await page.getByLabel('Ciudad').fill('Santo Domingo');
  await page.getByLabel('Provincia / región').fill('Distrito Nacional');
  await page.getByLabel('Código postal').fill('10127');
  await page.getByLabel('Teléfono').fill('8095550101');
  await page.getByRole('button', { name: 'Revisar compra' }).click();

  await expect(page.getByRole('heading', { name: 'Dirección revisada' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Método de pago' })).toBeVisible();
  await expect(page.locator('.review-totals__grand')).toContainText('3,000.00');
  const reviewCheckbox = page.getByLabel('He revisado la dirección, el método de pago, los productos y el total.');
  await expect(reviewCheckbox).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeDisabled();
  await reviewCheckbox.check();
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeEnabled();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

async function mockAuthenticatedCustomer(page: import('@playwright/test').Page): Promise<void> {
  await page.route('**/api/v1/auth/refresh', async routeHandler => {
    await routeHandler.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'test-token',
        accessTokenExpiresAtUtc: '2026-09-07T18:00:00Z',
        tokenType: 'Bearer',
        user: {
          id: '11111111-1111-1111-1111-111111111111',
          email: 'customer@example.com',
          fullName: 'Checkout Test User',
          emailConfirmed: false,
          roles: ['Customer'],
        },
      }),
    });
  });
}
