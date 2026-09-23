import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { AuditTable } from "@/features/audit/components/audit-table";
import { listAuditLogs } from "@/features/audit/queries";
import { auditFiltersSchema } from "@/features/audit/schemas";
import { getUserOptions } from "@/features/stock/queries";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { parseListParams, type SearchParams } from "@/lib/query-params";

export const metadata: Metadata = {
  title: "Auditoría",
};

interface AuditPageProps {
  searchParams: Promise<SearchParams>;
}

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, "audit:view")) redirect("/forbidden");

  const raw = await searchParams;
  const params = parseListParams(raw, { order: "desc" });
  const filters = auditFiltersSchema.parse({
    entity: first(raw.entity),
    action: first(raw.action),
    userId: first(raw.userId),
    from: first(raw.from),
    to: first(raw.to),
  });

  const [data, users] = await Promise.all([listAuditLogs(params, filters), getUserOptions()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoría"
        description="Bitácora de creaciones, ediciones y desactivaciones con el antes y el después de cada cambio."
      />
      <AuditTable
        data={data}
        sortState={{ sort: "createdAt", order: params.order }}
        users={users}
      />
    </div>
  );
}
