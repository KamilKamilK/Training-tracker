import { useState } from 'react';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.js';
import { ErrorBanner } from '../../components/common/ErrorBanner.js';
import { useExerciseVideosContext } from './exerciseVideos.context.js';

/** Admin tool: removes from the video storage everything that is not the video of an exercise. */
export const ExerciseVideoStorageCleanup = () => {
  const { error, clearError, removeUnusedFiles } = useExerciseVideosContext();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [removedFiles, setRemovedFiles] = useState<number | null>(null);

  const cleanUp = async () => {
    if (isPending) return;
    setIsPending(true);
    const removed = await removeUnusedFiles();
    setIsPending(false);
    if (removed !== null) {
      setRemovedFiles(removed);
      setIsConfirmOpen(false);
    }
  };

  return (
    <div className="bg-slate-700 rounded-lg p-4 space-y-3 text-sm">
      <h4 className="font-semibold">Filmy techniki</h4>
      <p className="text-slate-300">
        Zbędne pliki w magazynie filmów: pozostałe po nieudanym wgraniu lub zamianie filmu oraz foldery i pliki
        dodane poza aplikacją. Pliki z ostatniej godziny zostają, bo mogą należeć do trwającego wgrywania.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            clearError();
            setIsConfirmOpen(true);
          }}
          className="bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded-lg"
        >
          Usuń zbędne pliki
        </button>
        <span role="status" className="text-slate-400">
          {removedFiles !== null && `Usunięte pliki: ${removedFiles}.`}
        </span>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Usunąć zbędne pliki?"
        confirmLabel="Usuń pliki"
        cancelLabel="Anuluj"
        onConfirm={() => void cleanUp()}
        onCancel={() => {
          clearError();
          setIsConfirmOpen(false);
        }}
        isPending={isPending}
      >
        <p>
          Z magazynu filmów zniknie wszystko, co nie jest filmem ćwiczenia, także foldery z całą zawartością. Filmy
          ćwiczeń zostają. Tej operacji nie można cofnąć.
        </p>
        {error && <ErrorBanner message={error} onDismiss={clearError} />}
      </ConfirmDialog>
    </div>
  );
};
