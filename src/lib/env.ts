import { z } from "zod";

/**
 * Esquema de variables de entorno del servidor.
 * Se valida una sola vez al arrancar (importado desde next.config.ts) para
 * fallar temprano con un mensaje claro en lugar de errores crípticos en runtime.
 *
 * Este módulo solo debe importarse desde código de servidor.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL es obligatoria")
    .startsWith("sqlserver://", "DATABASE_URL debe usar el protocolo sqlserver://"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET debe tener al menos 32 caracteres"),
  AUTH_URL: z.url("AUTH_URL debe ser una URL válida").optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Valida un objeto de variables de entorno contra el esquema.
 * Lanza un Error legible que enumera cada variable inválida.
 */
export function parseEnv(raw: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(raíz)"}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Variables de entorno inválidas. Revisa tu archivo .env (usa .env.example como guía):\n${details}`,
    );
  }

  return result.data;
}

const skipValidation = process.env.SKIP_ENV_VALIDATION === "true";

/** Variables de entorno validadas y tipadas. */
export const env: Env = skipValidation
  ? (process.env as unknown as Env)
  : parseEnv(process.env as Record<string, string | undefined>);
