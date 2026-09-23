import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { GENERIC_ERROR_MESSAGE, ok, toActionError } from "@/lib/action-result";
import { AuthorizationError, BusinessRuleError, NotFoundError } from "@/lib/errors";

describe("toActionError", () => {
  it("convierte errores de Zod en errores por campo", () => {
    const schema = z.object({ name: z.string().min(2, "Muy corto") });
    const error = schema.safeParse({ name: "a" }).error!;
    const result = toActionError(error);
    expect(result).toEqual({
      success: false,
      error: "Revisa los campos marcados.",
      fieldErrors: { name: ["Muy corto"] },
    });
  });

  it("propaga el mensaje de errores de negocio, autorización y no encontrado", () => {
    expect(toActionError(new BusinessRuleError("Regla incumplida"))).toMatchObject({
      success: false,
      error: "Regla incumplida",
    });
    expect(toActionError(new AuthorizationError("Sin permiso", 403))).toMatchObject({
      error: "Sin permiso",
    });
    expect(toActionError(new NotFoundError())).toMatchObject({
      error: "El registro no existe o fue eliminado.",
    });
  });

  it("mapea violaciones de unicidad de Prisma al campo indicado", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "test",
      meta: { target: "categories_name_key" },
    });
    const result = toActionError(error, { unique: { name: "Nombre duplicado" } });
    expect(result).toEqual({
      success: false,
      error: "Nombre duplicado",
      fieldErrors: { name: ["Nombre duplicado"] },
    });
  });

  it("detecta el índice violado en el mensaje del driver adapter de SQL Server", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "test",
      meta: {
        driverAdapterError: {
          name: "DriverAdapterError",
          cause: {
            kind: "UniqueConstraintViolation",
            originalMessage:
              "Violation of UNIQUE KEY constraint warehouses_code_key. Cannot insert duplicate key in object dbo.warehouses.",
            constraint: { index: "dbo.warehouses" },
          },
        },
        modelName: "Warehouse",
      },
    });
    const result = toActionError(error, { unique: { code: "Código duplicado" } });
    expect(result).toMatchObject({
      error: "Código duplicado",
      fieldErrors: { code: ["Código duplicado"] },
    });
  });

  it("usa un mensaje genérico de duplicado si no reconoce el campo", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "test",
      meta: {},
    });
    expect(toActionError(error, { unique: { name: "x" } })).toEqual({
      success: false,
      error: "Ya existe un registro con esos datos.",
    });
  });

  it("oculta errores internos detrás de un mensaje genérico", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = toActionError(new Error("Login failed for user 'sa'"));
    expect(result).toEqual({ success: false, error: GENERIC_ERROR_MESSAGE });
    expect(JSON.stringify(result)).not.toContain("sa");
    spy.mockRestore();
  });

  it("ok envuelve los datos", () => {
    expect(ok({ id: "1" })).toEqual({ success: true, data: { id: "1" } });
  });
});
