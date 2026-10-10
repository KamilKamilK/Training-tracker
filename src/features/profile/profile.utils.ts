import { HEALTH_CONSENT } from '../../constants/consent.js';
import { UserProfile } from '../../types/index.js';

/** An account is active once the current version of the health consent is accepted (ADR-0015). */
export const isActive = (profile: UserProfile): boolean =>
  profile.consents.health.accepted && profile.consents.health.version === HEALTH_CONSENT.version;
