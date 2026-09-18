import type { NextAuthConfig } from "next-auth";

/**
 * Configuracion base de Auth.js, sin providers.
 * Se usa tal cual en middleware.ts (Edge Runtime, no puede cargar Prisma/bcrypt)
 * y se extiende con el provider de Credentials en auth.ts (Node.js runtime).
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.branchId = user.branchId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.branchId = token.branchId;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
