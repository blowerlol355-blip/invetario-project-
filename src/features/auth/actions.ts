"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";

import { loginSchema } from "@/features/auth/schemas";
import { signIn, signOut } from "@/lib/auth";
import { createRateLimiter } from "@/lib/rate-limit";

export interface LoginActionResult {
  error?: string;
}

/** 5 intentos fallidos por IP + correo cada 15 minutos. */
const loginLimiter = createRateLimiter({ limit: 5, windowMs: 15 * 60 * 1000 });

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "local";
}

/** Rutas internas válidas para volver tras el login (evita open redirects). */
function safeCallbackUrl(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }
  return value;
}

export async function loginAction(
  input: { email: string; password: string },
  callbackUrl?: string,
): Promise<LoginActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const key = `${await getClientIp()}:${parsed.data.email}`;
  const limit = loginLimiter.check(key);
  if (!limit.allowed) {
    const minutes = Math.max(1, Math.ceil(limit.retryAfterMs / 60_000));
    return {
      error: `Demasiados intentos fallidos. Inténtalo de nuevo en ${minutes} minuto${minutes === 1 ? "" : "s"}.`,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: safeCallbackUrl(callbackUrl),
    });
    loginLimiter.reset(key);
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      loginLimiter.consume(key);
      if ("code" in error && error.code === "inactive") {
        return { error: "Tu cuenta está desactivada. Contacta a un administrador." };
      }
      return { error: "Correo o contraseña incorrectos." };
    }
    // signIn redirige lanzando NEXT_REDIRECT: hay que propagarlo.
    throw error;
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
