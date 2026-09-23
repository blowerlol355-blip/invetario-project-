import type { ReactNode } from "react";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Proveedores globales de la aplicación (tema, tooltips, toasts).
 * Se monta una sola vez en el layout raíz.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      <Toaster richColors closeButton position="top-right" />
    </ThemeProvider>
  );
}
