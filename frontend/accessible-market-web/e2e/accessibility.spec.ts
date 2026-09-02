import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const publicRoutes = ['/', '/login', '/register', '/forgot-password'];

for (const route of publicRoutes) {
  test(`${route} has no automatically detectable accessibility violations`, async ({ page }) => {
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
