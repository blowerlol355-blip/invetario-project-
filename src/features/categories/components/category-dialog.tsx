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
import { createCategoryAction, updateCategoryAction } from "@/features/categories/actions";
import type { CategoryRow } from "@/features/categories/queries";
import {
  categoryDefaults,
  type CategoryInput,
  categorySchema,
} from "@/features/categories/schemas";
import { useActionForm } from "@/hooks/use-action-form";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si se indica, el diálogo edita; si no, crea. */
  category?: CategoryRow;
}

export function CategoryDialog({ open, onOpenChange, category }: CategoryDialogProps) {
  const isEdit = Boolean(category);
  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: categoryDefaults,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        category
          ? { name: category.name, description: category.description ?? "" }
          : categoryDefaults,
      );
    }
  }, [open, category, form]);

  const { submit, isPending } = useActionForm({
    form,
    action: (values) =>
      category ? updateCategoryAction(category.id, values) : createCategoryAction(values),
    successMessage: isEdit ? "Categoría actualizada." : "Categoría creada.",
    onSuccess: () => onOpenChange(false),
  });

  const { register, formState } = form;

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} noValidate className="space-y-5">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Modifica el nombre o la descripción de la categoría."
                : "Las categorías agrupan los productos del inventario."}
            </DialogDescription>
          </DialogHeader>

          <Field id="name" label="Nombre" required error={formState.errors.name?.message}>
            <Input
              id="name"
              autoFocus
              placeholder="Ej.: Herramientas"
              aria-invalid={!!formState.errors.name}
              aria-describedby={formState.errors.name ? "name-error" : undefined}
              {...register("name")}
            />
          </Field>

          <Field id="description" label="Descripción" error={formState.errors.description?.message}>
            <Textarea
              id="description"
              rows={3}
              placeholder="Opcional"
              aria-invalid={!!formState.errors.description}
              {...register("description")}
            />
          </Field>

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
              {isEdit ? "Guardar cambios" : "Crear categoría"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
