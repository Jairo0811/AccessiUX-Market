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
  await expect(page.getByLabel('Precio mínimo')).toBeVisible();
  await expect(page.getByLabel('Precio máximo')).toBeVisible();
  await expect(page.getByLabel('Disponibilidad')).toBeVisible();
  await expect(page.getByLabel('Ordenar por')).toBeVisible();
  await expect(page.getByRole('status')).toContainText('0 producto(s) encontrado(s)');
  await expect(page.getByText('No encontramos productos con esos filtros')).toBeVisible();
});

test('catalog filters are reflected in the URL', async ({ page }) => {
  await page.route('**/api/v1/catalog/search**', async routeHandler => {
    await routeHandler.fulfill({ status: 200, contentType: 'application/json', body: emptySearchResult });
  });
  await page.goto('/catalog');
  await page.getByLabel('Buscar').fill('teclado');
  await page.getByLabel('Precio mínimo').fill('500');
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await expect(page).toHaveURL(/q=teclado/);
  await expect(page).toHaveURL(/minPrice=500/);
});
