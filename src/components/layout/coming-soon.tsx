import { ConstructionIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";

interface ComingSoonProps {
  title: string;
  description: string;
  /** Fase del roadmap en la que se construye el módulo. */
  phase: number;
}

/** Marcador temporal para módulos aún no construidos. Se elimina al implementarlos. */
export function ComingSoon({ title, description, phase }: ComingSoonProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <div className="flex min-h-[40vh] animate-fade-up flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card p-8 text-center text-muted-foreground [animation-delay:120ms]">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-warning/15 text-warning-foreground dark:text-warning">
          <ConstructionIcon className="size-6" />
        </span>
        <p className="font-medium text-foreground">Módulo en construcción</p>
        <p className="max-w-sm text-sm">
          Este módulo se implementa en la fase {phase} del proyecto. La navegación y los permisos ya
          están activos.
        </p>
      </div>
    </div>
  );
}
