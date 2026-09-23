import { PencilLineIcon, PlusCircleIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { AUDIT_ACTION_LABELS, type AuditAction } from "@/lib/domain";
import { cn } from "@/lib/utils";

const STYLES: Record<AuditAction, { className: string; icon: typeof PlusCircleIcon }> = {
  CREATE: { className: "border-success/30 bg-success/10 text-success", icon: PlusCircleIcon },
  UPDATE: { className: "border-info/30 bg-info/10 text-info", icon: PencilLineIcon },
  DELETE: {
    className: "border-destructive/30 bg-destructive/10 text-destructive",
    icon: Trash2Icon,
  },
  STATUS_CHANGE: {
    className: "border-warning/40 bg-warning/15 text-warning-foreground dark:text-warning",
    icon: RefreshCwIcon,
  },
};

export function AuditActionBadge({
  action,
  className,
}: {
  action: AuditAction;
  className?: string;
}) {
  const { className: style, icon: Icon } = STYLES[action];
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", style, className)}>
      <Icon className="size-3" />
      {AUDIT_ACTION_LABELS[action]}
    </Badge>
  );
}
