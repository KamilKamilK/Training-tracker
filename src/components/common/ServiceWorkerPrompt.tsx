import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const ServiceWorkerPrompt = () => {
  const [error, setError] = useState<string | null>(null);
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError() {
      setError('Nie udało się przygotować aplikacji do pracy bez sieci. Spróbuj odświeżyć stronę po połączeniu z internetem.');
    },
  });

  if (!offlineReady && !needRefresh && !error) return null;

  const dismiss = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setError(null);
  };

  const refresh = async () => {
    try {
      await updateServiceWorker(true);
    } catch {
      setError('Nie udało się włączyć nowej wersji. Spróbuj ponownie po połączeniu z internetem.');
    }
  };

  return (
    <div className="border-b border-slate-500 bg-slate-800 p-4 text-white">
      {(needRefresh || offlineReady) && <p role="status" className="text-sm">
        {needRefresh ? 'Dostępna nowa wersja aplikacji.' : 'Pliki aplikacji są gotowe do pracy bez sieci.'}
      </p>}
      {needRefresh && <p className="mt-2 text-sm text-slate-300">Odśwież, gdy skończysz edycję. Szkic treningu pozostanie zapisany.</p>}
      {error && <p role="alert" className="mt-2 text-sm text-red-200">{error}</p>}
      <div className="mt-3 flex gap-3">
        {needRefresh && <button className="rounded-sm bg-blue-600 px-3 py-2 hover:bg-blue-700" onClick={() => void refresh()}>Odśwież</button>}
        <button className="rounded-sm bg-slate-700 px-3 py-2 hover:bg-slate-600" onClick={dismiss}>{needRefresh ? 'Później' : 'Zamknij'}</button>
      </div>
    </div>
  );
};
