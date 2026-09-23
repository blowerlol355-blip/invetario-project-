import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { MovementsTable } from "@/features/stock/components/movements-table";
import { getUserOptions, listMovements } from "@/features/stock/queries";
import { movementFiltersSchema } from "@/features/stock/schemas";
import { getWarehouseOptions } from "@/features/warehouses/queries";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { parseListParams, type SearchParams } from "@/lib/query-params";

export const metadata: Metadata = {
  title: "Movimientos",
};

interface MovementsPageProps {
  searchParams: Promise<SearchParams>;
}

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function MovementsPage({ searchParams }: MovementsPageProps) {
  const raw = await searchParams;
  const params = parseListParams(raw, { order: "desc" });
  const filters = movementFiltersSchema.parse({
    type: first(raw.type),
    warehouseId: first(raw.warehouseId),
    productId: first(raw.productId),
    userId: first(raw.userId),
    from: first(raw.from),
    to: first(raw.to),
  });

  const [session, data, warehouses, users] = await Promise.all([
    auth(),
    listMovements(params, filters),
    getWarehouseOptions(),
    getUserOptions(),
  ]);
  const canCreate = hasPermission(session?.user.role, "movements:create");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Movimientos"
        description="Historial de entradas, salidas, ajustes y transferencias de stock."
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/movements/new">
                <PlusIcon className="size-4" />
                Registrar movimiento
              </Link>
            </Button>
          ) : undefined
        }
      />
      <MovementsTable
        data={data}
        sortState={{ sort: "createdAt", order: params.order }}
        warehouses={warehouses}
        users={users}
      />
    </div>
  );
}
