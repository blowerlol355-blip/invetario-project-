"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryOption } from "@/features/categories/queries";
import type { SupplierOption } from "@/features/suppliers/queries";
import { useTableParams } from "@/hooks/use-table-params";

interface ProductFiltersProps {
  categories: CategoryOption[];
  suppliers: SupplierOption[];
}

const ALL = "all";

export function ProductFilters({ categories, suppliers }: ProductFiltersProps) {
  const { params, setFilter } = useTableParams();
  const categoryId = params.get("categoryId") ?? ALL;
  const supplierId = params.get("supplierId") ?? ALL;

  return (
    <>
      <Select value={categoryId} onValueChange={(value) => setFilter("categoryId", value)}>
        <SelectTrigger className="w-full sm:w-48" aria-label="Filtrar por categoría">
          <SelectValue placeholder="Categoría" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todas las categorías</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={supplierId} onValueChange={(value) => setFilter("supplierId", value)}>
        <SelectTrigger className="w-full sm:w-52" aria-label="Filtrar por proveedor">
          <SelectValue placeholder="Proveedor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos los proveedores</SelectItem>
          {suppliers.map((supplier) => (
            <SelectItem key={supplier.id} value={supplier.id}>
              {supplier.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
