import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TemplatesTab } from './TemplatesTab.js';

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
});
