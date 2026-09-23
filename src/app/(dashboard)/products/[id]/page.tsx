import { ArrowLeftRightIcon, PencilIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ProductInfoCard,
  ProductKpis,
  StockByWarehouseCard,
} from "@/features/products/components/product-detail-cards";
import { ProductMovementsTable } from "@/features/products/components/product-movements-table";
import { ProductRowActions } from "@/features/products/components/product-row-actions";
import { getProductDetail, listProductMovements } from "@/features/products/queries";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { parseListParams, type SearchParams } from "@/lib/query-params";

interface ProductPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductDetail(id);
  return { title: product ? product.name : "Producto" };
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { id } = await params;
  const listParams = parseListParams(await searchParams, { order: "desc" });

  const [session, product] = await Promise.all([auth(), getProductDetail(id)]);
  if (!product) notFound();

  const movements = await listProductMovements(id, listParams);
  const canManage = hasPermission(session?.user.role, "products:manage");
  const canMove = hasPermission(session?.user.role, "movements:create") && product.isActive;

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {product.sku}
            </Badge>
            <StatusBadge active={product.isActive} />
            <span>
              {product.category.name}
              {product.supplier ? ` · ${product.supplier.name}` : ""}
            </span>
          </span>
        }
        actions={
          canManage || canMove ? (
            <>
              {canMove && (
                <Button variant="outline" asChild>
                  <Link href={`/movements/new?productId=${product.id}`}>
                    <ArrowLeftRightIcon className="size-4" />
                    Registrar movimiento
                  </Link>
                </Button>
              )}
              {canManage && (
                <>
                  <Button asChild>
                    <Link href={`/products/${product.id}/edit`}>
                      <PencilIcon className="size-4" />
                      Editar
                    </Link>
                  </Button>
                  <ProductRowActions product={product} canManage={canManage} />
                </>
              )}
            </>
          ) : undefined
        }
      />

      <ProductKpis product={product} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <StockByWarehouseCard product={product} />
          <section className="animate-fade-up space-y-3 [animation-delay:280ms]">
            <h2 className="text-base font-semibold">Historial de movimientos</h2>
            <ProductMovementsTable data={movements} />
          </section>
        </div>
        <ProductInfoCard product={product} />
      </div>
    </div>
  );
}
