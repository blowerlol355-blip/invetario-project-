import "dotenv/config";

import { defineConfig } from "prisma/config";

/**
 * Configuración de Prisma 7. La URL de conexión vive aquí (no en schema.prisma)
 * y el cliente en runtime usa el driver adapter @prisma/adapter-pg (src/lib/db.ts).
 *
 * Migraciones y seed usan DIRECT_URL si existe (conexión de sesión de Supabase,
 * puerto 5432) y si no DATABASE_URL. `prisma generate` (postinstall) no necesita
 * conectarse: sin variables se usa un marcador para que la instalación no falle
 * (Vercel, CI). Los comandos que sí conectan fallan con un error de conexión claro.
 */
const DATABASE_URL_PLACEHOLDER = "postgresql://missing:missing@localhost:5432/stockpilot";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url:
      process.env.DIRECT_URL?.trim() ||
      process.env.DATABASE_URL?.trim() ||
      DATABASE_URL_PLACEHOLDER,
  },
});
