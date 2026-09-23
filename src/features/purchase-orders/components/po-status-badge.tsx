import { Badge } from "@/components/ui/badge";
import { PURCHASE_ORDER_STATUS_LABELS, type PurchaseOrderStatus } from "@/lib/domain";
import { cn } from "@/lib/utils";

const STYLES: Record<PurchaseOrderStatus, string> = {
  DRAFT: "border-muted-foreground/30 bg-muted text-muted-foreground",
  SENT: "border-info/30 bg-info/10 text-info",
  PARTIALLY_RECEIVED: "border-warning/40 bg-warning/15 text-warning-foreground dark:text-warning",
  RECEIVED: "border-success/30 bg-success/10 text-success",
  CANCELLED: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function PurchaseOrderStatusBadge({
  status,
  className,
}: {
  status: PurchaseOrderStatus;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("font-medium", STYLES[status], className)}>
      {PURCHASE_ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}
