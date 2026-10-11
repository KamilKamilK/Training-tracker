import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ErrorToast, ToastRegion } from './Toasts.js';

describe('ErrorToast', () => {
  it('stacks errors from anywhere in the page in the toast corner until closed', async () => {
    const onDismiss = vi.fn();
    render(
      <ToastRegion>
        <section data-testid="tab">
          <ErrorToast message="Nie udało się wczytać planu." onDismiss={onDismiss} />
          <ErrorToast message="Nie udało się wczytać pomiarów." onDismiss={vi.fn()} />
        </section>
      </ToastRegion>,
    );

    const alerts = screen.getAllByRole('alert');
    expect(alerts.map(alert => alert.textContent)).toEqual(['Nie udało się wczytać planu.', 'Nie udało się wczytać pomiarów.']);
    expect(screen.getByTestId('tab').contains(alerts[0])).toBe(false);

    await userEvent.setup().click(screen.getAllByRole('button', { name: 'Zamknij' })[0]);
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
