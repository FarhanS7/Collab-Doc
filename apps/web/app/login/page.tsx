'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function LoginForm() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';
  const error = searchParams.get('error');

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  const handleSignIn = async () => {
    setLoadingProvider('github');
    await signIn('github', { callbackUrl });
  };

  const errorMessage = error
    ? {
        OAuthSignin: 'Could not start the sign-in process. Please try again.',
        OAuthCallback: 'Authentication failed. Please try again.',
        OAuthCreateAccount: 'Could not create your account. Please try again.',
        Callback: 'Sign-in callback error. Please try again.',
        Default: 'An unexpected error occurred. Please try again.',
      }[error] ?? 'Authentication failed. Please try again.'
    : null;

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="login-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <main className="login-root">
      {/* Ambient Background */}
      <div className="login-bg" aria-hidden="true">
        <div className="login-bg__glow login-bg__glow--1" />
        <div className="login-bg__glow login-bg__glow--2" />
        <div className="login-bg__grid" />
      </div>

      {/* Login Card */}
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand__icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="8" height="8" x="2" y="2" rx="2" />
              <rect width="8" height="8" x="14" y="2" rx="2" />
              <rect width="8" height="8" x="2" y="14" rx="2" />
              <rect width="8" height="8" x="14" y="14" rx="2" />
            </svg>
          </div>
          <h1 className="login-brand__name">CollabEditor</h1>
          <p className="login-brand__tagline">Sign in to start collaborating in real-time</p>
        </div>

        {errorMessage && (
          <div className="login-error" role="alert">
            <span className="login-error__icon">⚠</span>
            {errorMessage}
          </div>
        )}

        <div className="login-providers">
          <button
            id="btn-github-signin"
            className="login-btn login-btn--github"
            onClick={handleSignIn}
            disabled={loadingProvider !== null}
            aria-busy={loadingProvider === 'github'}
          >
            {loadingProvider === 'github' ? (
              <span className="login-btn__spinner" aria-hidden="true" />
            ) : (
              <svg className="login-btn__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
            )}
            <span>Continue with GitHub</span>
          </button>
        </div>

        <p className="login-footer">
          By signing in, you agree to collaborate in real-time ✨
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-loading {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          background: #050505;
        }

        .login-root {
          font-family: 'Inter', system-ui, sans-serif;
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          background: #050505; position: relative;
          overflow: hidden; padding: 1.5rem;
          -webkit-font-smoothing: antialiased;
        }

        .login-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
        .login-bg__glow {
          position: absolute; border-radius: 50%;
          filter: blur(120px); opacity: 0.15;
        }
        .login-bg__glow--1 {
          width: 500px; height: 300px;
          background: #3b82f6;
          top: -100px; left: 50%; transform: translateX(-50%);
        }
        .login-bg__glow--2 {
          width: 300px; height: 300px;
          background: #8b5cf6;
          bottom: -100px; right: -50px;
        }
        .login-bg__grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        .login-card {
          position: relative; z-index: 1;
          width: 100%; max-width: 400px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px; padding: 2.5rem 2rem;
          backdrop-filter: blur(20px);
          box-shadow: 0 32px 80px rgba(0,0,0,0.6);
          animation: cardIn 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-brand {
          display: flex; flex-direction: column; align-items: center;
          gap: 0.5rem; margin-bottom: 2rem; text-align: center;
        }
        .login-brand__icon {
          padding: 6px; border-radius: 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff; margin-bottom: 0.25rem;
        }
        .login-brand__name {
          font-size: 1.25rem; font-weight: 500; color: #fff;
          letter-spacing: -0.02em;
        }
        .login-brand__tagline {
          font-size: 0.8125rem; color: #78716c; font-weight: 300;
        }

        .login-error {
          display: flex; align-items: center; gap: 0.5rem;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.15);
          border-radius: 8px; padding: 0.75rem 1rem;
          color: #fca5a5; font-size: 0.8125rem;
          margin-bottom: 1.25rem; font-weight: 300;
        }
        .login-error__icon { font-size: 1rem; flex-shrink: 0; }

        .login-providers {
          display: flex; flex-direction: column; gap: 0.75rem;
        }
        .login-btn {
          display: flex; align-items: center; justify-content: center;
          gap: 0.75rem; width: 100%; padding: 0.75rem 1.5rem;
          border-radius: 9999px;
          font-family: 'Inter', sans-serif; font-size: 0.875rem; font-weight: 500;
          cursor: pointer; border: none;
          transition: all 0.2s; position: relative; overflow: hidden;
        }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .login-btn:active:not(:disabled) { transform: translateY(1px); }

        .login-btn--github {
          background: rgba(255,255,255,0.05); color: #fff;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .login-btn--github:hover:not(:disabled) {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.15);
        }

        .login-btn--google {
          background: #fff; color: #3c4043;
          border: 1px solid rgba(0,0,0,0.08);
        }
        .login-btn--google:hover:not(:disabled) {
          background: #f5f5f5;
        }

        .login-btn__icon { width: 18px; height: 18px; flex-shrink: 0; }

        .login-btn__spinner {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.15);
          border-top-color: #fff;
          animation: spin 0.7s linear infinite; flex-shrink: 0;
        }
        .spinner {
          width: 24px; height: 24px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.1);
          border-top-color: #3b82f6;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .login-footer {
          text-align: center; margin-top: 1.5rem;
          font-size: 0.75rem; color: #57534e;
        }

        @media (max-width: 480px) {
          .login-card { padding: 2rem 1.5rem; }
        }
      `}</style>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="login-loading">
        <div className="spinner" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
