"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, SaveIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

import { Field } from "@/components/forms/field";
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
import type { CategoryOption } from "@/features/categories/queries";
import { createProductAction, updateProductAction } from "@/features/products/actions";
import { getMarginPercent } from "@/features/products/lib/stock-status";
import { productDefaults, type ProductInput, productSchema } from "@/features/products/schemas";
import type { SupplierOption } from "@/features/suppliers/queries";
import { useActionForm } from "@/hooks/use-action-form";
import { PRODUCT_UNITS } from "@/lib/domain";

interface ProductFormProps {
  categories: CategoryOption[];
  suppliers: SupplierOption[];
  /** Si se indica, el formulario edita ese producto. */
  product?: { id: string; values: ProductInput };
}

const NONE = "__none__";

/** Convierte el valor de un input numérico: vacío -> undefined (obligatorio) o null (opcional). */
const toNumber = (value: string | number | null) =>
  value === "" || value === null || value === undefined ? undefined : Number(value);
const toNullableNumber = (value: string | number | null) =>
  value === "" || value === null || value === undefined ? null : Number(value);

export function ProductForm({ categories, suppliers, product }: ProductFormProps) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: product?.values ?? productDefaults,
  });

  const { submit, isPending } = useActionForm({
    form,
    action: (values) =>
      product ? updateProductAction(product.id, values) : createProductAction(values),
    successMessage: isEdit ? "Producto actualizado." : "Producto creado.",
    onSuccess: ({ id }) => router.push(`/products/${id}`),
  });

  const { register, control, watch, formState } = form;
  const errors = formState.errors;
  const [costPrice, salePrice] = watch(["costPrice", "salePrice"]);
  const margin =
    Number.isFinite(costPrice) && Number.isFinite(salePrice)
      ? getMarginPercent(salePrice, costPrice)
      : null;

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="animate-fade-up lg:col-span-2">
          <CardHeader>
            <CardTitle>Identificación</CardTitle>
            <CardDescription>
              Datos con los que se reconoce el producto en el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field
              id="sku"
              label="SKU"
              required
              description="Código interno único"
              error={errors.sku?.message}
            >
              <Input
                id="sku"
                placeholder="HER-0001"
                className="uppercase"
                autoFocus={!isEdit}
                aria-invalid={!!errors.sku}
                {...register("sku")}
              />
            </Field>
            <Field id="barcode" label="Código de barras" error={errors.barcode?.message}>
              <Input
                id="barcode"
                placeholder="7791234567890"
                inputMode="numeric"
                aria-invalid={!!errors.barcode}
                {...register("barcode")}
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
                placeholder="Ej.: Taladro percutor 650W"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
            </Field>
            <Field
              id="description"
              label="Descripción"
              error={errors.description?.message}
              className="sm:col-span-2"
            >
              <Textarea
                id="description"
                rows={3}
                placeholder="Opcional"
                aria-invalid={!!errors.description}
                {...register("description")}
              />
            </Field>
            <Field
              id="imageUrl"
              label="URL de imagen"
              error={errors.imageUrl?.message}
              className="sm:col-span-2"
            >
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://..."
                aria-invalid={!!errors.imageUrl}
                {...register("imageUrl")}
              />
            </Field>
          </CardContent>
        </Card>

        <Card className="animate-fade-up [animation-delay:80ms]">
          <CardHeader>
            <CardTitle>Clasificación</CardTitle>
            <CardDescription>Categoría, proveedor habitual y unidad de medida.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field id="categoryId" label="Categoría" required error={errors.categoryId?.message}>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="categoryId"
                      className="w-full"
                      aria-invalid={!!errors.categoryId}
                    >
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field id="supplierId" label="Proveedor" error={errors.supplierId?.message}>
              <Controller
                control={control}
                name="supplierId"
                render={({ field }) => (
                  <Select
                    value={field.value || NONE}
                    onValueChange={(value) => field.onChange(value === NONE ? "" : value)}
                  >
                    <SelectTrigger id="supplierId" className="w-full">
                      <SelectValue placeholder="Sin proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Sin proveedor</SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field id="unit" label="Unidad de medida" required error={errors.unit?.message}>
              <Controller
                control={control}
                name="unit"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="unit" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </CardContent>
        </Card>

        <Card className="animate-fade-up [animation-delay:120ms] lg:col-span-2">
          <CardHeader>
            <CardTitle>Precios</CardTitle>
            <CardDescription>
              El costo promedio real se calcula automáticamente con cada entrada de stock.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Field
              id="costPrice"
              label="Costo de referencia (USD)"
              required
              error={errors.costPrice?.message}
            >
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                aria-invalid={!!errors.costPrice}
                {...register("costPrice", { setValueAs: toNumber })}
              />
            </Field>
            <Field
              id="salePrice"
              label="Precio de venta (USD)"
              required
              error={errors.salePrice?.message}
            >
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                aria-invalid={!!errors.salePrice}
                {...register("salePrice", { setValueAs: toNumber })}
              />
            </Field>
            <div className="space-y-2">
              <p className="text-sm font-medium">Margen bruto</p>
              <p className="text-2xl font-semibold tabular-nums">
                {margin === null ? "-" : `${margin}%`}
              </p>
              <p className="text-xs text-muted-foreground">Sobre el precio de venta</p>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-up [animation-delay:160ms]">
          <CardHeader>
            <CardTitle>Niveles de stock</CardTitle>
            <CardDescription>
              Se alerta cuando la existencia total es menor o igual al mínimo.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Field id="minStock" label="Stock mínimo" required error={errors.minStock?.message}>
              <Input
                id="minStock"
                type="number"
                step="1"
                min="0"
                inputMode="numeric"
                aria-invalid={!!errors.minStock}
                {...register("minStock", { setValueAs: toNumber })}
              />
            </Field>
            <Field id="maxStock" label="Stock máximo" error={errors.maxStock?.message}>
              <Input
                id="maxStock"
                type="number"
                step="1"
                min="0"
                inputMode="numeric"
                placeholder="Sin límite"
                aria-invalid={!!errors.maxStock}
                {...register("maxStock", { setValueAs: toNullableNumber })}
              />
            </Field>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" asChild disabled={isPending}>
          <Link href={product ? `/products/${product.id}` : "/products"}>Cancelar</Link>
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <SaveIcon className="size-4" />
          )}
          {isEdit ? "Guardar cambios" : "Crear producto"}
        </Button>
      </div>
    </form>
  );
}
