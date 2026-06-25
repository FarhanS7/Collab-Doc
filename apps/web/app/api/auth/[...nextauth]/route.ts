import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

// NextAuth requires both GET and POST handlers in App Router
export { handler as GET, handler as POST };
