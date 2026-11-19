import { createContext, useContext } from 'react';
import type { ExerciseVideosState } from './useExerciseVideos.js';

const noVideos: ExerciseVideosState = {
  videos: new Map(),
  canManage: false,
  loadError: null,
  clearLoadError: () => undefined,
  error: null,
  clearError: () => undefined,
  uploadVideo: async () => false,
  deleteVideo: async () => false,
  getPlaybackUrl: async () => null,
};

/**
 * Provided by the journal (TrainingTracker), so exercise cards in the workout and in the History
 * reach the videos without passing them through every tab. Without a provider there are no videos.
 */
export const ExerciseVideosContext = createContext<ExerciseVideosState>(noVideos);

export const useExerciseVideosContext = () => useContext(ExerciseVideosContext);
