import React, { useEffect, useState } from 'react';
import { Dumbbell } from 'lucide-react';

// Loading usually takes under a second. After a reload Firestore can wait up to about 9 s for the
// previous page to release its IndexedDB tab lease (ADR-0010, pkt 3), so a longer wait gets an
// explanation instead of looking stuck.
export const SLOW_LOADING_MS = 3000;

export const LoadingSpinner: React.FC = () => {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsSlow(true), SLOW_LOADING_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="text-center px-4">
        <Dumbbell size={64} className="animate-pulse text-blue-500 mx-auto mb-4" />
        <p className="text-xl">Ładowanie danych...</p>
        {isSlow && (
          <p className="text-sm text-slate-400 mt-3 max-w-sm mx-auto">
            Wczytywanie trwa dłużej niż zwykle. Po odświeżeniu strony może to potrwać do kilkunastu sekund — dane są bezpieczne.
          </p>
        )}
      </div>
    </div>
  );
};
