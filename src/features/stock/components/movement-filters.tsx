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
import type { WarehouseOption } from "@/features/warehouses/queries";
import { useTableParams } from "@/hooks/use-table-params";
import { MOVEMENT_TYPE_LABELS, MOVEMENT_TYPES } from "@/lib/domain";

interface MovementFiltersProps {
  warehouses: WarehouseOption[];
  users: UserOption[];
  defaultRange?: { from: string; to: string };
}

const ALL = "all";

export function MovementFilters({ warehouses, users, defaultRange }: MovementFiltersProps) {
  const { params, setFilter } = useTableParams();
  const from = params.get("from") ?? defaultRange?.from ?? "";
  const to = params.get("to") ?? defaultRange?.to ?? "";

  return (
    <>
      <Select value={params.get("type") ?? ALL} onValueChange={(v) => setFilter("type", v)}>
        <SelectTrigger className="w-full sm:w-40" aria-label="Filtrar por tipo">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos los tipos</SelectItem>
          {MOVEMENT_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {MOVEMENT_TYPE_LABELS[type]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.get("warehouseId") ?? ALL}
        onValueChange={(v) => setFilter("warehouseId", v)}
      >
        <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar por almacén">
          <SelectValue placeholder="Almacén" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos los almacenes</SelectItem>
          {warehouses.map((warehouse) => (
            <SelectItem key={warehouse.id} value={warehouse.id}>
              {warehouse.name}
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
