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
import { createSupplierAction, updateSupplierAction } from "@/features/suppliers/actions";
import type { SupplierRow } from "@/features/suppliers/queries";
import { supplierDefaults, type SupplierInput, supplierSchema } from "@/features/suppliers/schemas";
import { useActionForm } from "@/hooks/use-action-form";

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: SupplierRow;
}

function toFormValues(supplier: SupplierRow): SupplierInput {
  return {
    name: supplier.name,
    contactName: supplier.contactName ?? "",
    email: supplier.email ?? "",
    phone: supplier.phone ?? "",
    address: supplier.address ?? "",
    taxId: supplier.taxId ?? "",
  };
}

export function SupplierDialog({ open, onOpenChange, supplier }: SupplierDialogProps) {
  const isEdit = Boolean(supplier);
  const form = useForm<SupplierInput>({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplierDefaults,
  });

  useEffect(() => {
    if (open) form.reset(supplier ? toFormValues(supplier) : supplierDefaults);
  }, [open, supplier, form]);

  const { submit, isPending } = useActionForm({
    form,
    action: (values) =>
      supplier ? updateSupplierAction(supplier.id, values) : createSupplierAction(values),
    successMessage: isEdit ? "Proveedor actualizado." : "Proveedor creado.",
    onSuccess: () => onOpenChange(false),
  });

  const { register, formState } = form;
  const errors = formState.errors;

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} noValidate className="space-y-5">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle>
            <DialogDescription>
              Datos de contacto y fiscales del proveedor que abastece el inventario.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="name"
              label="Razón social"
              required
              error={errors.name?.message}
              className="sm:col-span-2"
            >
              <Input
                id="name"
                autoFocus
                placeholder="Ej.: Distribuidora Andina S.A."
                aria-invalid={!!errors.name}
                {...register("name")}
              />
            </Field>
            <Field
              id="taxId"
              label="Identificación fiscal"
              description="RUC, NIT, RFC, CUIT..."
              error={errors.taxId?.message}
            >
              <Input
                id="taxId"
                placeholder="Ej.: 20512345678"
                aria-invalid={!!errors.taxId}
                {...register("taxId")}
              />
            </Field>
            <Field id="contactName" label="Persona de contacto" error={errors.contactName?.message}>
              <Input
                id="contactName"
                placeholder="Nombre y apellido"
                aria-invalid={!!errors.contactName}
                {...register("contactName")}
              />
            </Field>
            <Field id="email" label="Correo" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                placeholder="ventas@proveedor.com"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
            </Field>
            <Field id="phone" label="Teléfono" error={errors.phone?.message}>
              <Input
                id="phone"
                type="tel"
                placeholder="+51 1 555 0192"
                aria-invalid={!!errors.phone}
                {...register("phone")}
              />
            </Field>
            <Field
              id="address"
              label="Dirección"
              error={errors.address?.message}
              className="sm:col-span-2"
            >
              <Textarea
                id="address"
                rows={2}
                placeholder="Calle, número, ciudad"
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
              {isEdit ? "Guardar cambios" : "Crear proveedor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
