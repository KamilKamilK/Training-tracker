import React from 'react';
import { LogOut } from 'lucide-react';
import { APP_CONFIG } from '../../constants/config.js';

interface HeaderProps {
  templatesCount: number;
  workoutsCount: number;
  email: string | null;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({ templatesCount, workoutsCount, email, onSignOut }) => (
  <div className="mb-6 text-center">
    <div className="flex justify-end items-center gap-2 text-xs text-slate-400 mb-2">
      {email && <span className="truncate">{email}</span>}
      <button onClick={onSignOut} className="flex items-center gap-1 hover:text-white" title="Wyloguj">
        <LogOut size={14} /> Wyloguj
      </button>
    </div>
    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
      💪 {APP_CONFIG.name}
    </h1>
    <p className="text-slate-400">{APP_CONFIG.subtitle}</p>
    <p className="text-slate-500 text-sm mt-1">
      {templatesCount} szablonów | {workoutsCount} treningów
    </p>
  </div>
);
