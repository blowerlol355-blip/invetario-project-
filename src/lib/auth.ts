import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { loginSchema } from "@/features/auth/schemas";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import type { UserRole } from "@/lib/domain";

/** Usuario desactivado por un administrador. */
export class InactiveUserError extends CredentialsSignin {
  override code = "inactive";
}

/**
 * Instancia de Auth.js para el servidor (Server Components, Server Actions y
 * Route Handlers). Sesiones JWT firmadas con AUTH_SECRET.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (!user) return null;

        const passwordMatches = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!passwordMatches) return null;

        if (!user.isActive) throw new InactiveUserError();

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
        };
      },
    }),
  ],
});
