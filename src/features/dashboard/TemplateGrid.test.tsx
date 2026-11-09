import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { WorkoutTemplate } from '../../types/index.js';
import { TemplateGrid } from './TemplateGrid.js';

const template = (id: string, name: string): WorkoutTemplate => ({
  id,
  name,
  description: `Opis ${name}`,
  exercises: ['Przysiad', 'Wiosłowanie'],
  category: 'strength',
  estimatedDuration: 60,
  difficulty: 'intermediate',
  color: 'bg-blue-600',
  icon: '🏋️',
});

const templates = [template('a', 'Trening A'), template('b', 'Trening B')];

describe('TemplateGrid', () => {
  it('shows each template as a button named by the template and described by its details', () => {
    render(<TemplateGrid templates={templates} workouts={[]} onStart={vi.fn()} />);

    const card = screen.getByRole('button', { name: 'Trening A' });
    expect(card).toHaveProperty('type', 'button');
    expect(card.getAttribute('aria-describedby')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Trening A', description: /Opis Trening A.*60 min.*2 ćw\./ })).toBe(card);
  });

  it.each(['{Enter}', ' '])('starts the focused template from the keyboard with %s', async key => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<TemplateGrid templates={templates} workouts={[]} onStart={onStart} />);

    await user.tab();
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Trening B' }));
    await user.keyboard(key);

    expect(onStart).toHaveBeenCalledOnce();
    expect(onStart).toHaveBeenCalledWith(templates[1]);
  });
});
