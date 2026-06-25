// Extend NextAuth default types with our custom session fields
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }
  interface JWT {
    id: string;
  }
}
