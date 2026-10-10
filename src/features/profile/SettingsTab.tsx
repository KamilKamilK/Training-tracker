import React, { useState } from 'react';
import { ErrorBanner } from '../../components/common/ErrorBanner.js';
import { FormField } from '../../components/common/FormField.js';
import { Modal } from '../../components/common/Modal.js';
import { HEALTH_CONSENT } from '../../constants/consent.js';
import { UserProfile } from '../../types/index.js';
import type { FieldErrors } from '../../utils/form.utils.js';
import { DisplayNameInput, validateDisplayName } from './profile.validation.js';

interface SettingsTabProps {
  email: string | null;
  profile: UserProfile;
  error: string | null;
  onDismissError: () => void;
  onUpdateDisplayName: (displayName: string) => Promise<boolean>;
  onWithdrawHealthConsent: () => Promise<boolean>;
}

const primaryButton = 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg';

export const SettingsTab: React.FC<SettingsTabProps> = ({
  email,
  profile,
  error,
  onDismissError,
  onUpdateDisplayName,
  onWithdrawHealthConsent,
}) => {
  const [input, setInput] = useState<DisplayNameInput>({ displayName: profile.displayName });
  const [errors, setErrors] = useState<FieldErrors<DisplayNameInput>>({});
  const [saved, setSaved] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const saveName = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaved(false);
    const result = validateDisplayName(input);
    if ('errors' in result) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setIsBusy(true);
    setSaved(await onUpdateDisplayName(result.data.displayName));
    setIsBusy(false);
  };

  const withdraw = async () => {
    setIsBusy(true);
    // On success the account becomes inactive and the app shows the activation screen instead.
    if (!(await onWithdrawHealthConsent())) {
      setIsBusy(false);
      setIsWithdrawOpen(false);
    }
  };

  return (
    <div className="space-y-8 max-w-xl">
      <h2 className="text-2xl font-bold">Ustawienia</h2>
      {error && <ErrorBanner message={error} onDismiss={onDismissError} />}

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Profil</h3>
        <p className="text-sm text-slate-400">E-mail: {email}</p>
        <form onSubmit={saveName} noValidate className="space-y-3">
          <FormField
            id="settings-name"
            label="Imię"
            type="text"
            autoComplete="given-name"
            value={input.displayName}
            error={errors.displayName}
            onChange={displayName => {
              setSaved(false);
              setInput({ displayName });
            }}
          />
          <div className="flex items-center gap-3">
            <button type="submit" disabled={isBusy} className={primaryButton}>
              Zapisz
            </button>
            {saved && (
              <span role="status" className="text-sm text-green-400">
                Zapisano.
              </span>
            )}
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Zgody</h3>
        <div className="bg-slate-700 rounded-lg p-4 space-y-2 text-sm">
          <p>{HEALTH_CONSENT.text}</p>
          <p className="text-slate-400">
            Udzielona {profile.consents.health.at.toLocaleString('pl-PL')} (wersja {profile.consents.health.version}).
          </p>
          <button onClick={() => setIsWithdrawOpen(true)} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg">
            Wycofaj zgodę
          </button>
        </div>
      </section>

      <Modal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} title="Wycofać zgodę?">
        <p className="text-slate-300 mb-4">
          Bez tej zgody konto stanie się nieaktywne: nie zobaczysz ani nie zapiszesz treningów i pomiarów, dopóki ponownie
          jej nie wyrazisz. Zapisane dane pozostaną na koncie.
        </p>
        <div className="flex gap-3">
          <button onClick={withdraw} disabled={isBusy} className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-2 rounded-lg">
            Wycofaj zgodę
          </button>
          <button onClick={() => setIsWithdrawOpen(false)} className="bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded-lg">
            Anuluj
          </button>
        </div>
      </Modal>
    </div>
  );
};
