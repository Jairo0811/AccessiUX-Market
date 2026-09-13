import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const emptySearchResult = JSON.stringify({
  items: [],
  totalCount: 0,
  page: 1,
  pageSize: 12,
  totalPages: 0,
  facets: { categories: [], minPrice: null, maxPrice: null },
});

const publicRoutes = ['/', '/catalog', '/login', '/register', '/accessibility'];

async function mockCatalog(page: Page): Promise<void> {
  await page.route('**/api/v1/catalog/search**', async routeHandler => {
    await routeHandler.fulfill({
      status: 200,
      contentType: 'application/json',
      body: emptySearchResult,
    });
  });
}

async function expectNoDocumentHorizontalOverflow(page: Page): Promise<void> {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

async function mockAuthenticatedCustomer(page: Page): Promise<void> {
  await page.route('**/api/v1/auth/refresh', async routeHandler => {
    await routeHandler.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'responsive-test-token',
        accessTokenExpiresAtUtc: '2026-09-13T03:00:00Z',
        tokenType: 'Bearer',
        user: {
          id: '11111111-1111-1111-1111-111111111111',
          email: 'customer@example.com',
          fullName: 'Responsive Test User',
          emailConfirmed: true,
          roles: ['Customer'],
        },
      }),
    });
  });
}

for (const viewport of [
  { width: 320, height: 740, name: '320px phone' },
  { width: 390, height: 844, name: '390px phone' },
  { width: 768, height: 1024, name: 'tablet' },
]) {
  test(`public surfaces do not create horizontal page overflow at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await mockCatalog(page);

    for (const route of publicRoutes) {
      await page.goto(route);
      await expect(page.locator('main')).toBeVisible();
      await expectNoDocumentHorizontalOverflow(page);
    }
  });
}

test('mobile navigation is compact, keyboard-friendly and closes predictably', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockCatalog(page);
  await page.goto('/');

  const toggle = page.locator('.nav__toggle');
  const actions = page.locator('#primary-nav-actions');

  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAccessibleName('Abrir menú de navegación');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(actions).toBeHidden();

  await toggle.click();
  await expect(toggle).toHaveAccessibleName('Cerrar menú de navegación');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(actions).toBeVisible();
  await expect(actions.getByRole('link', { name: 'Catálogo' })).toBeVisible();

  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  await page.keyboard.press('Escape');
  await expect(actions).toBeHidden();
  await expect(toggle).toHaveAccessibleName('Abrir menú de navegación');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  await toggle.click();
  await actions.getByRole('link', { name: 'Catálogo' }).click();
  await expect(page).toHaveURL(/\/catalog$/);
  await expect(actions).toBeHidden();
  await expectNoDocumentHorizontalOverflow(page);

  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('home accessibility panel stays inside a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');

  await page.getByRole('button', { name: 'Accesibilidad', exact: true }).click();
  const panel = page.getByRole('region', { name: 'Accesibilidad', exact: true });
  await expect(panel).toBeVisible();

  const box = await panel.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(321);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(741);
  await expectNoDocumentHorizontalOverflow(page);
});

test('accessible invoice remains contained on a 320px phone and loads official branding', async ({ page }) => {
  const orderId = '22222222-2222-2222-2222-222222222222';
  await page.setViewportSize({ width: 320, height: 740 });
  await mockAuthenticatedCustomer(page);

  await page.route(`**/api/v1/orders/${orderId}/invoice`, async routeHandler => {
    await routeHandler.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        invoiceNumber: 'FAC-20260912-RESPONSIVE',
        orderNumber: 'AUX-20260912-RESPONSIVE',
        status: 'Confirmed',
        currency: 'DOP',
        subtotal: 1800,
        shippingAmount: 0,
        taxAmount: 324,
        total: 2124,
        paymentMethod: 'CashOnDelivery',
        address: {
          recipientName: 'Cliente Responsive',
          addressLine1: 'Avenida de prueba 123',
          addressLine2: null,
          city: 'Santo Domingo',
          region: 'Santo Domingo',
          postalCode: '11807',
          countryCode: 'DO',
          phone: '8095550101',
        },
        items: [{
          productId: '33333333-3333-3333-3333-333333333333',
          name: 'Mouse Vertical Ergonómico AccessiUX con nombre deliberadamente largo',
          slug: 'mouse-vertical-accessiux',
          unitPrice: 1800,
          currency: 'DOP',
          quantity: 1,
          lineTotal: 1800,
        }],
        issuedAtUtc: '2026-09-12T20:54:22Z',
        completedAtUtc: '2026-09-12T20:54:22Z',
      }),
    });
  });

  await page.goto(`/orders/${orderId}/invoice`);
  await expect(page.getByRole('heading', { name: 'FAC-20260912-RESPONSIVE' })).toBeVisible();

  const logo = page.locator('.invoice-brand__logo');
  await expect(logo).toBeVisible();
  const naturalWidth = await logo.evaluate((image: HTMLImageElement) => image.naturalWidth);
  expect(naturalWidth).toBeGreaterThan(0);

  const tableWrap = page.locator('.invoice-table-wrap');
  await expect(tableWrap).toBeVisible();
  await expectNoDocumentHorizontalOverflow(page);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
