// Valida las variables de entorno al arrancar (falla temprano si faltan).
import "./src/lib/env";

import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Cabeceras de seguridad aplicadas a todas las rutas.
 * La CSP se aplica en modo estricto (enforce). `'unsafe-inline'` en script-src es necesario
 * para los scripts de hidratación de Next.js sin nonces; `'unsafe-eval'` solo en desarrollo
 * (Fast Refresh). Los tests E2E fallan si el navegador reporta una violación.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  {
    key: "Content-Security-Policy",
    // cdn.jsdelivr.net y fonts.scalar.com: referencia interactiva de la API en /api-docs (Scalar).
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://cdn.jsdelivr.net`,
      "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.scalar.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.scalar.com https://cdn.jsdelivr.net",
      "connect-src 'self' https://cdn.jsdelivr.net",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // pdfmake usa pdfkit y fuentes en binario: se ejecuta en Node sin empaquetar.
  serverExternalPackages: ["pdfmake"],
  // En Vercel las funciones solo incluyen los archivos trazados: las métricas de las fuentes
  // estándar de PDFKit (Helvetica) se leen del disco en tiempo de ejecución.
  outputFileTracingIncludes: {
    "/api/reports/[report]": ["./node_modules/pdfkit/js/data/**"],
  },
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
