'use client';

import React, { useState } from 'react';

export interface DocumentMember {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  role: 'owner' | 'editor' | 'viewer';
}

interface MemberManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  currentUserId: string;
  members: DocumentMember[];
  onMembersChange: (updatedMembers: DocumentMember[]) => void;
}

export default function MemberManagementModal({
  isOpen,
  onClose,
  documentId,
  currentUserId,
  members,
  onMembersChange,
}: MemberManagementModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/docs/${documentId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || 'Failed to invite member');
      }

      const newMember = json.data;
      onMembersChange([...members, newMember]);
      setEmail('');
      setSuccess(`Successfully invited ${email} as ${role}.`);
      
      // Auto clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Are you sure you want to revoke access for ${userEmail}?`)) {
      return;
    }

    setRemovingUserId(userId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/docs/${documentId}/members/${userId}`, {
        method: 'DELETE',
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || 'Failed to remove member');
      }

      onMembersChange(members.filter((m) => m.id !== userId));
      setSuccess(`Removed access for ${userEmail}.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to remove member');
    } finally {
      setRemovingUserId(null);
    }
  };

  return (
    <div className="member-modal-overlay" onClick={onClose}>
      <div className="member-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="member-modal-header">
          <h2>Manage Members</h2>
          <button className="member-modal-close" onClick={onClose} aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="member-modal-body">
          {/* Status Messages */}
          {error && <div className="member-status-alert member-status-alert--error">{error}</div>}
          {success && <div className="member-status-alert member-status-alert--success">{success}</div>}

          {/* Invite Section */}
          <form className="member-invite-form" onSubmit={handleInvite}>
            <div className="member-input-group">
              <input
                type="email"
                placeholder="Enter collaborator email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                className="member-input-field"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                disabled={isSubmitting}
                className="member-role-select"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <button type="submit" disabled={isSubmitting || !email} className="member-invite-btn">
                {isSubmitting ? 'Inviting...' : 'Invite'}
              </button>
            </div>
          </form>

          {/* Member List */}
          <div className="member-list-container">
            <h3>Current Collaborators ({members.length})</h3>
            <div className="member-list">
              {members.map((m) => {
                const initials = (m.name || m.email)
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                const isSelf = m.id === currentUserId;

                return (
                  <div key={m.id} className="member-row">
                    <div className="member-row__info">
                      <div className="member-avatar">
                        {initials}
                      </div>
                      <div className="member-details">
                        <span className="member-name">
                          {m.name || 'Invited User'} {isSelf && <span className="member-self-tag">(You)</span>}
                        </span>
                        <span className="member-email">{m.email}</span>
                      </div>
                    </div>

                    <div className="member-row__actions">
                      <span className={`member-badge member-badge--${m.role}`}>
                        {m.role}
                      </span>

                      {/* Owners can remove anyone except themselves */}
                      {!isSelf && m.role !== 'owner' && (
                        <button
                          className="member-remove-btn"
                          onClick={() => handleRemove(m.id, m.email)}
                          disabled={removingUserId === m.id}
                          title="Revoke access"
                          aria-label={`Revoke access for ${m.email}`}
                        >
                          {removingUserId === m.id ? (
                            <span className="member-remove-spinner" />
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .member-modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          z-index: 100;
          animation: modal-fade-in 0.25s ease;
        }

        .member-modal-card {
          width: 100%; max-width: 560px;
          background: rgba(15, 15, 15, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          display: flex; flex-direction: column;
          overflow: hidden;
          animation: modal-slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .member-modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .member-modal-header h2 {
          font-size: 1.125rem; font-weight: 600; color: #fff; margin: 0;
        }
        .member-modal-close {
          background: none; border: none; color: #a8a29e; cursor: pointer;
          padding: 4px; border-radius: 6px; display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, color 0.2s;
        }
        .member-modal-close:hover {
          background: rgba(255, 255, 255, 0.05); color: #fff;
        }

        .member-modal-body {
          padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem;
        }

        .member-status-alert {
          padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.8125rem; font-weight: 500;
          animation: alert-enter 0.2s ease;
        }
        .member-status-alert--error {
          background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #fca5a5;
        }
        .member-status-alert--success {
          background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); color: #6ee7b7;
        }

        .member-invite-form {
          width: 100%;
        }
        .member-input-group {
          display: flex; gap: 0.75rem; width: 100%;
        }
        .member-input-field {
          flex: 1; height: 40px; border-radius: 8px;
          background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);
          color: #fff; padding: 0 0.875rem; font-size: 0.875rem; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .member-input-field:focus {
          border-color: rgba(99, 102, 241, 0.5);
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }
        .member-role-select {
          height: 40px; border-radius: 8px;
          background: rgba(20, 20, 20, 0.95); border: 1px solid rgba(255, 255, 255, 0.08);
          color: #e7e5e4; padding: 0 1.5rem 0 0.75rem; font-size: 0.875rem; outline: none;
          cursor: pointer; transition: border-color 0.2s;
        }
        .member-role-select:focus {
          border-color: rgba(99, 102, 241, 0.5);
        }
        .member-invite-btn {
          height: 40px; padding: 0 1.25rem; border-radius: 8px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          border: none; color: #fff; font-size: 0.875rem; font-weight: 500;
          cursor: pointer; transition: opacity 0.2s, transform 0.1s;
        }
        .member-invite-btn:hover:not(:disabled) {
          opacity: 0.95;
        }
        .member-invite-btn:active:not(:disabled) {
          transform: scale(0.98);
        }
        .member-invite-btn:disabled {
          background: rgba(255, 255, 255, 0.05); color: #78716c; cursor: not-allowed;
        }

        .member-list-container h3 {
          font-size: 0.8125rem; font-weight: 600; text-transform: uppercase;
          color: #78716c; letter-spacing: 0.05em; margin: 0 0 0.75rem 0;
        }
        .member-list {
          display: flex; flex-direction: column; gap: 0.5rem;
          max-height: 240px; overflow-y: auto; padding-right: 4px;
        }
        
        /* Custom scrollbar */
        .member-list::-webkit-scrollbar { width: 6px; }
        .member-list::-webkit-scrollbar-track { background: transparent; }
        .member-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }

        .member-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.75rem 0.875rem; border-radius: 10px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.03);
          transition: background 0.2s;
        }
        .member-row:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        .member-row__info {
          display: flex; align-items: center; gap: 0.75rem;
        }
        .member-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%);
          border: 1px solid rgba(99, 102, 241, 0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 600; color: #a5b4fc;
        }
        .member-details {
          display: flex; flex-direction: column;
        }
        .member-name {
          font-size: 0.875rem; font-weight: 500; color: #fff;
        }
        .member-self-tag {
          font-size: 0.75rem; color: #78716c; margin-left: 4px; font-weight: normal;
        }
        .member-email {
          font-size: 0.75rem; color: #78716c;
        }

        .member-row__actions {
          display: flex; align-items: center; gap: 0.75rem;
        }

        .member-badge {
          font-size: 0.625rem; font-weight: 600; text-transform: uppercase;
          padding: 0.1875rem 0.5rem; border-radius: 9999px; letter-spacing: 0.05em;
        }
        .member-badge--owner { background: rgba(59,130,246,0.1); color: #60a5fa; border: 1px solid rgba(59,130,246,0.2); }
        .member-badge--editor { background: rgba(34,197,94,0.1); color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }
        .member-badge--viewer { background: rgba(107,114,128,0.1); color: #9ca3af; border: 1px solid rgba(107,114,128,0.2); }

        .member-remove-btn {
          background: none; border: none; color: #f87171; cursor: pointer;
          padding: 6px; border-radius: 6px; display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, color 0.2s;
        }
        .member-remove-btn:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.1); color: #ef4444;
        }
        .member-remove-btn:disabled {
          opacity: 0.5; cursor: not-allowed;
        }
        
        .member-remove-spinner {
          width: 14px; height: 14px; border: 2px solid rgba(239, 68, 68, 0.2);
          border-top-color: #ef4444; border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes modal-fade-in {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes modal-slide-up {
          from { transform: scale(0.96) translateY(8px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes alert-enter {
          from { transform: translateY(-4px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
