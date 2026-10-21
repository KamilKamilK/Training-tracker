export const APP_CONFIG = {
  name: 'Dziennik Treningowy',
  subtitle: 'Plan: Redukcja + Kondycja + Siła',
};

/** Every LocalStorage entry of the app; sign-out removes all of them (AuthService.signOut). */
export const STORAGE_KEYS = {
  currentWorkoutDraft: 'currentWorkoutDraft',
  /** Templates saved in the browser before they moved to Firestore; read once and imported (useTemplates). */
  customTemplates: 'customTemplates',
  /** Workouts and measurements kept in the browser by the first versions; no longer read, only removed. */
  legacyWorkouts: 'workouts',
  legacyMeasurements: 'measurements',
};
