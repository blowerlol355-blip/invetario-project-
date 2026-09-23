import "dotenv/config";

import { defineConfig, env } from "prisma/config";

/**
 * Configuración de Prisma 7. La URL de conexión vive aquí (no en schema.prisma)
 * y el cliente en runtime usa el driver adapter @prisma/adapter-mssql (src/lib/db.ts).
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
