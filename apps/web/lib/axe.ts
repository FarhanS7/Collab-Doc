import React from 'react';

export async function initAxe() {
  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    try {
      const axe = await import('@axe-core/react');
      const ReactDOM = await import('react-dom');
      axe.default(React, ReactDOM, 1000);
      console.log('♿ [@axe-core/react] Accessibility auditor initialized in development mode.');
    } catch (err) {
      console.warn('[axe-core] Could not initialize axe-core accessibility auditor:', err);
    }
  }
}
