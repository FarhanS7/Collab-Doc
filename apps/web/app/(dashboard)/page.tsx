'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DocumentMetadata {
  id: string;
  title: string;
  updatedAt: string;
  role: 'owner' | 'editor' | 'viewer';
  ownerName: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    try {
      const res = await fetch('/api/docs');
      if (!res.ok) {
        if (res.status === 401) { router.push('/login'); return; }
        throw new Error('Failed to fetch documents');
      }
      const json = await res.json();
      setDocuments(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDocument() {
    setIsCreating(true);
    try {
      const res = await fetch('/api/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Document' }),
      });
      if (!res.ok) throw new Error('Failed to create document');
      const json = await res.json();
      router.push(`/doc/${json.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document');
      setIsCreating(false);
    }
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    }).format(new Date(dateString));
  };

  return (
    <div className="dashboard-content">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-header__title">Your Documents</h1>
          <p className="dashboard-header__subtitle">Manage and collaborate on your files</p>
        </div>
        <button
          className="btn-create"
          onClick={handleCreateDocument}
          disabled={isCreating}
          aria-busy={isCreating}
        >
          {isCreating ? (
            <span className="spinner-small" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          )}
          <span>New Document</span>
        </button>
      </header>

      {error && (
        <div className="dashboard-error">
          <span>⚠</span>
          {error}
        </div>
      )}

      {loading ? (
        <div className="dashboard-loading"><div className="spinner" /></div>
      ) : documents.length === 0 ? (
        <div className="dashboard-empty">
          <div className="dashboard-empty__icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <h3>No documents yet</h3>
          <p>Create your first document to start collaborating.</p>
          <button className="btn-create btn-create--outline" onClick={handleCreateDocument} disabled={isCreating}>
            Create Document
          </button>
        </div>
      ) : (
        <div className="document-grid">
          {documents.map((doc) => (
            <Link href={`/doc/${doc.id}`} key={doc.id} className="document-card">
              <div className="document-card__header">
                <svg className="document-card__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <span className={`role-badge role-badge--${doc.role}`}>{doc.role}</span>
              </div>
              <div className="document-card__body">
                <h3 className="document-card__title">{doc.title}</h3>
                <div className="document-card__meta">
                  <span>Edited {formatDate(doc.updatedAt)}</span>
                  {doc.role !== 'owner' && (
                    <><span className="dot">·</span><span>{doc.ownerName}</span></>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <style>{`
        .dashboard-content { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dashboard-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 3rem; flex-wrap: wrap; gap: 1.5rem;
        }
        .dashboard-header__title {
          font-size: 1.875rem; font-weight: 500; letter-spacing: -0.025em;
          margin-bottom: 0.5rem;
          background: linear-gradient(to bottom, #ffffff, #a3a3a3);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .dashboard-header__subtitle { color: #78716c; font-size: 0.875rem; font-weight: 300; }

        .btn-create {
          display: flex; align-items: center; gap: 0.5rem;
          background: #fff; color: #000;
          border: none; padding: 0.625rem 1.25rem;
          border-radius: 0.5rem;
          font-family: 'Inter', sans-serif; font-weight: 500; font-size: 0.75rem;
          cursor: pointer; transition: background 0.2s;
        }
        .btn-create:hover:not(:disabled) { background: #e7e5e4; }
        .btn-create:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-create--outline {
          background: transparent; color: #a8a29e;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .btn-create--outline:hover:not(:disabled) { background: rgba(255,255,255,0.05); color: #fff; }

        .dashboard-loading { display: flex; justify-content: center; padding: 4rem 0; }
        .spinner {
          width: 24px; height: 24px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.1);
          border-top-color: #3b82f6;
          animation: spin 0.8s linear infinite;
        }
        .spinner-small {
          width: 14px; height: 14px; border-radius: 50%;
          border: 2px solid rgba(0,0,0,0.15);
          border-top-color: #000;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .dashboard-error {
          display: flex; align-items: center; gap: 0.5rem;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.15);
          color: #fca5a5; padding: 0.75rem 1rem;
          border-radius: 8px; margin-bottom: 2rem; font-size: 0.8125rem;
        }

        .dashboard-empty {
          text-align: center; padding: 5rem 2rem;
          background: rgba(255,255,255,0.02);
          border: 1px dashed rgba(255,255,255,0.08);
          border-radius: 16px;
          display: flex; flex-direction: column; align-items: center; gap: 1rem;
        }
        .dashboard-empty__icon { color: rgba(255,255,255,0.15); margin-bottom: 1rem; }
        .dashboard-empty h3 { font-size: 1.25rem; font-weight: 500; }
        .dashboard-empty p { color: #78716c; margin-bottom: 1.5rem; font-size: 0.875rem; }

        .document-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1rem;
        }

        .document-card {
          display: flex; flex-direction: column;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px; padding: 1.5rem;
          text-decoration: none; color: inherit;
          transition: all 0.2s; height: 160px;
        }
        .document-card:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.1);
          transform: translateY(-2px);
        }
        .document-card__header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: auto;
        }
        .document-card__icon { color: #78716c; opacity: 0.6; }
        .document-card__body { margin-top: 1.5rem; }
        .document-card__title {
          font-size: 1rem; font-weight: 500; margin-bottom: 0.375rem;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          letter-spacing: -0.02em;
        }
        .document-card__meta {
          display: flex; align-items: center; gap: 0.375rem;
          font-size: 0.6875rem; color: #78716c; font-weight: 400;
        }

        .role-badge {
          font-size: 0.625rem; font-weight: 600; text-transform: uppercase;
          padding: 0.1875rem 0.5rem; border-radius: 9999px;
          letter-spacing: 0.05em;
        }
        .role-badge--owner {
          background: rgba(59,130,246,0.1); color: #60a5fa;
          border: 1px solid rgba(59,130,246,0.2);
        }
        .role-badge--editor {
          background: rgba(34,197,94,0.1); color: #4ade80;
          border: 1px solid rgba(34,197,94,0.2);
        }
        .role-badge--viewer {
          background: rgba(107,114,128,0.1); color: #9ca3af;
          border: 1px solid rgba(107,114,128,0.2);
        }
      `}</style>
    </div>
  );
}
