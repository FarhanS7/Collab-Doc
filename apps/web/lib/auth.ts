import type { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from './prisma';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is not set');
}

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  callbacks: {
    /**
     * Called after successful OAuth login.
     * Upserts the user in Postgres — creates on first login, updates profile on subsequent logins.
     */
    async signIn({ user, account }) {
      if (!user.email) return false; // Reject accounts with no email

      try {
        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            avatarUrl: user.image,
          },
          create: {
            email: user.email,
            name: user.name,
            avatarUrl: user.image,
            provider: account?.provider ?? 'unknown',
          },
        });
        return true;
      } catch (error) {
        console.error('[NextAuth] signIn callback failed:', error);
        return false;
      }
    },

    /**
     * Runs when JWT is created or updated.
     * We inject the DB user id into the token so it's available everywhere.
     */
    async jwt({ token, user }) {
      if (user?.email) {
        // On initial sign-in, fetch the DB user to get the cuid() id
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true },
        });
        if (dbUser) token.id = dbUser.id;
      }
      return token;
    },

    /**
     * Shapes the session object returned by useSession() / getServerSession().
     * Exposes id so client components can identify the current user.
     */
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login', // Redirect to our custom login page
  },

  // Debug OAuth errors in development
  debug: process.env.NODE_ENV === 'development',
};
