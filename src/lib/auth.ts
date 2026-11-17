import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimit } from "@/lib/security";

const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128)
});

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const email = parsed.data.email.toLowerCase();
        if (!rateLimit(`login:${email}`, 8, 15 * 60_000)) return null;

        const user = await prisma.user.findUnique({
          where: { email }
        });
        if (!user || user.isSuspended) return null;

        const valid = await compare(parsed.data.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: "STUDENT" | "MANAGER" }).role;
      }
      if (token.id) {
        const current = await prisma.user.findUnique({ where: { id: String(token.id) }, select: { isSuspended: true } });
        if (!current || current.isSuspended) token.id = null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : "";
        session.user.role = token.role as "STUDENT" | "MANAGER";
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};
