import {
  createProductViaApi,
  expect,
  pickProduct,
  selectOption,
  stockByWarehouse,
  test,
} from "./fixtures";

test("crea, envía y recibe una orden de compra generando la entrada de stock", async ({
  page,
  request,
}) => {
  const product = await createProductViaApi(request);

  await page.goto("/purchase-orders/new");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Nueva orden");
  await selectOption(page, "Proveedor", /./);
  await selectOption(page, "Almacén de recepción", /SUR/);
  await page.getByLabel("Notas").fill("Orden creada por el test E2E");

  await pickProduct(page, page.getByRole("combobox").last(), product.sku);
  await expect(page.getByRole("combobox").last()).toContainText(product.sku);
  await page.getByLabel("Cantidad").fill("5");
  await page.getByLabel("Costo unitario").fill("10");
  await expect(page.getByLabel("Cantidad")).toHaveValue("5");
  await page.getByRole("button", { name: "Crear borrador" }).click();

  // La creación asigna el código en una transacción serializable: puede tardar unos segundos.
  await expect(page).toHaveURL(/\/purchase-orders\/[0-9a-f-]{36}$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/OC-\d{4}-\d{4}/);
  await expect(page.getByText("Borrador").first()).toBeVisible();

  await page.getByRole("button", { name: "Enviar al proveedor" }).click();
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(page.getByText("Enviada").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Recibir mercancía" })).toBeVisible();

  await page.getByRole("button", { name: "Recibir mercancía" }).click();
  await page.getByRole("button", { name: "Recibir todo lo pendiente" }).click();
  await page.getByRole("button", { name: "Confirmar recepción" }).click();
  await expect(page.getByText("Recibida", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Recibir mercancía" })).toHaveCount(0);

  expect(await stockByWarehouse(request, product.id)).toEqual({ SUR: 5 });

  const detail = await request.get(`/api/v1/products/${product.id}`);
  const data = ((await detail.json()) as { data: { avgCost: number; totalStock: number } }).data;
  expect(data).toMatchObject({ avgCost: 10, totalStock: 5 });
});
