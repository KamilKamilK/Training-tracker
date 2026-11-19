import { describe, expect, it } from 'vitest';
import { HEALTH_CONSENT } from '../../constants/consent.js';
import { parseUserProfile } from '../../utils/parse.utils.js';
import { hasRole, isActive } from './profile.utils.js';

const document = (accepted: boolean, version: string = HEALTH_CONSENT.version) => ({
  displayName: 'Anna',
  consents: { health: { accepted, version, at: { seconds: 1_791_000_000, nanoseconds: 500_000_000 } } },
});

describe('parseUserProfile', () => {
  it('reads the consent time as a Date', () => {
    expect(parseUserProfile(document(true))?.consents.health.at).toEqual(new Date(1_791_000_000_500));
  });

  it('accepts roles set by the administrator', () => {
    expect(parseUserProfile({ ...document(true), roles: ['coach'] })?.roles).toEqual(['coach']);
  });

  it.each([
    ['no consent', { displayName: 'Anna', consents: {} }],
    ['an empty name', { ...document(true), displayName: '' }],
    ['consent time as text', { displayName: 'Anna', consents: { health: { accepted: true, version: 'v', at: '2026-10-10' } } }],
  ])('rejects a document with %s', (_, value) => {
    expect(parseUserProfile(value)).toBeNull();
  });
});

describe('isActive', () => {
  it('requires the accepted current version of the health consent', () => {
    const parse = (value: unknown) => {
      const profile = parseUserProfile(value);
      if (!profile) throw new Error('invalid test document');
      return profile;
    };
    expect(isActive(parse(document(true)))).toBe(true);
    expect(isActive(parse(document(false)))).toBe(false);
    expect(isActive(parse(document(true, '2020-01-01')))).toBe(false);
  });
});

describe('hasRole', () => {
  it('finds a role set by the administrator', () => {
    const parse = (value: unknown) => {
      const profile = parseUserProfile(value);
      if (!profile) throw new Error('invalid test document');
      return profile;
    };
    expect(hasRole(parse({ ...document(true), roles: ['coach', 'admin'] }), 'admin')).toBe(true);
    expect(hasRole(parse({ ...document(true), roles: ['coach'] }), 'admin')).toBe(false);
    expect(hasRole(parse(document(true)), 'admin')).toBe(false);
  });
});
