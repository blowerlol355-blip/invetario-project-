import "server-only";

import { hashApiKey, isApiKeyFormat } from "@/features/users/lib/api-key";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { UserRole } from "@/lib/domain";
import { AuthorizationError } from "@/lib/errors";

/** Identidad resuelta para una petición de la API. */
export interface ApiPrincipal {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  /** Mecanismo usado: clave de API (integraciones) o cookie de sesión (navegador). */
  via: "api-key" | "session";
}

const INVALID_KEY_MESSAGE = "Clave de API inválida o revocada.";

function readBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    throw new AuthorizationError("Cabecera Authorization inválida. Usa: Bearer <clave>.", 401);
  }
  return token.trim();
}

async function authenticateApiKey(token: string): Promise<ApiPrincipal> {
  if (!isApiKeyFormat(token)) throw new AuthorizationError(INVALID_KEY_MESSAGE, 401);
  const user = await prisma.user.findFirst({
    where: { apiKeyHash: hashApiKey(token) },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  if (!user) throw new AuthorizationError(INVALID_KEY_MESSAGE, 401);
  if (!user.isActive) throw new AuthorizationError("La cuenta está desactivada.", 401);
  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    via: "api-key",
  };
}

/**
 * Resuelve quién llama a la API: primero `Authorization: Bearer <clave>` y, si no
 * hay cabecera, la sesión del navegador (permite probar la API desde /api-docs).
 * Lanza AuthorizationError 401 si no hay identidad válida.
 */
export async function authenticateApiRequest(request: Request): Promise<ApiPrincipal> {
  const token = readBearerToken(request);
  if (token) return authenticateApiKey(token);

  const session = await auth();
  if (!session?.user) {
    throw new AuthorizationError(
      "Autenticación requerida: envía Authorization: Bearer <clave de API>.",
      401,
    );
  }
  return {
    userId: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    role: session.user.role,
    via: "session",
  };
}
