import "server-only";

import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

import { type ApiPrincipal, authenticateApiRequest } from "@/features/api/auth";
import { Prisma } from "@/generated/prisma/client";
import { isUniqueViolation, uniqueTarget } from "@/lib/action-result";
import { AuthorizationError, BusinessRuleError, ConflictError, NotFoundError } from "@/lib/errors";
import { hasPermission, type Permission } from "@/lib/permissions";
import type { Paginated } from "@/lib/query-params";
import { createRateLimiter } from "@/lib/rate-limit";

/**
 * Infraestructura común de la API REST pública (/api/v1): autenticación, permisos,
 * rate limiting, validación y respuestas de error con un formato único.
 */

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "BUSINESS_RULE"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: { path: string; message: string }[];
  };
}

/** Error con estado HTTP explícito para casos que no encajan en los errores de dominio. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details?: { path: string; message: string }[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class RateLimitError extends ApiError {
  constructor(public readonly retryAfterSeconds: number) {
    super(429, "RATE_LIMITED", "Demasiadas peticiones. Inténtalo de nuevo en unos segundos.");
  }
}

export interface ApiErrorOptions {
  /** Mensajes para violaciones de unicidad (P2002) indexados por nombre de campo. */
  unique?: Record<string, string>;
}

/** Traduce cualquier error a (estado, cuerpo) sin filtrar detalles internos. */
export function toApiError(
  error: unknown,
  options: ApiErrorOptions = {},
): { status: number; body: ApiErrorBody; headers?: Record<string, string> } {
  const failure = (
    status: number,
    code: ApiErrorCode,
    message: string,
    details?: ApiErrorBody["error"]["details"],
  ) => ({
    status,
    body: { error: { code, message, ...(details ? { details } : {}) } },
  });

  if (error instanceof ZodError) {
    return failure(
      400,
      "VALIDATION_ERROR",
      "Datos inválidos.",
      error.issues.map((issue) => ({
        path: issue.path.map(String).join("."),
        message: issue.message,
      })),
    );
  }
  if (error instanceof RateLimitError) {
    return {
      ...failure(error.status, error.code, error.message),
      headers: { "Retry-After": String(error.retryAfterSeconds) },
    };
  }
  if (error instanceof ApiError)
    return failure(error.status, error.code, error.message, error.details);
  if (error instanceof AuthorizationError) {
    return failure(
      error.status,
      error.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
      error.message,
    );
  }
  if (error instanceof NotFoundError) return failure(404, "NOT_FOUND", error.message);
  if (error instanceof ConflictError) return failure(409, "CONFLICT", error.message);
  if (error instanceof BusinessRuleError) return failure(422, "BUSINESS_RULE", error.message);
  if (isUniqueViolation(error)) {
    const target = uniqueTarget(error).toLowerCase();
    for (const [field, message] of Object.entries(options.unique ?? {})) {
      if (target.includes(field.toLowerCase())) {
        return failure(409, "CONFLICT", message, [{ path: field, message }]);
      }
    }
    return failure(409, "CONFLICT", "Ya existe un registro con esos datos.");
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return failure(404, "NOT_FOUND", new NotFoundError().message);
  }

  console.error("[api] error no controlado:", error);
  return failure(500, "INTERNAL_ERROR", "Error interno del servidor.");
}

const NO_STORE = { "Cache-Control": "no-store" };

export function apiJson<T>(
  data: T,
  init: { status?: number; meta?: Record<string, unknown>; headers?: Record<string, string> } = {},
): NextResponse {
  return NextResponse.json(
    { data, ...(init.meta ? { meta: init.meta } : {}) },
    { status: init.status ?? 200, headers: { ...NO_STORE, ...init.headers } },
  );
}

export function apiPaginated<T>(result: Paginated<T>): NextResponse {
  return apiJson(result.rows, {
    meta: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      pageCount: result.pageCount,
    },
  });
}

/** Valida los query params; los errores se convierten en 400 con detalle por campo. */
export function parseQuery<T>(schema: ZodType<T>, url: URL): T {
  return schema.parse(Object.fromEntries(url.searchParams.entries()));
}

/** Lee y valida el cuerpo JSON; un JSON malformado responde 400. */
export async function parseBody<T>(schema: ZodType<T>, request: Request): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError(400, "BAD_REQUEST", "El cuerpo debe ser un JSON válido.");
  }
  return schema.parse(raw);
}

// ----------------------------- Rate limiting ------------------------

/** Peticiones por minuto de cada identidad autenticada. */
export const API_RATE_LIMIT = 120;
/** Intentos fallidos de autenticación por minuto y por IP. */
const AUTH_FAILURE_LIMIT = 30;

const principalLimiter = createRateLimiter({ limit: API_RATE_LIMIT, windowMs: 60_000 });
const anonymousLimiter = createRateLimiter({ limit: AUTH_FAILURE_LIMIT, windowMs: 60_000 });

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

// ----------------------------- Envoltorio de rutas ------------------

export interface ApiContext<P> {
  request: Request;
  url: URL;
  params: P;
  principal: ApiPrincipal;
}

export interface ApiRouteOptions extends ApiErrorOptions {
  /** Permiso exigido; si se omite basta con estar autenticado. */
  permission?: Permission;
}

type RouteHandler<P> = (request: Request, context: { params: Promise<P> }) => Promise<Response>;

/**
 * Construye un Route Handler de la API: autentica (clave o sesión), aplica el límite de
 * peticiones, comprueba el permiso y convierte cualquier excepción en una respuesta
 * de error uniforme. Los handlers devuelven `apiJson` / `apiPaginated`.
 */
export function apiRoute<P = Record<string, never>>(
  options: ApiRouteOptions,
  handler: (context: ApiContext<P>) => Promise<Response>,
): RouteHandler<P> {
  return async (request, context) => {
    try {
      let principal: ApiPrincipal;
      try {
        principal = await authenticateApiRequest(request);
      } catch (error) {
        if (error instanceof AuthorizationError) {
          const ip = anonymousLimiter.consume(`ip:${clientIp(request)}`);
          if (!ip.allowed) throw new RateLimitError(Math.ceil(ip.retryAfterMs / 1000));
        }
        throw error;
      }

      const limit = principalLimiter.consume(`user:${principal.userId}`);
      if (!limit.allowed) throw new RateLimitError(Math.ceil(limit.retryAfterMs / 1000));

      if (options.permission && !hasPermission(principal.role, options.permission)) {
        throw new AuthorizationError(
          `Tu rol (${principal.role}) no tiene el permiso ${options.permission}.`,
          403,
        );
      }

      const response = await handler({
        request,
        url: new URL(request.url),
        params: await context.params,
        principal,
      });
      response.headers.set("X-RateLimit-Limit", String(API_RATE_LIMIT));
      response.headers.set("X-RateLimit-Remaining", String(limit.remaining));
      return response;
    } catch (error) {
      const { status, body, headers } = toApiError(error, options);
      return NextResponse.json(body, { status, headers: { ...NO_STORE, ...headers } });
    }
  };
}
