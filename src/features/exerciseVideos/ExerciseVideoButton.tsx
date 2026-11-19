import { useState } from 'react';
import { Video } from 'lucide-react';
import { useExerciseVideosContext } from './exerciseVideos.context.js';
import { ExerciseVideoModal } from './ExerciseVideoModal.js';

/**
 * Shown next to an exercise that has a technique video. The admin also sees it for exercises
 * without one, to add it; other accounts do not see the upload option at all.
 */
export const ExerciseVideoButton = ({ exerciseName }: { exerciseName: string }) => {
  const { videos, canManage } = useExerciseVideosContext();
  const [isOpen, setIsOpen] = useState(false);
  const video = videos.get(exerciseName);

  if (!video && !canManage) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={video ? `Technika: ${exerciseName}` : `Dodaj film techniki: ${exerciseName}`}
        className="flex shrink-0 items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
      >
        <Video size={16} aria-hidden="true" />
        {video ? 'Technika' : 'Dodaj film'}
      </button>
      {isOpen && <ExerciseVideoModal exerciseName={exerciseName} video={video} onClose={() => setIsOpen(false)} />}
    </>
  );
};
