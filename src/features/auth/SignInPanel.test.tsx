import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SignInPanel } from './SignInPanel.js';

const setup = () => {
  const handlers = {
    onGoogle: vi.fn(),
    onSignIn: vi.fn().mockResolvedValue(true),
    onRegister: vi.fn().mockResolvedValue(true),
    onReset: vi.fn().mockResolvedValue(true),
  };
  render(<SignInPanel {...handlers} />);
  return { user: userEvent.setup(), ...handlers };
};

describe('SignInPanel', () => {
  it('registers only with a valid e-mail and matching passwords that meet the policy', async () => {
    const { user, onRegister } = setup();
    await user.click(screen.getByRole('tab', { name: /Zarejestruj/ }));
    await user.type(screen.getByLabelText('E-mail'), 'anna@example.com');
    await user.type(screen.getByLabelText('Hasło'), 'slabe');
    await user.type(screen.getByLabelText('Powtórz hasło'), 'inne');
    await user.click(screen.getByRole('button', { name: 'Załóż konto' }));

    expect(onRegister).not.toHaveBeenCalled();
    expect(screen.getByText(/Co najmniej 8 znaków/)).toBeTruthy();
    expect(screen.getByText('Hasła nie są takie same.')).toBeTruthy();

    await user.clear(screen.getByLabelText('Hasło'));
    await user.type(screen.getByLabelText('Hasło'), 'Silne1haslo');
    await user.clear(screen.getByLabelText('Powtórz hasło'));
    await user.type(screen.getByLabelText('Powtórz hasło'), 'Silne1haslo');
    await user.click(screen.getByRole('button', { name: 'Załóż konto' }));
    expect(onRegister).toHaveBeenCalledWith('anna@example.com', 'Silne1haslo');
  });

  it('signs in with e-mail and password', async () => {
    const { user, onSignIn } = setup();
    await user.type(screen.getByLabelText('E-mail'), 'anna@example.com');
    await user.type(screen.getByLabelText('Hasło'), 'Silne1haslo');
    await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));
    expect(onSignIn).toHaveBeenCalledWith('anna@example.com', 'Silne1haslo');
  });

  it('shows and hides the password', async () => {
    const { user } = setup();
    const password = screen.getByLabelText('Hasło');
    expect(password.getAttribute('type')).toBe('password');
    await user.click(screen.getByRole('button', { name: 'Pokaż hasło' }));
    expect(password.getAttribute('type')).toBe('text');
  });

  it('sends a password reset link and returns to sign-in', async () => {
    const { user, onReset } = setup();
    await user.click(screen.getByRole('button', { name: 'Nie pamiętasz hasła?' }));
    await user.type(screen.getByLabelText('E-mail'), 'anna@example.com');
    await user.click(screen.getByRole('button', { name: 'Wyślij link' }));
    expect(onReset).toHaveBeenCalledWith('anna@example.com');
    expect(screen.getByRole('button', { name: 'Zaloguj się' })).toBeTruthy();
  });
});
