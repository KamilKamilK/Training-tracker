import React from 'react';
import { Dumbbell, LogOut, MailCheck, RefreshCw } from 'lucide-react';
import { APP_CONFIG } from '../../constants/config.js';
import { ErrorBanner } from '../../components/common/ErrorBanner.js';
import { SignInPanel } from './SignInPanel.js';

interface AuthScreenProps {
  variant: 'signedOut' | 'unverified' | 'denied';
  email: string | null;
  error: string | null;
  notice: string | null;
  onDismissError: () => void;
  onGoogle: () => void;
  onSignIn: (email: string, password: string) => Promise<boolean>;
  onRegister: (email: string, password: string) => Promise<boolean>;
  onReset: (email: string) => Promise<boolean>;
  onResendVerification: () => void;
  onCheckVerification: () => void;
  onSignOut: () => void;
}

const secondaryButton =
  'flex items-center justify-center gap-2 w-full bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded-lg';

export const AuthScreen: React.FC<AuthScreenProps> = props => {
  const { variant, email, error, notice, onDismissError, onSignOut } = props;
  const signOutButton = (
    <button onClick={onSignOut} className={secondaryButton}>
      <LogOut size={18} /> Wyloguj
    </button>
  );

  return (
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

        {variant === 'signedOut' && (
          <SignInPanel
            onGoogle={props.onGoogle}
            onSignIn={props.onSignIn}
            onRegister={props.onRegister}
            onReset={props.onReset}
          />
        )}

        {variant === 'unverified' && (
          <div className="space-y-3">
            <MailCheck size={32} className="mx-auto text-blue-400" />
            <p className="text-slate-300">
              Potwierdź adres <strong>{email}</strong> — kliknij link w wiadomości, którą wysłaliśmy. Do tego czasu dziennik
              jest niedostępny.
            </p>
            <button onClick={props.onCheckVerification} className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg">
              <RefreshCw size={18} /> Potwierdziłem adres
            </button>
            <button onClick={props.onResendVerification} className={secondaryButton}>
              Wyślij link ponownie
            </button>
            {signOutButton}
          </div>
        )}

        {variant === 'denied' && (
          <div className="space-y-3">
            <p className="text-slate-400">Konto {email ?? ''} nie ma dostępu do tego dziennika.</p>
            {signOutButton}
          </div>
        )}
      </div>
    </div>
  );
};
