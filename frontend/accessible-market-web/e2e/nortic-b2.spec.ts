import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('accessibility statement is public, titled and free of detectable violations', async ({ page }) => {
  await page.goto('/accessibility');

  await expect(page).toHaveTitle('Accesibilidad | AccessiUX Market');
  await expect(page.getByRole('heading', { level: 1, name: 'Declaración de accesibilidad' })).toBeVisible();
  await expect(page.getByText('Objetivo de conformidad: nivel AA.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Principios que aplicamos' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Compras con prevención de errores' })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('skip link allows keyboard users to bypass repeated navigation', async ({ page }) => {
  await page.goto('/');

  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Saltar al contenido principal' });
  await expect(skipLink).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});

test('main public routes expose descriptive page titles', async ({ page }) => {
  const routes = [
    ['/', 'AccessiUX Market'],
    ['/catalog', 'Catálogo | AccessiUX Market'],
    ['/login', 'Iniciar sesión | AccessiUX Market'],
    ['/register', 'Crear cuenta | AccessiUX Market'],
    ['/forgot-password', 'Restablecer contraseña | AccessiUX Market'],
    ['/accessibility', 'Accesibilidad | AccessiUX Market'],
  ] as const;

  for (const [route, title] of routes) {
    if (route === '/catalog') {
      await page.route('**/api/v1/catalog/search**', async routeHandler => {
        await routeHandler.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [], totalCount: 0, page: 1, pageSize: 12, totalPages: 0,
            facets: { categories: [], minPrice: null, maxPrice: null }
          }),
        });
      });
    }

    await page.goto(route);
    await expect(page).toHaveTitle(title);
  }
});
