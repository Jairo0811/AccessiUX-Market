import { expect, test } from '@playwright/test';

test('official AccessiUX branding renders in the header and footer', async ({ page }) => {
  await page.goto('/');

  const headerBrand = page.locator('.site-header .brand--official');
  await expect(headerBrand).toBeVisible();

  const headerLogo = headerBrand.locator('img.brand__mark');
  await expect(headerLogo).toBeVisible();
  await expect(headerLogo).toHaveAttribute('src', '/branding/accessiux-market-logo.png');
  expect(await headerLogo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);

  const footerBrand = page.locator('.site-footer .footer-brand--official');
  await expect(footerBrand).toBeVisible();

  const footerLogo = footerBrand.locator('img.footer-brand__mark');
  await expect(footerLogo).toBeVisible();
  await expect(footerLogo).toHaveAttribute('src', '/branding/accessiux-market-logo.png');
  expect(await footerLogo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
});
