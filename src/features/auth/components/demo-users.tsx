"use client";

import { ShieldCheckIcon, UserCogIcon, UserIcon } from "lucide-react";

import { USER_ROLE_LABELS, type UserRole } from "@/lib/domain";
import { cn } from "@/lib/utils";

export interface DemoUser {
  role: UserRole;
  name: string;
  email: string;
  password: string;
  description: string;
}

/** Usuarios creados por el seed. Se muestran para que cualquiera pueda probar la demo. */
export const DEMO_USERS: DemoUser[] = [
  {
    role: "ADMIN",
    name: "Ana Torres",
    email: "admin@stockpilot.dev",
    password: "Admin123!",
    description: "Acceso total, usuarios y auditoría",
  },
  {
    role: "MANAGER",
    name: "Luis Medina",
    email: "manager@stockpilot.dev",
    password: "Manager123!",
    description: "Productos, catálogos, compras y reportes",
  },
  {
    role: "OPERATOR",
    name: "Carla Rojas",
    email: "operator@stockpilot.dev",
    password: "Operator123!",
    description: "Movimientos de stock y consultas",
  },
];

const ROLE_ICONS = {
  ADMIN: ShieldCheckIcon,
  MANAGER: UserCogIcon,
  OPERATOR: UserIcon,
} as const;

const ROLE_STYLES: Record<UserRole, string> = {
  ADMIN: "bg-primary/10 text-primary",
  MANAGER: "bg-info/15 text-info",
  OPERATOR: "bg-success/15 text-success",
};

interface DemoUsersProps {
  selectedEmail?: string;
  onSelect: (user: DemoUser) => void;
}

export function DemoUsers({ selectedEmail, onSelect }: DemoUsersProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Usuarios de demostración
      </p>
      <ul className="grid gap-2">
        {DEMO_USERS.map((user) => {
          const Icon = ROLE_ICONS[user.role];
          const selected = selectedEmail === user.email;
          return (
            <li key={user.email}>
              <button
                type="button"
                onClick={() => onSelect(user)}
                aria-pressed={selected}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-left transition-all duration-200 hover:border-primary/50 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  selected && "border-primary bg-accent/60 shadow-sm shadow-primary/10",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-9 shrink-0 items-center justify-center rounded-md",
                    ROLE_STYLES[user.role],
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {USER_ROLE_LABELS[user.role]}
                    </span>
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {user.description}
                  </span>
                </span>
                <span className="hidden font-mono text-[11px] text-muted-foreground sm:block">
                  {user.password}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
