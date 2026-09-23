"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyMovementPoint } from "@/features/dashboard/lib/series";
import { formatInteger } from "@/lib/format";

const SERIES = [
  { key: "inbound", label: "Entradas", color: "var(--viz-series-1)" },
  { key: "outbound", label: "Salidas", color: "var(--viz-series-2)" },
] as const;

interface ChartTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
  label?: React.ReactNode;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as DailyMovementPoint | undefined;
  return (
    <div className="rounded-lg border bg-popover p-3 text-sm text-popover-foreground shadow-md">
      <p className="mb-2 font-medium">{label}</p>
      <ul className="space-y-1">
        {SERIES.map((series) => (
          <li key={series.key} className="flex items-center justify-between gap-6">
            <span className="inline-flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: series.color }} />
              {series.label}
            </span>
            <span className="tabular-nums">{formatInteger(point?.[series.key] ?? 0)}</span>
          </li>
        ))}
        <li className="flex justify-between gap-6 border-t pt-1 text-xs text-muted-foreground">
          <span>Movimientos</span>
          <span className="tabular-nums">{formatInteger(point?.movements ?? 0)}</span>
        </li>
      </ul>
    </div>
  );
}

interface MovementsChartProps {
  data: DailyMovementPoint[];
}

/** Unidades que entraron y salieron por día en los últimos 30 días (las transferencias no cuentan). */
export function MovementsChart({ data }: MovementsChartProps) {
  const totalIn = data.reduce((sum, point) => sum + point.inbound, 0);
  const totalOut = data.reduce((sum, point) => sum + point.outbound, 0);

  return (
    <Card className="animate-fade-up [animation-delay:240ms]">
      <CardHeader>
        <CardTitle className="text-base">Movimientos de los últimos 30 días</CardTitle>
        <CardDescription>
          {formatInteger(totalIn)} unidades entraron y {formatInteger(totalOut)} salieron. Las
          transferencias entre almacenes no se cuentan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="h-72 w-full"
          role="img"
          aria-label="Gráfica de barras de entradas y salidas diarias"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              barGap={2}
              barCategoryGap="30%"
            >
              <CartesianGrid vertical={false} stroke="var(--viz-grid)" strokeWidth={1} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                interval={4}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={44}
                tickFormatter={(value: number) => formatInteger(value)}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: "var(--accent)", opacity: 0.4 }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
              />
              {SERIES.map((series) => (
                <Bar
                  key={series.key}
                  dataKey={series.key}
                  name={series.label}
                  fill={series.color}
                  maxBarSize={24}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
