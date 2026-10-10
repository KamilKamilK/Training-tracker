import { z } from 'zod';

export const MeasurementDocumentSchema = z.object({
  date: z.string(),
  weight: z.number().finite(),
  waist: z.number().finite(),
  bodyFat: z.number().finite().optional(),
  photos: z.array(z.string()).optional(),
});

export type Measurement = z.infer<typeof MeasurementDocumentSchema> & { id?: string };
