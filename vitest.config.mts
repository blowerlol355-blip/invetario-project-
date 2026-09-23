import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      // Permite importar módulos marcados con "server-only" en tests unitarios.
      "server-only": fileURLToPath(new URL("./tests/mocks/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    // Variables mínimas para que src/lib/env.ts valide en tests unitarios (sin BD real).
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/stockpilot_test",
      AUTH_SECRET: "secreto-de-pruebas-unitarias-con-mas-de-32-caracteres",
    },
    include: ["tests/unit/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**"],
    coverage: {
      provider: "v8",
      // Capa de lógica de negocio: reglas puras, esquemas y utilidades. Las consultas,
      // Server Actions y adaptadores (Prisma, Auth.js, pdfmake) se prueban en E2E.
      include: [
        "src/features/**/lib/**",
        "src/features/**/schemas.ts",
        "src/features/api/handler.ts",
        "src/lib/**",
      ],
      exclude: [
        "src/generated/**",
        "**/*.d.ts",
        "src/lib/db.ts",
        "src/lib/auth.ts",
        "src/lib/auth.config.ts",
        "src/lib/transaction.ts",
        "src/features/reports/lib/pdf.ts",
        "src/features/stock/lib/run-movement.ts",
      ],
      reporter: ["text", "html", "lcov"],
      thresholds: { lines: 70, functions: 70, branches: 70, statements: 70 },
    },
  },
});
