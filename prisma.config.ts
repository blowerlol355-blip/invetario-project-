import "dotenv/config";

import { defineConfig } from "prisma/config";

/**
 * Configuración de Prisma 7. La URL de conexión vive aquí (no en schema.prisma)
 * y el cliente en runtime usa el driver adapter @prisma/adapter-mssql (src/lib/db.ts).
 *
 * `prisma generate` (postinstall) no necesita conectarse: si DATABASE_URL no está
 * definida se usa un marcador para que la instalación no falle (Vercel, CI). Los
 * comandos que sí conectan (migrate, seed) fallan con un error de conexión claro.
 */
const DATABASE_URL_PLACEHOLDER =
  "sqlserver://localhost:1433;database=stockpilot;user=missing;password=missing";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? DATABASE_URL_PLACEHOLDER,
  },
});
