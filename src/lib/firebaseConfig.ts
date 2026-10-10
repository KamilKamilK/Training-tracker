import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, connectAuthEmulator, getAuth, signInWithCredential } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Local development (`npm run emulators`) and end-to-end tests (`npm run test:e2e`) run against
// the emulators, so production data is never touched. The flag is replaced at build time, so a
// production build contains none of this code.
if (import.meta.env.VITE_USE_EMULATORS === "true") {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });

  // The Google popup cannot be driven by a test, so tests sign in with an emulator-only
  // credential for the given e-mail and get back its uid.
  window.__e2eSignIn = async (email: string) => {
    const idToken = JSON.stringify({ sub: email, email, email_verified: true });
    const { user } = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
    return user.uid;
  };
}
