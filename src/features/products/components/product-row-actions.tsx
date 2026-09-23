"use client";

import { BanIcon, CircleCheckIcon, EyeIcon, MoreHorizontalIcon, PencilIcon } from "lucide-react";
import Link from "next/link";
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
import { setProductActiveAction } from "@/features/products/actions";

interface ProductRowActionsProps {
  product: { id: string; name: string; isActive: boolean };
  canManage: boolean;
}

export function ProductRowActions({ product, canManage }: ProductRowActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const nextActive = !product.isActive;

  const toggleActive = async () => {
    const result = await setProductActiveAction(product.id, nextActive);
    if (!result.success) throw new Error(result.error);
    toast.success(nextActive ? "Producto activado." : "Producto desactivado.");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Acciones de ${product.name}`}>
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/products/${product.id}`}>
              <EyeIcon className="size-4" />
              Ver detalle
            </Link>
          </DropdownMenuItem>
          {canManage && (
            <>
              <DropdownMenuItem asChild>
                <Link href={`/products/${product.id}/edit`}>
                  <PencilIcon className="size-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setConfirmOpen(true)}
                variant={nextActive ? "default" : "destructive"}
              >
                {nextActive ? (
                  <CircleCheckIcon className="size-4" />
                ) : (
                  <BanIcon className="size-4" />
                )}
                {nextActive ? "Activar" : "Desactivar"}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={nextActive ? "Activar producto" : "Desactivar producto"}
        description={
          nextActive
            ? `"${product.name}" volverá a estar disponible para movimientos y órdenes de compra.`
            : `"${product.name}" dejará de aparecer en movimientos y órdenes de compra. Solo es posible si no tiene existencias.`
        }
        confirmLabel={nextActive ? "Activar" : "Desactivar"}
        destructive={!nextActive}
        onConfirm={toggleActive}
      />
    </>
  );
}
