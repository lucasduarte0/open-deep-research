import { compare } from "bcrypt-ts";
import NextAuth, { type User, type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { getUser } from "@/lib/db/queries";

interface ExtendedSession extends Session {
  user: User;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  pages: {
    signIn: "/login",
    newUser: "/register",
    // Remove or disable the newUser page if you don't want it
  },
  providers: [
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        // Require both email and password for authentication.
        if (!email || !password) {
          return null;
        }

        // Retrieve the user from the database.
        const users = await getUser(email);
        if (users.length === 0) return null;

        // Verify that the provided password matches.
        const passwordsMatch = await compare(password, users[0].password!);
        if (!passwordsMatch) return null;

        return users[0] as any;
      },
    }),
  ],
  // Cookie configuration for the Docker environment.
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: any;
    }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnRegister = nextUrl.pathname.startsWith("/register");
      const isOnLogin = nextUrl.pathname.startsWith("/login");

      // Redirect authenticated users away from auth pages
      if (isLoggedIn && (isOnLogin || isOnRegister)) {
        return Response.redirect(new URL("/", nextUrl as unknown as URL));
      }

      // If no user session, always require login
      return !!auth;
    },
  },
});
