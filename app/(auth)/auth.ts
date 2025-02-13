import { compare } from 'bcrypt-ts';
import NextAuth, { type User, type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { getUser } from '@/lib/db/queries';
import { authConfig } from './auth.config';

interface AuthorizeCredentials {
  email?: string;
  password?: string;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials: AuthorizeCredentials) {
        const { email, password } = credentials;

        // Only allow explicit login with credentials
        if (!email || !password) {
          return null;
        }

        const users = await getUser(email);
        if (users.length === 0) return null;

        const user = users[0];
        if (!user.password) return null;

        const passwordsMatch = await compare(password, user.password);
        if (!passwordsMatch) return null;

        return {
          id: user.id,
          email: user.email,
        };
      },
    }),
  ],
  // Add proxy configuration for Docker environment
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      },
    },
  },
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
});
