import {
  ArrowLeftRightIcon,
  BellRingIcon,
  ClipboardListIcon,
  DollarSignIcon,
  PackageIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import type { DashboardKpis } from "@/features/dashboard/queries";
import { formatCurrency, formatInteger } from "@/lib/format";
import { cn } from "@/lib/utils";

interface KpiProps {
  label: string;
  value: string;
  hint: ReactNode;
  icon: typeof PackageIcon;
  href: string;
  tone?: "default" | "warning";
  delay: number;
}

function Kpi({ label, value, hint, icon: Icon, href, tone = "default", delay }: KpiProps) {
  return (
    <Link
      href={href}
      className="group rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Card
        className="h-full animate-fade-up transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md"
        style={{ animationDelay: `${delay}ms` }}
      >
        <CardContent className="flex items-start justify-between gap-3 pt-6">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 truncate text-2xl font-semibold tabular-nums xl:text-3xl">{value}</p>
            <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
          </div>
          <span
            className={cn(
              "inline-flex size-10 shrink-0 items-center justify-center rounded-lg",
              tone === "warning"
                ? "bg-warning/15 text-warning-foreground dark:text-warning"
                : "bg-primary/10 text-primary",
            )}
          >
            <Icon className="size-5" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

/** Fila de indicadores del dashboard. Cada tarjeta enlaza al módulo correspondiente. */
export function KpiCards({ kpis }: { kpis: DashboardKpis }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi
        label="Valor del inventario"
        value={formatCurrency(kpis.inventoryValue)}
        hint={`${formatInteger(kpis.inventoryUnits)} unidades a costo promedio`}
        icon={DollarSignIcon}
        href="/reports/inventory"
        delay={0}
      />
      <Kpi
        label="Productos activos"
        value={formatInteger(kpis.activeProducts)}
        hint="En el catálogo"
        icon={PackageIcon}
        href="/products"
        delay={60}
      />
      <Kpi
        label="Stock bajo"
        value={formatInteger(kpis.lowStock)}
        hint={
          kpis.outOfStock > 0
            ? `${formatInteger(kpis.outOfStock)} sin existencia`
            : "Ninguno sin existencia"
        }
        icon={BellRingIcon}
        href="/alerts"
        tone={kpis.lowStock > 0 ? "warning" : "default"}
        delay={120}
      />
      <Kpi
        label="Movimientos de hoy"
        value={formatInteger(kpis.movementsToday)}
        hint={
          <span className="inline-flex items-center gap-1">
            <ClipboardListIcon className="size-3" />
            {formatInteger(kpis.openPurchaseOrders)} órdenes de compra en curso
          </span>
        }
        icon={ArrowLeftRightIcon}
        href="/movements"
        delay={180}
      />
    </div>
  );
}
