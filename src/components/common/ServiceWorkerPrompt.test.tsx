import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceWorkerPrompt } from './ServiceWorkerPrompt.js';

const sw = vi.hoisted(() => ({
  offlineReady: false,
  needRefresh: false,
  setOfflineReady: vi.fn(),
  setNeedRefresh: vi.fn(),
  updateServiceWorker: vi.fn(),
}));

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    offlineReady: [sw.offlineReady, sw.setOfflineReady],
    needRefresh: [sw.needRefresh, sw.setNeedRefresh],
    updateServiceWorker: sw.updateServiceWorker,
  }),
}));

describe('ServiceWorkerPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sw.offlineReady = false;
    sw.needRefresh = false;
    sw.updateServiceWorker.mockResolvedValue(undefined);
  });

  it('does not show a notification before the worker is ready', () => {
    render(<ServiceWorkerPrompt />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('announces offline readiness without offering an update', async () => {
    sw.offlineReady = true;
    render(<ServiceWorkerPrompt />);
    expect(screen.getByRole('status').textContent).toContain('gotowe do pracy bez sieci');
    expect(screen.queryByRole('button', { name: 'Odśwież' })).toBeNull();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Zamknij' }));
    expect(sw.setOfflineReady).toHaveBeenCalledWith(false);
  });

  it('leaves the new version waiting when the user chooses later', async () => {
    sw.needRefresh = true;
    render(<ServiceWorkerPrompt />);
    expect(screen.getByRole('status').textContent).toContain('Dostępna nowa wersja');
    expect(sw.updateServiceWorker).not.toHaveBeenCalled();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Później' }));
    expect(sw.setNeedRefresh).toHaveBeenCalledWith(false);
    expect(sw.updateServiceWorker).not.toHaveBeenCalled();
  });

  it('activates the update only after confirmation and reports a failed update', async () => {
    sw.needRefresh = true;
    sw.updateServiceWorker.mockRejectedValue(new Error('test failure'));
    render(<ServiceWorkerPrompt />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Odśwież' }));
    expect(sw.updateServiceWorker).toHaveBeenCalledWith(true);
    expect(screen.getByRole('alert').textContent).toContain('Nie udało się włączyć nowej wersji');
    expect(screen.getByRole('alert').textContent).not.toContain('test failure');
  });
});
