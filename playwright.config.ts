import { defineConfig, devices } from "@playwright/test";

/**
 * Tests de extremo a extremo contra el build de producción (`npm run build` previo)
 * y la base de datos local sembrada (`npm run db:seed`). Los datos que crean llevan el
 * prefijo E2E- y se eliminan en tests/e2e/global-teardown.ts.
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export const ADMIN_STATE = "tests/e2e/.auth/admin.json";
export const OPERATOR_STATE = "tests/e2e/.auth/operator.json";

export default defineConfig({
  testDir: "tests/e2e",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  // Los flujos comparten la misma base de datos: se ejecutan en serie.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    // PLAYWRIGHT_CHANNEL=chrome|msedge usa el navegador instalado en lugar del Chromium descargado.
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    locale: "es-419",
    timezoneId: "America/Bogota",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: ADMIN_STATE },
      dependencies: ["setup"],
      testIgnore: /screenshots\.spec\.ts/,
    },
    {
      // Capturas para el README: `npx playwright test --project=screenshots`.
      name: "screenshots",
      testMatch: /screenshots\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: ADMIN_STATE, colorScheme: "light" },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: `npm run start -- --port ${PORT}`,
    // Auth.js redirige a AUTH_URL tras el login: debe apuntar al servidor de pruebas.
    env: { AUTH_URL: baseURL },
    url: `${baseURL}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
