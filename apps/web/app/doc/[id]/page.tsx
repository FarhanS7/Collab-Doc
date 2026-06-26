import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import EditorComponent from '@/components/editor/EditorComponent';
import Link from 'next/link';



async function getDocument(id: string, reqHeaders: Headers) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/docs/${id}`, {
    headers: {
      Cookie: reqHeaders.get('cookie') || '',
    },
    cache: 'no-store', // Always fresh for editor
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    if (res.status === 403) throw new Error('FORBIDDEN');
    throw new Error('FAILED_TO_FETCH');
  }

  const json = await res.json();
  return json.data;
}

export default async function DocumentPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(`/login?callbackUrl=/doc/${params.id}`);
  }

  // We need the headers to forward the auth cookie to our own API
  const { headers } = await import('next/headers');
  const reqHeaders = headers();

  let doc;
  try {
    doc = await getDocument(params.id, reqHeaders);
  } catch (err: any) {
    if (err.message === 'FORBIDDEN') {
      return (
        <div className="doc-error-page">
          <div className="doc-error-box">
            <h1>Access Denied</h1>
            <p>You do not have permission to view this document.</p>
            <Link href="/dashboard" className="doc-btn">Return to Dashboard</Link>
          </div>
        </div>
      );
    }
    return <div className="doc-error-page">Failed to load document</div>;
  }

  if (!doc) {
    notFound();
  }

  return (
    <div className="editor-layout">
      {/* Top Navbar */}
      <header className="editor-header">
        <div className="editor-header__left">
          <Link href="/dashboard" className="editor-header__back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div className="editor-header__info">
            <h1 className="editor-header__title">{doc.title}</h1>
            <span className={`role-badge role-badge--${doc.currentUserRole}`}>
              {doc.currentUserRole}
            </span>
          </div>
        </div>
        <div className="editor-header__right">
          <div className="editor-header__avatars">
            {/* Simple PresenceBar stub */}
            <div className="avatar-circle">{session.user?.name?.[0] || 'U'}</div>
          </div>
        </div>
      </header>

      {/* Editor Workspace */}
      <main className="editor-workspace">
        <EditorComponent 
          documentId={doc.id} 
          initialYDocBase64={doc.yDocState} 
          role={doc.currentUserRole} 
        />
      </main>

      <style>{`
        .editor-layout {
          display: flex; flex-direction: column; height: 100vh;
          background: #050505; color: #fff;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .editor-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 1rem; height: 56px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(5,5,5,0.8);
          backdrop-filter: blur(12px);
        }

        .editor-header__left { display: flex; align-items: center; gap: 1rem; }
        .editor-header__back {
          display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 6px;
          color: #a8a29e; transition: background 0.2s, color 0.2s;
        }
        .editor-header__back:hover { background: rgba(255,255,255,0.05); color: #fff; }

        .editor-header__info { display: flex; align-items: center; gap: 0.75rem; }
        .editor-header__title { font-size: 0.9375rem; font-weight: 500; }

        .role-badge {
          font-size: 0.625rem; font-weight: 600; text-transform: uppercase;
          padding: 0.1875rem 0.5rem; border-radius: 9999px; letter-spacing: 0.05em;
        }
        .role-badge--owner { background: rgba(59,130,246,0.1); color: #60a5fa; border: 1px solid rgba(59,130,246,0.2); }
        .role-badge--editor { background: rgba(34,197,94,0.1); color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }
        .role-badge--viewer { background: rgba(107,114,128,0.1); color: #9ca3af; border: 1px solid rgba(107,114,128,0.2); }

        .editor-header__avatars { display: flex; align-items: center; gap: 0.5rem; }
        .avatar-circle {
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 500; color: #fff;
        }

        .editor-workspace {
          flex: 1; overflow: hidden; display: flex; flex-direction: column;
        }

        .doc-error-page {
          height: 100vh; display: flex; align-items: center; justify-content: center;
          background: #050505; color: #fff; font-family: 'Inter', sans-serif;
        }
        .doc-error-box {
          text-align: center; background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 3rem; border-radius: 1rem;
        }
        .doc-error-box h1 { font-size: 1.5rem; font-weight: 500; margin-bottom: 0.5rem; }
        .doc-error-box p { color: #a8a29e; margin-bottom: 2rem; font-size: 0.875rem; }
        .doc-btn {
          display: inline-block; padding: 0.625rem 1.25rem;
          background: #fff; color: #000; font-weight: 500; border-radius: 0.5rem;
          font-size: 0.875rem; transition: opacity 0.2s;
        }
        .doc-btn:hover { opacity: 0.9; }
      `}</style>
    </div>
  );
}
