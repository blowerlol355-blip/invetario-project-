import { createHash, randomBytes } from "node:crypto";

/** Prefijo que identifica las claves de StockPilot (facilita detectarlas en logs y secretos). */
export const API_KEY_PREFIX = "sp_";
const API_KEY_BYTES = 24;
const API_KEY_PATTERN = /^sp_[0-9a-f]{48}$/;

export interface GeneratedApiKey {
  /** Clave en claro: se entrega una única vez al usuario. */
  key: string;
  /** SHA-256 en hexadecimal; es lo único que se guarda en la base. */
  hash: string;
}

/** Deriva el hash que se almacena y se compara; la clave en claro nunca se persiste. */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key, "utf8").digest("hex");
}

export function generateApiKey(): GeneratedApiKey {
  const key = `${API_KEY_PREFIX}${randomBytes(API_KEY_BYTES).toString("hex")}`;
  return { key, hash: hashApiKey(key) };
}

/** Formato válido de una clave: descarta rápido cadenas arbitrarias antes de ir a la base. */
export function isApiKeyFormat(value: string): boolean {
  return API_KEY_PATTERN.test(value);
}
