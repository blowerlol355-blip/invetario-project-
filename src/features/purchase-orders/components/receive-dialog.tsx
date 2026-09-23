"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, PackageCheckIcon } from "lucide-react";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";

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
import { receivePurchaseOrderAction } from "@/features/purchase-orders/actions";
import type { PurchaseOrderItemDetail } from "@/features/purchase-orders/queries";
import { type ReceiveItemsInput, receiveItemsSchema } from "@/features/purchase-orders/schemas";
import { useActionForm } from "@/hooks/use-action-form";
import { formatInteger } from "@/lib/format";

interface ReceiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  code: string;
  warehouseName: string;
  items: PurchaseOrderItemDetail[];
}

const toNumber = (value: string | number | null) =>
  value === "" || value === null || value === undefined ? undefined : Number(value);

export function ReceiveDialog({
  open,
  onOpenChange,
  orderId,
  code,
  warehouseName,
  items,
}: ReceiveDialogProps) {
  const pendingItems = items.filter((item) => item.quantityReceived < item.quantityOrdered);

  const form = useForm<ReceiveItemsInput>({
    resolver: zodResolver(receiveItemsSchema),
    defaultValues: {
      items: pendingItems.map((item) => ({
        itemId: item.id,
        quantity: item.quantityOrdered - item.quantityReceived,
      })),
    },
  });
  const { register, control, watch, setValue, reset, formState } = form;
  const { fields } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    if (open) {
      reset({
        items: pendingItems.map((item) => ({
          itemId: item.id,
          quantity: item.quantityOrdered - item.quantityReceived,
        })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se reinicia solo al abrir
  }, [open]);

  const { submit, isPending } = useActionForm({
    form,
    action: (values) => receivePurchaseOrderAction(orderId, values),
    successMessage: (result) =>
      result.status === "RECEIVED"
        ? `Orden ${code} recibida por completo (${formatInteger(result.totalReceived)} unidades).`
        : `Recepción parcial registrada (${formatInteger(result.totalReceived)} unidades).`,
    onSuccess: () => onOpenChange(false),
  });

  const values = watch("items");
  const totalToReceive = values.reduce(
    (sum, v) => sum + (Number.isFinite(v.quantity) ? v.quantity : 0),
    0,
  );

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={submit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>Recibir orden {code}</DialogTitle>
            <DialogDescription>
              Indica las cantidades que llegaron a <strong>{warehouseName}</strong>. Cada línea
              genera una entrada de stock con el costo de la orden.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fields.forEach((_, i) => setValue(`items.${i}.quantity`, 0))}
            >
              Poner en cero
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                fields.forEach((_, i) => {
                  const item = pendingItems[i];
                  if (item)
                    setValue(`items.${i}.quantity`, item.quantityOrdered - item.quantityReceived);
                })
              }
            >
              Recibir todo lo pendiente
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Producto</th>
                  <th className="px-3 py-2 text-right font-medium">Pedido</th>
                  <th className="px-3 py-2 text-right font-medium">Recibido</th>
                  <th className="px-3 py-2 text-right font-medium">Pendiente</th>
                  <th className="px-3 py-2 text-right font-medium">Recibir ahora</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {fields.map((field, index) => {
                  // Tras recibir, la página se revalida antes de que el diálogo termine de
                  // cerrarse: las filas cuyo ítem ya no está pendiente no se pintan.
                  const item = pendingItems.find((candidate) => candidate.id === field.itemId);
                  if (!item) return null;
                  const pending = item.quantityOrdered - item.quantityReceived;
                  const error = formState.errors.items?.[index]?.quantity?.message;
                  return (
                    <tr key={field.id}>
                      <td className="px-3 py-2">
                        <p className="font-medium">{item.productName}</p>
                        <p className="font-mono text-xs text-muted-foreground">{item.sku}</p>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatInteger(item.quantityOrdered)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatInteger(item.quantityReceived)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatInteger(pending)}
                      </td>
                      <td className="px-3 py-2">
                        <input type="hidden" {...register(`items.${index}.itemId`)} />
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          max={pending}
                          inputMode="numeric"
                          aria-label={`Cantidad a recibir de ${item.productName}`}
                          className="ml-auto w-24 text-right"
                          aria-invalid={!!error}
                          {...register(`items.${index}.quantity`, { setValueAs: toNumber })}
                        />
                        {error && (
                          <p role="alert" className="mt-1 text-right text-xs text-destructive">
                            {error}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <DialogFooter className="sm:justify-between">
            <p className="self-center text-sm text-muted-foreground">
              Total a recibir:{" "}
              <span className="font-medium text-foreground tabular-nums">
                {formatInteger(totalToReceive)}
              </span>{" "}
              unidades
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || totalToReceive === 0}>
                {isPending ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <PackageCheckIcon className="size-4" />
                )}
                Confirmar recepción
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
