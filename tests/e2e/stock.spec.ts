import type { Page } from "@playwright/test";

import {
  createProductViaApi,
  expect,
  pickProduct,
  selectOption,
  stockByWarehouse,
  test,
} from "./fixtures";

test.describe.configure({ mode: "serial" });

let product: { id: string; sku: string; name: string };

test.beforeAll(async ({ request }) => {
  product = await createProductViaApi(request);
});

async function openMovementForm(page: Page, type: string) {
  await page.goto("/movements/new");
  await page.getByRole("radio", { name: type }).click();
  await pickProduct(page, page.getByRole("combobox", { name: /Producto/ }), product.sku);
}

test("registra una entrada y actualiza la existencia", async ({ page, request }) => {
  await openMovementForm(page, "Entrada");
  await selectOption(page, "Almacén de destino", /CEN/);
  await page.getByLabel(/^Cantidad/).fill("10");
  await page.getByLabel("Costo unitario (USD)").fill("12.5");
  await page.getByLabel("Referencia").fill("E2E-IN");
  await page.getByRole("button", { name: "Registrar entrada" }).click();

  await expect(page).toHaveURL(new RegExp(`/products/${product.id}$`));
  await expect(page.getByText("Stock por almacén")).toBeVisible();
  expect(await stockByWarehouse(request, product.id)).toEqual({ CEN: 10 });
});

test("registra una salida y rechaza retirar más de lo disponible", async ({ page, request }) => {
  await openMovementForm(page, "Salida");
  await selectOption(page, "Almacén de origen", /CEN/);
  // El formulario bloquea el envío cuando la cantidad supera la existencia disponible.
  await page.getByLabel(/^Cantidad/).fill("50");
  await expect(page.getByLabel(/^Cantidad/)).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("button", { name: "Registrar salida" })).toBeDisabled();

  await page.getByLabel(/^Cantidad/).fill("3");
  await page.getByRole("button", { name: "Registrar salida" }).click();
  await expect(page).toHaveURL(new RegExp(`/products/${product.id}$`));
  expect(await stockByWarehouse(request, product.id)).toEqual({ CEN: 7 });
});

test("transfiere entre almacenes de forma atómica", async ({ page, request }) => {
  await openMovementForm(page, "Transferencia");
  await selectOption(page, "Almacén de origen", /CEN/);
  await selectOption(page, "Almacén de destino", /NOR/);
  await page.getByLabel(/^Cantidad/).fill("4");
  await page.getByRole("button", { name: "Registrar transferencia" }).click();

  await expect(page).toHaveURL(new RegExp(`/products/${product.id}$`));
  expect(await stockByWarehouse(request, product.id)).toEqual({ CEN: 3, NOR: 4 });

  await page.goto(`/movements?q=${product.sku}`);
  const rows = page.getByRole("row").filter({ hasText: product.sku });
  await expect(rows).toHaveCount(3);
  await expect(rows.first()).toContainText("Transferencia");
});
