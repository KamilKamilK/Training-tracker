import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WorkoutForm } from './WorkoutForm.js';
import { Workout } from '../../types/index.js';

const workout: Workout = {
  id: 'w1', type: 'Trening A', date: '2026-11-09T17:00:00.000Z', notes: '', completed: false,
  exercises: [{ name: 'Przysiad', sets: [{ weight: '80', reps: '8', rir: '2' }] }],
};

const props = (overrides: Partial<React.ComponentProps<typeof WorkoutForm>> = {}) => ({
  workout, isFinishing: false, error: null, onDismissError: vi.fn(), onAddSet: vi.fn(), onUpdateSet: vi.fn(),
  onRemoveSet: vi.fn(), onUpdateNotes: vi.fn(), onAbandonWorkout: vi.fn(), onFinishWorkout: vi.fn(),
  ...overrides,
});

describe('WorkoutForm', () => {
  it('passes typed notes on', async () => {
    const callbacks = props();
    const user = userEvent.setup();
    render(<WorkoutForm {...callbacks} />);
    await user.type(screen.getByLabelText('Notatki treningu'), 'x');
    expect(callbacks.onUpdateNotes).toHaveBeenCalledWith('x');
  });

  it('abandons the workout only after confirmation', async () => {
    const callbacks = props();
    const user = userEvent.setup();
    render(<WorkoutForm {...callbacks} />);

    await user.click(screen.getByRole('button', { name: 'Porzuć trening' }));
    expect(screen.getByRole('dialog', { name: 'Porzucić trening?' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Wróć do treningu' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(callbacks.onAbandonWorkout).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Porzuć trening' }));
    const dialog = screen.getByRole('dialog', { name: 'Porzucić trening?' });
    await user.click(within(dialog).getByRole('button', { name: 'Porzuć trening' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(callbacks.onAbandonWorkout).toHaveBeenCalledTimes(1);
  });

  it('cannot be abandoned while the workout is being saved', () => {
    render(<WorkoutForm {...props({ isFinishing: true })} />);
    expect(screen.getByRole('button', { name: 'Porzuć trening' })).toHaveProperty('disabled', true);
  });
});
