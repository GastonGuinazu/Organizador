import type { NextAuthConfig } from "next-auth";

/**
 * Solo lo necesario para JWT y middleware en Edge (sin Prisma ni bcrypt).
 * Los proveedores con acceso a BD viven en `auth.ts`.
 */
export default {
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
