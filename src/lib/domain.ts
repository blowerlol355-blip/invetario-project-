/**
 * Constantes de dominio compartidas entre base de datos, servidor y cliente.
 *
 * El esquema no usa enums de Prisma: estos valores se almacenan como VARCHAR
 * (con constraints CHECK en la migración) y se tipan aquí, que es la única fuente
 * de verdad. Los esquemas Zod de cada módulo deben usar estas listas.
 */

export const USER_ROLES = ["ADMIN", "MANAGER", "OPERATOR"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  OPERATOR: "Operador",
};

export const MOVEMENT_TYPES = ["IN", "OUT", "ADJUSTMENT", "TRANSFER"] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  IN: "Entrada",
  OUT: "Salida",
  ADJUSTMENT: "Ajuste",
  TRANSFER: "Transferencia",
};

export const PURCHASE_ORDER_STATUSES = [
  "DRAFT",
  "SENT",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CANCELLED",
] as const;
export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number];

export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  PARTIALLY_RECEIVED: "Recibida parcialmente",
  RECEIVED: "Recibida",
  CANCELLED: "Cancelada",
};

export const AUDIT_ACTIONS = ["CREATE", "UPDATE", "DELETE", "STATUS_CHANGE"] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: "Creación",
  UPDATE: "Edición",
  DELETE: "Eliminación",
  STATUS_CHANGE: "Cambio de estado",
};

/** Entidades que escriben en la bitácora (valor de `AuditLog.entity`) y su etiqueta. */
export const AUDIT_ENTITIES = [
  "Category",
  "Supplier",
  "Warehouse",
  "Product",
  "StockMovement",
  "PurchaseOrder",
  "User",
] as const;
export type AuditEntity = (typeof AUDIT_ENTITIES)[number];

export const AUDIT_ENTITY_LABELS: Record<AuditEntity, string> = {
  Category: "Categoría",
  Supplier: "Proveedor",
  Warehouse: "Almacén",
  Product: "Producto",
  StockMovement: "Movimiento",
  PurchaseOrder: "Orden de compra",
  User: "Usuario",
};

/** Unidades de medida admitidas para productos. */
export const PRODUCT_UNITS = [
  "unidad",
  "par",
  "caja",
  "paquete",
  "rollo",
  "litro",
  "kg",
  "metro",
] as const;
export type ProductUnit = (typeof PRODUCT_UNITS)[number];
