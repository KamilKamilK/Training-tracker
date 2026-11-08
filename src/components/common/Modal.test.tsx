import { StrictMode, useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal.js';

function Example() {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState('');

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Otwórz pomiar</button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Nowy pomiar">
        <label>Waga<input value={value} onChange={event => setValue(event.target.value)} /></label>
        <button onClick={() => setIsOpen(false)}>Anuluj</button>
      </Modal>
    </>
  );
}

describe('Modal', () => {
  it('does not render a closed dialog', () => {
    render(<Modal isOpen={false} onClose={vi.fn()} title="Nowy pomiar">Treść</Modal>);
    expect(screen.queryByRole('dialog', { hidden: true })).toBeNull();
  });

  it('names the modal dialog with its heading and moves focus inside', async () => {
    render(<Example />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Otwórz pomiar' }));

    const dialog = screen.getByRole('dialog', { name: 'Nowy pomiar' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe(within(dialog).getByRole('heading', { name: 'Nowy pomiar' }).id);
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(within(dialog).getByRole('button', { name: 'Zamknij' })).toBeTruthy();
  });

  it.each(['Zamknij', 'Anuluj', 'Escape'])('closes with %s and restores focus to the opener', async action => {
    const user = userEvent.setup();
    render(<Example />);
    const opener = screen.getByRole('button', { name: 'Otwórz pomiar' });
    await user.click(opener);
    const dialog = screen.getByRole('dialog', { name: 'Nowy pomiar' });

    if (action === 'Escape') {
      // Browsers translate Escape into a cancel event; jsdom does not implement this default action.
      expect(fireEvent(dialog, new Event('cancel', { cancelable: true }))).toBe(false);
    } else {
      await user.click(within(dialog).getByRole('button', { name: action }));
    }

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
    await user.click(opener);
    expect(screen.getByRole('dialog', { name: 'Nowy pomiar' }).contains(document.activeElement)).toBe(true);
  });

  it('keeps focus in the form when rerendered with a new close callback', async () => {
    const user = userEvent.setup();
    render(<StrictMode><Example /></StrictMode>);
    await user.click(screen.getByRole('button', { name: 'Otwórz pomiar' }));
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Waga' });
    await user.type(input, '82');
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('82');
  });

  it('leaves the dialog open when the parent rejects closing', () => {
    const onClose = vi.fn();
    render(<Modal isOpen onClose={onClose} title="Zapisywanie">Treść</Modal>);
    const dialog = screen.getByRole('dialog', { name: 'Zapisywanie' });
    expect(fireEvent(dialog, new Event('cancel', { cancelable: true }))).toBe(false);
    expect(onClose).toHaveBeenCalledOnce();
    expect(dialog.getAttribute('open')).not.toBeNull();
  });

  it('restores focus when an open modal is unmounted', () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const { unmount } = render(<StrictMode><Modal isOpen onClose={vi.fn()} title="Pomiar">Treść</Modal></StrictMode>);
    expect(screen.getByRole('dialog', { name: 'Pomiar' }).contains(document.activeElement)).toBe(true);
    unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});
