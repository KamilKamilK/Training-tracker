import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConsentScreen } from './ConsentScreen.js';

describe('ConsentScreen', () => {
  it('activates the account only with a name and the checked consent', async () => {
    const onActivate = vi.fn().mockResolvedValue(true);
    render(<ConsentScreen defaultName="" error={null} onDismissError={vi.fn()} onActivate={onActivate} onSignOut={vi.fn()} />);
    const user = userEvent.setup();

    const checkbox = screen.getByRole('checkbox');
    expect((checkbox as HTMLInputElement).checked).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Aktywuj konto' }));
    expect(onActivate).not.toHaveBeenCalled();
    expect(screen.getByText('Podaj imię.')).toBeTruthy();
    expect(screen.getByText(/bez niej konto pozostaje nieaktywne/)).toBeTruthy();

    await user.type(screen.getByLabelText('Imię'), '  Anna ');
    await user.click(checkbox);
    await user.click(screen.getByRole('button', { name: 'Aktywuj konto' }));
    expect(onActivate).toHaveBeenCalledWith('Anna');
  });
});
