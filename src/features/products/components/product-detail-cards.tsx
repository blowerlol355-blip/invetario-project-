import { BarcodeIcon, BoxesIcon, DollarSignIcon, PercentIcon, TagIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockStatusBadge } from "@/features/products/components/stock-status-badge";
import { getMarginPercent, getStockFillPercent } from "@/features/products/lib/stock-status";
import type { ProductDetail } from "@/features/products/queries";
import { formatCurrency, formatDateTime, formatInteger } from "@/lib/format";
import { cn } from "@/lib/utils";

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
  delay,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: typeof BoxesIcon;
  delay: number;
}) {
  return (
    <Card className="animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <CardContent className="flex items-start justify-between gap-3 pt-6">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
      </CardContent>
    </Card>
  );
}

export function ProductKpis({ product }: { product: ProductDetail }) {
  const margin = getMarginPercent(product.salePrice, product.avgCost || product.costPrice);
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi
        label="Existencia total"
        value={`${formatInteger(product.totalStock)} ${product.unit}`}
        hint={
          <StockStatusBadge
            quantity={product.totalStock}
            minStock={product.minStock}
            maxStock={product.maxStock}
          />
        }
        icon={BoxesIcon}
        delay={0}
      />
      <Kpi
        label="Valor a costo promedio"
        value={formatCurrency(product.totalStock * product.avgCost)}
        hint={`Costo promedio ${formatCurrency(product.avgCost)}`}
        icon={DollarSignIcon}
        delay={60}
      />
      <Kpi
        label="Precio de venta"
        value={formatCurrency(product.salePrice)}
        hint={`Costo de referencia ${formatCurrency(product.costPrice)}`}
        icon={TagIcon}
        delay={120}
      />
      <Kpi
        label="Margen bruto"
        value={margin === null ? "-" : `${margin}%`}
        hint="Sobre el precio de venta"
        icon={PercentIcon}
        delay={180}
      />
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

export function ProductInfoCard({ product }: { product: ProductDetail }) {
  return (
    <Card className="animate-fade-up [animation-delay:200ms]">
      <CardHeader>
        <CardTitle className="text-base">Información</CardTitle>
      </CardHeader>
      <CardContent>
        {product.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria
          <img
            src={product.imageUrl}
            alt={product.name}
            className="mb-4 aspect-video w-full rounded-lg border object-cover"
          />
        )}
        <dl className="divide-y">
          <InfoRow label="SKU">
            <span className="font-mono">{product.sku}</span>
          </InfoRow>
          <InfoRow label="Código de barras">
            {product.barcode ? (
              <span className="inline-flex items-center gap-1 font-mono">
                <BarcodeIcon className="size-3.5" />
                {product.barcode}
              </span>
            ) : (
              "-"
            )}
          </InfoRow>
          <InfoRow label="Categoría">
            <span className="inline-flex items-center gap-2">
              {product.category.name}
              {!product.category.isActive && <StatusBadge active={false} />}
            </span>
          </InfoRow>
          <InfoRow label="Proveedor">
            {product.supplier ? (
              <span className="inline-flex items-center gap-2">
                {product.supplier.name}
                {!product.supplier.isActive && <StatusBadge active={false} />}
              </span>
            ) : (
              "-"
            )}
          </InfoRow>
          <InfoRow label="Unidad">{product.unit}</InfoRow>
          <InfoRow label="Stock mínimo / máximo">
            {formatInteger(product.minStock)} /{" "}
            {product.maxStock === null ? "sin límite" : formatInteger(product.maxStock)}
          </InfoRow>
          <InfoRow label="Creado">{formatDateTime(product.createdAt)}</InfoRow>
          <InfoRow label="Actualizado">{formatDateTime(product.updatedAt)}</InfoRow>
        </dl>
        {product.description && (
          <p className="mt-4 border-t pt-4 text-sm text-muted-foreground">{product.description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function StockByWarehouseCard({ product }: { product: ProductDetail }) {
  return (
    <Card className="animate-fade-up [animation-delay:240ms]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Stock por almacén</CardTitle>
        <Link href="/warehouses" className="text-xs text-primary hover:underline">
          Ver almacenes
        </Link>
      </CardHeader>
      <CardContent>
        {product.stocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin existencias en ningún almacén.</p>
        ) : (
          <ul className="space-y-4">
            {product.stocks.map((stock) => {
              const share =
                product.totalStock > 0
                  ? Math.round((stock.quantity / product.totalStock) * 100)
                  : 0;
              const fill = getStockFillPercent(stock.quantity, product.minStock, product.maxStock);
              return (
                <li key={stock.warehouseId}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2">
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                        {stock.warehouseCode}
                      </span>
                      {stock.warehouseName}
                    </span>
                    <span className="tabular-nums">
                      <span className="font-medium">{formatInteger(stock.quantity)}</span>
                      <span className="text-xs text-muted-foreground"> ({share}%)</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        stock.quantity <= 0
                          ? "bg-destructive"
                          : fill < 40
                            ? "bg-warning"
                            : "bg-gradient-to-r from-primary to-chart-2",
                      )}
                      style={{ width: `${Math.max(fill, 2)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
