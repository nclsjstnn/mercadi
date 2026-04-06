import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models/user";

declare module "next-auth" {
  interface User {
    role: string;
    plan?: string;
    tenantId?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role: string;
    plan?: string;
    tenantId?: string;
  }
}

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();
        const user = await User.findOne({ email: credentials.email });
        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          plan: user.plan || "free",
          tenantId: user.tenantId?.toString(),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Fresh login — seed token from authorize() result
        token.role = user.role;
        token.plan = user.plan || "free";
        token.tenantId = user.tenantId;
        return token;
      }
      // On every subsequent request re-read role/plan/tenantId from DB so
      // manual role changes (e.g. promoting to admin) take effect immediately.
      if (token.sub) {
        await connectDB();
        const dbUser = await User.findById(token.sub).select("role plan tenantId").lean();
        if (dbUser) {
          token.role = dbUser.role;
          token.plan = (dbUser.plan as string) || "free";
          token.tenantId = dbUser.tenantId?.toString();
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role;
        session.user.plan = token.plan || "free";
        session.user.tenantId = token.tenantId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};
