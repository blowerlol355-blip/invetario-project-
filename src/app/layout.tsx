import "./globals.css";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";

// La variable no puede llamarse --font-sans: es el token de Tailwind que la referencia.
const fontSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fontMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "StockPilot",
    template: "%s | StockPilot",
  },
  description: "Sistema de gestión de inventario para pequeñas y medianas empresas.",
  applicationName: "StockPilot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Las variables de fuente van en <html>: la regla `html { font-family }` de globals.css las lee.
    <html
      lang="es"
      className={`${fontSans.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
