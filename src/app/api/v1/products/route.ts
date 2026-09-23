import { revalidatePath } from "next/cache";

import { apiJson, apiPaginated, apiRoute, parseBody, parseQuery } from "@/features/api/handler";
import { apiProductBodySchema, apiProductQuerySchema, toListParams } from "@/features/api/schemas";
import { getProductDetail, listProducts } from "@/features/products/queries";
import { createProduct } from "@/features/products/service";

export const dynamic = "force-dynamic";

const UNIQUE_MESSAGES = { sku: "Ya existe un producto con ese SKU." };

/** GET /api/v1/products: listado paginado con búsqueda, filtros y orden. */
export const GET = apiRoute({ permission: "products:read" }, async ({ url }) => {
  const query = parseQuery(apiProductQuerySchema, url);
  const result = await listProducts(toListParams(query), {
    categoryId: query.categoryId ?? "",
    supplierId: query.supplierId ?? "",
  });
  return apiPaginated(result);
});

/** POST /api/v1/products: crea un producto (requiere products:manage). */
export const POST = apiRoute(
  { permission: "products:manage", unique: UNIQUE_MESSAGES },
  async ({ request, principal }) => {
    const input = await parseBody(apiProductBodySchema, request);
    const { id } = await createProduct(input, principal.userId);
    revalidatePath("/products");
    const product = await getProductDetail(id);
    return apiJson(product, { status: 201, headers: { Location: `/api/v1/products/${id}` } });
  },
);
