"use client";

import { useState, useTransition } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/action-result";

interface UseActionFormOptions<TValues extends FieldValues, TData> {
  form: UseFormReturn<TValues>;
  action: (values: TValues) => Promise<ActionResult<TData>>;
  successMessage: string | ((data: TData) => string);
  onSuccess?: (data: TData) => void;
}

/**
 * Conecta un formulario de React Hook Form con una Server Action:
 * muestra toasts, mapea errores de campo devueltos por el servidor y expone
 * el estado de envío.
 */
export function useActionForm<TValues extends FieldValues, TData>({
  form,
  action,
  successMessage,
  onSuccess,
}: UseActionFormOptions<TValues, TData>) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const submit = form.handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await action(values);
      if (result.success) {
        toast.success(
          typeof successMessage === "function" ? successMessage(result.data) : successMessage,
        );
        onSuccess?.(result.data);
        return;
      }

      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          if (field === "_root") continue;
          form.setError(field as Path<TValues>, { type: "server", message: messages[0] });
        }
      }
      setServerError(result.error);
      toast.error(result.error);
    });
  });

  return { submit, isPending, serverError };
}
