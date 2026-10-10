import React from 'react';
import { Dumbbell } from 'lucide-react';
import { APP_CONFIG } from '../../constants/config.js';
import { ErrorBanner } from './ErrorBanner.js';

interface CardScreenProps {
  error: string | null;
  onDismissError: () => void;
  notice?: string | null;
  children: React.ReactNode;
}

/** Full-page card with the app name, used by the screens shown before the journal opens. */
export const CardScreen: React.FC<CardScreenProps> = ({ error, onDismissError, notice, children }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4">
    <div className="bg-slate-800 rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
      <Dumbbell size={48} className="text-blue-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-4">{APP_CONFIG.name}</h1>
      {error && <ErrorBanner message={error} onDismiss={onDismissError} />}
      {notice && (
        <p role="status" className="bg-blue-900/50 border border-blue-600 text-blue-100 rounded-lg p-3 mb-4 text-sm">
          {notice}
        </p>
      )}
      {children}
    </div>
  </div>
);
