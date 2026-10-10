const INVALID_CREDENTIALS = 'Nieprawidłowy e-mail lub hasło.';

/**
 * User-facing message for a Firebase Authentication error code. Sign-in failures share one
 * message, so the screen never reveals whether an account exists.
 */
export const authErrorMessage = (code: string | undefined): string => {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return INVALID_CREDENTIALS;
    case 'auth/email-already-in-use':
      return 'Nie udało się utworzyć konta. Jeśli masz już konto, zaloguj się albo zresetuj hasło.';
    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements':
      return 'Hasło nie spełnia wymagań: co najmniej 8 znaków, w tym wielka i mała litera oraz cyfra.';
    case 'auth/too-many-requests':
      return 'Zbyt wiele prób. Spróbuj ponownie za kilka minut.';
    case 'auth/network-request-failed':
      return 'Brak połączenia z internetem. Sprawdź sieć i spróbuj ponownie.';
    case 'auth/user-disabled':
      return 'To konto jest zablokowane.';
    default:
      return 'Nie udało się wykonać operacji. Spróbuj ponownie.';
  }
};

/** Codes for a sign-in popup the user closed; not an error worth showing. */
export const CANCELLED_SIGN_IN_CODES = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];
