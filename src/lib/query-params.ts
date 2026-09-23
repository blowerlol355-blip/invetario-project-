import { z } from "zod";

/** searchParams tal como los entrega Next.js a una página. */
export type SearchParams = Record<string, string | string[] | undefined>;

export const STATUS_FILTERS = ["all", "active", "inactive"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export const PAGE_SIZES = [10, 20, 50] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

const pageSizeSchema = z.coerce
  .number()
  .int()
  // Sin predicado de tipo: `pageSize` queda como number para que la API pública
  // pueda construir ListParams con tamaños de página libres (1..100).
  .refine((value) => (PAGE_SIZES as readonly number[]).includes(value));

export const listParamsSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: pageSizeSchema.catch(10),
  q: z.string().trim().max(100).catch(""),
  sort: z.string().trim().max(50).catch(""),
  order: z.enum(["asc", "desc"]).catch("asc"),
  status: z.enum(STATUS_FILTERS).catch("all"),
});

export type ListParams = z.infer<typeof listParamsSchema>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Normaliza los searchParams de una página de listado; los valores inválidos caen al default. */
export function parseListParams(
  searchParams: SearchParams,
  defaults: Partial<ListParams> = {},
): ListParams {
  const raw: Record<string, string> = {};
  for (const key of Object.keys(listParamsSchema.shape)) {
    const value = first(searchParams[key]);
    if (value !== undefined) raw[key] = value;
  }
  return listParamsSchema.parse({ ...defaults, ...raw });
}

/** Devuelve `sort` si está en la lista blanca; si no, el valor por defecto. */
export function resolveSort<T extends string>(sort: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(sort) ? (sort as T) : fallback;
}

/** Condición Prisma para el filtro de estado. */
export function statusWhere(status: StatusFilter): { isActive?: boolean } {
  if (status === "active") return { isActive: true };
  if (status === "inactive") return { isActive: false };
  return {};
}

export interface Paginated<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export function paginate<T>(rows: T[], total: number, params: ListParams): Paginated<T> {
  return {
    rows,
    total,
    page: params.page,
    pageSize: params.pageSize,
    pageCount: Math.max(1, Math.ceil(total / params.pageSize)),
  };
}

/** skip/take para Prisma. */
export function pagination(params: ListParams): { skip: number; take: number } {
  return { skip: (params.page - 1) * params.pageSize, take: params.pageSize };
}
