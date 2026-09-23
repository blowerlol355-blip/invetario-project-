"use client";

import { BanIcon, CircleCheckIcon, MoreHorizontalIcon, PencilIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setCategoryActiveAction } from "@/features/categories/actions";
import { CategoryDialog } from "@/features/categories/components/category-dialog";
import type { CategoryRow } from "@/features/categories/queries";

export function CategoryRowActions({ category }: { category: CategoryRow }) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const nextActive = !category.isActive;

  const toggleActive = async () => {
    const result = await setCategoryActiveAction(category.id, nextActive);
    if (!result.success) throw new Error(result.error);
    toast.success(nextActive ? "Categoría activada." : "Categoría desactivada.");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Acciones de ${category.name}`}>
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <PencilIcon className="size-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setConfirmOpen(true)}
            variant={nextActive ? "default" : "destructive"}
          >
            {nextActive ? <CircleCheckIcon className="size-4" /> : <BanIcon className="size-4" />}
            {nextActive ? "Activar" : "Desactivar"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CategoryDialog open={editOpen} onOpenChange={setEditOpen} category={category} />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={nextActive ? "Activar categoría" : "Desactivar categoría"}
        description={
          nextActive
            ? `La categoría "${category.name}" volverá a estar disponible para nuevos productos.`
            : `La categoría "${category.name}" dejará de estar disponible para nuevos productos. Los productos existentes no se modifican.`
        }
        confirmLabel={nextActive ? "Activar" : "Desactivar"}
        destructive={!nextActive}
        onConfirm={toggleActive}
      />
    </>
  );
}
