import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onDismiss }) => (
  <div role="alert" className="flex items-start gap-3 bg-red-900/60 border border-red-600 text-red-100 rounded-lg p-4 mb-4">
    <AlertCircle size={20} className="shrink-0 mt-0.5" />
    <p className="flex-1 text-sm">{message}</p>
    <button onClick={onDismiss} className="text-red-200 hover:text-white" title="Zamknij" aria-label="Zamknij">
      <X size={18} />
    </button>
  </div>
);
