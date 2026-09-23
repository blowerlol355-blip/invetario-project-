import {
  ArrowDownToLineIcon,
  ArrowLeftRightIcon,
  ArrowUpFromLineIcon,
  SlidersHorizontalIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { MOVEMENT_TYPE_LABELS, type MovementType } from "@/lib/domain";
import { cn } from "@/lib/utils";

const STYLES: Record<MovementType, { className: string; icon: typeof ArrowDownToLineIcon }> = {
  IN: { className: "border-success/30 bg-success/10 text-success", icon: ArrowDownToLineIcon },
  OUT: {
    className: "border-destructive/30 bg-destructive/10 text-destructive",
    icon: ArrowUpFromLineIcon,
  },
  TRANSFER: { className: "border-info/30 bg-info/10 text-info", icon: ArrowLeftRightIcon },
  ADJUSTMENT: {
    className: "border-warning/40 bg-warning/15 text-warning-foreground dark:text-warning",
    icon: SlidersHorizontalIcon,
  },
};

export function MovementTypeBadge({ type, className }: { type: MovementType; className?: string }) {
  const { className: style, icon: Icon } = STYLES[type];
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", style, className)}>
      <Icon className="size-3" />
      {MOVEMENT_TYPE_LABELS[type]}
    </Badge>
  );
}
