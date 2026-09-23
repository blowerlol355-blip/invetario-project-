import { FileSpreadsheetIcon, FileTextIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ReportKey } from "@/features/reports/registry";

interface ExportButtonsProps {
  report: ReportKey;
  /** Parámetros de filtro actuales (se reenvían al endpoint de exportación). */
  params: Record<string, string>;
  disabled?: boolean;
}

/** Enlaces de descarga CSV y PDF del reporte con los filtros vigentes. */
export function ExportButtons({ report, params, disabled }: ExportButtonsProps) {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== ""));
  const href = (format: "csv" | "pdf") => {
    query.set("format", format);
    return `/api/reports/${report}?${query.toString()}`;
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" asChild disabled={disabled}>
        <a href={href("csv")} download aria-disabled={disabled}>
          <FileSpreadsheetIcon className="size-4" />
          CSV
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild disabled={disabled}>
        <a href={href("pdf")} download aria-disabled={disabled}>
          <FileTextIcon className="size-4" />
          PDF
        </a>
      </Button>
    </div>
  );
}
