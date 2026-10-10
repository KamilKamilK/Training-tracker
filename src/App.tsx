import TrainingTracker from './app/TrainingTracker.js';
import { AuthScreen } from './features/auth/AuthScreen.js';
import { LoadingSpinner } from './components/common/LoadingSpinner.js';
import { useAuth } from './features/auth/useAuth.js';

function App() {
  const auth = useAuth();

  if (auth.status === 'loading') return <LoadingSpinner />;

  if (auth.status === 'owner') return <TrainingTracker email={auth.email} onSignOut={auth.signOut} />;

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
