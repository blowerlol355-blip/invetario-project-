import { test as setup } from "@playwright/test";

import { ADMIN_STATE, OPERATOR_STATE } from "../../playwright.config";
import { DEMO, login } from "./fixtures";

/** Inicia sesión una vez por rol y guarda las cookies para el resto de los tests. */
setup("sesión de administrador", async ({ page }) => {
  await login(page, DEMO.admin);
  await page.context().storageState({ path: ADMIN_STATE });
});

setup("sesión de operador", async ({ page }) => {
  await login(page, DEMO.operator);
  await page.context().storageState({ path: OPERATOR_STATE });
});
