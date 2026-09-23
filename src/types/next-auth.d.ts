import type { DefaultSession } from "next-auth";

import type { UserRole } from "@/lib/domain";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
  }
}

// Auth.js v5 reexporta el tipo JWT desde @auth/core: hay que aumentar el módulo original.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
