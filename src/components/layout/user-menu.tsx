"use client";

import { ChevronsUpDownIcon, Loader2Icon, LogOutIcon } from "lucide-react";
import { useTransition } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { logoutAction } from "@/features/auth/actions";
import { USER_ROLE_LABELS, type UserRole } from "@/lib/domain";
import { getInitials } from "@/lib/format";

export interface UserMenuUser {
  name: string;
  email: string;
  role: UserRole;
}

interface UserMenuProps {
  user: UserMenuUser;
  variant: "sidebar" | "header";
}

export function UserMenu({ user, variant }: UserMenuProps) {
  const [isPending, startTransition] = useTransition();
  const { isMobile } = useSidebar();
  const initials = getInitials(user.name || user.email);

  const logout = () => startTransition(() => logoutAction());

  const content = (
    <DropdownMenuContent
      align="end"
      side={variant === "sidebar" && !isMobile ? "right" : "bottom"}
      sideOffset={8}
      className="w-60"
    >
      <DropdownMenuLabel className="font-normal">
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary/10 font-medium text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 flex-1">
            <span className="truncate text-sm font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
        <Badge variant="secondary" className="mt-2">
          {USER_ROLE_LABELS[user.role]}
        </Badge>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={logout} disabled={isPending} variant="destructive">
        {isPending ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <LogOutIcon className="size-4" />
        )}
        Cerrar sesión
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  if (variant === "header") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Menú de usuario"
            className="rounded-full transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        {content}
      </DropdownMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              aria-label="Menú de usuario"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-medium text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {USER_ROLE_LABELS[user.role]}
                </span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          {content}
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
