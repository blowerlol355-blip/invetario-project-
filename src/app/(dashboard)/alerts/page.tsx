import { BellRingIcon, PackageXIcon } from "lucide-react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { AlertsTable } from "@/features/alerts/components/alerts-table";
import { getAlertSummary, listAlerts } from "@/features/alerts/queries";
import { auth } from "@/lib/auth";
import { formatInteger } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";
import { parseListParams, type SearchParams } from "@/lib/query-params";

export const metadata: Metadata = {
  title: "Alertas de stock",
};

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = parseListParams(await searchParams);
  const [session, data, summary] = await Promise.all([
    auth(),
    listAlerts(params),
    getAlertSummary(),
  ]);
  const canOrder = hasPermission(session?.user.role, "purchase-orders:manage");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertas de stock"
        description="Productos activos cuya existencia total es menor o igual a su stock mínimo."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="animate-fade-up">
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Productos en alerta</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">
                {formatInteger(summary.total)}
              </p>
            </div>
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-warning/15 text-warning-foreground dark:text-warning">
              <BellRingIcon className="size-5" />
            </span>
          </CardContent>
        </Card>
        <Card className="animate-fade-up [animation-delay:60ms]">
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Sin existencia</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">
                {formatInteger(summary.outOfStock)}
              </p>
            </div>
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <PackageXIcon className="size-5" />
            </span>
          </CardContent>
        </Card>
      </div>

      <AlertsTable data={data} canOrder={canOrder} />
    </div>
  );
}
