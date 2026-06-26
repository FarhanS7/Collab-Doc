import React, { useEffect, useState } from 'react';
import { Awareness } from 'y-protocols/awareness';

interface PresenceBarProps {
  awareness: Awareness;
}

interface ActiveUser {
  clientId: number;
  name: string;
  color: string;
}

export default function PresenceBar({ awareness }: PresenceBarProps) {
  const [users, setUsers] = useState<ActiveUser[]>([]);

  useEffect(() => {
    const updateUsers = () => {
      const states = awareness.getStates();
      const activeUsers: ActiveUser[] = [];

      states.forEach((state: any, clientId: number) => {
        if (state.user) {
          activeUsers.push({
            clientId,
            name: state.user.name,
            color: state.user.color,
          });
        }
      });

      // Sort by clientId to keep avatar ordering stable
      activeUsers.sort((a, b) => a.clientId - b.clientId);
      setUsers(activeUsers);
    };

    // Initialize list
    updateUsers();

    // Listen to changes (joins, moves, leaves)
    awareness.on('change', updateUsers);

    return () => {
      awareness.off('change', updateUsers);
    };
  }, [awareness]);

  return (
    <div className="presence-bar">
      {users.map((u) => {
        const initials = u.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        return (
          <div
            key={u.clientId}
            className="avatar-circle"
            style={{
              borderColor: u.color,
              color: '#fff',
              background: `${u.color}33`, // 20% opacity border highlights
            }}
            title={u.name}
          >
            {initials || 'U'}
          </div>
        );
      })}

      <style>{`
        .presence-bar {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .avatar-circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: help;
          transition: transform 0.2s ease;
        }

        .avatar-circle:hover {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}
