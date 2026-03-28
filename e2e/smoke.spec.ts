import { test, expect } from "@playwright/test";

test("registro y vista de actividades", async ({ page }) => {
  const email = `e2e_${Date.now()}@example.com`;
  const password = "e2e_password_12345";

  await page.goto("/register");
  await page.getByLabel("Nombre (opcional)").fill("E2E");
  await page.getByLabel("Correo", { exact: true }).fill(email);
  await page.getByLabel(/Contraseña/).fill(password);
  await page.getByRole("button", { name: "Registrarme" }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: /tus actividades/i })).toBeVisible();
});
