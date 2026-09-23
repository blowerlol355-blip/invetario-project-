import { CompassIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CompassIcon className="size-7" />
      </span>
      <div>
        <p className="text-sm font-medium text-primary">Error 404</p>
        <h1 className="text-2xl font-semibold tracking-tight">Página no encontrada</h1>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          La ruta que buscas no existe o fue movida.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Ir al dashboard</Link>
      </Button>
    </div>
  );
}
