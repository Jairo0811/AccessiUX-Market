import { chromium, expect } from '@playwright/test';

const baseURL = process.env.SMOKE_WEB_BASE_URL ?? 'http://127.0.0.1:4200';
const password = process.env.DEMO_PASSWORD;
if (!password) throw new Error('DEMO_PASSWORD is required');

const accounts = [
  { email: 'customer@accessiux.local', roles: 'Cliente' },
  { email: 'seller@accessiux.local', roles: 'Cliente, Vendedor' },
  { email: 'admin@accessiux.local', roles: 'Cliente, Administrador' },
];

const browser = await chromium.launch();
try {
  for (const account of accounts) {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${baseURL}/login`);
    await page.getByLabel('Correo electrónico').fill(account.email);
    await page.getByLabel('Contraseña').fill(password);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByText(account.email, { exact: true })).toBeVisible();
    await expect(page.getByText(account.roles, { exact: true })).toBeVisible();

    if (account.email === 'customer@accessiux.local') {
      await expect(page.getByRole('link', { name: 'Vender', exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Administración', exact: true })).toHaveCount(0);
    }

    if (account.email === 'seller@accessiux.local') {
      await expect(page.getByRole('link', { name: 'Panel de vendedor', exact: true }).first()).toBeVisible();
      await page.goto(`${baseURL}/seller`);
      await expect(page.getByRole('heading', { name: 'Panel de vendedor' })).toBeVisible();
      await expect(page.getByText('Perfil activo:')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Crear producto' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Políticas comerciales' })).toBeVisible();
    }

    if (account.email === 'admin@accessiux.local') {
      await expect(page.getByRole('link', { name: 'Administración', exact: true }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: 'Vender', exact: true })).toHaveCount(0);
      await page.goto(`${baseURL}/admin`);
      await expect(page.getByRole('heading', { name: 'Panel de administración' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Estado de la plataforma' })).toBeVisible();
    }

    await context.close();
  }

  const publicContext = await browser.newContext();
  const productPage = await publicContext.newPage();
  await productPage.goto(`${baseURL}/products/smoke-product-v1`);
  await expect(productPage.getByRole('heading', { name: 'Producto Smoke v1' })).toBeVisible();
  await expect(productPage.getByRole('heading', { name: 'Políticas del vendedor' })).toBeVisible();
  await expect(productPage.getByText('Garantía', { exact: true })).toBeVisible();
  await expect(productPage.getByText('Envío', { exact: true })).toBeVisible();
  await expect(productPage.getByText('Devoluciones', { exact: true })).toBeVisible();
  await publicContext.close();

  console.log('FULL-STACK BROWSER SMOKE: PASS');
} finally {
  await browser.close();
}
