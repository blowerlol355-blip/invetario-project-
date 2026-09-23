"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createWarehouseAction, updateWarehouseAction } from "@/features/warehouses/actions";
import type { WarehouseRow } from "@/features/warehouses/queries";
import {
  warehouseDefaults,
  type WarehouseInput,
  warehouseSchema,
} from "@/features/warehouses/schemas";
import { useActionForm } from "@/hooks/use-action-form";

interface WarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse?: WarehouseRow;
}

export function WarehouseDialog({ open, onOpenChange, warehouse }: WarehouseDialogProps) {
  const isEdit = Boolean(warehouse);
  const form = useForm<WarehouseInput>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: warehouseDefaults,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        warehouse
          ? { code: warehouse.code, name: warehouse.name, address: warehouse.address ?? "" }
          : warehouseDefaults,
      );
    }
  }, [open, warehouse, form]);

  const { submit, isPending } = useActionForm({
    form,
    action: (values) =>
      warehouse ? updateWarehouseAction(warehouse.id, values) : createWarehouseAction(values),
    successMessage: isEdit ? "Almacén actualizado." : "Almacén creado.",
    onSuccess: () => onOpenChange(false),
  });

  const { register, formState } = form;
  const errors = formState.errors;

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} noValidate className="space-y-5">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar almacén" : "Nuevo almacén"}</DialogTitle>
            <DialogDescription>
              Ubicación física donde se guarda el inventario (almacén, sucursal, bodega).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              id="code"
              label="Código"
              required
              description="2 a 10 caracteres"
              error={errors.code?.message}
            >
              <Input
                id="code"
                autoFocus
                placeholder="CEN"
                className="uppercase"
                maxLength={10}
                aria-invalid={!!errors.code}
                {...register("code")}
              />
            </Field>
            <Field
              id="name"
              label="Nombre"
              required
              error={errors.name?.message}
              className="sm:col-span-2"
            >
              <Input
                id="name"
                placeholder="Ej.: Almacén Central"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
            </Field>
            <Field
              id="address"
              label="Dirección"
              error={errors.address?.message}
              className="sm:col-span-3"
            >
              <Textarea
                id="address"
                rows={2}
                placeholder="Opcional"
                aria-invalid={!!errors.address}
                {...register("address")}
              />
            </Field>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2Icon className="size-4 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Crear almacén"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
