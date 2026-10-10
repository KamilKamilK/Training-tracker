import React from 'react';
import { LogOut, MailCheck, RefreshCw } from 'lucide-react';
import { CardScreen } from '../../components/common/CardScreen.js';
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
    <CardScreen error={error} notice={notice} onDismissError={onDismissError}>
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
    </CardScreen>
  );
};
