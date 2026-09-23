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
import { setWarehouseActiveAction } from "@/features/warehouses/actions";
import { WarehouseDialog } from "@/features/warehouses/components/warehouse-dialog";
import type { WarehouseRow } from "@/features/warehouses/queries";

export function WarehouseRowActions({ warehouse }: { warehouse: WarehouseRow }) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const nextActive = !warehouse.isActive;

  const toggleActive = async () => {
    const result = await setWarehouseActiveAction(warehouse.id, nextActive);
    if (!result.success) throw new Error(result.error);
    toast.success(nextActive ? "Almacén activado." : "Almacén desactivado.");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Acciones de ${warehouse.name}`}>
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

      <WarehouseDialog open={editOpen} onOpenChange={setEditOpen} warehouse={warehouse} />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={nextActive ? "Activar almacén" : "Desactivar almacén"}
        description={
          nextActive
            ? `El almacén "${warehouse.name}" volverá a aceptar movimientos y órdenes de compra.`
            : `El almacén "${warehouse.name}" dejará de aceptar movimientos. Solo es posible si no tiene existencias.`
        }
        confirmLabel={nextActive ? "Activar" : "Desactivar"}
        destructive={!nextActive}
        onConfirm={toggleActive}
      />
    </>
  );
}
