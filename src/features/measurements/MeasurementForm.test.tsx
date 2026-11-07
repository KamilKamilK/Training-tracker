import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MeasurementForm } from './MeasurementForm.js';

const fill = async (weight: string, waist: string) => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Waga (kg)'), weight);
  await user.type(screen.getByLabelText('Obwód talii (cm)'), waist);
  await user.click(screen.getByRole('button', { name: /Zapisz pomiar/ }));
};

describe('MeasurementForm', () => {
  it('shows field errors and does not submit invalid values', async () => {
    const onSubmit = vi.fn();
    render(<MeasurementForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    await fill('20', 'abc');

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Waga musi mieścić się/)).toBeTruthy();
    expect(screen.getByText(/Obwód talii musi mieścić się/)).toBeTruthy();
  });

  it('submits a valid measurement and closes after a successful save', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const onCancel = vi.fn();
    render(<MeasurementForm onSubmit={onSubmit} onCancel={onCancel} />);

    await fill('82,5', '90');

    expect(onSubmit).toHaveBeenCalledWith({ id: expect.any(String), date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), weight: 82.5, waist: 90 });
    expect(onCancel).toHaveBeenCalled();
  });

  it('stays open when saving fails', async () => {
    const onCancel = vi.fn();
    render(<MeasurementForm onSubmit={vi.fn().mockResolvedValue(false)} onCancel={onCancel} />);

    await fill('82', '90');

    expect(onCancel).not.toHaveBeenCalled();
  });

  it('prefills a saved measurement and preserves its id and optional data when correcting it', async () => {
    const measurement = { id: 'old-id', date: '2026-10-01', weight: 82, waist: 90, bodyFat: 20, photos: ['photo'] };
    const onSubmit = vi.fn().mockResolvedValue(true);
    const user = userEvent.setup();
    render(<MeasurementForm initialMeasurement={measurement} onSubmit={onSubmit} onCancel={vi.fn()} />);
    expect(screen.getByLabelText<HTMLInputElement>('Data pomiaru').value).toBe('2026-10-01');
    await user.clear(screen.getByLabelText('Waga (kg)'));
    await user.type(screen.getByLabelText('Waga (kg)'), '81,5');
    await user.click(screen.getByRole('button', { name: 'Zapisz pomiar' }));
    expect(onSubmit).toHaveBeenCalledWith({ ...measurement, weight: 81.5 });
    expect(measurement.weight).toBe(82);
  });

  it('reuses the id on retry and blocks a second submission while saving', async () => {
    const onSubmit = vi.fn().mockResolvedValueOnce(false).mockImplementationOnce(() => new Promise(() => {}));
    const user = userEvent.setup();
    render(<MeasurementForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    await fill('82', '90');
    await user.click(screen.getByRole('button', { name: 'Zapisz pomiar' }));
    expect(onSubmit.mock.calls[0][0].id).toBe(onSubmit.mock.calls[1][0].id);
    await user.click(screen.getByRole('button', { name: 'Zapisywanie...' }));
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });
});
