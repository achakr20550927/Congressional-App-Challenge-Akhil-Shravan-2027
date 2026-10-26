import { test, expect } from '@playwright/test';
import { noOverflow } from './helpers.js';

test('DNA homepage scrolls, pauses, and exposes interactive evidence', async ({ page }, info) => {
  await page.goto('/welcome');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('See movement');
  const video = page.locator('.landing-video');
  await expect(video).toHaveCount(1);
  await expect.poll(() => video.evaluate(v => v.readyState)).toBeGreaterThanOrEqual(2);
  await page.getByRole('button', { name: 'Pause background animation' }).click();
  await expect.poll(() => video.evaluate(v => v.paused)).toBe(true);
  await page.getByRole('button', { name: 'Play background animation' }).click();
  await expect.poll(() => video.evaluate(v => v.paused)).toBe(false);
  await page.screenshot({ path: info.outputPath('homepage.png'), fullPage: false });
  await page.getByRole('link', { name: /Explore the assessment/ }).click();
  await expect(page.getByRole('heading', { name: /A small ritual/ })).toBeInViewport();
  await page.locator('#analysis').scrollIntoViewIfNeeded();
  await page.getByLabel('Inspect signal time').fill('2.5');
  await expect(page.getByText('Inspect 2.5 s')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Frequency spectrum', exact: true })).toBeVisible();
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath('homepage-full.png'), fullPage: true });
  await page.getByRole('button', { name: /Explore a sample result/ }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByRole('heading', { name: 'A repeating rhythm stood out.' })).toBeVisible();
});

test('reduced-motion homepage keeps the background paused', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/welcome');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pause background animation' })).toHaveCount(0);
  expect(await page.locator('.landing-video').evaluate(v => v.paused)).toBe(true);
  await page.locator('#privacy').scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { name: 'Your movement data stays yours.' })).toBeInViewport();
  await noOverflow(page);
});
