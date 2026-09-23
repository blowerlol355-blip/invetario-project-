import { ShieldAlertIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Acceso denegado",
};

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] animate-fade-up flex-col items-center justify-center gap-4 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlertIcon className="size-7" />
      </span>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Acceso denegado</h1>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Tu rol no tiene permisos para ver esta sección. Si crees que es un error, contacta a un
          administrador.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Volver al dashboard</Link>
      </Button>
    </div>
  );
}
