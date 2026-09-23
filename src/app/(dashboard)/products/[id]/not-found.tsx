import { PackageSearchIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <div className="flex min-h-[50vh] animate-fade-up flex-col items-center justify-center gap-4 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <PackageSearchIcon className="size-7" />
      </span>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Producto no encontrado</h1>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          El producto no existe o el enlace es incorrecto.
        </p>
      </div>
      <Button asChild>
        <Link href="/products">Volver a productos</Link>
      </Button>
    </div>
  );
}
