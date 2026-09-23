import { ShieldCheckIcon, UserCogIcon, UserIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { USER_ROLE_LABELS, type UserRole } from "@/lib/domain";
import { cn } from "@/lib/utils";

const STYLES: Record<UserRole, { className: string; icon: typeof ShieldCheckIcon }> = {
  ADMIN: { className: "border-primary/30 bg-primary/10 text-primary", icon: ShieldCheckIcon },
  MANAGER: { className: "border-info/30 bg-info/10 text-info", icon: UserCogIcon },
  OPERATOR: {
    className: "border-muted-foreground/30 bg-muted text-muted-foreground",
    icon: UserIcon,
  },
};

export function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
  const { className: style, icon: Icon } = STYLES[role];
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", style, className)}>
      <Icon className="size-3" />
      {USER_ROLE_LABELS[role]}
    </Badge>
  );
}
