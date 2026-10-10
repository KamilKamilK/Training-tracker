import { z } from 'zod';

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

const templateId = z.string().nullable().default(null);

/** Days missing from a stored plan are rest days; keys other than weekdays are ignored. */
export const WeekPlanSchema = z.object({
  monday: templateId,
  tuesday: templateId,
  wednesday: templateId,
  thursday: templateId,
  friday: templateId,
  saturday: templateId,
  sunday: templateId,
});

export const WeekPlanDocumentSchema = z.object({
  plan: WeekPlanSchema,
  updatedAt: z.string(),
});

export type WeekPlan = z.infer<typeof WeekPlanSchema>;
export type WeekPlanDocument = z.infer<typeof WeekPlanDocumentSchema>;
