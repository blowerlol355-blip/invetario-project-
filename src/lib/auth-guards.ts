import "server-only";

import type { Session } from "next-auth";

import { auth } from "@/lib/auth";
import { AuthorizationError } from "@/lib/errors";
import { hasPermission, type Permission } from "@/lib/permissions";

export { AuthorizationError };

/** Devuelve la sesión actual o lanza 401. Para Server Actions y Route Handlers. */
export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user) {
    throw new AuthorizationError("Debes iniciar sesión para continuar.", 401);
  }
  return session;
}

/**
 * Exige un permiso concreto. Toda Server Action que modifique datos debe
 * empezar llamando a esta función: nunca se confía solo en la UI.
 */
export async function requirePermission(permission: Permission): Promise<Session> {
  const session = await requireSession();
  if (!hasPermission(session.user.role, permission)) {
    throw new AuthorizationError("No tienes permisos para realizar esta acción.", 403);
  }
  return session;
}
