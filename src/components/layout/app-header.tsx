"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

import { Breadcrumbs } from "./breadcrumbs";
import { UserMenu, type UserMenuUser } from "./user-menu";

interface AppHeaderProps {
  user: UserMenuUser;
}

export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
      <SidebarTrigger className="-ml-1" aria-label="Alternar menú lateral" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumbs />
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <UserMenu user={user} variant="header" />
      </div>
    </header>
  );
}
