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
      // In dev, the Express server is on port 4000. In prod, we'll use Next.js rewrites or a full URL.
      // For now, assuming local dev setup where we hit the API proxy or the direct URL.
      // Next.js rewrites are better for this. We'll assume a rewrite is setup: /api/ -> http://localhost:4000/api/
      const res = await fetch('/api/docs');
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
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
      router.push(`/doc/${json.data.id}`); // Navigate to the new document
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document');
      setIsCreating(false);
    }
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          )}
          <span>New Document</span>
        </button>
      </header>

      {error && (
        <div className="dashboard-error">
          <span className="dashboard-error__icon">⚠</span>
          {error}
        </div>
      )}

      {loading ? (
        <div className="dashboard-loading">
          <div className="spinner" />
        </div>
      ) : documents.length === 0 ? (
        <div className="dashboard-empty">
          <div className="dashboard-empty__icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
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
                <svg className="document-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span className={`role-badge role-badge--${doc.role}`}>{doc.role}</span>
              </div>
              <div className="document-card__body">
                <h3 className="document-card__title">{doc.title}</h3>
                <div className="document-card__meta">
                  <span>Edited {formatDate(doc.updatedAt)}</span>
                  {doc.role !== 'owner' && (
                    <>
                      <span className="dot">•</span>
                      <span>Owner: {doc.ownerName}</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <style>{`
        .dashboard-content {
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 3rem;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .dashboard-header__title {
          font-family: 'Syne', sans-serif;
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #fff, #a5b4fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .dashboard-header__subtitle {
          color: rgba(255, 255, 255, 0.5);
          font-size: 1.125rem;
        }

        /* Buttons */
        .btn-create {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #6366f1;
          color: white;
          border: none;
          padding: 0.875rem 1.5rem;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: 0.9375rem;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
        }
        .btn-create:hover:not(:disabled) {
          background: #4f46e5;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
        }
        .btn-create:active:not(:disabled) {
          transform: translateY(1px);
        }
        .btn-create:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .btn-create--outline {
          background: transparent;
          border: 1px solid rgba(99, 102, 241, 0.5);
          box-shadow: none;
        }
        .btn-create--outline:hover:not(:disabled) {
          background: rgba(99, 102, 241, 0.1);
        }

        /* Loading & Error */
        .dashboard-loading {
          display: flex;
          justify-content: center;
          padding: 4rem 0;
        }
        .spinner {
          width: 32px; height: 32px;
          border-radius: 50%;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: #6366f1;
          animation: spin 0.8s linear infinite;
        }
        .spinner-small {
          width: 18px; height: 18px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: #fff;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .dashboard-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 2rem;
        }

        /* Empty State */
        .dashboard-empty {
          text-align: center;
          padding: 5rem 2rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .dashboard-empty__icon {
          color: rgba(255, 255, 255, 0.2);
          margin-bottom: 1rem;
        }
        .dashboard-empty h3 {
          font-size: 1.5rem;
          font-family: 'Syne', sans-serif;
        }
        .dashboard-empty p {
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 1.5rem;
        }

        /* Grid */
        .document-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        /* Card */
        .document-card {
          display: flex;
          flex-direction: column;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1.5rem;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          height: 180px;
        }
        .document-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
        }
        
        .document-card__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: auto;
        }
        
        .document-card__icon {
          width: 28px;
          height: 28px;
          color: #6366f1;
          opacity: 0.8;
        }

        .document-card__body {
          margin-top: 2rem;
        }

        .document-card__title {
          font-family: 'Syne', sans-serif;
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .document-card__meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
          color: rgba(255, 255, 255, 0.4);
        }
        .dot {
          font-size: 0.5rem;
        }

        /* Role Badges */
        .role-badge {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          letter-spacing: 0.05em;
        }
        .role-badge--owner {
          background: rgba(99, 102, 241, 0.15);
          color: #818cf8;
          border: 1px solid rgba(99, 102, 241, 0.3);
        }
        .role-badge--editor {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .role-badge--viewer {
          background: rgba(107, 114, 128, 0.15);
          color: #9ca3af;
          border: 1px solid rgba(107, 114, 128, 0.3);
        }
      `}</style>
    </div>
  );
}
