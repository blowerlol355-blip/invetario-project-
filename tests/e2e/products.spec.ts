import { expect, selectOption, test, uniqueSku } from "./fixtures";

test("crear un producto desde el formulario y verlo en el detalle y el listado", async ({
  page,
}) => {
  const sku = uniqueSku();
  const name = `Taladro de prueba ${sku}`;

  await page.goto("/products/new");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Nuevo producto");

  await page.getByLabel("SKU").fill(sku.toLowerCase());
  await page.getByLabel("Nombre").fill(name);
  await page.getByLabel("Descripción").fill("Creado por el test E2E");
  await selectOption(page, "Categoría", /Herramientas/);
  await selectOption(page, "Proveedor", /Ferretería/);
  await page.getByLabel("Costo de referencia (USD)").fill("45.5");
  await page.getByLabel("Precio de venta (USD)").fill("79.9");
  await page.getByLabel("Stock mínimo").fill("5");
  await page.getByLabel("Stock máximo").fill("40");
  await page.getByRole("button", { name: "Crear producto" }).click();

  await expect(page.getByText("Producto creado.")).toBeVisible();
  await expect(page).toHaveURL(/\/products\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
  await expect(page.getByText(sku, { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Stock por almacén")).toBeVisible();

  await page.goto(`/products?q=${sku}`);
  const row = page.getByRole("row").filter({ hasText: sku });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("Herramientas");
});

test("no permite un SKU duplicado y muestra el error en el campo", async ({ page }) => {
  await page.goto("/products/new");
  await page.getByLabel("SKU").fill("HER-0001");
  await page.getByLabel("Nombre").fill("Duplicado E2E");
  await selectOption(page, "Categoría", /Herramientas/);
  await page.getByLabel("Costo de referencia (USD)").fill("1");
  await page.getByLabel("Precio de venta (USD)").fill("2");
  await page.getByLabel("Stock mínimo").fill("0");
  await page.getByRole("button", { name: "Crear producto" }).click();

  await expect(page.getByText("Ya existe un producto con ese SKU.").first()).toBeVisible();
  await expect(page).toHaveURL(/\/products\/new$/);
});
