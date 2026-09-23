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
import { setSupplierActiveAction } from "@/features/suppliers/actions";
import { SupplierDialog } from "@/features/suppliers/components/supplier-dialog";
import type { SupplierRow } from "@/features/suppliers/queries";

export function SupplierRowActions({ supplier }: { supplier: SupplierRow }) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const nextActive = !supplier.isActive;

  const toggleActive = async () => {
    const result = await setSupplierActiveAction(supplier.id, nextActive);
    if (!result.success) throw new Error(result.error);
    toast.success(nextActive ? "Proveedor activado." : "Proveedor desactivado.");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Acciones de ${supplier.name}`}>
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

      <SupplierDialog open={editOpen} onOpenChange={setEditOpen} supplier={supplier} />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={nextActive ? "Activar proveedor" : "Desactivar proveedor"}
        description={
          nextActive
            ? `"${supplier.name}" volverá a estar disponible para productos y órdenes de compra.`
            : `"${supplier.name}" dejará de aparecer al crear productos y órdenes de compra. Su historial se conserva.`
        }
        confirmLabel={nextActive ? "Activar" : "Desactivar"}
        destructive={!nextActive}
        onConfirm={toggleActive}
      />
    </>
  );
}
