import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { MovementForm } from "@/features/stock/components/movement-form";
import { getProductOptions } from "@/features/stock/queries";
import { getWarehouseOptions } from "@/features/warehouses/queries";
import { auth } from "@/lib/auth";
import { MOVEMENT_TYPES, type MovementType } from "@/lib/domain";
import { hasPermission } from "@/lib/permissions";
import type { SearchParams } from "@/lib/query-params";

export const metadata: Metadata = {
  title: "Registrar movimiento",
};

interface NewMovementPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function NewMovementPage({ searchParams }: NewMovementPageProps) {
  const session = await auth();
  if (!hasPermission(session?.user.role, "movements:create")) redirect("/forbidden");

  const raw = await searchParams;
  const requestedType = Array.isArray(raw.type) ? raw.type[0] : raw.type;
  const initialType: MovementType = (MOVEMENT_TYPES as readonly string[]).includes(
    requestedType ?? "",
  )
    ? (requestedType as MovementType)
    : "IN";
  const initialProductId = Array.isArray(raw.productId) ? raw.productId[0] : raw.productId;

  const [products, warehouses] = await Promise.all([getProductOptions(), getWarehouseOptions()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registrar movimiento"
        description="Toda variación de existencias se registra aquí y queda en el historial."
      />
      <MovementForm
        products={products}
        warehouses={warehouses}
        initialType={initialType}
        initialProductId={
          initialProductId && products.some((p) => p.id === initialProductId)
            ? initialProductId
            : undefined
        }
      />
    </div>
  );
}
