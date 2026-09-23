import Link from "next/link";

import { MovementTypeBadge } from "@/components/movement-type-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecentMovement } from "@/features/dashboard/queries";
import { formatInteger, formatRelative } from "@/lib/format";

export function RecentMovements({ movements }: { movements: RecentMovement[] }) {
  return (
    <Card className="animate-fade-up [animation-delay:360ms]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Últimos movimientos</CardTitle>
        <Link href="/movements" className="text-xs text-primary hover:underline">
          Ver historial
        </Link>
      </CardHeader>
      <CardContent>
        {movements.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay movimientos registrados.</p>
        ) : (
          <ul className="divide-y">
            {movements.map((movement) => (
              <li key={movement.id} className="flex items-center gap-3 py-2.5 text-sm">
                <MovementTypeBadge type={movement.type} className="w-28 justify-center" />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${movement.productId}`}
                    className="line-clamp-1 font-medium hover:underline"
                  >
                    {movement.productName}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-mono">{movement.warehouse}</span> · {movement.userName} ·{" "}
                    {formatRelative(movement.createdAt)}
                  </p>
                </div>
                <span className="shrink-0 tabular-nums">
                  {formatInteger(movement.quantity)}{" "}
                  <span className="text-xs text-muted-foreground">{movement.unit}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
