import { type APIRequestContext, expect, type Page, test as base } from "@playwright/test";

export const DEMO = {
  admin: { email: "admin@stockpilot.dev", password: "Admin123!", name: "Ana Torres" },
  manager: { email: "manager@stockpilot.dev", password: "Manager123!", name: "Luis Medina" },
  operator: { email: "operator@stockpilot.dev", password: "Operator123!", name: "Carla Rojas" },
} as const;

/** Prefijo de todo lo que crean los tests; global-teardown lo elimina. */
export const E2E_PREFIX = "E2E-";

export function uniqueSku(): string {
  return `${E2E_PREFIX}${Date.now().toString(36).toUpperCase()}`;
}

export async function login(page: Page, user: { email: string; password: string }) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(user.email);
  await page.getByLabel("Contraseña", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.waitForURL("**/dashboard");
}

interface ApiEnvelope<T> {
  data: T;
}

/** Crea un producto de prueba a través de la API (misma sesión que el navegador). */
export async function createProductViaApi(
  request: APIRequestContext,
  overrides: Record<string, unknown> = {},
) {
  const categories = await request.get("/api/v1/products?pageSize=1");
  expect(categories.ok()).toBeTruthy();
  const first = ((await categories.json()) as ApiEnvelope<{ id: string }[]>).data[0];
  const detail = await request.get(`/api/v1/products/${first?.id}`);
  const category = ((await detail.json()) as ApiEnvelope<{ category: { id: string } }>).data
    .category;

  const sku = uniqueSku();
  const response = await request.post("/api/v1/products", {
    data: {
      sku,
      name: `Producto E2E ${sku}`,
      categoryId: category.id,
      costPrice: 10,
      salePrice: 15,
      minStock: 1,
      ...overrides,
    },
  });
  expect(response.status(), await response.text()).toBe(201);
  return ((await response.json()) as ApiEnvelope<{ id: string; sku: string; name: string }>).data;
}

/** Existencia por almacén (código -> cantidad) de un producto, vía API. */
export async function stockByWarehouse(request: APIRequestContext, productId: string) {
  const response = await request.get(`/api/v1/stock?productId=${productId}&includeZero=true`);
  expect(response.ok()).toBeTruthy();
  const rows = (
    (await response.json()) as ApiEnvelope<{ warehouseCode: string; quantity: number }[]>
  ).data;
  return Object.fromEntries(rows.map((row) => [row.warehouseCode, row.quantity]));
}

/** Selecciona una opción de un Select de shadcn/ui por la etiqueta de su campo. */
export async function selectOption(page: Page, label: string | RegExp, option: string | RegExp) {
  await page.getByLabel(label).click();
  await page.getByRole("option", { name: option }).first().click();
}

/** Elige un producto en el combobox de búsqueda (Command + Popover). */
export async function pickProduct(
  page: Page,
  combobox: ReturnType<Page["getByRole"]>,
  sku: string,
) {
  await combobox.click();
  await page.getByPlaceholder("Escribe para filtrar...").fill(sku);
  await page.getByRole("option", { name: new RegExp(sku) }).click();
}

/**
 * Test base: falla si el navegador reporta violaciones de la CSP o errores de consola
 * durante el flujo (la CSP se aplica en modo estricto desde la Fase 10).
 */
export const test = base.extend<{ consoleGuard: void }>({
  consoleGuard: [
    async ({ page }, use) => {
      const problems: string[] = [];
      page.on("console", (message) => {
        const text = message.text();
        if (
          text.includes("Content Security Policy") ||
          text.includes("Content-Security-Policy") ||
          (message.type() === "error" && !text.includes("favicon"))
        ) {
          problems.push(`[${message.type()}] ${text}`);
        }
      });
      await use();
      expect(problems, "errores de consola o violaciones de CSP").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
