"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUserAction, updateUserAction } from "@/features/users/actions";
import type { UserRow } from "@/features/users/queries";
import {
  passwordSchema,
  userFormDefaults,
  type UserFormInput,
  userFormSchema,
} from "@/features/users/schemas";
import { useActionForm } from "@/hooks/use-action-form";
import { USER_ROLE_LABELS, USER_ROLES } from "@/lib/domain";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si se indica, el diálogo edita; si no, crea. */
  user?: UserRow;
  /** Id del administrador conectado: no puede cambiar su propio rol. */
  currentUserId: string;
}

const ROLE_HINTS: Record<(typeof USER_ROLES)[number], string> = {
  ADMIN: "Acceso total, incluida la gestión de usuarios y la auditoría.",
  MANAGER: "Productos, catálogos, órdenes de compra y reportes.",
  OPERATOR: "Registra movimientos y consulta inventario y alertas.",
};

export function UserDialog({ open, onOpenChange, user, currentUserId }: UserDialogProps) {
  const isEdit = Boolean(user);
  const isSelf = user?.id === currentUserId;
  // La contraseña solo es obligatoria al crear; al editar se cambia desde "Restablecer contraseña".
  const schema = isEdit ? userFormSchema : userFormSchema.extend({ password: passwordSchema });

  const form = useForm<UserFormInput>({
    resolver: zodResolver(schema),
    defaultValues: userFormDefaults,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        user
          ? { name: user.name, email: user.email, role: user.role, password: "" }
          : userFormDefaults,
      );
    }
  }, [open, user, form]);

  const { submit, isPending } = useActionForm({
    form,
    action: ({ password, ...values }) =>
      user ? updateUserAction(user.id, values) : createUserAction({ ...values, password }),
    successMessage: isEdit ? "Usuario actualizado." : "Usuario creado.",
    onSuccess: () => onOpenChange(false),
  });

  const { register, control, formState, watch } = form;
  const errors = formState.errors;
  const role = watch("role");

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} noValidate className="space-y-5">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Modifica el nombre, el correo o el rol. Los cambios de rol se aplican en el siguiente inicio de sesión."
                : "La cuenta quedará activa de inmediato con la contraseña que indiques."}
            </DialogDescription>
          </DialogHeader>

          <Field id="name" label="Nombre" required error={errors.name?.message}>
            <Input
              id="name"
              autoFocus
              autoComplete="off"
              placeholder="Ej.: María Pérez"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
              {...register("name")}
            />
          </Field>

          <Field id="email" label="Correo" required error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="off"
              placeholder="usuario@empresa.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
          </Field>

          <Field
            id="role"
            label="Rol"
            required
            error={errors.role?.message}
            description={isSelf ? "No puedes cambiar tu propio rol." : ROLE_HINTS[role]}
          >
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={isSelf}>
                  <SelectTrigger id="role" className="w-full" aria-invalid={!!errors.role}>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {USER_ROLE_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          {!isEdit && (
            <Field
              id="password"
              label="Contraseña"
              required
              error={errors.password?.message}
              description="Mínimo 8 caracteres con al menos una letra y un número."
            >
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : "password-description"}
                {...register("password")}
              />
            </Field>
          )}

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
              {isEdit ? "Guardar cambios" : "Crear usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
