import { z } from 'zod';

export const WorkoutTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  exercises: z.array(z.string()),
  category: z.enum(['strength', 'cardio', 'hybrid', 'custom']),
  estimatedDuration: z.number().finite(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  color: z.string(),
  icon: z.string().optional(),
  isCustom: z.boolean().optional(),
  createdAt: z.string().optional(),
});

export type WorkoutTemplate = z.infer<typeof WorkoutTemplateSchema>;

export type TabType = 'dashboard' | 'plan' | 'workout' | 'history' | 'stats' | 'templates';
