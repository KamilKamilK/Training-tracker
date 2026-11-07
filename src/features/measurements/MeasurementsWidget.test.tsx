import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MeasurementsWidget } from './MeasurementsWidget.js';

describe('MeasurementsWidget', () => {
  it('exposes corrections for older measurements as well as the latest five', async () => {
    const measurements = Array.from({ length: 6 }, (_, i) => ({
      id: String(i), date: `2026-10-0${i + 1}`, weight: 80 + i, waist: 90,
    }));
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(<MeasurementsWidget measurements={measurements} onAdd={vi.fn()} onEdit={onEdit} onDelete={onDelete} />);
    expect(screen.getAllByRole('button', { name: /Edytuj pomiar/ })).toHaveLength(5);
    await user.click(screen.getByRole('button', { name: 'Pokaż wszystkie pomiary' }));
    await user.click(screen.getAllByRole('button', { name: /Edytuj pomiar/ })[5]);
    expect(onEdit).toHaveBeenCalledWith(measurements[0]);
    await user.click(screen.getAllByRole('button', { name: /Usuń pomiar/ })[5]);
    expect(onDelete).toHaveBeenCalledWith(measurements[0]);
  });
});
