"use client";

import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { SearchXIcon } from "lucide-react";
import type { ReactNode } from "react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTableParams } from "@/hooks/use-table-params";
import type { Paginated } from "@/lib/query-params";
import { cn } from "@/lib/utils";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";

/** Contexto de orden actual que reciben las cabeceras ordenables. */
export interface SortState {
  sort: string;
  order: "asc" | "desc";
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: Paginated<TData>;
  sortState: SortState;
  searchPlaceholder?: string;
  /** Filtros adicionales que se renderizan en la barra de herramientas. */
  filters?: ReactNode;
  showStatusFilter?: boolean;
  showSearch?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

/**
 * Tabla genérica con paginación, orden y búsqueda del lado del servidor.
 * El Server Component de la página consulta los datos según la URL y los pasa aquí;
 * este componente solo pinta y actualiza la URL.
 */
export function DataTable<TData>({
  columns,
  data,
  sortState,
  searchPlaceholder,
  filters,
  showStatusFilter = true,
  showSearch = true,
  emptyTitle = "Sin resultados",
  emptyDescription = "No hay registros que coincidan con la búsqueda o los filtros.",
}: DataTableProps<TData>) {
  const { isPending } = useTableParams();

  const table = useReactTable({
    data: data.rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: data.pageCount,
    state: {
      pagination: { pageIndex: data.page - 1, pageSize: data.pageSize },
      sorting: sortState.sort ? [{ id: sortState.sort, desc: sortState.order === "desc" }] : [],
    },
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-4">
      {(showSearch || showStatusFilter || filters) && (
        <DataTableToolbar
          searchPlaceholder={searchPlaceholder}
          showStatusFilter={showStatusFilter}
          showSearch={showSearch}
          filters={filters}
        />
      )}

      <div
        className={cn(
          "overflow-hidden rounded-xl border bg-card transition-opacity",
          isPending && "opacity-60",
        )}
        aria-busy={isPending}
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(header.column.columnDef.meta?.className)}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={columns.length} className="h-64 p-0">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <SearchXIcon />
                        </EmptyMedia>
                        <EmptyTitle>{emptyTitle}</EmptyTitle>
                        <EmptyDescription>{emptyDescription}</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(cell.column.columnDef.meta?.className)}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <DataTablePagination data={data} />
    </div>
  );
}
