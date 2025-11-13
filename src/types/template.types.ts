export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  exercises: string[];
  category: 'strength' | 'cardio' | 'hybrid' | 'custom';
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  color: string;
  icon?: string;
  isCustom?: boolean;
  createdAt?: string;
}

export type TabType = 'dashboard' | 'plan' | 'workout' | 'history' | 'stats' | 'templates';