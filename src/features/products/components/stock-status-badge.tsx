import { Badge } from "@/components/ui/badge";
import {
  getStockStatus,
  STOCK_STATUS_LABELS,
  type StockStatus,
} from "@/features/products/lib/stock-status";
import { cn } from "@/lib/utils";

const STYLES: Record<StockStatus, string> = {
  out: "border-destructive/30 bg-destructive/10 text-destructive",
  low: "border-warning/40 bg-warning/15 text-warning-foreground dark:text-warning",
  ok: "border-success/30 bg-success/10 text-success",
  over: "border-info/30 bg-info/10 text-info",
};

interface StockStatusBadgeProps {
  quantity: number;
  minStock: number;
  maxStock: number | null;
  className?: string;
}

export function StockStatusBadge({
  quantity,
  minStock,
  maxStock,
  className,
}: StockStatusBadgeProps) {
  const status = getStockStatus(quantity, minStock, maxStock);
  return (
    <Badge variant="outline" className={cn("font-medium", STYLES[status], className)}>
      {STOCK_STATUS_LABELS[status]}
    </Badge>
  );
}
