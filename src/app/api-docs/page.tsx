import { ArrowLeftIcon, BookOpenTextIcon, FileJson2Icon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ApiReference } from "@/features/api/components/api-reference";

export const metadata: Metadata = {
  title: "Documentación de la API",
  description: "Referencia interactiva de la API REST de StockPilot (OpenAPI 3.1).",
};

/** Página pública con la referencia de la API; las peticiones sí exigen autenticación. */
export default function ApiDocsPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <BookOpenTextIcon className="size-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">StockPilot API v1</p>
              <p className="text-xs text-muted-foreground">
                Autenticación con <code className="font-mono">Authorization: Bearer</code> o con la
                sesión del navegador.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a href="/openapi.yaml" download>
                <FileJson2Icon className="size-4" />
                openapi.yaml
              </a>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">
                <ArrowLeftIcon className="size-4" />
                Volver a la app
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <ApiReference specUrl="/openapi.yaml" />
      </main>
    </div>
  );
}
