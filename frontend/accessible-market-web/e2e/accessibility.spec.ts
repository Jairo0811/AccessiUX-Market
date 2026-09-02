import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const publicRoutes = ['/', '/catalog', '/login', '/register', '/forgot-password'];

for (const route of publicRoutes) {
  test(`${route} has no automatically detectable accessibility violations`, async ({ page }) => {
    if (route === '/catalog') {
      await page.route('**/api/v1/catalog/products', async routeHandler => {
        await routeHandler.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
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

test('the catalog exposes a clear empty state', async ({ page }) => {
  await page.route('**/api/v1/catalog/products', async routeHandler => {
    await routeHandler.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.goto('/catalog');
  await expect(page.getByRole('heading', { name: 'Productos disponibles' })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Todavía no hay productos publicados');
});
