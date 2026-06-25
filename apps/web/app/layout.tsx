import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { SessionProvider } from 'next-auth/react';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'CollabEditor — Real-time Collaborative Editor',
  description:
    'A real-time collaborative text editor with AI writing assistance. Edit documents together, powered by CRDTs and AI.',
  keywords: ['collaborative editor', 'real-time', 'AI writing', 'CRDT', 'Y.js'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* SessionProvider makes useSession() available in all client components */}
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
