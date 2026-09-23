import { NextResponse } from "next/server";
import NextAuth from "next-auth";

import { authConfig } from "@/lib/auth.config";
import { getRequiredPermission } from "@/lib/navigation";
import { hasPermission } from "@/lib/permissions";

const { auth } = NextAuth(authConfig);

/** Rutas accesibles sin sesión (la API autentica por sí misma; /openapi.yaml alimenta /api-docs). */
const PUBLIC_PATHS = ["/login", "/api/auth", "/api/v1", "/api-docs", "/openapi.yaml"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Protección de rutas: exige sesión en toda la aplicación (salvo rutas públicas)
 * y comprueba el permiso de cada sección según el rol. Las Server Actions
 * vuelven a validar permisos en el servidor; esto es solo la primera barrera.
 */
export default auth((request) => {
  const { nextUrl } = request;
  const { pathname } = nextUrl;
  const user = request.auth?.user;

  if (isPublicPath(pathname)) {
    if (user && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  if (!user) {
    const loginUrl = new URL("/login", nextUrl);
    if (pathname !== "/") loginUrl.searchParams.set("callbackUrl", pathname + nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  const required = getRequiredPermission(pathname);
  if (required && !hasPermission(user.role, required)) {
    return NextResponse.redirect(new URL("/forbidden", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Excluye archivos estáticos y assets; todo lo demás pasa por el middleware.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:png|jpg|jpeg|gif|svg|ico|webp|txt|xml)$).*)",
  ],
};
