"use client";

import type { Column } from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTableParams } from "@/hooks/use-table-params";
import { cn } from "@/lib/utils";

interface ColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
}

/** Cabecera ordenable: alterna asc → desc → sin orden y lo refleja en la URL. */
export function ColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: ColumnHeaderProps<TData, TValue>) {
  const { setSort } = useTableParams();

  if (!column.getCanSort()) {
    return <span className={cn("font-medium", className)}>{title}</span>;
  }

  const sorted = column.getIsSorted();

  const toggle = () => {
    if (sorted === false) setSort(column.id, "asc");
    else if (sorted === "asc") setSort(column.id, "desc");
    else setSort(null, null);
  };

  const Icon =
    sorted === "asc" ? ArrowUpIcon : sorted === "desc" ? ArrowDownIcon : ChevronsUpDownIcon;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className={cn("-ml-3 h-8 data-[state=open]:bg-accent", className)}
      aria-label={`Ordenar por ${title}`}
      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"}
    >
      {title}
      <Icon className={cn("size-3.5", sorted ? "text-foreground" : "text-muted-foreground")} />
    </Button>
  );
}
