import { test, expect } from '@playwright/test';

test('should show login page when unauthenticated', async ({ page }) => {
  await page.goto('/');
  // Expect to see the Login card
  await expect(page.getByText('ACR ERP')).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Senha')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
});
