"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserOption } from "@/features/stock/queries";
import { useTableParams } from "@/hooks/use-table-params";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  AUDIT_ENTITY_LABELS,
} from "@/lib/domain";

interface AuditFiltersProps {
  users: UserOption[];
}

const ALL = "all";

export function AuditFilters({ users }: AuditFiltersProps) {
  const { params, setFilter } = useTableParams();
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";

  return (
    <>
      <Select value={params.get("entity") ?? ALL} onValueChange={(v) => setFilter("entity", v)}>
        <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar por entidad">
          <SelectValue placeholder="Entidad" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todas las entidades</SelectItem>
          {AUDIT_ENTITIES.map((entity) => (
            <SelectItem key={entity} value={entity}>
              {AUDIT_ENTITY_LABELS[entity]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={params.get("action") ?? ALL} onValueChange={(v) => setFilter("action", v)}>
        <SelectTrigger className="w-full sm:w-40" aria-label="Filtrar por acción">
          <SelectValue placeholder="Acción" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todas las acciones</SelectItem>
          {AUDIT_ACTIONS.map((action) => (
            <SelectItem key={action} value={action}>
              {AUDIT_ACTION_LABELS[action]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={params.get("userId") ?? ALL} onValueChange={(v) => setFilter("userId", v)}>
        <SelectTrigger className="w-full sm:w-40" aria-label="Filtrar por usuario">
          <SelectValue placeholder="Usuario" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos los usuarios</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Input
          type="date"
          aria-label="Desde"
          className="w-full sm:w-38"
          value={from}
          max={to || undefined}
          onChange={(event) => setFilter("from", event.target.value || null)}
        />
        <span className="text-sm text-muted-foreground">a</span>
        <Input
          type="date"
          aria-label="Hasta"
          className="w-full sm:w-38"
          value={to}
          min={from || undefined}
          onChange={(event) => setFilter("to", event.target.value || null)}
        />
      </div>
    </>
  );
}
