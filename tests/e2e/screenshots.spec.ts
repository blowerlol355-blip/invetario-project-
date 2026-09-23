import { test } from "@playwright/test";

/**
 * Genera las capturas del README (docs/screenshots). No forma parte de la suite normal:
 *   npm run build && npx playwright test --project=screenshots
 */
const PAGES = [
  { path: "/dashboard", file: "dashboard.png" },
  { path: "/products", file: "products.png" },
  { path: "/movements", file: "movements.png" },
  { path: "/purchase-orders", file: "purchase-orders.png" },
  { path: "/reports/inventory", file: "reports.png" },
  { path: "/audit", file: "audit.png" },
];

test.use({ viewport: { width: 1440, height: 900 } });

for (const { path, file } of PAGES) {
  test(`captura ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.getByRole("heading", { level: 1 }).waitFor();
    // Deja terminar las animaciones de entrada antes de capturar.
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `docs/screenshots/${file}`, fullPage: false });
  });
}
