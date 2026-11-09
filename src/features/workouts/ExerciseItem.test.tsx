import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ExerciseItem } from './ExerciseItem.js';

const exercise = {
  name: 'Wyciskanie sztangi',
  sets: [
    { weight: '80', reps: '8', rir: '2' },
    { weight: '', reps: '', rir: '' },
  ],
};

const renderItem = () => {
  const onUpdateSet = vi.fn();
  const onRemoveSet = vi.fn();
  render(
    <ExerciseItem exercise={exercise} exerciseIndex={0} onAddSet={vi.fn()} onUpdateSet={onUpdateSet} onRemoveSet={onRemoveSet} />,
  );
  return { onUpdateSet, onRemoveSet };
};

describe('ExerciseItem sets', () => {
  it('labels every set field with its set number and exercise and opens a numeric keyboard', () => {
    renderItem();

    const weight = screen.getByRole('textbox', { name: 'Ciężar (kg), seria 1, Wyciskanie sztangi' });
    const reps = screen.getByRole('textbox', { name: 'Powtórzenia, seria 1, Wyciskanie sztangi' });
    const rir = screen.getByRole('textbox', { name: 'RIR, seria 1, Wyciskanie sztangi' });

    expect(weight).toHaveProperty('value', '80');
    expect(weight.getAttribute('inputmode')).toBe('decimal');
    expect(reps.getAttribute('inputmode')).toBe('numeric');
    expect(rir.getAttribute('inputmode')).toBe('decimal');
    expect(screen.getByRole('textbox', { name: 'Ciężar (kg), seria 2, Wyciskanie sztangi' })).toHaveProperty('value', '');
  });

  it('updates the field of the labelled set', async () => {
    const user = userEvent.setup();
    const { onUpdateSet } = renderItem();

    await user.type(screen.getByRole('textbox', { name: 'Powtórzenia, seria 2, Wyciskanie sztangi' }), '9');

    expect(onUpdateSet).toHaveBeenCalledWith(1, 'reps', '9');
  });

  it('removes the set named by the remove button', async () => {
    const user = userEvent.setup();
    const { onRemoveSet } = renderItem();

    await user.click(screen.getByRole('button', { name: 'Usuń serię 2, Wyciskanie sztangi' }));

    expect(onRemoveSet).toHaveBeenCalledWith(1);
  });
});
