import React from 'react';
import { test, expect } from '@playwright/test';

test('Jamlyan Analytics connected users monitor shows active sessions and hides billing cards', async ({ page }) => {
  await page.goto('/#/jamlyan-analytics');
  
  // Verify overview shows billing cards
  await expect(page.getByText('Seat Utilization & Monthly Billing')).toBeVisible();

  // Click on Connected Users tab
  const connectedUsersTab = page.locator('button', { hasText: 'Connected Users' }).first();
  await connectedUsersTab.click();

  // Verify banner title or monitor header
  await expect(page.getByText('Live Connected Active Users & Devices')).toBeVisible();

  // Verify billing cards are hidden on Connected Users tab
  await expect(page.getByText('Seat Utilization & Monthly Billing')).not.toBeVisible();

  // Verify summary cards exist
  await expect(page.getByText('Total Online Now')).toBeVisible();
  await expect(page.getByText('Staff / Teachers Online')).toBeVisible();
  await expect(page.getByText('Admins Online')).toBeVisible();
  await expect(page.getByText('Students Online')).toBeVisible();

  // Verify connected devices table exists with Force Sign Out button
  await expect(page.getByText('Connected Devices & Active Sessions')).toBeVisible();
  await expect(page.getByRole('button', { name: /Force Sign Out/i }).first()).toBeVisible();
});
