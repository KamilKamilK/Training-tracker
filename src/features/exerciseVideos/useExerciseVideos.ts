import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExerciseVideo } from '../../types/index.js';
import { ERROR_MESSAGES } from '../../constants/messages.js';
import { ExerciseVideosService } from './exerciseVideos.service.js';
import { checkVideoFile } from './exerciseVideo.utils.js';

export interface ExerciseVideosState {
  /** Videos by the exact exercise text. */
  videos: ReadonlyMap<string, ExerciseVideo>;
  /** Uploading and deleting are offered only to the admin; the function and the rules check it again. */
  canManage: boolean;
  loadError: string | null;
  clearLoadError: () => void;
  error: string | null;
  clearError: () => void;
  /** Resolves to true once the file is in the bucket and Firestore confirmed the document. */
  uploadVideo: (exerciseName: string, file: File) => Promise<boolean>;
  deleteVideo: (video: ExerciseVideo) => Promise<boolean>;
  /** Resolves to the number of removed files, or null with the error in `error`. */
  removeOrphanedFiles: () => Promise<number | null>;
  /** Null when the link could not be obtained; the error is in `error`. */
  getPlaybackUrl: (mediaId: string) => Promise<string | null>;
}

/** Technique videos kept in sync with Firestore; writes show up through the subscription. */
export const useExerciseVideos = (canManage: boolean): ExerciseVideosState => {
  const [videos, setVideos] = useState<ReadonlyMap<string, ExerciseVideo>>(() => new Map());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      ExerciseVideosService.subscribe(
        list => {
          setVideos(new Map(list.map(video => [video.exerciseName, video])));
          setLoadError(null);
        },
        () => setLoadError(ERROR_MESSAGES.loadExerciseVideos),
      ),
    [],
  );

  // The file goes to the bucket first and the document is written after it, so a document never
  // points to a missing file. A replaced file is deleted last; if that fails it only takes space.
  const uploadVideo = useCallback(async (exerciseName: string, file: File): Promise<boolean> => {
    const check = await checkVideoFile(file);
    if (!check.ok) {
      setError(check.message);
      return false;
    }
    const replaced = videos.get(exerciseName);
    try {
      const mediaId = crypto.randomUUID();
      await ExerciseVideosService.uploadFile(mediaId, file);
      await ExerciseVideosService.save({
        exerciseName,
        mediaId,
        sizeBytes: file.size,
        durationSec: check.durationSec,
        uploadedAt: new Date().toISOString(),
      });
    } catch {
      setError(ERROR_MESSAGES.uploadExerciseVideo);
      return false;
    }
    try {
      if (replaced) await ExerciseVideosService.deleteFile(replaced.mediaId);
      setError(null);
    } catch {
      setError(ERROR_MESSAGES.removeReplacedExerciseVideo);
    }
    return true;
  }, [videos]);

  // The file is deleted before the document; repeating a failed deletion finishes the job.
  const deleteVideo = useCallback(async (video: ExerciseVideo): Promise<boolean> => {
    try {
      await ExerciseVideosService.deleteFile(video.mediaId);
      await ExerciseVideosService.delete(video.id);
      setError(null);
      return true;
    } catch {
      setError(ERROR_MESSAGES.deleteExerciseVideo);
      return false;
    }
  }, []);

  const removeOrphanedFiles = useCallback(async (): Promise<number | null> => {
    try {
      const removed = await ExerciseVideosService.removeOrphanedFiles();
      setError(null);
      return removed;
    } catch {
      setError(ERROR_MESSAGES.removeOrphanedExerciseVideoFiles);
      return null;
    }
  }, []);

  const getPlaybackUrl = useCallback(async (mediaId: string): Promise<string | null> => {
    try {
      return await ExerciseVideosService.playbackUrl(mediaId);
    } catch {
      setError(ERROR_MESSAGES.playExerciseVideo);
      return null;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);
  const clearLoadError = useCallback(() => setLoadError(null), []);

  return useMemo(
    () => ({
      videos, canManage, loadError, clearLoadError, error, clearError, uploadVideo, deleteVideo, removeOrphanedFiles, getPlaybackUrl,
    }),
    [videos, canManage, loadError, clearLoadError, error, clearError, uploadVideo, deleteVideo, removeOrphanedFiles, getPlaybackUrl],
  );
};
