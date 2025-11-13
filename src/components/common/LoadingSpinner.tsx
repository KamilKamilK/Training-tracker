
import React from 'react';
import { Dumbbell } from 'lucide-react';

export const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
    <div className="text-center">
      <Dumbbell size={64} className="animate-pulse text-blue-500 mx-auto mb-4" />
      <p className="text-xl">Ładowanie danych...</p>
    </div>
  </div>
);