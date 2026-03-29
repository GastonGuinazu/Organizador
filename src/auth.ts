import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import authConfig from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(1),
          })
          .safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!user) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
        };
      },
    }),
  ],
});
