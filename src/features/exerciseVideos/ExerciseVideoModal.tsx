import { useEffect, useId, useState } from 'react';
import { ExerciseVideo } from '../../types/index.js';
import { Modal } from '../../components/common/Modal.js';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.js';
import { ErrorBanner } from '../../components/common/ErrorBanner.js';
import { VALIDATION_RULES } from '../../constants/validation.js';
import { useExerciseVideosContext } from './exerciseVideos.context.js';

const { maxBytes, maxDurationSec } = VALIDATION_RULES.exerciseVideo;

interface ExerciseVideoModalProps {
  exerciseName: string;
  video: ExerciseVideo | undefined;
  onClose: () => void;
}

/** Plays the technique video; the admin also uploads, replaces and deletes it here. */
export const ExerciseVideoModal = ({ exerciseName, video, onClose }: ExerciseVideoModalProps) => {
  const { canManage, error, clearError, uploadVideo, deleteVideo, removeOrphanedFiles, getPlaybackUrl } = useExerciseVideosContext();
  const fileInputId = useId();
  const [playback, setPlayback] = useState<{ mediaId: string; url: string } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  // Changing the key empties the file input after an upload.
  const [fileInputKey, setFileInputKey] = useState(0);
  const [pending, setPending] = useState<'upload' | 'delete' | 'cleanup' | null>(null);
  const [removedFiles, setRemovedFiles] = useState<number | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // The signed link expires after a few minutes, so it is fetched each time the video is shown.
  const mediaId = video?.mediaId;
  useEffect(() => {
    if (!mediaId) return;
    let isCurrent = true;
    void getPlaybackUrl(mediaId).then(url => {
      if (isCurrent && url) setPlayback({ mediaId, url });
    });
    return () => {
      isCurrent = false;
    };
  }, [mediaId, getPlaybackUrl]);
  const playbackUrl = playback?.mediaId === mediaId ? playback?.url : undefined;

  const upload = async () => {
    if (!file || pending) return;
    setPending('upload');
    const uploaded = await uploadVideo(exerciseName, file);
    setPending(null);
    if (uploaded) {
      setFile(null);
      setFileInputKey(key => key + 1);
    }
  };

  const remove = async () => {
    if (!video || pending) return;
    setPending('delete');
    const deleted = await deleteVideo(video);
    setPending(null);
    if (deleted) setIsDeleteConfirmOpen(false);
  };

  const cleanUp = async () => {
    if (pending) return;
    setPending('cleanup');
    setRemovedFiles(null);
    setRemovedFiles(await removeOrphanedFiles());
    setPending(null);
  };

  const close = () => {
    if (pending) return;
    clearError();
    onClose();
  };

  return (
    <Modal isOpen title={`Technika: ${exerciseName}`} onClose={close}>
      <div className="space-y-4">
        {!video && <p className="text-slate-400">To ćwiczenie nie ma jeszcze filmu.</p>}
        {video && playbackUrl && (
          <video
            key={playbackUrl}
            src={playbackUrl}
            aria-label={`Film techniki: ${exerciseName}`}
            controls
            loop
            muted
            playsInline
            autoPlay
            className="w-full max-h-[60vh] rounded-lg bg-black"
          />
        )}
        {video && !playbackUrl && !error && <p className="text-slate-400">Ładowanie filmu...</p>}
        {error && !isDeleteConfirmOpen && <ErrorBanner message={error} onDismiss={clearError} />}

        {canManage && (
          <fieldset disabled={pending !== null} className="space-y-3 border-t border-slate-600 pt-4 min-w-0">
            <legend className="font-bold">{video ? 'Zamień film' : 'Dodaj film'}</legend>
            <label htmlFor={fileInputId} className="block text-sm text-slate-300">
              Plik MP4 (H.264), do {maxDurationSec} s i {maxBytes / (1024 * 1024)} MB
            </label>
            <input
              key={fileInputKey}
              id={fileInputId}
              type="file"
              accept="video/mp4"
              onChange={event => {
                clearError();
                setFile(event.target.files?.[0] ?? null);
              }}
              className="block w-full text-sm"
            />
            <div className="flex flex-wrap justify-end gap-3">
              {video && (
                <button
                  type="button"
                  onClick={() => {
                    clearError();
                    setIsDeleteConfirmOpen(true);
                  }}
                  className="bg-red-700 hover:bg-red-600 disabled:bg-gray-600 rounded-lg px-4 py-2"
                >
                  Usuń film
                </button>
              )}
              <button
                type="button"
                onClick={() => void upload()}
                disabled={!file}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg px-4 py-2"
              >
                {pending === 'upload' ? 'Wgrywanie...' : video ? 'Wgraj nowy film' : 'Wgraj film'}
              </button>
            </div>
          </fieldset>
        )}

        {canManage && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-600 pt-4">
            <p role="status" className="text-sm text-slate-400">
              {removedFiles === null
                ? 'Pliki po nieudanym wgraniu lub zamianie filmu, starsze niż godzina.'
                : `Usunięte pliki bez filmu: ${removedFiles}.`}
            </p>
            <button
              type="button"
              onClick={() => void cleanUp()}
              disabled={pending !== null}
              className="bg-slate-600 hover:bg-slate-500 disabled:bg-gray-600 rounded-lg px-4 py-2"
            >
              {pending === 'cleanup' ? 'Usuwanie...' : 'Usuń pliki bez filmu'}
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="Usunąć film?"
        confirmLabel="Usuń film"
        cancelLabel="Anuluj"
        onConfirm={() => void remove()}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        isPending={pending === 'delete'}
      >
        <p>Film ćwiczenia „{exerciseName}” zniknie z każdego treningu, w którym występuje to ćwiczenie.</p>
        {error && <ErrorBanner message={error} onDismiss={clearError} />}
      </ConfirmDialog>
    </Modal>
  );
};
