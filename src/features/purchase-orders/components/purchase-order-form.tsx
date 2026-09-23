"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, PlusIcon, SaveIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";

import { Field } from "@/components/forms/field";
import { ProductCombobox } from "@/components/forms/product-combobox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createPurchaseOrderAction,
  updatePurchaseOrderAction,
} from "@/features/purchase-orders/actions";
import {
  type PurchaseOrderInput,
  purchaseOrderItemDefaults,
  purchaseOrderSchema,
} from "@/features/purchase-orders/schemas";
import type { ProductOption } from "@/features/stock/queries";
import type { SupplierOption } from "@/features/suppliers/queries";
import type { WarehouseOption } from "@/features/warehouses/queries";
import { useActionForm } from "@/hooks/use-action-form";
import { formatCurrency, formatInteger } from "@/lib/format";

interface PurchaseOrderFormProps {
  suppliers: SupplierOption[];
  warehouses: WarehouseOption[];
  products: ProductOption[];
  initialValues: PurchaseOrderInput;
  order?: { id: string; code: string };
}

const toNumber = (value: string | number | null) =>
  value === "" || value === null || value === undefined ? undefined : Number(value);

export function PurchaseOrderForm({
  suppliers,
  warehouses,
  products,
  initialValues,
  order,
}: PurchaseOrderFormProps) {
  const router = useRouter();
  const isEdit = Boolean(order);

  const form = useForm<PurchaseOrderInput>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: initialValues,
  });
  const { register, control, watch, setValue, formState } = form;
  const errors = formState.errors;
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const { submit, isPending } = useActionForm({
    form,
    action: (values) =>
      order ? updatePurchaseOrderAction(order.id, values) : createPurchaseOrderAction(values),
    successMessage: isEdit
      ? "Orden actualizada."
      : (data) => `Orden ${"code" in data ? data.code : ""} creada como borrador.`,
    onSuccess: (data) => router.push(`/purchase-orders/${data.id}`),
  });

  const items = watch("items");
  const supplierId = watch("supplierId");
  const total = items.reduce(
    (sum, item) =>
      sum +
      (Number.isFinite(item.quantityOrdered) && Number.isFinite(item.unitCost)
        ? item.quantityOrdered * item.unitCost
        : 0),
    0,
  );
  const totalUnits = items.reduce(
    (sum, item) => sum + (Number.isFinite(item.quantityOrdered) ? item.quantityOrdered : 0),
    0,
  );

  const productList = products.map(({ id, sku, name }) => ({ id, sku, name }));

  const onProductChange = (index: number, productId: string) => {
    setValue(`items.${index}.productId`, productId, { shouldValidate: true });
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const currentCost = items[index]?.unitCost;
    if (!currentCost) setValue(`items.${index}.unitCost`, product.costPrice);
    if (!supplierId && product.supplierId) setValue("supplierId", product.supplierId);
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="animate-fade-up lg:col-span-2">
          <CardHeader>
            <CardTitle>Datos generales</CardTitle>
            <CardDescription>
              {isEdit
                ? `Editando el borrador ${order?.code}.`
                : "La orden se crea como borrador; después podrás enviarla al proveedor."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field id="supplierId" label="Proveedor" required error={errors.supplierId?.message}>
              <Controller
                control={control}
                name="supplierId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="supplierId"
                      className="w-full"
                      aria-invalid={!!errors.supplierId}
                    >
                      <SelectValue placeholder="Selecciona un proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field
              id="warehouseId"
              label="Almacén de recepción"
              required
              error={errors.warehouseId?.message}
            >
              <Controller
                control={control}
                name="warehouseId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="warehouseId"
                      className="w-full"
                      aria-invalid={!!errors.warehouseId}
                    >
                      <SelectValue placeholder="Selecciona el almacén" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          <span className="font-mono text-xs">{w.code}</span> {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field
              id="expectedDate"
              label="Fecha de entrega esperada"
              error={errors.expectedDate?.message}
            >
              <Input
                id="expectedDate"
                type="date"
                aria-invalid={!!errors.expectedDate}
                {...register("expectedDate")}
              />
            </Field>
            <Field id="notes" label="Notas" error={errors.notes?.message} className="sm:col-span-2">
              <Textarea
                id="notes"
                rows={2}
                placeholder="Instrucciones para el proveedor (opcional)"
                aria-invalid={!!errors.notes}
                {...register("notes")}
              />
            </Field>
          </CardContent>
        </Card>

        <Card className="animate-fade-up [animation-delay:80ms]">
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Productos</span>
              <span className="font-medium tabular-nums">
                {items.filter((i) => i.productId).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unidades</span>
              <span className="font-medium tabular-nums">{formatInteger(totalUnits)}</span>
            </div>
            <div className="flex justify-between border-t pt-3 text-base">
              <span className="font-medium">Total estimado</span>
              <span className="font-semibold tabular-nums">{formatCurrency(total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="animate-fade-up [animation-delay:120ms]">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Productos</CardTitle>
            <CardDescription>
              Cantidad a pedir y costo unitario acordado con el proveedor.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append(purchaseOrderItemDefaults)}
          >
            <PlusIcon className="size-4" />
            Agregar producto
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {typeof errors.items?.message === "string" && (
            <p role="alert" className="text-sm text-destructive">
              {errors.items.message}
            </p>
          )}
          <div className="hidden grid-cols-[1fr_110px_140px_120px_40px] gap-3 px-1 text-xs font-medium text-muted-foreground md:grid">
            <span>Producto</span>
            <span className="text-right">Cantidad</span>
            <span className="text-right">Costo unitario</span>
            <span className="text-right">Subtotal</span>
            <span />
          </div>
          {fields.map((fieldItem, index) => {
            const itemErrors = errors.items?.[index];
            const item = items[index];
            const product = products.find((p) => p.id === item?.productId);
            const subtotal =
              item && Number.isFinite(item.quantityOrdered) && Number.isFinite(item.unitCost)
                ? item.quantityOrdered * item.unitCost
                : 0;
            return (
              <div
                key={fieldItem.id}
                className="grid animate-fade-up gap-3 rounded-lg border p-3 md:grid-cols-[1fr_110px_140px_120px_40px] md:items-start md:border-0 md:p-1"
              >
                <div className="space-y-1">
                  <Controller
                    control={control}
                    name={`items.${index}.productId`}
                    render={({ field }) => (
                      <ProductCombobox
                        id={`items-${index}-product`}
                        products={productList}
                        value={field.value}
                        onChange={(id) => onProductChange(index, id)}
                        invalid={!!itemErrors?.productId}
                      />
                    )}
                  />
                  {product && (
                    <p className="text-xs text-muted-foreground">
                      Stock actual{" "}
                      {formatInteger(product.stocks.reduce((s, x) => s + x.quantity, 0))}{" "}
                      {product.unit}
                      {" · "}mínimo {formatInteger(product.minStock)}
                    </p>
                  )}
                  {itemErrors?.productId && (
                    <p role="alert" className="text-xs text-destructive">
                      {itemErrors.productId.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    inputMode="numeric"
                    aria-label="Cantidad"
                    className="text-right"
                    aria-invalid={!!itemErrors?.quantityOrdered}
                    {...register(`items.${index}.quantityOrdered`, { setValueAs: toNumber })}
                  />
                  {itemErrors?.quantityOrdered && (
                    <p role="alert" className="text-xs text-destructive">
                      {itemErrors.quantityOrdered.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    aria-label="Costo unitario"
                    className="text-right"
                    aria-invalid={!!itemErrors?.unitCost}
                    {...register(`items.${index}.unitCost`, { setValueAs: toNumber })}
                  />
                  {itemErrors?.unitCost && (
                    <p role="alert" className="text-xs text-destructive">
                      {itemErrors.unitCost.message}
                    </p>
                  )}
                </div>
                <p className="pt-2 text-right text-sm font-medium tabular-nums">
                  {formatCurrency(subtotal)}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Quitar producto"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                  className="justify-self-end"
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" asChild disabled={isPending}>
          <Link href={order ? `/purchase-orders/${order.id}` : "/purchase-orders"}>Cancelar</Link>
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <SaveIcon className="size-4" />
          )}
          {isEdit ? "Guardar cambios" : "Crear borrador"}
        </Button>
      </div>
    </form>
  );
}
