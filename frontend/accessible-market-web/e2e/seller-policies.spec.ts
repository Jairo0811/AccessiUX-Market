import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const sellerId = '33333333-3333-3333-3333-333333333333';
const productId = '44444444-4444-4444-4444-444444444444';

test('product detail exposes seller policies in a standardized accessible order', async ({ page }) => {
  await page.route('**/api/v1/catalog/products/teclado-politicas', async routeHandler => {
    await routeHandler.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: productId,
        sellerId,
        categoryId: '55555555-5555-5555-5555-555555555555',
        name: 'Teclado con políticas claras',
        slug: 'teclado-politicas',
        description: 'Producto utilizado para validar información comercial estandarizada.',
        price: 2500,
        currency: 'DOP',
        stockQuantity: 5,
        status: 'Published',
      }),
    });
  });

  await page.route(`**/api/v1/catalog/sellers/id/${sellerId}`, async routeHandler => {
    await routeHandler.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: sellerId,
        displayName: 'Tienda Accesible',
        slug: 'tienda-accesible',
        description: 'Vendedor de prueba.',
        warrantyPolicy: 'Garantía limitada de 12 meses.',
        shippingPolicy: 'Envíos en 2 a 4 días laborables.',
        returnPolicy: 'Devoluciones dentro de 30 días.',
      }),
    });
  });

  await page.goto('/products/teclado-politicas');

  await expect(page.getByRole('heading', { level: 1, name: 'Teclado con políticas claras' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Políticas del vendedor' })).toBeVisible();
  await expect(page.getByText('Vendido por Tienda Accesible.')).toBeVisible();

  const terms = page.locator('section[aria-labelledby="seller-policies-title"] dt');
  await expect(terms).toHaveText(['Garantía', 'Envío', 'Devoluciones']);
  await expect(page.getByText('Garantía limitada de 12 meses.')).toBeVisible();
  await expect(page.getByText('Envíos en 2 a 4 días laborables.')).toBeVisible();
  await expect(page.getByText('Devoluciones dentro de 30 días.')).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('product detail explains missing seller policies instead of hiding the sections', async ({ page }) => {
  await page.route('**/api/v1/catalog/products/producto-sin-politicas', async routeHandler => {
    await routeHandler.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: productId,
        sellerId,
        categoryId: '55555555-5555-5555-5555-555555555555',
        name: 'Producto sin políticas',
        slug: 'producto-sin-politicas',
        description: 'Producto con perfil vendedor todavía incompleto.',
        price: 1000,
        currency: 'DOP',
        stockQuantity: 2,
        status: 'Published',
      }),
    });
  });

  await page.route(`**/api/v1/catalog/sellers/id/${sellerId}`, async routeHandler => {
    await routeHandler.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: sellerId,
        displayName: 'Vendedor Nuevo',
        slug: 'vendedor-nuevo',
        description: null,
        warrantyPolicy: null,
        shippingPolicy: null,
        returnPolicy: null,
      }),
    });
  });

  await page.goto('/products/producto-sin-politicas');

  await expect(page.getByText('El vendedor todavía no ha publicado su política de garantía.')).toBeVisible();
  await expect(page.getByText('El vendedor todavía no ha publicado su política de envío.')).toBeVisible();
  await expect(page.getByText('El vendedor todavía no ha publicado su política de devoluciones.')).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
