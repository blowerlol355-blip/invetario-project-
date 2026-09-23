"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTableParams } from "@/hooks/use-table-params";
import { formatInteger } from "@/lib/format";
import { PAGE_SIZES, type Paginated } from "@/lib/query-params";

interface DataTablePaginationProps {
  data: Paginated<unknown>;
}

export function DataTablePagination({ data }: DataTablePaginationProps) {
  const { setPage, setPageSize } = useTableParams();
  const { page, pageCount, pageSize, total } = data;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total === 0
          ? "0 registros"
          : `${formatInteger(from)} a ${formatInteger(to)} de ${formatInteger(total)} registros`}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filas</span>
          <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger className="w-20" size="sm" aria-label="Filas por página">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <span className="text-sm text-muted-foreground">
          Página {page} de {pageCount}
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setPage(1)}
            disabled={page <= 1}
            aria-label="Primera página"
          >
            <ChevronsLeftIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            aria-label="Página anterior"
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= pageCount}
            aria-label="Página siguiente"
          >
            <ChevronRightIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setPage(pageCount)}
            disabled={page >= pageCount}
            aria-label="Última página"
          >
            <ChevronsRightIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
