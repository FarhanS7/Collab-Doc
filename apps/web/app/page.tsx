import Link from 'next/link';

export default function LandingPage() {
  return (
    <>
      <div className="landing-root">
        {/* Ambient Background */}
        <div className="landing-bg" aria-hidden="true">
          <div className="landing-bg__glow landing-bg__glow--1" />
          <div className="landing-bg__glow landing-bg__glow--2" />
          <div className="landing-bg__grid" />
        </div>

        {/* ── HEADER ── */}
        <header className="landing-header">
          <div className="landing-header__inner">
            <Link href="/" className="landing-header__brand">
              <div className="landing-header__logo-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="8" height="8" x="2" y="2" rx="2" />
                  <rect width="8" height="8" x="14" y="2" rx="2" />
                  <rect width="8" height="8" x="2" y="14" rx="2" />
                  <rect width="8" height="8" x="14" y="14" rx="2" />
                </svg>
              </div>
              <span className="landing-header__wordmark">Collab<span className="landing-header__wordmark-dim">Editor</span></span>
            </Link>

            <nav className="landing-header__nav">
              <a href="#features" className="landing-header__link">Features</a>
              <a href="#how-it-works" className="landing-header__link">How It Works</a>
              <a href="#tech" className="landing-header__link">Tech Stack</a>
            </nav>

            <Link href="/login" className="landing-header__cta">
              Get Started
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          </div>
        </header>

        <main>
          {/* ── HERO ── */}
          <section className="landing-hero">
            <div className="landing-hero__inner">
              <div className="landing-hero__badge">
                <span className="landing-hero__badge-dot">
                  <span className="landing-hero__badge-ping" />
                  <span className="landing-hero__badge-core" />
                </span>
                REAL-TIME COLLABORATIVE EDITING
              </div>

              <h1 className="landing-hero__title">
                Write Together.<br />
                <span className="landing-hero__title-dim">Ship Faster with AI.</span>
              </h1>

              <p className="landing-hero__subtitle">
                A real-time collaborative editor powered by CRDTs and AI writing assistance.
                No conflicts. No lag. Just seamless teamwork with intelligent suggestions.
              </p>

              <div className="landing-hero__actions">
                <Link href="/login" className="shiny-cta">
                  <span className="shiny-cta__text">
                    Start Collaborating
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                    </svg>
                  </span>
                </Link>
                <a href="#features" className="landing-hero__secondary-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />
                  </svg>
                  See Features
                </a>
              </div>

              {/* Metrics */}
              <div className="landing-hero__metrics">
                <div className="landing-hero__metric">
                  <p className="landing-hero__metric-value">Zero</p>
                  <p className="landing-hero__metric-label">Merge Conflicts</p>
                </div>
                <div className="landing-hero__metric">
                  <p className="landing-hero__metric-value">&lt;50ms</p>
                  <p className="landing-hero__metric-label">Sync Latency</p>
                </div>
                <div className="landing-hero__metric">
                  <p className="landing-hero__metric-value">AI</p>
                  <p className="landing-hero__metric-label">Writing Copilot</p>
                </div>
                <div className="landing-hero__metric">
                  <p className="landing-hero__metric-value">∞</p>
                  <p className="landing-hero__metric-label">Concurrent Users</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── TECH STACK MARQUEE ── */}
          <section className="landing-tech-strip" id="tech">
            <p className="landing-tech-strip__label">BUILT WITH MODERN ENGINEERING</p>
            <div className="landing-tech-strip__logos">
              <span>Next.js</span>
              <span>TypeScript</span>
              <span>Tiptap</span>
              <span>Y.js (CRDT)</span>
              <span>Socket.io</span>
              <span>PostgreSQL</span>
              <span>Redis</span>
              <span>Claude AI</span>
            </div>
          </section>

          {/* ── FEATURES ── */}
          <section className="landing-features" id="features">
            <div className="landing-features__header">
              <h2 className="landing-features__title">Everything You Need to Collaborate</h2>
              <p className="landing-features__desc">No bloat. Just the tools that matter for real-time writing and AI-powered productivity.</p>
            </div>

            <div className="landing-features__grid">
              <div className="glass-card landing-feature-card landing-feature-card--blue">
                <div className="landing-feature-card__icon landing-feature-card__icon--blue">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                </div>
                <h3 className="landing-feature-card__title">Real-Time Editing</h3>
                <p className="landing-feature-card__text">Multiple users edit simultaneously with zero conflicts. CRDT-based sync means every keystroke appears instantly for all collaborators.</p>
                <ul className="landing-feature-card__list">
                  <li><svg className="check-icon check-icon--blue" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>Conflict-free via Y.js CRDT</li>
                  <li><svg className="check-icon check-icon--blue" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>Live cursor presence</li>
                </ul>
              </div>

              <div className="glass-card landing-feature-card landing-feature-card--purple">
                <div className="landing-feature-card__icon landing-feature-card__icon--purple">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                </div>
                <h3 className="landing-feature-card__title">AI Writing Assistant</h3>
                <p className="landing-feature-card__text">Ghost text suggestions powered by Claude AI. Accept with Tab, reject with Escape. Your AI copilot that writes alongside you.</p>
                <ul className="landing-feature-card__list">
                  <li><svg className="check-icon check-icon--purple" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>Streaming completions</li>
                  <li><svg className="check-icon check-icon--purple" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>Context-aware suggestions</li>
                </ul>
              </div>

              <div className="glass-card landing-feature-card landing-feature-card--green">
                <div className="landing-feature-card__icon landing-feature-card__icon--green">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3 className="landing-feature-card__title">Role-Based Access</h3>
                <p className="landing-feature-card__text">Owner, Editor, Viewer permissions. Invite teammates by email, control who can edit, and manage your documents with confidence.</p>
                <ul className="landing-feature-card__list">
                  <li><svg className="check-icon check-icon--green" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>Granular permissions</li>
                  <li><svg className="check-icon check-icon--green" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>Email-based invitations</li>
                </ul>
              </div>
            </div>
          </section>

          {/* ── HOW IT WORKS ── */}
          <section className="landing-process" id="how-it-works">
            <div className="landing-process__inner">
              <div className="landing-process__left">
                <h2 className="landing-process__title">How It Works</h2>
                <p className="landing-process__desc">A seamless flow from login to live collaboration. No setup complexity.</p>
                <Link href="/login" className="landing-process__btn">Try It Now</Link>
              </div>

              <div className="landing-process__steps">
                <div className="landing-process__step">
                  <div className="landing-process__step-line">
                    <div className="landing-process__step-num landing-process__step-num--active">1</div>
                    <div className="landing-process__step-connector" />
                  </div>
                  <div className="landing-process__step-content">
                    <h3>Sign In with GitHub or Google</h3>
                    <p>One-click OAuth. No passwords to remember, no sign-up forms. You&apos;re in within seconds.</p>
                  </div>
                </div>

                <div className="landing-process__step">
                  <div className="landing-process__step-line">
                    <div className="landing-process__step-num">2</div>
                    <div className="landing-process__step-connector" />
                  </div>
                  <div className="landing-process__step-content">
                    <h3>Create or Join a Document</h3>
                    <p>Hit &quot;New Document&quot; from your dashboard or accept an invite link. Your workspace is ready.</p>
                  </div>
                </div>

                <div className="landing-process__step">
                  <div className="landing-process__step-line">
                    <div className="landing-process__step-num">3</div>
                    <div className="landing-process__step-connector" />
                  </div>
                  <div className="landing-process__step-content">
                    <h3>Write Together in Real-Time</h3>
                    <p>See your team&apos;s cursors live. Every edit syncs via CRDTs — no conflicts, no lost work, ever.</p>
                  </div>
                </div>

                <div className="landing-process__step">
                  <div className="landing-process__step-line">
                    <div className="landing-process__step-num">4</div>
                  </div>
                  <div className="landing-process__step-content">
                    <h3>Let AI Accelerate Your Writing</h3>
                    <p>Press a shortcut and Claude AI suggests completions as ghost text. Accept with Tab, keep your flow.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="landing-cta">
            <div className="landing-cta__glow" aria-hidden="true" />
            <div className="landing-cta__inner">
              <h2 className="landing-cta__title">Ready to write together?</h2>
              <p className="landing-cta__desc">No setup required. Sign in and start collaborating in under 30 seconds.</p>
              <div className="landing-cta__action">
                <Link href="/login" className="shiny-cta">
                  <span className="shiny-cta__text">Start for Free</span>
                </Link>
              </div>
              <p className="landing-cta__footnote">NO CREDIT CARD REQUIRED. FREE FOREVER FOR INDIVIDUALS.</p>
            </div>
          </section>
        </main>

        {/* ── FOOTER ── */}
        <footer className="landing-footer">
          <div className="landing-footer__inner">
            <span className="landing-footer__copy">© 2024 CollabEditor. Built as a portfolio project.</span>
            <div className="landing-footer__links">
              <a href="https://github.com/FarhanS7/Collab-Doc" target="_blank" rel="noopener noreferrer">GitHub</a>
              <Link href="/login">Sign In</Link>
            </div>
          </div>
        </footer>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

        /* ── RESETS ── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; color: inherit; }

        /* ── ROOT ── */
        .landing-root {
          font-family: 'Inter', system-ui, sans-serif;
          background: #050505;
          color: #fff;
          min-height: 100vh;
          overflow-x: hidden;
          font-weight: 300;
          -webkit-font-smoothing: antialiased;
        }
        h1, h2, h3, h4, h5, h6 { letter-spacing: -0.025em; }

        /* ── BG ── */
        .landing-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
        .landing-bg__glow {
          position: absolute; border-radius: 50%;
          filter: blur(120px); opacity: 0.2;
        }
        .landing-bg__glow--1 {
          width: 600px; height: 300px;
          background: #3b82f6;
          top: -100px; left: 50%; transform: translateX(-50%);
        }
        .landing-bg__glow--2 {
          width: 400px; height: 400px;
          background: #8b5cf6;
          bottom: 10%; right: -100px;
        }
        .landing-bg__grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        /* ── HEADER ── */
        .landing-header {
          position: fixed; top: 0; width: 100%; z-index: 50;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(5,5,5,0.6);
          backdrop-filter: blur(20px);
        }
        .landing-header__inner {
          max-width: 1280px; margin: 0 auto; padding: 0 1.5rem;
          height: 64px; display: flex; align-items: center; justify-content: space-between;
        }
        .landing-header__brand {
          display: flex; align-items: center; gap: 0.5rem; cursor: pointer;
        }
        .landing-header__logo-box {
          padding: 4px; border-radius: 6px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          transition: background 0.2s;
        }
        .landing-header__brand:hover .landing-header__logo-box { background: rgba(255,255,255,0.1); }
        .landing-header__wordmark {
          font-size: 0.875rem; font-weight: 500; color: #fff; letter-spacing: -0.02em;
        }
        .landing-header__wordmark-dim { color: #78716c; }
        .landing-header__nav {
          display: none; gap: 2rem;
          font-size: 0.75rem; font-weight: 500; color: #a8a29e;
        }
        @media (min-width: 768px) { .landing-header__nav { display: flex; } }
        .landing-header__link { transition: color 0.2s; }
        .landing-header__link:hover { color: #fff; }
        .landing-header__cta {
          display: none; align-items: center; gap: 0.5rem;
          font-size: 0.75rem; font-weight: 500; color: #fff;
          background: rgba(255,255,255,0.05); padding: 0.5rem 1rem;
          border-radius: 9999px; border: 1px solid rgba(255,255,255,0.05);
          transition: all 0.2s;
        }
        @media (min-width: 768px) { .landing-header__cta { display: flex; } }
        .landing-header__cta:hover { border-color: rgba(255,255,255,0.1); color: #60a5fa; }

        /* ── HERO ── */
        .landing-hero {
          position: relative; padding: 10rem 1.5rem 5rem; overflow: hidden;
        }
        @media (min-width: 768px) { .landing-hero { padding: 12rem 1.5rem 8rem; } }
        .landing-hero__inner { max-width: 56rem; margin: 0 auto; text-align: center; }
        .landing-hero__badge {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.25rem 0.75rem; border-radius: 9999px;
          border: 1px solid rgba(59,130,246,0.2);
          background: rgba(59,130,246,0.05);
          color: #93c5fd; font-size: 0.75rem; font-weight: 500;
          letter-spacing: 0.05em; backdrop-filter: blur(4px);
          margin-bottom: 2rem;
        }
        .landing-hero__badge-dot { position: relative; width: 0.5rem; height: 0.5rem; }
        .landing-hero__badge-ping {
          position: absolute; inset: 0; border-radius: 50%;
          background: #60a5fa; opacity: 0.75;
          animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite;
        }
        .landing-hero__badge-core {
          position: relative; display: block; width: 0.5rem; height: 0.5rem;
          border-radius: 50%; background: #3b82f6;
        }
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }

        .landing-hero__title {
          font-size: clamp(3rem, 7vw, 4.5rem);
          font-weight: 500; line-height: 1.05;
          color: #fff; letter-spacing: -0.03em;
          margin-bottom: 1.5rem;
        }
        .landing-hero__title-dim { color: #78716c; }

        .landing-hero__subtitle {
          font-size: 1rem; color: #a8a29e; max-width: 40rem;
          margin: 0 auto 2.5rem; line-height: 1.7; font-weight: 300;
        }
        @media (min-width: 768px) { .landing-hero__subtitle { font-size: 1.125rem; } }

        .landing-hero__actions {
          display: flex; flex-direction: column; align-items: center;
          gap: 1rem; padding-top: 1rem;
        }
        @media (min-width: 768px) { .landing-hero__actions { flex-direction: row; justify-content: center; } }

        .landing-hero__secondary-btn {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.875rem 1.5rem; border-radius: 9999px;
          border: 1px solid rgba(255,255,255,0.1);
          color: #d6d3d1; font-size: 0.875rem; font-weight: 500;
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(4px); transition: all 0.2s;
        }
        .landing-hero__secondary-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }

        .landing-hero__metrics {
          padding-top: 4rem; margin-top: 4rem;
          border-top: 1px solid rgba(255,255,255,0.05);
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem;
          max-width: 48rem; margin-left: auto; margin-right: auto;
        }
        @media (min-width: 768px) { .landing-hero__metrics { grid-template-columns: repeat(4, 1fr); } }
        .landing-hero__metric { text-align: center; }
        .landing-hero__metric-value {
          font-size: 1.5rem; font-weight: 600; color: #fff; letter-spacing: -0.02em;
        }
        .landing-hero__metric-label {
          font-size: 0.6875rem; color: #78716c; text-transform: uppercase;
          letter-spacing: 0.1em; margin-top: 0.25rem; font-weight: 500;
        }

        /* ── SHINY CTA (from template) ── */
        @property --gradient-angle { syntax: "<angle>"; initial-value: 0deg; inherits: false; }
        @property --gradient-angle-offset { syntax: "<angle>"; initial-value: 0deg; inherits: false; }
        @property --gradient-percent { syntax: "<percentage>"; initial-value: 20%; inherits: false; }
        @property --gradient-shine { syntax: "<color>"; initial-value: #8484ff; inherits: false; }

        .shiny-cta {
          --shadow-size: 2px;
          position: relative; overflow: hidden; border-radius: 9999px;
          padding: 0.875rem 2rem; font-size: 0.875rem; line-height: 1.5;
          font-weight: 500; color: #fff; cursor: pointer; z-index: 0;
          border: 1px solid transparent; outline: none;
          isolation: isolate; display: inline-block;
          background:
            linear-gradient(#000, #000) padding-box,
            conic-gradient(
              from calc(var(--gradient-angle) - var(--gradient-angle-offset)),
              transparent 0%, #1d4ed8 5%, var(--gradient-shine) 15%, #1d4ed8 30%, transparent 40%, transparent 100%
            ) border-box;
          box-shadow: inset 0 0 0 1px #1a1818;
          animation: border-spin 2.5s linear infinite;
          transition: box-shadow 0.3s;
        }
        @keyframes border-spin { to { --gradient-angle: 360deg; } }
        .shiny-cta:active { transform: translateY(1px); }
        .shiny-cta::before {
          content: ''; pointer-events: none; position: absolute;
          left: 50%; top: 50%; transform: translate(-50%,-50%); z-index: 0;
          width: calc(100% - 6px); height: calc(100% - 6px);
          background: radial-gradient(circle at 2px 2px, white 0.5px, transparent 0) padding-box;
          background-size: 4px 4px; background-repeat: space;
          mask-image: conic-gradient(from calc(var(--gradient-angle) + 45deg), black, transparent 10% 90%, black);
          border-radius: inherit; opacity: 0.4;
        }
        .shiny-cta::after {
          content: ''; pointer-events: none; position: absolute;
          left: 50%; top: 50%; transform: translate(-50%,-50%); z-index: 1;
          width: 100%; aspect-ratio: 1;
          background: linear-gradient(-50deg, transparent, #1d4ed8, transparent);
          mask-image: radial-gradient(circle at bottom, transparent 40%, black);
          opacity: 0.6; animation: shimmer 4s linear infinite;
        }
        @keyframes shimmer { to { transform: translate(-50%,-50%) rotate(360deg); } }
        .shiny-cta__text {
          position: relative; z-index: 2;
          display: inline-flex; align-items: center; gap: 0.5rem;
        }

        /* ── GLASS CARD ── */
        .glass-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }

        /* ── TECH STRIP ── */
        .landing-tech-strip {
          padding: 3rem 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.05);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(12,10,9,0.5); text-align: center;
          position: relative; z-index: 1;
        }
        .landing-tech-strip__label {
          font-size: 0.6875rem; font-weight: 500; letter-spacing: 0.1em;
          color: #57534e; text-transform: uppercase; margin-bottom: 2rem;
        }
        .landing-tech-strip__logos {
          display: flex; flex-wrap: wrap; justify-content: center;
          gap: 1.5rem; opacity: 0.5; font-size: 1rem; font-weight: 500; color: #fff;
        }
        @media (min-width: 768px) { .landing-tech-strip__logos { gap: 3rem; } }
        .landing-tech-strip__logos:hover { opacity: 1; transition: opacity 0.7s; }

        /* ── FEATURES ── */
        .landing-features {
          padding: 6rem 1.5rem; max-width: 1280px; margin: 0 auto;
          position: relative; z-index: 1;
        }
        .landing-features__header { margin-bottom: 4rem; }
        .landing-features__title {
          font-size: 1.875rem; font-weight: 500; color: #fff;
          letter-spacing: -0.02em; margin-bottom: 1rem;
        }
        @media (min-width: 768px) { .landing-features__title { font-size: 2.25rem; } }
        .landing-features__desc {
          color: #a8a29e; max-width: 36rem; font-size: 0.875rem;
          line-height: 1.6; font-weight: 300;
        }
        .landing-features__grid {
          display: grid; gap: 1.5rem;
        }
        @media (min-width: 768px) { .landing-features__grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .landing-features__grid { grid-template-columns: repeat(3, 1fr); } }

        .landing-feature-card {
          padding: 2rem; border-radius: 0.75rem;
          transition: border-color 0.2s;
        }
        .landing-feature-card--blue:hover { border-color: rgba(59,130,246,0.3); }
        .landing-feature-card--purple:hover { border-color: rgba(168,85,247,0.3); }
        .landing-feature-card--green:hover { border-color: rgba(34,197,94,0.3); }

        .landing-feature-card__icon {
          width: 2.5rem; height: 2.5rem; border-radius: 0.5rem;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 1.5rem; transition: transform 0.3s;
        }
        .landing-feature-card:hover .landing-feature-card__icon { transform: scale(1.05); }
        .landing-feature-card__icon--blue { background: rgba(59,130,246,0.1); color: #60a5fa; border: 1px solid rgba(59,130,246,0.2); }
        .landing-feature-card__icon--purple { background: rgba(168,85,247,0.1); color: #c084fc; border: 1px solid rgba(168,85,247,0.2); }
        .landing-feature-card__icon--green { background: rgba(34,197,94,0.1); color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }

        .landing-feature-card__title {
          font-size: 1.125rem; font-weight: 500; color: #fff; margin-bottom: 0.75rem;
        }
        .landing-feature-card__text {
          font-size: 0.875rem; color: #a8a29e; line-height: 1.6;
          font-weight: 300; margin-bottom: 1.5rem;
        }
        .landing-feature-card__list {
          list-style: none; display: flex; flex-direction: column; gap: 0.75rem;
        }
        .landing-feature-card__list li {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.75rem; color: #78716c; font-weight: 500;
        }
        .check-icon--blue { color: #3b82f6; }
        .check-icon--purple { color: #a855f7; }
        .check-icon--green { color: #22c55e; }

        /* ── PROCESS ── */
        .landing-process {
          padding: 6rem 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.05);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(0,0,0,0.2);
          position: relative; z-index: 1;
        }
        .landing-process__inner {
          max-width: 1280px; margin: 0 auto;
          display: flex; flex-direction: column; gap: 4rem;
        }
        @media (min-width: 768px) { .landing-process__inner { flex-direction: row; } }
        .landing-process__left { flex: 0 0 33%; }
        @media (min-width: 768px) { .landing-process__left { position: sticky; top: 8rem; align-self: flex-start; } }
        .landing-process__title {
          font-size: 1.875rem; font-weight: 500; color: #fff;
          margin-bottom: 1.5rem; letter-spacing: -0.02em;
        }
        @media (min-width: 768px) { .landing-process__title { font-size: 2.25rem; } }
        .landing-process__desc {
          color: #a8a29e; margin-bottom: 2rem;
          font-size: 0.875rem; font-weight: 300;
        }
        .landing-process__btn {
          display: inline-block; padding: 0.625rem 1.25rem;
          border-radius: 0.5rem; background: #fff; color: #000;
          font-weight: 500; font-size: 0.75rem;
          transition: background 0.2s;
        }
        .landing-process__btn:hover { background: #e7e5e4; }

        .landing-process__steps { flex: 1; display: flex; flex-direction: column; gap: 3rem; }
        .landing-process__step { display: flex; gap: 1.5rem; }
        .landing-process__step-line { display: flex; flex-direction: column; align-items: center; }
        .landing-process__step-num {
          width: 2rem; height: 2rem; border-radius: 50%;
          background: #1c1917; border: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 500; color: #fff;
          transition: border-color 0.2s; flex-shrink: 0;
        }
        .landing-process__step:hover .landing-process__step-num { border-color: rgba(59,130,246,0.5); }
        .landing-process__step-num--active {
          background: #2563eb;
          box-shadow: 0 0 15px rgba(37,99,235,0.5);
          border: none;
        }
        .landing-process__step-connector {
          width: 1px; flex: 1; margin: 0.5rem 0;
          background: rgba(255,255,255,0.05);
        }
        .landing-process__step-num--active + .landing-process__step-connector {
          background: linear-gradient(to bottom, rgba(37,99,235,0.5), transparent);
        }
        .landing-process__step-content { padding-top: 0.25rem; padding-bottom: 2rem; }
        .landing-process__step-content h3 {
          font-size: 1.125rem; font-weight: 500; color: #fff; margin-bottom: 0.5rem;
        }
        .landing-process__step-content p {
          font-size: 0.875rem; color: #a8a29e; font-weight: 300; line-height: 1.6;
        }

        /* ── CTA SECTION ── */
        .landing-cta {
          padding: 8rem 1.5rem; text-align: center;
          position: relative; overflow: hidden; z-index: 1;
        }
        .landing-cta__glow {
          position: absolute; inset: 0; z-index: -1;
          background: rgba(59,130,246,0.08); filter: blur(100px);
          border-radius: 50%; transform: scale(0.5);
          top: 50%; left: 50%; translate: -50% -50%;
        }
        .landing-cta__inner { max-width: 40rem; margin: 0 auto; }
        .landing-cta__title {
          font-size: 2.25rem; font-weight: 500; color: #fff;
          margin-bottom: 1rem; letter-spacing: -0.02em;
        }
        @media (min-width: 768px) { .landing-cta__title { font-size: 3rem; } }
        .landing-cta__desc {
          font-size: 1.125rem; color: #a8a29e; font-weight: 300; margin-bottom: 2rem;
        }
        .landing-cta__action { padding-top: 1.5rem; }
        .landing-cta__footnote {
          font-size: 0.6875rem; color: #57534e; margin-top: 2rem;
          font-weight: 500; letter-spacing: 0.05em;
        }

        /* ── FOOTER ── */
        .landing-footer {
          border-top: 1px solid rgba(255,255,255,0.05);
          padding: 3rem 1.5rem; background: #000;
          position: relative; z-index: 1;
        }
        .landing-footer__inner {
          max-width: 1280px; margin: 0 auto;
          display: flex; flex-direction: column; align-items: center; gap: 1.5rem;
        }
        @media (min-width: 768px) { .landing-footer__inner { flex-direction: row; justify-content: space-between; } }
        .landing-footer__copy { font-size: 0.75rem; color: #57534e; }
        .landing-footer__links {
          display: flex; gap: 2rem;
          font-size: 0.75rem; font-weight: 500; color: #78716c;
        }
        .landing-footer__links a:hover { color: #fff; transition: color 0.2s; }
      `}</style>
    </>
  );
}
