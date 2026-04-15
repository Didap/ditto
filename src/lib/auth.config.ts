import type { NextAuthConfig } from "next-auth";

/**
 * Base auth config — used by middleware (Edge Runtime).
 * Does NOT import database or bcrypt (Node.js-only modules).
 */
export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [], // Populated in auth.ts for Node.js runtime
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
};
