import { revalidatePath } from "next/cache";
import { z } from "zod";

import { apiJson, apiRoute, parseBody } from "@/features/api/handler";
import { apiProductBodySchema } from "@/features/api/schemas";
import { getProductDetail } from "@/features/products/queries";
import { updateProduct } from "@/features/products/service";
import { NotFoundError } from "@/lib/errors";

export const dynamic = "force-dynamic";

const UNIQUE_MESSAGES = { sku: "Ya existe un producto con ese SKU." };
const NOT_FOUND = "El producto no existe.";

type Params = { id: string };

function assertUuid(id: string): void {
  if (!z.uuid().safeParse(id).success) throw new NotFoundError(NOT_FOUND);
}

/** GET /api/v1/products/{id}: detalle con existencia por almacén. */
export const GET = apiRoute<Params>({ permission: "products:read" }, async ({ params }) => {
  assertUuid(params.id);
  const product = await getProductDetail(params.id);
  if (!product) throw new NotFoundError(NOT_FOUND);
  return apiJson(product);
});

/** PUT /api/v1/products/{id}: reemplaza los datos del producto (requiere products:manage). */
export const PUT = apiRoute<Params>(
  { permission: "products:manage", unique: UNIQUE_MESSAGES },
  async ({ request, params, principal }) => {
    assertUuid(params.id);
    const input = await parseBody(apiProductBodySchema, request);
    await updateProduct(params.id, input, principal.userId);
    revalidatePath("/products");
    revalidatePath(`/products/${params.id}`);
    return apiJson(await getProductDetail(params.id));
  },
);
