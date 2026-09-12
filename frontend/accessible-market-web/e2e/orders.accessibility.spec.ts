import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type Route } from '@playwright/test';

const orderId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const productId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const createdAtUtc = '2026-09-06T21:00:00Z';
const cancelUntilUtc = '2026-09-06T21:30:00Z';

const baseOrder = {
  id: orderId,
  orderNumber: 'AUX-20260906-TEST0001',
  status: 'Pending',
  currency: 'DOP',
  subtotal: 3000,
  shippingAmount: 0,
  taxAmount: 0,
  total: 3000,
  paymentMethod: 'Card',
  address: {
    recipientName: 'Cliente Prueba',
    addressLine1: 'Av. Winston Churchill 100',
    addressLine2: 'Apto. 2A',
    city: 'Santo Domingo',
    region: 'Distrito Nacional',
    postalCode: '10127',
    countryCode: 'DO',
    phone: '8095550101',
  },
  items: [{
    productId,
    name: 'Teclado accesible',
    slug: 'teclado-accesible',
    unitPrice: 1500,
    quantity: 2,
    lineTotal: 3000,
  }],
  createdAtUtc,
  updatedAtUtc: createdAtUtc,
  cancelledAtUtc: null,
  canCancel: true,
  cancelUntilUtc,
  cancellationMessage: `This order can be cancelled until ${cancelUntilUtc}.`,
};

const sessionBody = JSON.stringify({
  accessToken: 'test-token',
  accessTokenExpiresAtUtc: '2026-09-07T18:00:00Z',
  tokenType: 'Bearer',
  user: {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'customer@example.com',
    fullName: 'Orders Test User',
    emailConfirmed: false,
    roles: ['Customer'],
  },
});

test('order history exposes status and cancellation availability accessibly', async ({ page }) => {
  await installApiRouter(page, async (route, method, pathname) => {
    if (method === 'GET' && pathname === '/api/v1/orders') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: orderId,
          orderNumber: baseOrder.orderNumber,
          status: 'Pending',
          total: 3000,
          currency: 'DOP',
          itemCount: 2,
          createdAtUtc,
          updatedAtUtc: createdAtUtc,
          canCancel: true,
          cancelUntilUtc,
          cancellationMessage: baseOrder.cancellationMessage,
        }]),
      });
      return true;
    }

    return false;
  });

  await page.goto('/orders');

  await expect(page.getByRole('heading', { name: 'Mis pedidos' })).toBeVisible();
  await expect(page.getByText(baseOrder.orderNumber)).toBeVisible();
  await expect(page.getByText('Pendiente', { exact: true })).toBeVisible();
  await expect(page.getByText('Cancelación disponible.', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: `Ver detalle del pedido ${baseOrder.orderNumber}` })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('order cancellation requires explicit confirmation and announces the new state', async ({ page }) => {
  let cancelled = false;
  const detailPath = `/api/v1/orders/${orderId}`;

  await installApiRouter(page, async (route, method, pathname) => {
    if (method === 'POST' && pathname === `${detailPath}/cancel`) {
      cancelled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: orderId,
          orderNumber: baseOrder.orderNumber,
          status: 'Cancelled',
          cancelledAtUtc: '2026-09-06T21:10:00Z',
          message: 'Order cancelled successfully. Reserved stock was restored.',
        }),
      });
      return true;
    }

    if (method === 'GET' && pathname === detailPath) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cancelled ? {
          ...baseOrder,
          status: 'Cancelled',
          updatedAtUtc: '2026-09-06T21:10:00Z',
          cancelledAtUtc: '2026-09-06T21:10:00Z',
          canCancel: false,
          cancellationMessage: 'This order has been cancelled.',
        } : baseOrder),
      });
      return true;
    }

    return false;
  });

  await page.goto(`/orders/${orderId}`);

  await expect(page.getByRole('heading', { name: baseOrder.orderNumber })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancelar pedido' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar pedido' }).click();

  await expect(page.getByRole('heading', { name: '¿Confirmas la cancelación?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sí, cancelar pedido' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Conservar pedido' })).toBeVisible();

  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  await page.getByRole('button', { name: 'Sí, cancelar pedido' }).click();

  await expect(page.getByText(`Pedido ${baseOrder.orderNumber} cancelado correctamente.`)).toBeVisible();
  await expect(page.getByText(/Estado:\s*Cancelado/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancelar pedido' })).toHaveCount(0);

  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('accessible invoice exposes official branding, persisted reading preferences and a non-color status', async ({ page }) => {
  const invoicePath = `/api/v1/orders/${orderId}/invoice`;
  const invoiceNumber = 'FAC-20260906-TEST0001';

  await installApiRouter(page, async (route, method, pathname) => {
    if (method === 'GET' && pathname === invoicePath) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          invoiceNumber,
          orderId,
          orderNumber: baseOrder.orderNumber,
          status: 'Confirmed',
          issuedAtUtc: '2026-09-06T21:20:00Z',
          currency: 'DOP',
          subtotal: 3000,
          shippingAmount: 0,
          taxAmount: 540,
          total: 3540,
          paymentMethod: 'CashOnDelivery',
          address: baseOrder.address,
          items: baseOrder.items,
        }),
      });
      return true;
    }

    return false;
  });

  await page.goto(`/orders/${orderId}/invoice`);

  await expect(page.getByRole('heading', { name: invoiceNumber })).toBeVisible();
  await expect(page.getByText('Estado: Compra realizada', { exact: true })).toBeVisible();
  await expect(page.getByText('ITBIS (18%)', { exact: true })).toBeVisible();
  await expect(page.getByText('DOP 3,540.00', { exact: true })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Opciones de lectura de esta factura' })).toBeVisible();

  const invoiceLogo = page.locator('.invoice-brand__logo');
  await expect(invoiceLogo).toBeVisible();
  await expect(invoiceLogo).toHaveAttribute('src', '/branding/accessiux-market-logo.png');
  expect(await invoiceLogo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);

  const largeText = page.getByRole('checkbox', { name: /Texto grande/ });
  const highContrast = page.getByRole('checkbox', { name: /Alto contraste/ });
  const simpleReading = page.getByRole('checkbox', { name: /Lectura simple/ });

  await largeText.check();
  await expect(page.locator('html')).toHaveAttribute('data-large-text', '');
  await highContrast.check();
  await expect(page.locator('html')).toHaveAttribute('data-high-contrast', '');
  await simpleReading.check();
  await expect(page.locator('html')).toHaveAttribute('data-simple-reading', '');
  await expect(invoiceLogo).toBeHidden();
  await expect(page.locator('.invoice-brand__fallback')).toBeVisible();

  await expect(page.getByText('Lectura simple activada para AccessiUX Market.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ver todas las preferencias de accesibilidad' })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

async function installApiRouter(
  page: Page,
  handleOrders: (route: Route, method: string, pathname: string) => Promise<boolean>,
): Promise<void> {
  await page.route('**/*', async route => {
    const request = route.request();
    const method = request.method();
    const pathname = new URL(request.url()).pathname;

    if (method === 'POST' && pathname === '/api/v1/auth/refresh') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: sessionBody });
      return;
    }

    if (await handleOrders(route, method, pathname)) {
      return;
    }

    await route.continue();
  });
}
