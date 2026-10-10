import React, { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { FormField } from './FormField.js';
import {
  FieldErrors,
  PASSWORD_RULES,
  RegisterInput,
  SignInInput,
  validateRegister,
  validateReset,
  validateSignIn,
} from './auth.validation.js';

type Mode = 'signIn' | 'register' | 'reset';

interface SignInPanelProps {
  onGoogle: () => void;
  onSignIn: (email: string, password: string) => Promise<boolean>;
  onRegister: (email: string, password: string) => Promise<boolean>;
  onReset: (email: string) => Promise<boolean>;
}

const tabClass = (active: boolean) =>
  `flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-all ${
    active ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
  }`;

const submitClass =
  'w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg';

export const SignInPanel: React.FC<SignInPanelProps> = ({ onGoogle, onSignIn, onRegister, onReset }) => {
  const [mode, setMode] = useState<Mode>('signIn');
  const [input, setInput] = useState<RegisterInput>({ email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<FieldErrors<RegisterInput>>({});
  const [isBusy, setIsBusy] = useState(false);

  const change = (field: keyof RegisterInput) => (value: string) => setInput(prev => ({ ...prev, [field]: value }));

  const switchMode = (next: Mode) => {
    setMode(next);
    setErrors({});
    setInput(prev => ({ ...prev, password: '', confirmPassword: '' }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result =
      mode === 'register'
        ? validateRegister(input)
        : mode === 'signIn'
          ? validateSignIn({ email: input.email, password: input.password } satisfies SignInInput)
          : validateReset({ email: input.email });
    if ('errors' in result) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setIsBusy(true);
    const { email } = result.data;
    if (mode === 'register') await onRegister(email, input.password);
    else if (mode === 'signIn') await onSignIn(email, input.password);
    else if (await onReset(email)) switchMode('signIn');
    setIsBusy(false);
  };

  return (
    <div className="space-y-4">
      {mode !== 'reset' && (
        <div className="flex gap-2" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'signIn'} className={tabClass(mode === 'signIn')} onClick={() => switchMode('signIn')}>
            <LogIn size={16} /> Zaloguj
          </button>
          <button type="button" role="tab" aria-selected={mode === 'register'} className={tabClass(mode === 'register')} onClick={() => switchMode('register')}>
            <UserPlus size={16} /> Zarejestruj
          </button>
        </div>
      )}

      <form onSubmit={submit} noValidate className="space-y-3">
        {mode === 'reset' && (
          <p className="text-slate-400 text-sm text-left">Podaj adres konta — wyślemy link do ustawienia nowego hasła.</p>
        )}
        <FormField id="auth-email" label="E-mail" type="email" autoComplete="email" value={input.email} error={errors.email} onChange={change('email')} />
        {mode !== 'reset' && (
          <FormField
            id="auth-password"
            label="Hasło"
            type="password"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            value={input.password}
            error={errors.password}
            hint={mode === 'register' ? PASSWORD_RULES : undefined}
            onChange={change('password')}
          />
        )}
        {mode === 'register' && (
          <FormField
            id="auth-confirm-password"
            label="Powtórz hasło"
            type="password"
            autoComplete="new-password"
            value={input.confirmPassword}
            error={errors.confirmPassword}
            onChange={change('confirmPassword')}
          />
        )}
        <button type="submit" disabled={isBusy} className={submitClass}>
          {mode === 'signIn' && 'Zaloguj się'}
          {mode === 'register' && 'Załóż konto'}
          {mode === 'reset' && 'Wyślij link'}
        </button>
      </form>

      {mode === 'signIn' && (
        <button type="button" onClick={() => switchMode('reset')} className="text-sm text-blue-400 hover:text-blue-300">
          Nie pamiętasz hasła?
        </button>
      )}
      {mode === 'reset' && (
        <button type="button" onClick={() => switchMode('signIn')} className="text-sm text-blue-400 hover:text-blue-300">
          Wróć do logowania
        </button>
      )}

      {mode !== 'reset' && (
        <>
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <span className="flex-1 border-t border-slate-600" /> albo <span className="flex-1 border-t border-slate-600" />
          </div>
          <button type="button" onClick={onGoogle} className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg">
            Kontynuuj z Google
          </button>
        </>
      )}
    </div>
  );
};
