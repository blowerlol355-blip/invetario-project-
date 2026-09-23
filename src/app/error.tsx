"use client";

import { TriangleAlertIcon } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Página de error global. Nunca muestra detalles internos al usuario. */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlertIcon className="size-7" />
      </span>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Algo salió mal</h1>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Ocurrió un error inesperado. Puedes intentarlo de nuevo; si persiste, contacta al
          administrador.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-muted-foreground">Referencia: {error.digest}</p>
        )}
      </div>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
