import TrainingTracker from './app/TrainingTracker.js';
import { AuthScreen } from './features/auth/AuthScreen.js';
import { ConsentScreen } from './features/profile/ConsentScreen.js';
import { LoadingSpinner } from './components/common/LoadingSpinner.js';
import { useAuth } from './features/auth/useAuth.js';
import { useProfile } from './features/profile/useProfile.js';
import { isActive } from './features/profile/profile.utils.js';

function App() {
  const auth = useAuth();
  const account = useProfile(auth.status === 'owner' ? auth.uid : null);

  if (auth.status === 'loading' || account.isLoading) return <LoadingSpinner />;

  if (auth.status === 'owner') {
    // The journal opens only once the server confirmed the consent: its queries are checked by
    // rules that read the stored profile, so opening earlier would get them rejected.
    const confirmedActive = account.confirmedProfile !== null && isActive(account.confirmedProfile);
    if (!account.profile || !isActive(account.profile) || !confirmedActive) {
      return (
        <ConsentScreen
          defaultName={account.profile?.displayName ?? auth.displayName ?? ''}
          error={account.error}
          onDismissError={account.clearError}
          onActivate={account.activate}
          onSignOut={auth.signOut}
        />
      );
    }
    return (
      <TrainingTracker
        email={auth.email}
        profile={account.profile}
        profileError={account.error}
        onDismissProfileError={account.clearError}
        onUpdateDisplayName={account.updateDisplayName}
        onWithdrawHealthConsent={account.withdrawHealthConsent}
        onSignOut={auth.signOut}
      />
    );
  }

  return (
    <AuthScreen
      variant={auth.status}
      email={auth.email}
      error={auth.error}
      notice={auth.notice}
      onDismissError={auth.clearError}
      onGoogle={auth.signInWithGoogle}
      onSignIn={auth.signInWithEmail}
      onRegister={auth.register}
      onReset={auth.sendPasswordReset}
      onResendVerification={auth.resendVerification}
      onCheckVerification={auth.checkVerification}
      onSignOut={auth.signOut}
    />
  );
}

export default App;
