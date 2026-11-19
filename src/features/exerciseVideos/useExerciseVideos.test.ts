import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useExerciseVideos } from './useExerciseVideos.js';
import { ExerciseVideosService } from './exerciseVideos.service.js';
import { VIDEO_FILE_MESSAGES } from './exerciseVideo.utils.js';
import { ERROR_MESSAGES } from '../../constants/messages.js';
import { ExerciseVideo } from '../../types/index.js';
import { buildMp4 } from '../../test/mp4.js';

vi.mock('./exerciseVideos.service.js', () => ({
  ExerciseVideosService: {
    subscribe: vi.fn(),
    uploadFile: vi.fn(),
    playbackUrl: vi.fn(),
    deleteFile: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    removeOrphanedFiles: vi.fn(),
  },
}));

const service = vi.mocked(ExerciseVideosService);
const video: ExerciseVideo = {
  id: 'a'.repeat(64),
  exerciseName: 'Przysiad',
  mediaId: '11111111-1111-4111-8111-111111111111',
  sizeBytes: 1000,
  durationSec: 12,
  uploadedAt: '2026-11-19T10:00:00.000Z',
};
const mp4 = (durationSec = 15) => new File([buildMp4({ durationSec })], 'przysiad.mp4', { type: 'video/mp4' });
let emit: (videos: ExerciseVideo[]) => void;
let fail: (error: unknown) => void;
const unsubscribe = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  service.subscribe.mockImplementation((onChange, onError) => {
    emit = onChange;
    fail = onError;
    return unsubscribe;
  });
  service.uploadFile.mockResolvedValue();
  service.save.mockResolvedValue();
  service.deleteFile.mockResolvedValue();
  service.delete.mockResolvedValue();
});

describe('useExerciseVideos', () => {
  it('maps videos by exercise name from the subscription and reports load errors', () => {
    const { result, unmount } = renderHook(() => useExerciseVideos(false));
    act(() => emit([video]));
    expect(result.current.videos.get('Przysiad')).toEqual(video);
    expect(result.current.canManage).toBe(false);
    act(() => fail(new Error('permission-denied')));
    expect(result.current.loadError).toBe(ERROR_MESSAGES.loadExerciseVideos);
    act(() => emit([]));
    expect(result.current.loadError).toBeNull();
    expect(result.current.videos.size).toBe(0);
    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('uploads the file before writing the document and then removes the replaced file', async () => {
    const order: string[] = [];
    service.uploadFile.mockImplementation(async () => { order.push('uploadFile'); });
    service.save.mockImplementation(async () => { order.push('save'); });
    service.deleteFile.mockImplementation(async () => { order.push('deleteFile'); });
    const { result } = renderHook(() => useExerciseVideos(true));
    act(() => emit([video]));

    await act(async () => { expect(await result.current.uploadVideo('Przysiad', mp4(15))).toBe(true); });

    expect(order).toEqual(['uploadFile', 'save', 'deleteFile']);
    const [mediaId] = service.uploadFile.mock.calls[0];
    expect(mediaId).not.toBe(video.mediaId);
    expect(service.save).toHaveBeenCalledWith(expect.objectContaining({ exerciseName: 'Przysiad', mediaId, durationSec: 15 }));
    expect(service.deleteFile).toHaveBeenCalledWith(video.mediaId);
    expect(result.current.error).toBeNull();
  });

  it('rejects an invalid file without contacting the server', async () => {
    const { result } = renderHook(() => useExerciseVideos(true));
    await act(async () => { expect(await result.current.uploadVideo('Przysiad', mp4(31))).toBe(false); });
    expect(result.current.error).toBe(VIDEO_FILE_MESSAGES.tooLong);
    expect(service.uploadFile).not.toHaveBeenCalled();
  });

  it('does not write the document when the file upload fails', async () => {
    service.uploadFile.mockRejectedValueOnce(new Error('403'));
    const { result } = renderHook(() => useExerciseVideos(true));
    await act(async () => { expect(await result.current.uploadVideo('Przysiad', mp4())).toBe(false); });
    expect(service.save).not.toHaveBeenCalled();
    expect(result.current.error).toBe(ERROR_MESSAGES.uploadExerciseVideo);
  });

  it('keeps the upload successful when only removing the replaced file fails', async () => {
    service.deleteFile.mockRejectedValueOnce(new Error('500'));
    const { result } = renderHook(() => useExerciseVideos(true));
    act(() => emit([video]));
    await act(async () => { expect(await result.current.uploadVideo('Przysiad', mp4())).toBe(true); });
    expect(result.current.error).toBe(ERROR_MESSAGES.removeReplacedExerciseVideo);
    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });

  it('deletes the file before the document and keeps the document when the file deletion fails', async () => {
    const { result } = renderHook(() => useExerciseVideos(true));
    service.deleteFile.mockRejectedValueOnce(new Error('500'));
    await act(async () => { expect(await result.current.deleteVideo(video)).toBe(false); });
    expect(service.delete).not.toHaveBeenCalled();
    expect(result.current.error).toBe(ERROR_MESSAGES.deleteExerciseVideo);

    await act(async () => { expect(await result.current.deleteVideo(video)).toBe(true); });
    expect(service.deleteFile).toHaveBeenLastCalledWith(video.mediaId);
    expect(service.delete).toHaveBeenCalledWith(video.id);
    expect(result.current.error).toBeNull();
  });

  it('returns the number of removed orphaned files or null with an error', async () => {
    service.removeOrphanedFiles.mockResolvedValueOnce(3);
    const { result } = renderHook(() => useExerciseVideos(true));
    await act(async () => { expect(await result.current.removeOrphanedFiles()).toBe(3); });
    expect(result.current.error).toBeNull();
    service.removeOrphanedFiles.mockRejectedValueOnce(new Error('429'));
    await act(async () => { expect(await result.current.removeOrphanedFiles()).toBeNull(); });
    expect(result.current.error).toBe(ERROR_MESSAGES.removeOrphanedExerciseVideoFiles);
  });

  it('returns the playback link or null with an error', async () => {
    service.playbackUrl.mockResolvedValueOnce('https://storage.example/v.mp4?token=t');
    const { result } = renderHook(() => useExerciseVideos(false));
    await act(async () => { expect(await result.current.getPlaybackUrl(video.mediaId)).toBe('https://storage.example/v.mp4?token=t'); });
    service.playbackUrl.mockRejectedValueOnce(new Error('403'));
    await act(async () => { expect(await result.current.getPlaybackUrl(video.mediaId)).toBeNull(); });
    expect(result.current.error).toBe(ERROR_MESSAGES.playExerciseVideo);
  });
});
