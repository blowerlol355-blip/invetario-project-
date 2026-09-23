import type { PurchaseOrderStatus } from "@/lib/domain";
import { BusinessRuleError } from "@/lib/errors";

export type PurchaseOrderAction = "edit" | "send" | "receive" | "cancel";

/** Estados desde los que se permite cada acción. */
export const ALLOWED_STATES: Record<PurchaseOrderAction, readonly PurchaseOrderStatus[]> = {
  edit: ["DRAFT"],
  send: ["DRAFT"],
  receive: ["SENT", "PARTIALLY_RECEIVED"],
  cancel: ["DRAFT", "SENT"],
};

const ACTION_LABELS: Record<PurchaseOrderAction, string> = {
  edit: "editar",
  send: "enviar",
  receive: "recibir",
  cancel: "cancelar",
};

export function canPerform(status: string, action: PurchaseOrderAction): boolean {
  return (ALLOWED_STATES[action] as readonly string[]).includes(status);
}

/** Lanza un error de negocio legible si la acción no está permitida en ese estado. */
export function assertCanPerform(status: string, action: PurchaseOrderAction): void {
  if (!canPerform(status, action)) {
    throw new BusinessRuleError(
      `No se puede ${ACTION_LABELS[action]} una orden en estado "${statusLabel(status)}".`,
    );
  }
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: "Borrador",
    SENT: "Enviada",
    PARTIALLY_RECEIVED: "Recibida parcialmente",
    RECEIVED: "Recibida",
    CANCELLED: "Cancelada",
  };
  return labels[status] ?? status;
}

/**
 * Construye el siguiente código correlativo del año: OC-2026-0001, OC-2026-0002...
 * `lastCode` es el mayor código existente con el prefijo del año (o null).
 */
export function buildPurchaseOrderCode(year: number, lastCode: string | null): string {
  const prefix = `OC-${year}-`;
  const lastNumber = lastCode?.startsWith(prefix)
    ? Number.parseInt(lastCode.slice(prefix.length), 10)
    : 0;
  const next = Number.isFinite(lastNumber) ? lastNumber + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}
