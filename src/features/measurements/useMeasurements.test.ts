import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMeasurements } from './useMeasurements.js';
import { MeasurementsService } from './measurements.service.js';
import { ERROR_MESSAGES } from '../../constants/messages.js';
import { Measurement } from '../../types/index.js';

vi.mock('./measurements.service.js', () => ({
  MeasurementsService: { subscribe: vi.fn(), save: vi.fn(), delete: vi.fn() },
}));

const service = vi.mocked(MeasurementsService);
const measurement = { id: 'm1', date: '2026-10-01', weight: 82, waist: 90 };
let emit: (data: Measurement[]) => void;
const unsubscribe = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  service.subscribe.mockImplementation((_uid, onChange) => { emit = onChange; return unsubscribe; });
});

describe('useMeasurements', () => {
  it('saves corrections with the same id and takes changes only from the subscription', async () => {
    const { result, unmount } = renderHook(() => useMeasurements('u1'));
    act(() => emit([measurement]));
    const corrected = { ...measurement, weight: 81 };
    await act(async () => { expect(await result.current.saveMeasurement(corrected)).toBe(true); });
    expect(service.save).toHaveBeenCalledWith('u1', corrected);
    expect(result.current.measurements).toEqual([measurement]);
    act(() => emit([corrected]));
    expect(result.current.measurements).toEqual([corrected]);
    await act(async () => { expect(await result.current.deleteMeasurement('m1')).toBe(true); });
    expect(service.delete).toHaveBeenCalledWith('u1', 'm1');
    expect(result.current.measurements).toEqual([corrected]);
    act(() => emit([]));
    expect(result.current.measurements).toEqual([]);
    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('reports write errors without losing the loaded data and clears errors on retry', async () => {
    const { result } = renderHook(() => useMeasurements('u1'));
    act(() => emit([measurement]));
    service.save.mockRejectedValueOnce(new Error('permission-denied'));
    await act(async () => { expect(await result.current.saveMeasurement(measurement)).toBe(false); });
    expect(result.current.error).toBe(ERROR_MESSAGES.saveMeasurement);
    service.delete.mockRejectedValueOnce(new Error('permission-denied'));
    await act(async () => { expect(await result.current.deleteMeasurement('m1')).toBe(false); });
    expect(result.current.error).toBe(ERROR_MESSAGES.deleteMeasurement);
    expect(result.current.measurements).toEqual([measurement]);
    await act(async () => { expect(await result.current.deleteMeasurement('m1')).toBe(true); });
    expect(result.current.error).toBeNull();
  });
});
