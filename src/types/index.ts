export interface WorkoutSet {
  weight: string;
  reps: string;
  rir: string;
}

export interface Exercise {
  name: string;
  sets: WorkoutSet[];
  notes?: string; 
}

export interface Workout {
  id: string;
  type: string;
  date: string;
  exercises: Exercise[];
  notes: string;
  duration?: number; 
  completed?: boolean; 
}

export interface Measurement {
  id?: string;
  date: string;
  weight: number;
  waist: number;
  bodyFat?: number; 
  photos?: string[]; 
}

export type TabType = 'dashboard' | 'plan' | 'workout' | 'history' | 'stats' | 'templates';

// 🆕 NOWY: Szablon treningu z metadanymi
export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  exercises: string[];
  category: 'strength' | 'cardio' | 'hybrid' | 'custom';
  estimatedDuration: number; // w minutach
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  color: string; 
  icon?: string; 
  isCustom?: boolean; 
  createdAt?: string;
}

// 🆕 NOWY: Ustawienia użytkownika
export interface UserSettings {
  defaultRestTime: number; // Domyślny czas odpoczynku
  weightUnit: 'kg' | 'lbs';
  preferredTemplates: string[]; // Ulubione szablony
  notifications: boolean;
}