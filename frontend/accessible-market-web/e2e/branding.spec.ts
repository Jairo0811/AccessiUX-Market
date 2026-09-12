import { expect, test } from '@playwright/test';

test('official AccessiUX branding renders in the header and footer', async ({ page }) => {
  await page.goto('/');

  const headerBrand = page.locator('.site-header .brand--official');
  await expect(headerBrand).toBeVisible();
  await expect(headerBrand).toContainText('AccessiUX');
  await expect(headerBrand).toContainText('Market');

  const headerMark = headerBrand.locator('img.brand__mark');
  await expect(headerMark).toBeVisible();
  await expect(headerMark).toHaveAttribute('src', '/branding/accessiux-market-isotype.png');
  expect(await headerMark.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);

  const footerBrand = page.locator('.site-footer .footer-brand--official');
  await expect(footerBrand).toBeVisible();
  await expect(footerBrand).toContainText('AccessiUX');
  await expect(footerBrand).toContainText('Market');

  const footerMark = footerBrand.locator('img.footer-brand__mark');
  await expect(footerMark).toBeVisible();
  await expect(footerMark).toHaveAttribute('src', '/branding/accessiux-market-isotype.png');
  expect(await footerMark.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
});
