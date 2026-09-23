import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PurchaseOrderStatusBadge } from "@/features/purchase-orders/components/po-status-badge";
import { PurchaseOrderActions } from "@/features/purchase-orders/components/purchase-order-actions";
import { getPurchaseOrderDetail } from "@/features/purchase-orders/queries";
import { auth } from "@/lib/auth";
import { formatCurrency, formatDateTime, formatInteger, formatShortDate } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";

interface PurchaseOrderPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PurchaseOrderPageProps): Promise<Metadata> {
  const { id } = await params;
  const order = await getPurchaseOrderDetail(id);
  return { title: order ? `Orden ${order.code}` : "Orden de compra" };
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

export default async function PurchaseOrderPage({ params }: PurchaseOrderPageProps) {
  const { id } = await params;
  const [session, order] = await Promise.all([auth(), getPurchaseOrderDetail(id)]);
  if (!order) notFound();

  const canManage = hasPermission(session?.user.role, "purchase-orders:manage");
  const canReceive = hasPermission(session?.user.role, "purchase-orders:receive");
  const percent =
    order.quantityOrdered === 0
      ? 0
      : Math.round((order.quantityReceived / order.quantityOrdered) * 100);

  const timeline = [
    { label: "Creada", date: order.createdAt, by: order.createdBy.name },
    { label: "Enviada", date: order.sentAt },
    {
      label: order.status === "PARTIALLY_RECEIVED" ? "Última recepción" : "Recibida",
      date: order.receivedAt,
    },
    { label: "Cancelada", date: order.cancelledAt },
  ].filter((step) => step.date);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Orden ${order.code}`}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <PurchaseOrderStatusBadge status={order.status} />
            <span>
              {order.supplier.name} · recepción en {order.warehouse.name}
            </span>
          </span>
        }
        actions={
          <PurchaseOrderActions order={order} canManage={canManage} canReceive={canReceive} />
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="animate-fade-up">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Productos</CardTitle>
              <span className="text-sm text-muted-foreground tabular-nums">
                {formatInteger(order.quantityReceived)} / {formatInteger(order.quantityOrdered)}{" "}
                unidades recibidas ({percent}%)
              </span>
            </CardHeader>
            <CardContent>
              <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    order.status === "CANCELLED"
                      ? "bg-destructive"
                      : "bg-gradient-to-r from-primary to-chart-2",
                  )}
                  style={{ width: `${Math.max(percent, order.status === "CANCELLED" ? 100 : 0)}%` }}
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b text-xs text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-3 text-left font-medium">Producto</th>
                      <th className="px-3 py-2 text-right font-medium">Pedido</th>
                      <th className="px-3 py-2 text-right font-medium">Recibido</th>
                      <th className="px-3 py-2 text-right font-medium">Pendiente</th>
                      <th className="px-3 py-2 text-right font-medium">Costo unit.</th>
                      <th className="py-2 pl-3 text-right font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {order.items.map((item) => {
                      const pending = item.quantityOrdered - item.quantityReceived;
                      return (
                        <tr key={item.id} className="animate-fade-up">
                          <td className="py-2 pr-3">
                            <Link
                              href={`/products/${item.productId}`}
                              className="font-medium hover:underline"
                            >
                              {item.productName}
                            </Link>
                            <p className="font-mono text-xs text-muted-foreground">{item.sku}</p>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {formatInteger(item.quantityOrdered)} {item.unit}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {formatInteger(item.quantityReceived)}
                          </td>
                          <td
                            className={cn(
                              "px-3 py-2 text-right tabular-nums",
                              pending > 0 && order.status !== "CANCELLED"
                                ? "font-medium text-warning-foreground dark:text-warning"
                                : "text-muted-foreground",
                            )}
                          >
                            {formatInteger(pending)}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {formatCurrency(item.unitCost)}
                          </td>
                          <td className="py-2 pl-3 text-right tabular-nums">
                            {formatCurrency(item.quantityOrdered * item.unitCost)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t font-medium">
                    <tr>
                      <td className="py-2 pr-3">Total</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatInteger(order.quantityOrdered)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatInteger(order.quantityReceived)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatInteger(order.quantityOrdered - order.quantityReceived)}
                      </td>
                      <td />
                      <td className="py-2 pl-3 text-right tabular-nums">
                        {formatCurrency(order.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {order.notes && (
            <Card className="animate-fade-up [animation-delay:80ms]">
              <CardHeader>
                <CardTitle className="text-base">Notas</CardTitle>
              </CardHeader>
              <CardContent className="text-sm whitespace-pre-line">{order.notes}</CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="animate-fade-up [animation-delay:120ms]">
            <CardHeader>
              <CardTitle className="text-base">Información</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y">
                <InfoRow label="Proveedor">
                  <Link
                    href={`/suppliers?q=${encodeURIComponent(order.supplier.name)}`}
                    className="hover:underline"
                  >
                    {order.supplier.name}
                  </Link>
                  {order.supplier.contactName && (
                    <p className="text-xs font-normal text-muted-foreground">
                      {order.supplier.contactName}
                    </p>
                  )}
                </InfoRow>
                <InfoRow label="Almacén">
                  <span className="font-mono text-xs">{order.warehouse.code}</span>{" "}
                  {order.warehouse.name}
                </InfoRow>
                <InfoRow label="Entrega esperada">
                  {order.expectedDate ? formatShortDate(order.expectedDate) : "-"}
                </InfoRow>
                <InfoRow label="Creada por">{order.createdBy.name}</InfoRow>
                <InfoRow label="Última actualización">{formatDateTime(order.updatedAt)}</InfoRow>
              </dl>
            </CardContent>
          </Card>

          <Card className="animate-fade-up [animation-delay:160ms]">
            <CardHeader>
              <CardTitle className="text-base">Línea de tiempo</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-4 border-l pl-4">
                {timeline.map((step) => (
                  <li key={step.label} className="text-sm">
                    <span className="absolute -left-[5px] mt-1.5 size-2 rounded-full bg-primary" />
                    <p className="font-medium">{step.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(step.date!)}
                      {"by" in step && step.by ? ` · ${step.by}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
              {order.status !== "CANCELLED" && order.status !== "RECEIVED" && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Los movimientos de recepción aparecen en el historial con la referencia{" "}
                  <Link
                    href={`/movements?q=${order.code}`}
                    className="font-mono text-primary hover:underline"
                  >
                    {order.code}
                  </Link>
                  .
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
