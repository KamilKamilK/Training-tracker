import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ExerciseVideoButton } from './ExerciseVideoButton.js';
import { ExerciseVideosContext } from './exerciseVideos.context.js';
import type { ExerciseVideosState } from './useExerciseVideos.js';
import { ExerciseVideo } from '../../types/index.js';
import { buildMp4 } from '../../test/mp4.js';

const video: ExerciseVideo = {
  id: 'a'.repeat(64),
  exerciseName: 'Przysiad',
  mediaId: '11111111-1111-4111-8111-111111111111',
  sizeBytes: 1000,
  durationSec: 12,
  uploadedAt: '2026-11-19T10:00:00.000Z',
};
const playbackUrl = 'https://storage.example/v.mp4?token=t';

const renderButton = (overrides: Partial<ExerciseVideosState>) => {
  const state: ExerciseVideosState = {
    videos: new Map(),
    canManage: false,
    loadError: null,
    clearLoadError: vi.fn(),
    error: null,
    clearError: vi.fn(),
    uploadVideo: vi.fn().mockResolvedValue(true),
    deleteVideo: vi.fn().mockResolvedValue(true),
    removeOrphanedFiles: vi.fn().mockResolvedValue(2),
    getPlaybackUrl: vi.fn().mockResolvedValue(playbackUrl),
    ...overrides,
  };
  render(
    <ExerciseVideosContext value={state}>
      <ExerciseVideoButton exerciseName="Przysiad" />
    </ExerciseVideosContext>,
  );
  return state;
};

describe('ExerciseVideoButton', () => {
  it('is hidden from other accounts when the exercise has no video', () => {
    renderButton({ canManage: false });
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('plays the video for an account without upload rights and offers no upload', async () => {
    const state = renderButton({ videos: new Map([['Przysiad', video]]) });
    await userEvent.click(screen.getByRole('button', { name: 'Technika: Przysiad' }));

    const dialog = screen.getByRole('dialog', { name: 'Technika: Przysiad' });
    const player = await within(dialog).findByLabelText('Film techniki: Przysiad');
    expect(player.getAttribute('src')).toBe(playbackUrl);
    expect(state.getPlaybackUrl).toHaveBeenCalledWith(video.mediaId);
    expect(within(dialog).queryByLabelText(/Plik MP4/)).toBeNull();
    expect(within(dialog).queryByRole('button', { name: 'Usuń film' })).toBeNull();
    expect(within(dialog).queryByRole('button', { name: 'Usuń pliki bez filmu' })).toBeNull();
  });

  it('lets the admin remove the files left without a video and shows how many were removed', async () => {
    const user = userEvent.setup();
    const state = renderButton({ canManage: true, videos: new Map([['Przysiad', video]]) });
    await user.click(screen.getByRole('button', { name: 'Technika: Przysiad' }));
    const dialog = screen.getByRole('dialog', { name: 'Technika: Przysiad' });

    await user.click(within(dialog).getByRole('button', { name: 'Usuń pliki bez filmu' }));

    expect(state.removeOrphanedFiles).toHaveBeenCalledOnce();
    expect((await within(dialog).findByRole('status')).textContent).toBe('Usunięte pliki bez filmu: 2.');
    expect(state.deleteVideo).not.toHaveBeenCalled();
  });

  it('lets the admin add a video to an exercise without one', async () => {
    const user = userEvent.setup();
    const state = renderButton({ canManage: true });
    await user.click(screen.getByRole('button', { name: 'Dodaj film techniki: Przysiad' }));

    const dialog = screen.getByRole('dialog', { name: 'Technika: Przysiad' });
    expect(within(dialog).getByText('To ćwiczenie nie ma jeszcze filmu.')).toBeTruthy();
    const upload = within(dialog).getByRole('button', { name: 'Wgraj film' });
    expect((upload as HTMLButtonElement).disabled).toBe(true);
    const file = new File([buildMp4()], 'przysiad.mp4', { type: 'video/mp4' });
    await user.upload(within(dialog).getByLabelText(/Plik MP4/), file);
    await user.click(upload);

    await waitFor(() => expect(state.uploadVideo).toHaveBeenCalledWith('Przysiad', file));
    expect(state.getPlaybackUrl).not.toHaveBeenCalled();
  });

  it('asks the admin to confirm before deleting the video', async () => {
    const user = userEvent.setup();
    const state = renderButton({ canManage: true, videos: new Map([['Przysiad', video]]) });
    await user.click(screen.getByRole('button', { name: 'Technika: Przysiad' }));
    await user.click(within(screen.getByRole('dialog', { name: 'Technika: Przysiad' })).getByRole('button', { name: 'Usuń film' }));

    const confirm = screen.getByRole('dialog', { name: 'Usunąć film?' });
    await user.click(within(confirm).getByRole('button', { name: 'Usuń film' }));
    await waitFor(() => expect(state.deleteVideo).toHaveBeenCalledWith(video));
  });

  it('shows the error from the context in the player', async () => {
    renderButton({ videos: new Map([['Przysiad', video]]), error: 'Nie udało się odtworzyć filmu.', getPlaybackUrl: vi.fn().mockResolvedValue(null) });
    await userEvent.click(screen.getByRole('button', { name: 'Technika: Przysiad' }));
    expect(within(screen.getByRole('dialog', { name: 'Technika: Przysiad' })).getByRole('alert').textContent).toContain('Nie udało się odtworzyć filmu.');
  });
});
