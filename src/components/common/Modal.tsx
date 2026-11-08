import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousFocus = document.activeElement;
    dialog.showModal();
    closeButtonRef.current?.focus();

    return () => {
      dialog.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby={titleId}
      onCancel={event => {
        // The parent decides whether closing is allowed, including while a save is pending.
        event.preventDefault();
        onClose();
      }}
      className="fixed inset-0 m-auto bg-slate-800 text-inherit rounded-xl max-w-2xl w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto p-6 backdrop:bg-black/70"
    >
      <div className="flex justify-between items-start mb-4">
        <h2 id={titleId} className="text-2xl font-bold">{title}</h2>
        <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Zamknij" className="text-slate-400 hover:text-white">
          <X size={24} aria-hidden="true" />
        </button>
      </div>
      {children}
    </dialog>
  );
};
