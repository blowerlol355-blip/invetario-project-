import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  active: boolean;
  className?: string;
}

/** Insignia Activo / Inactivo para catálogos con soft delete. */
export function StatusBadge({ active, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-medium",
        active
          ? "border-success/30 bg-success/10 text-success"
          : "border-muted-foreground/30 bg-muted text-muted-foreground",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("size-1.5 rounded-full", active ? "bg-success" : "bg-muted-foreground")}
      />
      {active ? "Activo" : "Inactivo"}
    </Badge>
  );
}
