import { apiPaginated, apiRoute, parseQuery } from "@/features/api/handler";
import { apiStockQuerySchema, toListParams } from "@/features/api/schemas";
import { listStock } from "@/features/stock/queries";

export const dynamic = "force-dynamic";

/** GET /api/v1/stock: existencia por producto y almacén (solo filas con stock salvo includeZero). */
export const GET = apiRoute({ permission: "products:read" }, async ({ url }) => {
  const query = parseQuery(apiStockQuerySchema, url);
  const result = await listStock(toListParams(query), {
    productId: query.productId,
    warehouseId: query.warehouseId,
    includeZero: query.includeZero,
  });
  return apiPaginated(result);
});
