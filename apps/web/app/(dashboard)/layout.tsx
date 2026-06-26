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
          <Link href="/dashboard" className="dashboard-nav__brand">
            <div className="dashboard-nav__logo-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="8" height="8" x="2" y="2" rx="2" />
                <rect width="8" height="8" x="14" y="2" rx="2" />
                <rect width="8" height="8" x="2" y="14" rx="2" />
                <rect width="8" height="8" x="14" y="14" rx="2" />
              </svg>
            </div>
            <span className="dashboard-nav__title">Collab<span className="dashboard-nav__title-dim">Editor</span></span>
          </Link>
          
          <div className="dashboard-nav__user">
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

        .dashboard-layout {
          min-height: 100vh;
          background: #050505;
          color: #fff;
          font-family: 'Inter', system-ui, sans-serif;
          font-weight: 300;
          -webkit-font-smoothing: antialiased;
        }

        .dashboard-nav {
          position: sticky; top: 0; z-index: 50;
          background: rgba(5, 5, 5, 0.6);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .dashboard-nav__container {
          max-width: 1280px;
          margin: 0 auto; padding: 0 1.5rem;
          height: 64px;
          display: flex; align-items: center; justify-content: space-between;
        }

        .dashboard-nav__brand {
          display: flex; align-items: center; gap: 0.5rem;
          text-decoration: none; color: inherit;
        }

        .dashboard-nav__logo-box {
          padding: 4px; border-radius: 6px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff; transition: background 0.2s;
        }
        .dashboard-nav__brand:hover .dashboard-nav__logo-box { background: rgba(255,255,255,0.1); }

        .dashboard-nav__title {
          font-size: 0.875rem; font-weight: 500; color: #fff;
          letter-spacing: -0.02em;
        }
        .dashboard-nav__title-dim { color: #78716c; }

        .dashboard-nav__user {
          display: flex; align-items: center; gap: 0.75rem;
        }

        .dashboard-nav__user-name {
          font-size: 0.8125rem; color: #a8a29e; font-weight: 400;
          display: none;
        }
        @media (min-width: 640px) {
          .dashboard-nav__user-name { display: block; }
        }

        .dashboard-nav__avatar {
          width: 28px; height: 28px; border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.1);
          object-fit: cover;
        }

        .dashboard-nav__avatar--fallback {
          background: rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: center;
          font-weight: 500; font-size: 0.75rem; color: #a8a29e;
        }

        .dashboard-main {
          max-width: 1280px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem;
        }
      `}</style>
    </div>
  );
}
