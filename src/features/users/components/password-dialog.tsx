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
import { resetPasswordAction } from "@/features/users/actions";
import type { UserRow } from "@/features/users/queries";
import { type PasswordResetInput, passwordResetSchema } from "@/features/users/schemas";
import { useActionForm } from "@/hooks/use-action-form";

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserRow;
}

const defaults: PasswordResetInput = { password: "", confirm: "" };

export function PasswordDialog({ open, onOpenChange, user }: PasswordDialogProps) {
  const form = useForm<PasswordResetInput>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (open) form.reset(defaults);
  }, [open, form]);

  const { submit, isPending } = useActionForm({
    form,
    action: (values) => resetPasswordAction(user.id, values),
    successMessage: "Contraseña restablecida.",
    onSuccess: () => onOpenChange(false),
  });

  const { register, formState } = form;
  const errors = formState.errors;

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} noValidate className="space-y-5">
          <DialogHeader>
            <DialogTitle>Restablecer contraseña</DialogTitle>
            <DialogDescription>
              Define una nueva contraseña para <strong>{user.name}</strong>. Las sesiones abiertas
              siguen activas hasta que caduquen.
            </DialogDescription>
          </DialogHeader>

          <Field
            id="password"
            label="Nueva contraseña"
            required
            error={errors.password?.message}
            description="Mínimo 8 caracteres con al menos una letra y un número."
          >
            <Input
              id="password"
              type="password"
              autoFocus
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
          </Field>

          <Field id="confirm" label="Confirmar contraseña" required error={errors.confirm?.message}>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.confirm}
              {...register("confirm")}
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
              Guardar contraseña
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
