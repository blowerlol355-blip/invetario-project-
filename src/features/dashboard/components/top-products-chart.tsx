"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopProduct } from "@/features/dashboard/queries";
import { formatCurrency, formatInteger } from "@/lib/format";

interface ChartTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const product = payload[0]?.payload as TopProduct | undefined;
  if (!product) return null;
  return (
    <div className="rounded-lg border bg-popover p-3 text-sm text-popover-foreground shadow-md">
      <p className="font-medium">{product.name}</p>
      <p className="font-mono text-xs text-muted-foreground">{product.sku}</p>
      <p className="mt-2 tabular-nums">
        {formatCurrency(product.value)}{" "}
        <span className="text-xs text-muted-foreground">· {formatInteger(product.units)} uds.</span>
      </p>
    </div>
  );
}

function shorten(name: string, max = 22): string {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

/** Los diez productos con mayor valor en existencia (unidades × costo promedio). */
export function TopProductsChart({ products }: { products: TopProduct[] }) {
  const total = products.reduce((sum, product) => sum + product.value, 0);

  return (
    <Card className="animate-fade-up [animation-delay:300ms]">
      <CardHeader>
        <CardTitle className="text-base">Top 10 productos por valor</CardTitle>
        <CardDescription>
          Concentran {formatCurrency(total)} del inventario a costo promedio.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin existencias valorizadas.</p>
        ) : (
          <>
            <div
              className="h-80 w-full"
              role="img"
              aria-label="Gráfica de barras de los diez productos con mayor valor"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={products}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                  barCategoryGap="25%"
                >
                  <CartesianGrid horizontal={false} stroke="var(--viz-grid)" strokeWidth={1} />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: number) => formatCurrency(value).replace(/\.\d+$/, "")}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    tickLine={false}
                    axisLine={false}
                    // Recharts pasa (valor, índice): no usar `shorten` directamente.
                    tickFormatter={(value: string) => shorten(value, 18)}
                    tick={{ fill: "var(--foreground)", fontSize: 11 }}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: "var(--accent)", opacity: 0.4 }}
                  />
                  <Bar
                    dataKey="value"
                    fill="var(--viz-series-1)"
                    maxBarSize={18}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ol className="sr-only">
              {products.map((product) => (
                <li key={product.id}>
                  <Link href={`/products/${product.id}`}>{product.name}</Link>:{" "}
                  {formatCurrency(product.value)}
                </li>
              ))}
            </ol>
          </>
        )}
      </CardContent>
    </Card>
  );
}
