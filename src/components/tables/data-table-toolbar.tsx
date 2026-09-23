"use client";

import { SearchIcon, XIcon } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTableParams } from "@/hooks/use-table-params";

interface DataTableToolbarProps {
  searchPlaceholder?: string;
  showStatusFilter?: boolean;
  showSearch?: boolean;
  filters?: ReactNode;
}

const STATUS_OPTIONS = [
  { value: "all", label: "Todos los estados" },
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" },
];

export function DataTableToolbar({
  searchPlaceholder = "Buscar...",
  showStatusFilter,
  showSearch = true,
  filters,
}: DataTableToolbarProps) {
  const { params, setSearch, setFilter } = useTableParams();
  const currentSearch = params.get("q") ?? "";
  const [value, setValue] = useState(currentSearch);

  // Sincroniza el input cuando la URL cambia desde fuera (p. ej. botón "limpiar").
  useEffect(() => {
    setValue(currentSearch);
  }, [currentSearch]);

  // Búsqueda con debounce para no navegar en cada tecla.
  useEffect(() => {
    if (value === currentSearch) return;
    const timeout = setTimeout(() => setSearch(value), 350);
    return () => clearTimeout(timeout);
  }, [value, currentSearch, setSearch]);

  const status = params.get("status") ?? "all";
  const hasFilters = currentSearch !== "" || status !== "all";

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      {showSearch && (
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="pl-9"
          />
        </div>
      )}

      {showStatusFilter && (
        <Select value={status} onValueChange={(next) => setFilter("status", next)}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar por estado">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {filters}

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setValue("");
            setSearch("");
            setFilter("status", null);
          }}
        >
          <XIcon className="size-4" />
          Limpiar
        </Button>
      )}
    </div>
  );
}
