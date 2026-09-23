"use server";

import { revalidatePath } from "next/cache";

import { runStockMovement } from "@/features/stock/lib/run-movement";
import { toMovementCommand } from "@/features/stock/lib/to-command";
import { type MovementInput, movementSchema } from "@/features/stock/schemas";
import { type ActionResult, ok, toActionError } from "@/lib/action-result";
import { requirePermission } from "@/lib/auth-guards";

export interface CreateMovementResult {
  movementId: string;
  productId: string;
  newAverageCost: number | null;
  balances: { warehouseId: string; quantity: number }[];
}

export async function createMovementAction(
  input: MovementInput,
): Promise<ActionResult<CreateMovementResult>> {
  try {
    const session = await requirePermission("movements:create");
    const values = movementSchema.parse(input);
    const result = await runStockMovement(toMovementCommand(values, session.user.id));

    revalidatePath("/movements");
    revalidatePath("/products");
    revalidatePath(`/products/${result.productId}`);
    revalidatePath("/dashboard");
    revalidatePath("/alerts");
    return ok(result);
  } catch (error) {
    return toActionError(error);
  }
}
