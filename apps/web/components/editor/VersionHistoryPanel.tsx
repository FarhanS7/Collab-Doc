'use client';

import React, { useState, useEffect } from 'react';

export interface VersionItem {
  id: string;
  createdAt: string;
}

interface VersionHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  isOwner: boolean;
}

export default function VersionHistoryPanel({
  isOpen,
  onClose,
  documentId,
  isOwner,
}: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch version history list when drawer opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchVersions = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/docs/${documentId}/versions`);
        if (!res.ok) throw new Error('Failed to load version history');
        const json = await res.json();
        setVersions(json.data || []);
      } catch (err: any) {
        setError(err.message || 'Error fetching versions');
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [isOpen, documentId]);

  // Load version preview snapshot
  const handleSelectVersion = async (versionId: string) => {
    setSelectedVersionId(versionId);
    setPreviewLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/docs/${documentId}/versions/${versionId}`);
      if (!res.ok) throw new Error('Failed to fetch snapshot');
      const json = await res.json();
      setPreviewContent(json.data.snapshotState);
    } catch (err: any) {
      setError(err.message || 'Error loading preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Trigger restore version
  const handleRestore = async (versionId: string) => {
    if (!isOwner) return;
    if (!confirm('Are you sure you want to restore this version? Active collaborators will be synced to this state.')) {
      return;
    }

    setRestoring(true);
    setError(null);
    try {
      const res = await fetch(`/api/docs/${documentId}/versions/${versionId}/restore`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to restore version');
      onClose();
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Error restoring version');
      setRestoring(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="version-drawer-backdrop" onClick={onClose}>
      <aside
        className="version-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Version history panel"
        aria-modal="true"
      >
        <div className="drawer-header">
          <div className="drawer-title-group">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <h2>Version History</h2>
          </div>
          <button className="drawer-close-btn" onClick={onClose} aria-label="Close version panel">
            ✕
          </button>
        </div>

        {error && <div className="drawer-error-box">{error}</div>}

        <div className="drawer-content">
          {loading ? (
            <div className="drawer-loading">Loading version history...</div>
          ) : versions.length === 0 ? (
            <div className="drawer-empty">No version snapshots recorded yet.</div>
          ) : (
            <ul className="version-list">
              {versions.map((ver, idx) => {
                const isSelected = selectedVersionId === ver.id;
                const formattedDate = new Date(ver.createdAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <li key={ver.id} className={`version-card ${isSelected ? 'version-card--selected' : ''}`}>
                    <div className="version-card__main" onClick={() => handleSelectVersion(ver.id)}>
                      <span className="version-card__badge">#{versions.length - idx}</span>
                      <div className="version-card__info">
                        <span className="version-card__date">{formattedDate}</span>
                        <span className="version-card__subtitle">Auto snapshot</span>
                      </div>
                    </div>

                    {isSelected && isOwner && (
                      <button
                        className="restore-btn"
                        onClick={() => handleRestore(ver.id)}
                        disabled={restoring}
                      >
                        {restoring ? 'Restoring...' : 'Restore state'}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {selectedVersionId && (
            <div className="preview-container">
              <div className="preview-banner">
                <span>Read-only preview</span>
              </div>
              {previewLoading ? (
                <div className="preview-loading">Fetching snapshot bytes...</div>
              ) : (
                <div className="preview-body">
                  Snapshot loaded ({previewContent ? `${previewContent.length} chars` : 'empty'}).
                </div>
              )}
            </div>
          )}
        </div>

        <style>{`
          .version-drawer-backdrop {
            position: fixed; inset: 0; z-index: 100;
            background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
            display: flex; justify-content: flex-end;
          }
          .version-drawer {
            width: 360px; height: 100%; background: #0a0a0a;
            border-left: 1px solid rgba(255,255,255,0.08);
            display: flex; flex-direction: column; color: #fff;
            animation: slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          }
          @keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
          .drawer-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: 1rem 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.08);
          }
          .drawer-title-group { display: flex; align-items: center; gap: 0.625rem; }
          .drawer-title-group h2 { font-size: 1rem; font-weight: 600; margin: 0; }
          .drawer-close-btn {
            background: transparent; border: none; color: #a8a29e; cursor: pointer;
            font-size: 1.125rem; padding: 0.25rem; transition: color 0.2s;
          }
          .drawer-close-btn:hover { color: #fff; }
          .drawer-error-box {
            margin: 0.75rem 1.25rem 0; padding: 0.625rem; border-radius: 6px;
            background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
            color: #fca5a5; font-size: 0.8125rem;
          }
          .drawer-content { flex: 1; overflow-y: auto; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
          .drawer-loading, .drawer-empty { color: #a8a29e; font-size: 0.875rem; text-align: center; margin-top: 2rem; }
          .version-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.75rem; }
          .version-card {
            border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
            background: rgba(255,255,255,0.02); padding: 0.75rem;
            display: flex; flex-direction: column; gap: 0.625rem; transition: border-color 0.2s;
          }
          .version-card:hover { border-color: rgba(255,255,255,0.18); }
          .version-card--selected { border-color: #60a5fa; background: rgba(59,130,246,0.05); }
          .version-card__main { display: flex; align-items: center; gap: 0.75rem; cursor: pointer; }
          .version-card__badge {
            font-size: 0.75rem; font-weight: 700; color: #a8a29e;
            background: rgba(255,255,255,0.06); padding: 0.25rem 0.5rem; border-radius: 4px;
          }
          .version-card__info { display: flex; flex-direction: column; }
          .version-card__date { font-size: 0.875rem; font-weight: 500; color: #e7e5e4; }
          .version-card__subtitle { font-size: 0.75rem; color: #78716c; }
          .restore-btn {
            background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3);
            color: #60a5fa; font-size: 0.8125rem; font-weight: 600; padding: 0.375rem 0.75rem;
            border-radius: 6px; cursor: pointer; transition: background 0.2s; align-self: flex-start;
          }
          .restore-btn:hover { background: rgba(59,130,246,0.3); color: #fff; }
          .restore-btn:disabled { opacity: 0.5; cursor: not-allowed; }
          .preview-container {
            margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 1rem;
          }
          .preview-banner {
            font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
            color: #f59e0b; margin-bottom: 0.5rem;
          }
          .preview-body { font-size: 0.8125rem; color: #a8a29e; }
        `}</style>
      </aside>
    </div>
  );
}
