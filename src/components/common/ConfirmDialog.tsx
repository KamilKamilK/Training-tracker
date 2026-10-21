import React from 'react';
import { Modal } from './Modal.js';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  /** Also called when the dialog is closed with its X button. */
  onCancel: () => void;
}

/** Asks before an action that discards data; the confirm button is styled as destructive. */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  children,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}) => (
  <Modal isOpen={isOpen} onClose={onCancel} title={title}>
    <div className="text-slate-300 mb-4">{children}</div>
    <div className="flex flex-wrap gap-3">
      <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg">
        {confirmLabel}
      </button>
      <button onClick={onCancel} className="bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded-lg">
        {cancelLabel}
      </button>
    </div>
  </Modal>
);
