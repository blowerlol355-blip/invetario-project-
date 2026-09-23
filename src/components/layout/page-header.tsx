import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  /** Acciones a la derecha (botones, filtros). */
  actions?: ReactNode;
}

/** Encabezado estándar de página: título, descripción y acciones. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex animate-fade-up flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <div className="mt-1 text-sm text-muted-foreground">{description}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
