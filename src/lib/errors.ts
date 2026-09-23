/**
 * Error de regla de negocio: el mensaje es apto para mostrarse al usuario.
 * (Ej.: "No se puede desactivar un almacén con existencias.")
 */
export class BusinessRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessRuleError";
  }
}

/**
 * Conflicto con datos existentes (duplicado validado en la aplicación). Es una regla
 * de negocio para las Server Actions y un 409 para la API REST.
 */
export class ConflictError extends BusinessRuleError {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

/** Entidad no encontrada (o inaccesible para el usuario). */
export class NotFoundError extends Error {
  constructor(message = "El registro no existe o fue eliminado.") {
    super(message);
    this.name = "NotFoundError";
  }
}

/** Falta de sesión (401) o de permiso (403). La lanzan los guards de src/lib/auth-guards.ts. */
export class AuthorizationError extends Error {
  constructor(
    message: string,
    public readonly status: 401 | 403,
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}
