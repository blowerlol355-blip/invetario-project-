import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { KpiCards } from "@/features/dashboard/components/kpi-cards";
import { MovementsChart } from "@/features/dashboard/components/movements-chart";
import { RecentMovements } from "@/features/dashboard/components/recent-movements";
import { TopProductsChart } from "@/features/dashboard/components/top-products-chart";
import { getDashboardData } from "@/features/dashboard/queries";
import { auth } from "@/lib/auth";
import { formatShortDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Dashboard",
};

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default async function DashboardPage() {
  const [session, data] = await Promise.all([auth(), getDashboardData()]);
  const firstName = session?.user.name?.split(" ")[0] ?? "";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description={`Resumen del inventario al ${formatShortDate(new Date())}.`}
      />
      <KpiCards kpis={data.kpis} />
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <MovementsChart data={data.series} />
        </div>
        <div className="xl:col-span-2">
          <TopProductsChart products={data.topProducts} />
        </div>
      </div>
      <RecentMovements movements={data.recentMovements} />
    </div>
  );
}
