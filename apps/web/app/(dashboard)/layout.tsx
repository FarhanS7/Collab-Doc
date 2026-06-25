import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login?callbackUrl=/dashboard');
  }

  return (
    <div className="dashboard-layout">
      {/* Top Navigation */}
      <nav className="dashboard-nav">
        <div className="dashboard-nav__container">
          <div className="dashboard-nav__brand">
            <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="8" fill="url(#grad-nav)" />
              <path d="M10 18h16M18 10v16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <defs>
                <linearGradient id="grad-nav" x1="0" y1="0" x2="36" y2="36">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <Link href="/dashboard" className="dashboard-nav__title">CollabEditor</Link>
          </div>
          
          <div className="dashboard-nav__user">
            {/* User profile dropdown (simplified for v1) */}
            <span className="dashboard-nav__user-name">{session.user?.name || session.user?.email}</span>
            {session.user?.image ? (
              <img src={session.user.image} alt="Avatar" className="dashboard-nav__avatar" />
            ) : (
              <div className="dashboard-nav__avatar dashboard-nav__avatar--fallback">
                {session.user?.email?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {children}
      </main>

      <style>{`
        .dashboard-layout {
          min-height: 100vh;
          background: #040406;
          color: #fff;
          font-family: 'DM Sans', system-ui, sans-serif;
        }

        .dashboard-nav {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(4, 4, 6, 0.7);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .dashboard-nav__container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .dashboard-nav__brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .dashboard-nav__title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1.25rem;
          color: #fff;
          text-decoration: none;
          letter-spacing: -0.02em;
        }

        .dashboard-nav__user {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .dashboard-nav__user-name {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
          display: none;
        }
        @media (min-width: 640px) {
          .dashboard-nav__user-name { display: block; }
        }

        .dashboard-nav__avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.1);
          object-fit: cover;
        }

        .dashboard-nav__avatar--fallback {
          background: #1c1c21;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
          color: #a78bfa;
        }

        .dashboard-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem;
        }
      `}</style>
    </div>
  );
}
