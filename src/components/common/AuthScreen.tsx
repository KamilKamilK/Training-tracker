import React from 'react';
import { Dumbbell, LogIn, LogOut } from 'lucide-react';
import { APP_CONFIG } from '../../constants/config.js';
import { ErrorBanner } from './ErrorBanner.js';

interface AuthScreenProps {
  variant: 'signedOut' | 'denied';
  email: string | null;
  error: string | null;
  onDismissError: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  variant,
  email,
  error,
  onDismissError,
  onSignIn,
  onSignOut,
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4">
    <div className="bg-slate-800 rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
      <Dumbbell size={48} className="text-blue-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-4">{APP_CONFIG.name}</h1>
      {error && <ErrorBanner message={error} onDismiss={onDismissError} />}
      {variant === 'signedOut' ? (
        <>
          <p className="text-slate-400 mb-6">Zaloguj się, aby zobaczyć swoje treningi.</p>
          <button
            onClick={onSignIn}
            className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
          >
            <LogIn size={18} /> Zaloguj przez Google
          </button>
        </>
      ) : (
        <>
          <p className="text-slate-400 mb-6">
            Konto {email ?? ''} nie ma dostępu do tego dziennika.
          </p>
          <button
            onClick={onSignOut}
            className="flex items-center justify-center gap-2 w-full bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded-lg"
          >
            <LogOut size={18} /> Wyloguj
          </button>
        </>
      )}
    </div>
  </div>
);
