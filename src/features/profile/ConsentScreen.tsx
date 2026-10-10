import React, { useState } from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';
import { CardScreen } from '../../components/common/CardScreen.js';
import { FormField } from '../../components/common/FormField.js';
import { HEALTH_CONSENT } from '../../constants/consent.js';
import type { FieldErrors } from '../../utils/form.utils.js';
import { ActivationInput, validateActivation } from './profile.validation.js';

interface ConsentScreenProps {
  defaultName: string;
  error: string | null;
  onDismissError: () => void;
  onActivate: (displayName: string) => Promise<boolean>;
  onSignOut: () => void;
}

/** Activation of the account: name and the required health-data consent (ADR-0015). */
export const ConsentScreen: React.FC<ConsentScreenProps> = ({ defaultName, error, onDismissError, onActivate, onSignOut }) => {
  const [input, setInput] = useState<ActivationInput>({ displayName: defaultName, healthConsent: false });
  const [errors, setErrors] = useState<FieldErrors<ActivationInput>>({});
  const [isBusy, setIsBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = validateActivation(input);
    if ('errors' in result) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setIsBusy(true);
    await onActivate(result.data.displayName);
    setIsBusy(false);
  };

  return (
    <CardScreen error={error} onDismissError={onDismissError}>
      <form onSubmit={submit} noValidate className="space-y-4 text-left">
        <div className="text-center">
          <ShieldCheck size={32} className="mx-auto text-blue-400 mb-2" />
          <h2 className="text-lg font-semibold">Aktywuj konto</h2>
        </div>
        <FormField
          id="profile-name"
          label="Imię"
          type="text"
          autoComplete="given-name"
          value={input.displayName}
          error={errors.displayName}
          onChange={displayName => setInput(prev => ({ ...prev, displayName }))}
        />
        <p className="text-sm text-slate-300">
          Dziennik zapisuje treningi oraz pomiary ciała. Waga, obwody i notatki o samopoczuciu to dane o zdrowiu, dlatego
          potrzebujemy Twojej zgody. Bez niej nie możemy prowadzić dziennika i konto pozostaje nieaktywne. Zgodę możesz
          wycofać w każdej chwili w Ustawieniach.
        </p>
        <div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={input.healthConsent}
              onChange={e => setInput(prev => ({ ...prev, healthConsent: e.target.checked }))}
              aria-invalid={errors.healthConsent ? true : undefined}
              aria-describedby={errors.healthConsent ? 'health-consent-error' : undefined}
              className="mt-1"
            />
            <span>{HEALTH_CONSENT.text}</span>
          </label>
          {errors.healthConsent && (
            <p id="health-consent-error" className="text-red-400 text-sm mt-1">
              {errors.healthConsent}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isBusy}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg"
        >
          {isBusy ? 'Zapisywanie...' : 'Aktywuj konto'}
        </button>
        <button
          type="button"
          onClick={onSignOut}
          className="flex items-center justify-center gap-2 w-full bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded-lg"
        >
          <LogOut size={18} /> Wyloguj
        </button>
      </form>
    </CardScreen>
  );
};
