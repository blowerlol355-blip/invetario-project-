import { describe, expect, it } from "vitest";

import { loginSchema } from "@/features/auth/schemas";

describe("loginSchema", () => {
  it("normaliza el correo a minúsculas y sin espacios", () => {
    const result = loginSchema.parse({ email: "  Admin@StockPilot.dev ", password: "x" });
    expect(result.email).toBe("admin@stockpilot.dev");
  });

  it("rechaza correos inválidos y contraseñas vacías", () => {
    expect(loginSchema.safeParse({ email: "no-es-correo", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });

  it("devuelve mensajes en español", () => {
    const result = loginSchema.safeParse({ email: "", password: "" });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message) ?? [];
    expect(messages).toContain("El correo es obligatorio");
    expect(messages).toContain("La contraseña es obligatoria");
  });
});
