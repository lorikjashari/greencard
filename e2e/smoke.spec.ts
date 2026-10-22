import { expect, test } from "@playwright/test";

test("Albanian landing page loads and is responsive", async ({ page }) => {
  await page.goto("/sq");
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "sq");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(false);
});

test("English locale is available", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("h1").first()).toBeVisible();
});

test("wizard starts with a draft", async ({ page }) => {
  await page.goto("/sq/apply");
  await expect(page.getByRole("progressbar")).toBeVisible();
  await expect(page.getByText(/Statusi martesor|Hapi 1/i).first()).toBeVisible();
});

test("admin login explains demo accounts", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.getByRole("heading").first()).toBeVisible();
  await expect(page.getByText("admin@demo.greencardkosova.com")).toBeVisible();
});

test("health endpoint reports status", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBe(true);
  const body = (await response.json()) as { ok?: boolean };
  expect(body.ok).toBe(true);
});
