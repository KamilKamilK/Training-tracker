import TrainingTracker from './app/TrainingTracker.js';
import { AuthScreen } from './features/auth/AuthScreen.js';
import { LoadingSpinner } from './components/common/LoadingSpinner.js';
import { useAuth } from './features/auth/useAuth.js';

function App() {
  const { status, email, error, clearError, signIn, signOut } = useAuth();

  if (status === 'loading') return <LoadingSpinner />;

  if (status === 'owner') return <TrainingTracker email={email} onSignOut={signOut} />;

  return (
    <AuthScreen
      variant={status}
      email={email}
      error={error}
      onDismissError={clearError}
      onSignIn={signIn}
      onSignOut={signOut}
    />
  );
}

export default App;
