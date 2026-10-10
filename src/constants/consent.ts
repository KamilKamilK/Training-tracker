/**
 * Consent to process health data, required to activate the account (ADR-0015). Changing the text
 * needs a new version, so every user accepts the new text again.
 */
export const HEALTH_CONSENT = {
  version: '2026-10-10',
  text: 'Wyrażam zgodę na przetwarzanie moich danych o zdrowiu — wagi, obwodów ciała i notatek o samopoczuciu — w celu prowadzenia dziennika treningowego.',
} as const;
