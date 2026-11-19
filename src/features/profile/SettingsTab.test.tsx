import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SettingsTab } from './SettingsTab.js';
import { ExerciseVideosContext } from '../exerciseVideos/exerciseVideos.context.js';
import type { ExerciseVideosState } from '../exerciseVideos/useExerciseVideos.js';
import { HEALTH_CONSENT } from '../../constants/consent.js';
import { UserProfile } from '../../types/index.js';

const profile = (roles?: string[]): UserProfile => ({
  displayName: 'Anna',
  consents: { health: { accepted: true, version: HEALTH_CONSENT.version, at: new Date('2026-11-01T10:00:00Z') } },
  roles,
});

const renderSettings = (roles: string[] | undefined, overrides: Partial<ExerciseVideosState> = {}) => {
  const videos: ExerciseVideosState = {
    videos: new Map(),
    canManage: roles?.includes('admin') ?? false,
    loadError: null,
    clearLoadError: vi.fn(),
    error: null,
    clearError: vi.fn(),
    uploadVideo: vi.fn(),
    deleteVideo: vi.fn(),
    removeUnusedFiles: vi.fn().mockResolvedValue(3),
    getPlaybackUrl: vi.fn(),
    ...overrides,
  };
  render(
    <ExerciseVideosContext value={videos}>
      <SettingsTab
        email="anna@example.com"
        profile={profile(roles)}
        error={null}
        onDismissError={vi.fn()}
        onUpdateDisplayName={vi.fn()}
        onWithdrawHealthConsent={vi.fn()}
      />
    </ExerciseVideosContext>,
  );
  return videos;
};

describe('SettingsTab', () => {
  it('shows no administration section to an account without the admin role', () => {
    renderSettings(['coach']);
    expect(screen.queryByRole('heading', { name: 'Administracja' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Usuń zbędne pliki' })).toBeNull();
  });

  it('lets the admin remove the unused video files after confirming and shows how many were removed', async () => {
    const user = userEvent.setup();
    const videos = renderSettings(['admin']);
    expect(screen.getByRole('heading', { name: 'Administracja' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Usuń zbędne pliki' }));
    const confirm = screen.getByRole('dialog', { name: 'Usunąć zbędne pliki?' });
    expect(videos.removeUnusedFiles).not.toHaveBeenCalled();
    await user.click(within(confirm).getByRole('button', { name: 'Usuń pliki' }));

    expect(videos.removeUnusedFiles).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByRole('status').textContent).toBe('Usunięte pliki: 3.');
  });

  it('removes nothing when the admin cancels', async () => {
    const user = userEvent.setup();
    const videos = renderSettings(['admin']);
    await user.click(screen.getByRole('button', { name: 'Usuń zbędne pliki' }));
    await user.click(within(screen.getByRole('dialog', { name: 'Usunąć zbędne pliki?' })).getByRole('button', { name: 'Anuluj' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(videos.removeUnusedFiles).not.toHaveBeenCalled();
  });

  it('keeps the confirmation open with the error when the removal fails', async () => {
    const user = userEvent.setup();
    renderSettings(['admin'], { removeUnusedFiles: vi.fn().mockResolvedValue(null), error: 'Nie udało się usunąć zbędnych plików.' });
    await user.click(screen.getByRole('button', { name: 'Usuń zbędne pliki' }));
    const confirm = screen.getByRole('dialog', { name: 'Usunąć zbędne pliki?' });
    await user.click(within(confirm).getByRole('button', { name: 'Usuń pliki' }));

    expect(within(confirm).getByRole('alert').textContent).toContain('Nie udało się usunąć zbędnych plików.');
    expect(screen.getByRole('status').textContent).toBe('');
  });
});
