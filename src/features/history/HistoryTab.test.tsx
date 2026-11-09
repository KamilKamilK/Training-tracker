import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { HistoryTab } from './HistoryTab.js';
import { Workout } from '../../types/index.js';

const workout: Workout = {
  id: 'saved', type: 'Trening A', date: '2026-10-01T10:00:00.000Z', notes: 'Notatka',
  duration: 45, completed: true,
  exercises: [{ name: 'Przysiad', notes: 'Uwagi', sets: [{ weight: '80', reps: '8', rir: '2' }] }],
};

const props = () => ({
  workouts: [structuredClone(workout)], onSave: vi.fn().mockResolvedValue(true),
  onDelete: vi.fn().mockResolvedValue(true), error: null, onDismissError: vi.fn(),
});

describe('HistoryTab corrections', () => {
  it('opens workout details as a named dialog and returns focus after closing', async () => {
    const user = userEvent.setup();
    render(<HistoryTab {...props()} />);
    const preview = screen.getByRole('button', { name: 'Podgląd' });
    await user.click(preview);
    const dialog = screen.getByRole('dialog', { name: workout.type });
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(screen.getByText('80 kg × 8 powt.')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Zamknij' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(preview);
  });

  it('edits sets and notes under the same id while preserving date and metadata', async () => {
    const callbacks = props();
    const user = userEvent.setup();
    render(<HistoryTab {...callbacks} />);
    await user.click(screen.getByRole('button', { name: /Edytuj trening/ }));
    const weight = screen.getByPlaceholderText('kg');
    await user.clear(weight);
    await user.type(weight, '85');
    await user.clear(screen.getByLabelText('Notatki treningu'));
    await user.type(screen.getByLabelText('Notatki treningu'), 'Korekta');
    await user.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));
    expect(callbacks.onSave).toHaveBeenCalledWith({
      ...workout, notes: 'Korekta',
      exercises: [{ ...workout.exercises[0], sets: [{ weight: '85', reps: '8', rir: '2' }] }],
    });
    expect(callbacks.workouts[0]).toEqual(workout);
    expect(screen.queryByLabelText('Notatki treningu')).toBeNull();
  });

  it('cancels edits without saving or mutating the original workout', async () => {
    const callbacks = props();
    const user = userEvent.setup();
    render(<HistoryTab {...callbacks} />);
    await user.click(screen.getByRole('button', { name: /Edytuj trening/ }));
    await user.type(screen.getByPlaceholderText('kg'), '5');
    await user.click(screen.getByRole('button', { name: 'Anuluj' }));
    expect(callbacks.onSave).not.toHaveBeenCalled();
    expect(callbacks.workouts[0]).toEqual(workout);
  });

  it('adds and removes sets without modifying other exercises or optional exercise notes', async () => {
    const callbacks = props();
    callbacks.workouts[0].exercises = [...callbacks.workouts[0].exercises, { name: 'Wiosłowanie', sets: [] }];
    const user = userEvent.setup();
    render(<HistoryTab {...callbacks} />);
    await user.click(screen.getByRole('button', { name: /Edytuj trening/ }));
    await user.click(screen.getAllByRole('button', { name: 'Dodaj serię' })[0]);
    await user.type(screen.getByLabelText('Ciężar (kg), seria 2, Przysiad'), '90');
    await user.click(screen.getByRole('button', { name: 'Usuń serię 1, Przysiad' }));
    await user.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));
    expect(callbacks.onSave).toHaveBeenCalledWith({
      ...workout,
      exercises: [
        { ...workout.exercises[0], sets: [{ weight: '90', reps: '', rir: '' }] },
        { name: 'Wiosłowanie', sets: [] },
      ],
    });
  });

  it('blocks repeat saves and closing the editor until the server responds', async () => {
    const callbacks = props();
    callbacks.onSave.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    render(<HistoryTab {...callbacks} />);
    await user.click(screen.getByRole('button', { name: /Edytuj trening/ }));
    await user.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));
    await user.click(screen.getByRole('button', { name: 'Zapisywanie...' }));
    await user.click(screen.getByRole('button', { name: 'Anuluj' }));
    expect(callbacks.onSave).toHaveBeenCalledOnce();
    expect(screen.getByLabelText('Notatki treningu').closest('fieldset')?.disabled).toBe(true);
  });

  it('keeps corrections after a failed save and supports retry', async () => {
    const callbacks = props();
    callbacks.onSave.mockResolvedValueOnce(false);
    const user = userEvent.setup();
    render(<HistoryTab {...callbacks} />);
    await user.click(screen.getByRole('button', { name: /Edytuj trening/ }));
    await user.type(screen.getByLabelText('Notatki treningu'), ' korekta');
    await user.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));
    expect(screen.getByLabelText<HTMLTextAreaElement>('Notatki treningu').value).toBe('Notatka korekta');
    await user.click(screen.getByRole('button', { name: 'Zapisz zmiany' }));
    expect(callbacks.onSave).toHaveBeenCalledTimes(2);
    expect(screen.queryByLabelText('Notatki treningu')).toBeNull();
  });

  it('requires confirmation for deletion and keeps the dialog after failure', async () => {
    const callbacks = props();
    callbacks.onDelete.mockResolvedValueOnce(false);
    const user = userEvent.setup();
    render(<HistoryTab {...callbacks} />);
    await user.click(screen.getByRole('button', { name: /Usuń trening/ }));
    await user.click(screen.getByRole('button', { name: 'Anuluj' }));
    expect(callbacks.onDelete).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /Usuń trening/ }));
    await user.click(screen.getByRole('button', { name: 'Usuń' }));
    expect(callbacks.onDelete).toHaveBeenCalledWith('saved');
    expect(screen.getByText('Usunąć trening?')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Usuń' }));
    expect(screen.queryByText('Usunąć trening?')).toBeNull();
  });

  it('keeps the deletion dialog while the subscription temporarily removes the pending document', async () => {
    const callbacks = props();
    callbacks.onDelete.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    const { rerender } = render(<HistoryTab {...callbacks} />);
    await user.click(screen.getByRole('button', { name: /Usuń trening/ }));
    await user.click(screen.getByRole('button', { name: 'Usuń' }));
    rerender(<HistoryTab {...callbacks} workouts={[]} />);
    await user.click(screen.getByRole('button', { name: 'Usuwanie...' }));
    await user.click(screen.getByRole('button', { name: 'Anuluj' }));
    expect(callbacks.onDelete).toHaveBeenCalledOnce();
    expect(screen.getByText('Usunąć trening?')).toBeTruthy();
  });
});
