"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircleIcon, EyeIcon, EyeOffIcon, Loader2Icon, LogInIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/features/auth/actions";
import { type LoginInput, loginSchema } from "@/features/auth/schemas";

interface LoginFormProps {
  callbackUrl?: string;
  /** Credenciales precargadas al elegir un usuario demo. */
  prefill?: { email: string; password: string } | null;
}

export function LoginForm({ callbackUrl, prefill }: LoginFormProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    values: prefill ?? undefined,
  });

  const { register, handleSubmit, formState } = form;

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await loginAction(values, callbackUrl);
      if (result?.error) setServerError(result.error);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {serverError && (
        <Alert
          variant="destructive"
          role="alert"
          className="animate-in fade-in slide-in-from-top-1"
        >
          <AlertCircleIcon className="size-4" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="tu@empresa.com"
          aria-invalid={!!formState.errors.email}
          aria-describedby={formState.errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {formState.errors.email && (
          <p id="email-error" className="text-sm text-destructive">
            {formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="********"
            className="pr-10"
            aria-invalid={!!formState.errors.password}
            aria-describedby={formState.errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
          </button>
        </div>
        {formState.errors.password && (
          <p id="password-error" className="text-sm text-destructive">
            {formState.errors.password.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <LogInIcon className="size-4" />
        )}
        {isPending ? "Ingresando..." : "Iniciar sesión"}
      </Button>
    </form>
  );
}
