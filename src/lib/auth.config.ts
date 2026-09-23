import type { NextAuthConfig } from "next-auth";

/**
 * Configuración de Auth.js compartida entre el middleware (runtime Edge) y el
 * servidor. No importa Prisma ni ningún módulo de Node: el proveedor de
 * credenciales se añade en src/lib/auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 horas: una jornada laboral
  },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? token.sub ?? "";
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;
