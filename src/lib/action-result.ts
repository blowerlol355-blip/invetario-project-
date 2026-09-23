import { ZodError } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { AuthorizationError, BusinessRuleError, NotFoundError } from "@/lib/errors";

/** Resultado uniforme de toda Server Action. */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export const GENERIC_ERROR_MESSAGE =
  "Ocurrió un error inesperado. Inténtalo de nuevo o contacta al administrador.";

export interface ActionErrorOptions {
  /**
   * Mensajes para violaciones de unicidad, indexados por nombre de campo.
   * Se busca el campo dentro del nombre del índice/constraint reportado por Prisma.
   */
  unique?: Record<string, string>;
}

export function ok<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function fail<T = never>(
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<T> {
  return { success: false, error, ...(fieldErrors ? { fieldErrors } : {}) };
}

export function isUniqueViolation(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/**
 * Texto donde buscar el nombre del índice violado. Con el motor clásico Prisma
 * rellena `meta.target`; con el driver adapter de SQL Server el nombre del
 * constraint solo aparece en el mensaje original del driver.
 */
export function uniqueTarget(error: Prisma.PrismaClientKnownRequestError): string {
  const meta = (error.meta ?? {}) as Record<string, unknown>;
  const parts: string[] = [];
  const target = meta.target;
  if (Array.isArray(target)) parts.push(target.join(","));
  else if (typeof target === "string") parts.push(target);

  const adapterError = meta.driverAdapterError as { cause?: Record<string, unknown> } | undefined;
  const cause = adapterError?.cause;
  if (cause) {
    if (typeof cause.originalMessage === "string") parts.push(cause.originalMessage);
    const constraint = cause.constraint as { index?: string; fields?: string[] } | undefined;
    if (constraint?.index) parts.push(constraint.index);
    if (constraint?.fields) parts.push(constraint.fields.join(","));
  }
  return parts.join(" ");
}

/**
 * Convierte cualquier error lanzado dentro de una Server Action en un ActionResult
 * seguro para el cliente. Nunca expone mensajes internos de Prisma o SQL Server.
 */
export function toActionError<T = never>(
  error: unknown,
  options: ActionErrorOptions = {},
): ActionResult<T> {
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.map(String).join(".") || "_root";
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return fail("Revisa los campos marcados.", fieldErrors);
  }

  if (
    error instanceof AuthorizationError ||
    error instanceof BusinessRuleError ||
    error instanceof NotFoundError
  ) {
    return fail(error.message);
  }

  if (isUniqueViolation(error)) {
    const target = uniqueTarget(error).toLowerCase();
    for (const [field, message] of Object.entries(options.unique ?? {})) {
      if (target.includes(field.toLowerCase())) {
        return fail(message, { [field]: [message] });
      }
    }
    return fail("Ya existe un registro con esos datos.");
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return fail(new NotFoundError().message);
  }

  console.error("[action] error no controlado:", error);
  return fail(GENERIC_ERROR_MESSAGE);
}
