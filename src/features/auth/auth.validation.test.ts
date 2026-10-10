import { describe, expect, it } from 'vitest';
import { validateRegister, validateReset, validateSignIn } from './auth.validation.js';

const valid = { email: ' anna@example.com ', password: 'Silne1haslo', confirmPassword: 'Silne1haslo' };

describe('validateRegister', () => {
  it('accepts a valid form and trims the e-mail', () => {
    expect(validateRegister(valid)).toEqual({ data: { ...valid, email: 'anna@example.com' } });
  });

  it.each([
    ['too short', 'Ab1'],
    ['no digit', 'Silnehaslo'],
    ['no upper-case letter', 'silne1haslo'],
    ['no lower-case letter', 'SILNE1HASLO'],
  ])('rejects a password with %s', (_, password) => {
    expect(validateRegister({ ...valid, password, confirmPassword: password })).toEqual({
      errors: { password: expect.stringContaining('Co najmniej 8 znaków') },
    });
  });

  it('rejects different passwords and an invalid e-mail', () => {
    expect(validateRegister({ email: 'anna@', password: valid.password, confirmPassword: 'Inne1haslo' })).toEqual({
      errors: { email: 'Podaj poprawny adres e-mail.', confirmPassword: 'Hasła nie są takie same.' },
    });
  });
});

describe('validateSignIn and validateReset', () => {
  it('require the fields without applying the password policy to sign-in', () => {
    expect(validateSignIn({ email: '', password: '' })).toEqual({
      errors: { email: 'Podaj adres e-mail.', password: 'Podaj hasło.' },
    });
    expect(validateSignIn({ email: 'anna@example.com', password: 'old' })).toHaveProperty('data');
    expect(validateReset({ email: 'x' })).toEqual({ errors: { email: 'Podaj poprawny adres e-mail.' } });
  });
});
