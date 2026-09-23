import type { Page } from "@playwright/test";

import { OPERATOR_STATE } from "../../playwright.config";
import { DEMO, expect, login, test } from "./fixtures";

/** Enlaces del menú lateral (excluye breadcrumbs y otros nav). */
const sidebarLink = (page: Page, name: string) =>
  page.locator('[data-slot="sidebar"]').getByRole("link", { name, exact: true });

test.describe("autenticación", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("rechaza credenciales incorrectas", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill(DEMO.admin.email);
    await page.getByLabel("Contraseña", { exact: true }).fill("incorrecta1");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirige al login sin sesión y vuelve a la ruta pedida", async ({ page }) => {
    await page.goto("/products");
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fproducts/);
    await page.getByLabel("Correo electrónico").fill(DEMO.manager.email);
    await page.getByLabel("Contraseña", { exact: true }).fill(DEMO.manager.password);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Productos");
  });

  test("el administrador entra al dashboard con su menú completo", async ({ page }) => {
    await login(page, DEMO.admin);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Ana");
    await expect(sidebarLink(page, "Usuarios")).toBeVisible();
    await expect(sidebarLink(page, "Auditoría")).toBeVisible();
  });
});

test.describe("permisos por rol", () => {
  test.use({ storageState: OPERATOR_STATE });

  test("el operador no ve ni puede abrir la administración", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(sidebarLink(page, "Movimientos")).toBeVisible();
    await expect(sidebarLink(page, "Usuarios")).toHaveCount(0);

    await page.goto("/users");
    await expect(page).toHaveURL(/\/forbidden/);
    await page.goto("/products/new");
    await expect(page).toHaveURL(/\/forbidden/);
  });
});
