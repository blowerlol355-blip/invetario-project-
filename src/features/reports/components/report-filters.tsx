"use client";

import { SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { ProductCombobox } from "@/components/forms/product-combobox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryOption } from "@/features/categories/queries";
import type { WarehouseOption } from "@/features/warehouses/queries";
import { useTableParams } from "@/hooks/use-table-params";

const ALL = "all";

interface OptionSelectProps {
  paramKey: string;
  label: string;
  allLabel: string;
  options: { id: string; name: string }[];
  className?: string;
}

function OptionSelect({ paramKey, label, allLabel, options, className }: OptionSelectProps) {
  const { params, setFilter } = useTableParams();
  return (
    <Select value={params.get(paramKey) ?? ALL} onValueChange={(v) => setFilter(paramKey, v)}>
      <SelectTrigger className={className ?? "w-full sm:w-48"} aria-label={label}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function WarehouseFilter({ warehouses }: { warehouses: WarehouseOption[] }) {
  return (
    <OptionSelect
      paramKey="warehouseId"
      label="Almacén"
      allLabel="Todos los almacenes"
      options={warehouses}
      className="w-full sm:w-44"
    />
  );
}

export function CategoryFilter({ categories }: { categories: CategoryOption[] }) {
  return (
    <OptionSelect
      paramKey="categoryId"
      label="Categoría"
      allLabel="Todas las categorías"
      options={categories}
    />
  );
}

export function DateRangeFilter({ from, to }: { from: string; to: string }) {
  const { setFilter } = useTableParams();
  return (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        aria-label="Desde"
        className="w-full sm:w-38"
        value={from}
        max={to}
        onChange={(event) => setFilter("from", event.target.value || null)}
      />
      <span className="text-sm text-muted-foreground">a</span>
      <Input
        type="date"
        aria-label="Hasta"
        className="w-full sm:w-38"
        value={to}
        min={from}
        onChange={(event) => setFilter("to", event.target.value || null)}
      />
    </div>
  );
}

export function SearchFilter({ placeholder }: { placeholder: string }) {
  const { params, setSearch } = useTableParams();
  const current = params.get("q") ?? "";
  const [value, setValue] = useState(current);

  useEffect(() => setValue(current), [current]);
  useEffect(() => {
    if (value === current) return;
    const timeout = setTimeout(() => setSearch(value), 350);
    return () => clearTimeout(timeout);
  }, [value, current, setSearch]);

  return (
    <div className="relative w-full sm:max-w-xs">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-9"
      />
    </div>
  );
}

export function ProductFilter({
  products,
}: {
  products: { id: string; sku: string; name: string }[];
}) {
  const { params, setFilter } = useTableParams();
  return (
    <div className="w-full sm:w-80">
      <ProductCombobox
        products={products}
        value={params.get("productId") ?? ""}
        onChange={(id) => setFilter("productId", id)}
        placeholder="Elige un producto"
      />
    </div>
  );
}
