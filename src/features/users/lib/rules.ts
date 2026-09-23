import type { UserRole } from "@/lib/domain";
import { BusinessRuleError } from "@/lib/errors";

/** Estado mínimo del usuario objetivo y del sistema para evaluar las reglas. */
export interface UserRuleContext {
  /** Usuario que ejecuta la acción. */
  actorId: string;
  /** Usuario sobre el que se actúa. */
  target: { id: string; role: UserRole; isActive: boolean };
  /** Administradores activos en el sistema (incluido el objetivo si lo es). */
  activeAdminCount: number;
}

function isLastActiveAdmin(ctx: UserRuleContext): boolean {
  return ctx.target.role === "ADMIN" && ctx.target.isActive && ctx.activeAdminCount <= 1;
}

/**
 * Un administrador no puede cambiar su propio rol (perdería el acceso a esta pantalla)
 * ni quitarle el rol al último administrador activo.
 */
export function assertCanChangeRole(ctx: UserRuleContext, newRole: UserRole): void {
  if (newRole === ctx.target.role) return;
  if (ctx.target.id === ctx.actorId) {
    throw new BusinessRuleError("No puedes cambiar tu propio rol.");
  }
  if (newRole !== "ADMIN" && isLastActiveAdmin(ctx)) {
    throw new BusinessRuleError(
      "Debe quedar al menos un administrador activo. Asigna el rol a otro usuario antes.",
    );
  }
}

/** Nadie se desactiva a sí mismo y el sistema nunca se queda sin administradores activos. */
export function assertCanSetActive(ctx: UserRuleContext, isActive: boolean): void {
  if (isActive || !ctx.target.isActive) return;
  if (ctx.target.id === ctx.actorId) {
    throw new BusinessRuleError("No puedes desactivar tu propia cuenta.");
  }
  if (isLastActiveAdmin(ctx)) {
    throw new BusinessRuleError(
      "Debe quedar al menos un administrador activo. Activa o asigna otro administrador antes.",
    );
  }
}
