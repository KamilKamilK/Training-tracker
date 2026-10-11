import React, { createContext, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, X } from 'lucide-react';

const ToastContainerContext = createContext<HTMLElement | null>(null);

/** Corner of the screen where error toasts from any part of the page are stacked. */
export const ToastRegion: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  return (
    <ToastContainerContext.Provider value={container}>
      {children}
      <div
        ref={setContainer}
        className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-40 flex flex-col gap-2 pointer-events-none"
      />
    </ToastContainerContext.Provider>
  );
};

interface ErrorToastProps {
  message: string;
  onDismiss: () => void;
}

/**
 * An error shown in the toast corner until the user closes it, so a failed load is not missed;
 * outside a ToastRegion it renders in place.
 */
export const ErrorToast: React.FC<ErrorToastProps> = ({ message, onDismiss }) => {
  const container = useContext(ToastContainerContext);
  const toast = (
    <div
      role="alert"
      className="pointer-events-auto flex items-start gap-3 bg-red-900 border border-red-600 text-red-100 rounded-lg p-3 shadow-2xl"
    >
      <AlertCircle size={18} className="shrink-0 mt-0.5" />
      <p className="flex-1 text-sm">{message}</p>
      <button onClick={onDismiss} className="text-red-200 hover:text-white" title="Zamknij" aria-label="Zamknij">
        <X size={16} />
      </button>
    </div>
  );
  return container ? createPortal(toast, container) : toast;
};
