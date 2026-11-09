import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TemplatesTab } from './TemplatesTab.js';
import type { WorkoutTemplate } from '../../types/index.js';

const renderTab = () => {
  const onAddTemplate = vi.fn();
  render(
    <TemplatesTab
      templates={[]}
      defaultTemplates={[]}
      customTemplates={[]}
      onAddTemplate={onAddTemplate}
      onUpdateTemplate={vi.fn()}
      onDeleteTemplate={vi.fn()}
      onDuplicateTemplate={vi.fn()}
    />,
  );
  return onAddTemplate;
};

describe('TemplatesTab form', () => {
  it('shows field errors instead of saving an invalid template', async () => {
    const user = userEvent.setup();
    const onAddTemplate = renderTab();

    await user.click(screen.getByRole('button', { name: /Nowy Szablon/ }));
    await user.type(screen.getByLabelText('Nazwa'), 'AB');
    await user.click(screen.getByRole('button', { name: /Dodaj ćwiczenie/ }));
    await user.click(screen.getByRole('button', { name: /Utwórz/ }));

    expect(onAddTemplate).not.toHaveBeenCalled();
    expect(screen.getByText(/Nazwa musi mieć od 3 do 50 znaków/)).toBeTruthy();
    expect(screen.getByText(/Szablon musi mieć od 1 do 20 ćwiczeń/)).toBeTruthy();
  });

  it('saves a valid template without empty exercise fields', async () => {
    const user = userEvent.setup();
    const onAddTemplate = renderTab();

    await user.click(screen.getByRole('button', { name: /Nowy Szablon/ }));
    await user.type(screen.getByLabelText('Nazwa'), ' Push A ');
    await user.click(screen.getByRole('button', { name: /Dodaj ćwiczenie/ }));
    await user.click(screen.getByRole('button', { name: /Dodaj ćwiczenie/ }));
    await user.type(screen.getByPlaceholderText('Ćwiczenie 1'), 'Przysiad');
    await user.click(screen.getByRole('button', { name: /Utwórz/ }));

    expect(onAddTemplate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Push A', exercises: ['Przysiad'] }));
  });

  it('picks the icon and the card colour from the lists', async () => {
    const user = userEvent.setup();
    const onAddTemplate = renderTab();

    await user.click(screen.getByRole('button', { name: /Nowy Szablon/ }));
    await user.type(screen.getByLabelText('Nazwa'), 'Basen');
    await user.click(screen.getByRole('button', { name: /Dodaj ćwiczenie/ }));
    await user.type(screen.getByPlaceholderText('Ćwiczenie 1'), 'Kraul');
    const icons = screen.getByRole('radiogroup', { name: 'Ikona' });
    const colors = screen.getByRole('radiogroup', { name: 'Kolor karty' });
    await user.click(within(icons).getByRole('radio', { name: '🏊' }));
    await user.click(within(colors).getByRole('radio', { name: 'Turkusowy' }));
    expect(within(colors).getByRole('radio', { name: 'Turkusowy' }).getAttribute('aria-checked')).toBe('true');
    await user.click(screen.getByRole('button', { name: /Utwórz/ }));

    expect(onAddTemplate).toHaveBeenCalledWith(expect.objectContaining({ icon: '🏊', color: 'bg-cyan-600' }));
  });
});

describe('TemplatesTab card actions', () => {
  it('names every action with its template and targets the selected template', async () => {
    const user = userEvent.setup();
    const customTemplates: WorkoutTemplate[] = ['Basen', 'Rower'].map((name, index) => ({
      id: `custom-${index}`,
      name,
      description: '',
      exercises: ['Rozgrzewka'],
      category: 'cardio',
      estimatedDuration: 30,
      difficulty: 'beginner',
      color: 'bg-blue-600',
      isCustom: true,
    }));
    const defaultTemplate = { ...customTemplates[0], id: 'default', name: 'Bieg', isCustom: false };
    const onUpdateTemplate = vi.fn();
    const onDeleteTemplate = vi.fn();
    const onDuplicateTemplate = vi.fn();
    render(
      <TemplatesTab
        templates={[...customTemplates, defaultTemplate]}
        customTemplates={customTemplates}
        defaultTemplates={[defaultTemplate]}
        onAddTemplate={vi.fn()}
        onUpdateTemplate={onUpdateTemplate}
        onDeleteTemplate={onDeleteTemplate}
        onDuplicateTemplate={onDuplicateTemplate}
      />,
    );

    for (const template of customTemplates) {
      const edit = screen.getByRole('button', { name: `Edytuj szablon ${template.name}` });
      const copy = screen.getByRole('button', { name: `Kopiuj szablon ${template.name}` });
      const remove = screen.getByRole('button', { name: `Usuń szablon ${template.name}` });
      for (const button of [edit, copy, remove]) {
        expect(button.getAttribute('type')).toBe('button');
      }

      await user.click(copy);
      expect(onDuplicateTemplate).toHaveBeenLastCalledWith(template.id);
      await user.click(remove);
      expect(onDeleteTemplate).toHaveBeenLastCalledWith(template.id);
      await user.click(edit);
      expect(screen.getByRole('textbox', { name: 'Nazwa' })).toBe(screen.getByDisplayValue(template.name));
      await user.click(screen.getByRole('button', { name: /Zapisz zmiany/ }));
      expect(onUpdateTemplate).toHaveBeenLastCalledWith(template);
    }

    const copyDefault = screen.getByRole('button', { name: 'Kopiuj szablon Bieg' });
    expect(copyDefault.getAttribute('type')).toBe('button');
    expect(screen.queryByRole('button', { name: 'Edytuj szablon Bieg' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Usuń szablon Bieg' })).toBeNull();
    await user.click(copyDefault);
    expect(onDuplicateTemplate).toHaveBeenLastCalledWith(defaultTemplate.id);
  });
});
