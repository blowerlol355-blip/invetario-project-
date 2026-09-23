import { ArrowLeftRightIcon, BookOpenTextIcon, DollarSignIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Reportes",
};

const REPORT_CARDS = [
  {
    href: "/reports/inventory",
    icon: DollarSignIcon,
    title: "Inventario valorizado",
    description:
      "Existencia y valor de cada producto a costo promedio ponderado, con totales por categoría y filtro por almacén.",
  },
  {
    href: "/reports/kardex",
    icon: BookOpenTextIcon,
    title: "Kardex por producto",
    description:
      "Saldo inicial, cada entrada y salida con saldo corrido, y saldo final de un producto en un rango de fechas.",
  },
  {
    href: "/reports/movements",
    icon: ArrowLeftRightIcon,
    title: "Movimientos por fecha",
    description: "Todos los movimientos de un período, filtrables por tipo, almacén y usuario.",
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes"
        description="Cada reporte se puede exportar a CSV (Excel) y PDF con los filtros aplicados."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {REPORT_CARDS.map((report, index) => (
          <Link
            key={report.href}
            href={report.href}
            className="group rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Card
              className="h-full animate-fade-up transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <CardHeader>
                <span className="mb-2 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <report.icon className="size-5" />
                </span>
                <CardTitle className="text-base">{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-sm font-medium text-primary group-hover:underline">
                  Abrir reporte
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
