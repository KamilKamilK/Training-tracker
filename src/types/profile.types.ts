import { z } from 'zod';

/** Firestore Timestamp (or its REST form after the SDK maps it) read as a Date. */
const ServerTime = z
  .object({ seconds: z.number(), nanoseconds: z.number() })
  .transform(time => new Date(time.seconds * 1000 + Math.floor(time.nanoseconds / 1e6)));

const ConsentSchema = z.object({
  accepted: z.boolean(),
  /** Version of the consent text the user saw (HEALTH_CONSENT.version). */
  version: z.string().min(1),
  /** Server time of the decision. */
  at: ServerTime,
});

export const UserProfileDocumentSchema = z.object({
  displayName: z.string().min(1).max(60),
  consents: z.object({ health: ConsentSchema }),
});

export type UserProfile = z.infer<typeof UserProfileDocumentSchema>;
