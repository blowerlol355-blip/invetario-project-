import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { AuditAction } from "@/lib/domain";

/** Cliente Prisma normal o cliente de transacción interactiva. */
export type DbClient = PrismaClient | Prisma.TransactionClient;

export interface AuditEntry {
  userId: string | null;
  action: AuditAction;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
}

const SENSITIVE_KEYS = new Set(["passwordHash", "password", "apiKeyHash", "apiKey"]);

/**
 * Serializa un snapshot para la bitácora: fechas en ISO, decimales de Prisma como
 * número y sin campos sensibles. Devuelve null si no hay valor.
 */
export function serializeSnapshot(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  return JSON.stringify(value, (key, current: unknown) => {
    if (SENSITIVE_KEYS.has(key)) return undefined;
    if (current instanceof Date) return current.toISOString();
    if (isDecimalLike(current)) return Number(current.toString());
    return current;
  });
}

function isDecimalLike(value: unknown): value is { toString(): string } {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "toFixed" in value &&
    typeof (value as { toFixed: unknown }).toFixed === "function"
  );
}

/**
 * Registra una entrada de auditoría. Debe llamarse dentro de la misma transacción
 * que el cambio para que ambos se confirmen o se reviertan juntos.
 */
export async function recordAudit(db: DbClient, entry: AuditEntry): Promise<void> {
  await db.auditLog.create({
    data: {
      userId: entry.userId,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      before: serializeSnapshot(entry.before),
      after: serializeSnapshot(entry.after),
    },
  });
}
