"use client";

import Script from "next/script";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef } from "react";

const SCALAR_SCRIPT = "https://cdn.jsdelivr.net/npm/@scalar/api-reference";

interface ScalarApi {
  createApiReference: (
    selector: string | HTMLElement,
    configuration: Record<string, unknown>,
  ) => { destroy?: () => void };
}

declare global {
  interface Window {
    Scalar?: ScalarApi;
  }
}

interface ApiReferenceProps {
  /** URL del documento OpenAPI (YAML o JSON). */
  specUrl: string;
}

/**
 * Renderiza la referencia interactiva de la API con Scalar (cargado desde CDN).
 * "Probar" funciona con la sesión del navegador o con una clave de API en Authorization.
 */
export function ApiReference({ specUrl }: ApiReferenceProps) {
  const container = useRef<HTMLDivElement>(null);
  const instance = useRef<{ destroy?: () => void } | null>(null);
  const { resolvedTheme } = useTheme();

  const mount = useCallback(() => {
    if (!window.Scalar || !container.current || instance.current) return;
    instance.current = window.Scalar.createApiReference(container.current, {
      url: specUrl,
      // Sin proxy externo: las peticiones de "Probar" van al mismo origen (con la cookie de sesión).
      proxyUrl: "",
      theme: "kepler",
      darkMode: resolvedTheme === "dark",
      hideDarkModeToggle: true,
      hideClientButton: true,
      defaultOpenAllTags: true,
      authentication: { preferredSecurityScheme: "ApiKeyAuth" },
      metaData: { title: "StockPilot API" },
    });
  }, [specUrl, resolvedTheme]);

  useEffect(() => {
    mount();
    return () => {
      instance.current?.destroy?.();
      instance.current = null;
    };
  }, [mount]);

  return (
    <>
      <Script src={SCALAR_SCRIPT} strategy="afterInteractive" onLoad={mount} />
      <div ref={container} className="min-h-[70vh]" />
    </>
  );
}
