import { FileQuestionIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function PurchaseOrderNotFound() {
  return (
    <div className="flex min-h-[50vh] animate-fade-up flex-col items-center justify-center gap-4 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FileQuestionIcon className="size-7" />
      </span>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orden no encontrada</h1>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          La orden de compra no existe o el enlace es incorrecto.
        </p>
      </div>
      <Button asChild>
        <Link href="/purchase-orders">Volver a órdenes de compra</Link>
      </Button>
    </div>
  );
}
