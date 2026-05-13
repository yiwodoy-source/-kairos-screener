import { test, expect } from '@playwright/test';

test('verify sourcing flow and blind recruitment mode', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Enter JD
  await page.fill('textarea[placeholder="Paste the job description here..."]', 'Expert React Developer with Next.js knowledge');

  // Start Sourcing
  await page.click('button:has-text("Start Sourcing")');

  // Wait for sourcing to complete and logs to show success
  await expect(page.locator('text=Sourcing complete!')).toBeVisible({ timeout: 15000 });

  // Verify candidates are added to the list
  const candidatesCount = await page.locator('h3').count();
  expect(candidatesCount).toBeGreaterThan(0);

  // Check if real names are shown
  const firstName = await page.locator('h3').first().innerText();
  expect(firstName).not.toContain('Candidate');

  // Toggle Blind Recruitment Mode
  await page.click('button:has(span.rounded-full)');

  // Verify names are anonymized
  const anonymizedName = await page.locator('h3').first().innerText();
  expect(anonymizedName).toContain('Candidate');

  console.log('Verification successful!');
});
