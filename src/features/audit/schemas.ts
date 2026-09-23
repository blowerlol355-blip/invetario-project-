import { z } from "zod";

import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/domain";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .catch("");

/** Filtros de la bitácora (además de los genéricos de ListParams; `q` busca por id de entidad). */
export const auditFiltersSchema = z.object({
  entity: z.union([z.enum(AUDIT_ENTITIES), z.literal("")]).catch(""),
  action: z.union([z.enum(AUDIT_ACTIONS), z.literal("")]).catch(""),
  userId: z.uuid().catch(""),
  from: isoDate,
  to: isoDate,
});

export type AuditFilters = z.infer<typeof auditFiltersSchema>;
