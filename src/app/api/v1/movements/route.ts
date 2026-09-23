import { revalidatePath } from "next/cache";

import { apiJson, apiPaginated, apiRoute, parseBody, parseQuery } from "@/features/api/handler";
import {
  apiMovementBodySchema,
  apiMovementQuerySchema,
  toListParams,
} from "@/features/api/schemas";
import { runStockMovement } from "@/features/stock/lib/run-movement";
import { listMovements } from "@/features/stock/queries";

export const dynamic = "force-dynamic";

/** GET /api/v1/movements: historial paginado con filtros por tipo, producto, almacén, usuario y fechas. */
export const GET = apiRoute({ permission: "movements:read" }, async ({ url }) => {
  const query = parseQuery(apiMovementQuerySchema, url);
  const result = await listMovements(toListParams(query), {
    type: query.type ?? "",
    productId: query.productId ?? "",
    warehouseId: query.warehouseId ?? "",
    userId: query.userId ?? "",
    from: query.from ?? "",
    to: query.to ?? "",
  });
  return apiPaginated(result);
});

/**
 * POST /api/v1/movements: registra un movimiento con las mismas reglas que la UI
 * (stock nunca negativo, transferencias atómicas, costo promedio ponderado).
 */
export const POST = apiRoute({ permission: "movements:create" }, async ({ request, principal }) => {
  const body = await parseBody(apiMovementBodySchema, request);
  const result = await runStockMovement({
    ...body,
    reference: body.reference ? body.reference.toUpperCase() : null,
    userId: principal.userId,
  });

  revalidatePath("/movements");
  revalidatePath("/products");
  revalidatePath(`/products/${result.productId}`);
  revalidatePath("/dashboard");
  revalidatePath("/alerts");
  return apiJson(result, { status: 201 });
});
