import { describe, expect, it } from "vitest";

import {
  passwordResetSchema,
  passwordSchema,
  userCreateSchema,
  userFiltersSchema,
} from "@/features/users/schemas";

describe("esquemas de usuarios", () => {
  it("exige letra y número en la contraseña", () => {
    expect(passwordSchema.safeParse("Clave123").success).toBe(true);
    expect(passwordSchema.safeParse("12345678").success).toBe(false);
    expect(passwordSchema.safeParse("soloLetras").success).toBe(false);
    expect(passwordSchema.safeParse("Ab1").success).toBe(false);
  });

  it("valida correo, rol y contraseña al crear", () => {
    const result = userCreateSchema.safeParse({
      name: "  Ana  ",
      email: "ana@empresa.com",
      role: "MANAGER",
      password: "Clave123",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Ana");

    const invalid = userCreateSchema.safeParse({
      name: "A",
      email: "no-es-correo",
      role: "ROOT",
      password: "corta",
    });
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      const paths = invalid.error.issues.map((issue) => issue.path[0]);
      expect(paths).toEqual(expect.arrayContaining(["name", "email", "role", "password"]));
    }
  });

  it("comprueba que la confirmación coincide", () => {
    const result = passwordResetSchema.safeParse({ password: "Clave123", confirm: "Clave124" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(["confirm"]);
  });

  it("el filtro de rol cae a vacío si es inválido", () => {
    expect(userFiltersSchema.parse({ role: "ADMIN" }).role).toBe("ADMIN");
    expect(userFiltersSchema.parse({ role: "x" }).role).toBe("");
  });
});
