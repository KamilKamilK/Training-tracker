export const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export type WeekPlan = Record<DayOfWeek, string | null>;

export interface WeekPlanDocument {
  plan: WeekPlan;
  updatedAt: string;
}
