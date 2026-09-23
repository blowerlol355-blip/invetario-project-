import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Ejecuta la limpieza de datos E2E en un proceso aparte con tsx: el cliente Prisma
 * generado es ESM (usa import.meta) y el cargador de Playwright lo trata como CommonJS.
 * Carga .env si existe (en CI las variables ya vienen del entorno).
 */
export default function globalTeardown() {
  const script = join(__dirname, "cleanup.ts");
  const envFlag = existsSync(join(process.cwd(), ".env")) ? "--env-file=.env " : "";
  execSync(`npx tsx ${envFlag}"${script}"`, { stdio: "inherit", cwd: process.cwd() });
}
