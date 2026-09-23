"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDownToLineIcon,
  ArrowLeftRightIcon,
  ArrowUpFromLineIcon,
  Loader2Icon,
  SaveIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

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
import { createMovementAction } from "@/features/stock/actions";
import type { ProductOption } from "@/features/stock/queries";
import {
  ADJUSTMENT_DIRECTION_LABELS,
  ADJUSTMENT_DIRECTIONS,
  movementDefaults,
  type MovementInput,
  movementSchema,
} from "@/features/stock/schemas";
import type { WarehouseOption } from "@/features/warehouses/queries";
import { useActionForm } from "@/hooks/use-action-form";
import { MOVEMENT_TYPE_LABELS, MOVEMENT_TYPES, type MovementType } from "@/lib/domain";
import { formatCurrency, formatInteger } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MovementFormProps {
  products: ProductOption[];
  warehouses: WarehouseOption[];
  initialType: MovementType;
  initialProductId?: string;
}

const TYPE_META: Record<
  MovementType,
  { icon: typeof ArrowDownToLineIcon; description: string; className: string }
> = {
  IN: {
    icon: ArrowDownToLineIcon,
    description: "Compra, devolución o inventario inicial. Actualiza el costo promedio.",
    className:
      "data-[active=true]:border-success data-[active=true]:bg-success/10 data-[active=true]:text-success",
  },
  OUT: {
    icon: ArrowUpFromLineIcon,
    description: "Venta o consumo. No puede superar la existencia del almacén.",
    className:
      "data-[active=true]:border-destructive data-[active=true]:bg-destructive/10 data-[active=true]:text-destructive",
  },
  TRANSFER: {
    icon: ArrowLeftRightIcon,
    description: "Mueve existencias entre dos almacenes en una sola operación.",
    className:
      "data-[active=true]:border-info data-[active=true]:bg-info/10 data-[active=true]:text-info",
  },
  ADJUSTMENT: {
    icon: SlidersHorizontalIcon,
    description: "Corrige la existencia tras un conteo físico, merma o daño.",
    className:
      "data-[active=true]:border-warning data-[active=true]:bg-warning/15 data-[active=true]:text-warning-foreground dark:data-[active=true]:text-warning",
  },
};

const toNumber = (value: string | number | null) =>
  value === "" || value === null || value === undefined ? undefined : Number(value);
const toNullableNumber = (value: string | number | null) =>
  value === "" || value === null || value === undefined ? null : Number(value);

export function MovementForm({
  products,
  warehouses,
  initialType,
  initialProductId,
}: MovementFormProps) {
  const router = useRouter();
  const form = useForm<MovementInput>({
    resolver: zodResolver(movementSchema),
    defaultValues: movementDefaults(initialType, initialProductId ?? ""),
  });
  const { register, control, watch, setValue, formState } = form;
  const errors = formState.errors;

  const [
    type,
    productId,
    fromWarehouseId,
    toWarehouseId,
    warehouseId,
    quantity,
    adjustmentDirection,
  ] = watch([
    "type",
    "productId",
    "fromWarehouseId",
    "toWarehouseId",
    "warehouseId",
    "quantity",
    "adjustmentDirection",
  ]);

  const product = products.find((p) => p.id === productId);
  const stockAt = (id: string) => product?.stocks.find((s) => s.warehouseId === id)?.quantity ?? 0;
  const warehouseName = (id: string) => warehouses.find((w) => w.id === id)?.name ?? "";

  // Al cambiar de tipo, limpia los campos que no aplican y sugiere el costo de referencia.
  useEffect(() => {
    if (type === "IN") setValue("unitCost", product ? product.costPrice : 0);
    else setValue("unitCost", null);
  }, [type, product, setValue]);

  const { submit, isPending } = useActionForm({
    form,
    action: createMovementAction,
    successMessage: (result) =>
      result.newAverageCost === null
        ? "Movimiento registrado."
        : `Entrada registrada. Nuevo costo promedio: ${formatCurrency(result.newAverageCost)}.`,
    onSuccess: (result) => router.push(`/products/${result.productId}`),
  });

  const sourceId =
    type === "OUT" || type === "TRANSFER"
      ? fromWarehouseId
      : type === "ADJUSTMENT" && adjustmentDirection === "decrease"
        ? warehouseId
        : "";
  const available = sourceId ? stockAt(sourceId) : null;
  const exceeds = available !== null && Number.isFinite(quantity) && quantity > available;

  const warehouseSelect = (
    name: "fromWarehouseId" | "toWarehouseId" | "warehouseId",
    label: string,
    placeholder: string,
    exclude?: string,
  ) => (
    <Field id={name} label={label} required error={errors[name]?.message}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger id={name} className="w-full" aria-invalid={!!errors[name]}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {warehouses
                .filter((w) => w.id !== exclude)
                .map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    <span className="font-mono text-xs">{w.code}</span> {w.name}
                    {product && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({formatInteger(stockAt(w.id))} {product.unit})
                      </span>
                    )}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}
      />
    </Field>
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Card className="animate-fade-up">
        <CardHeader>
          <CardTitle>Tipo de movimiento</CardTitle>
          <CardDescription>{TYPE_META[type].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <div
                role="radiogroup"
                aria-label="Tipo de movimiento"
                className="grid gap-2 sm:grid-cols-4"
              >
                {MOVEMENT_TYPES.map((value) => {
                  const meta = TYPE_META[value];
                  const active = field.value === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      data-active={active}
                      onClick={() => field.onChange(value)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-all hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                        meta.className,
                      )}
                    >
                      <meta.icon className="size-4" />
                      {MOVEMENT_TYPE_LABELS[value]}
                    </button>
                  );
                })}
              </div>
            )}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="animate-fade-up [animation-delay:80ms] lg:col-span-2">
          <CardHeader>
            <CardTitle>Detalle</CardTitle>
            <CardDescription>Producto, almacenes y cantidad.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field
              id="productId"
              label="Producto"
              required
              error={errors.productId?.message}
              className="sm:col-span-2"
            >
              <Controller
                control={control}
                name="productId"
                render={({ field }) => (
                  <ProductCombobox
                    id="productId"
                    products={products}
                    value={field.value}
                    onChange={field.onChange}
                    invalid={!!errors.productId}
                  />
                )}
              />
            </Field>

            {type === "IN" &&
              warehouseSelect("toWarehouseId", "Almacén de destino", "Selecciona el destino")}
            {type === "OUT" &&
              warehouseSelect("fromWarehouseId", "Almacén de origen", "Selecciona el origen")}
            {type === "TRANSFER" && (
              <>
                {warehouseSelect(
                  "fromWarehouseId",
                  "Almacén de origen",
                  "Selecciona el origen",
                  toWarehouseId,
                )}
                {warehouseSelect(
                  "toWarehouseId",
                  "Almacén de destino",
                  "Selecciona el destino",
                  fromWarehouseId,
                )}
              </>
            )}
            {type === "ADJUSTMENT" && (
              <>
                {warehouseSelect("warehouseId", "Almacén", "Selecciona el almacén")}
                <Field
                  id="adjustmentDirection"
                  label="Sentido del ajuste"
                  required
                  error={errors.adjustmentDirection?.message}
                >
                  <Controller
                    control={control}
                    name="adjustmentDirection"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="adjustmentDirection" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ADJUSTMENT_DIRECTIONS.map((direction) => (
                            <SelectItem key={direction} value={direction}>
                              {ADJUSTMENT_DIRECTION_LABELS[direction]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              </>
            )}

            <Field
              id="quantity"
              label={`Cantidad${product ? ` (${product.unit})` : ""}`}
              required
              error={
                errors.quantity?.message ??
                (exceeds
                  ? `Supera la existencia disponible (${formatInteger(available ?? 0)}).`
                  : undefined)
              }
            >
              <Input
                id="quantity"
                type="number"
                step="1"
                min="1"
                inputMode="numeric"
                aria-invalid={!!errors.quantity || exceeds}
                {...register("quantity", { setValueAs: toNumber })}
              />
            </Field>

            {type === "IN" && (
              <Field
                id="unitCost"
                label="Costo unitario (USD)"
                required
                description={
                  product ? `Costo promedio actual: ${formatCurrency(product.avgCost)}` : undefined
                }
                error={errors.unitCost?.message}
              >
                <Input
                  id="unitCost"
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  aria-invalid={!!errors.unitCost}
                  {...register("unitCost", { setValueAs: toNullableNumber })}
                />
              </Field>
            )}

            <Field
              id="reason"
              label="Motivo"
              required={type === "ADJUSTMENT"}
              error={errors.reason?.message}
              className="sm:col-span-2"
            >
              <Textarea
                id="reason"
                rows={2}
                placeholder={
                  type === "ADJUSTMENT"
                    ? "Ej.: Conteo físico, producto dañado"
                    : "Opcional. Ej.: Venta mostrador"
                }
                aria-invalid={!!errors.reason}
                {...register("reason")}
              />
            </Field>
            <Field
              id="reference"
              label="Referencia"
              description="Factura, ticket u orden de compra"
              error={errors.reference?.message}
            >
              <Input
                id="reference"
                placeholder="FAC-001234"
                className="uppercase"
                aria-invalid={!!errors.reference}
                {...register("reference")}
              />
            </Field>
          </CardContent>
        </Card>

        <Card className="animate-fade-up [animation-delay:120ms]">
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
            <CardDescription>Existencias antes y después del movimiento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {!product ? (
              <p className="text-muted-foreground">Selecciona un producto para ver el impacto.</p>
            ) : (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">Producto</p>
                  <p className="font-medium">{product.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{product.sku}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Existencia total</p>
                  <p className="font-medium tabular-nums">
                    {formatInteger(product.stocks.reduce((s, x) => s + x.quantity, 0))}{" "}
                    {product.unit}
                  </p>
                </div>
                {[
                  { id: sourceId, delta: -1 },
                  {
                    id:
                      type === "IN" || type === "TRANSFER"
                        ? toWarehouseId
                        : type === "ADJUSTMENT" && adjustmentDirection === "increase"
                          ? warehouseId
                          : "",
                    delta: 1,
                  },
                ]
                  .filter((entry) => entry.id)
                  .map((entry) => {
                    const before = stockAt(entry.id);
                    const after = Number.isFinite(quantity)
                      ? before + entry.delta * quantity
                      : before;
                    return (
                      <div key={entry.id} className="rounded-lg border bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">{warehouseName(entry.id)}</p>
                        <p className="tabular-nums">
                          {formatInteger(before)} <span className="text-muted-foreground">→</span>{" "}
                          <span className={cn("font-semibold", after < 0 && "text-destructive")}>
                            {formatInteger(after)}
                          </span>{" "}
                          <span className="text-xs text-muted-foreground">{product.unit}</span>
                        </p>
                      </div>
                    );
                  })}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" asChild disabled={isPending}>
          <Link href="/movements">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={isPending || exceeds}>
          {isPending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <SaveIcon className="size-4" />
          )}
          Registrar {MOVEMENT_TYPE_LABELS[type].toLowerCase()}
        </Button>
      </div>
    </form>
  );
}
