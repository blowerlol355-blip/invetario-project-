"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTableParams } from "@/hooks/use-table-params";
import { USER_ROLE_LABELS, USER_ROLES } from "@/lib/domain";

const ALL = "all";

export function UserFilters() {
  const { params, setFilter } = useTableParams();
  return (
    <Select value={params.get("role") ?? ALL} onValueChange={(value) => setFilter("role", value)}>
      <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar por rol">
        <SelectValue placeholder="Rol" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>Todos los roles</SelectItem>
        {USER_ROLES.map((role) => (
          <SelectItem key={role} value={role}>
            {USER_ROLE_LABELS[role]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
