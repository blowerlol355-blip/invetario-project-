import "server-only";

import {
  applyStockMovement,
  type StockMovementCommand,
  type StockMovementResult,
} from "@/features/stock/lib/apply-movement";
import { recordAudit } from "@/lib/audit";
import { withSerializableTransaction } from "@/lib/transaction";

/**
 * Ejecuta un movimiento en su propia transacción serializable y lo audita.
 * Reintenta ante conflictos de concurrencia detectados por PostgreSQL (P2034).
 */
export async function runStockMovement(
  command: StockMovementCommand,
): Promise<StockMovementResult> {
  return withSerializableTransaction(async (tx) => {
    const result = await applyStockMovement(tx, command);
    await recordAudit(tx, {
      userId: command.userId,
      action: "CREATE",
      entity: "StockMovement",
      entityId: result.movementId,
      after: { ...command, balances: result.balances, newAverageCost: result.newAverageCost },
    });
    return result;
  });
}
