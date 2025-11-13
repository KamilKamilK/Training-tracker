import React from 'react';
import { APP_CONFIG } from '../../constants/config.js';

interface HeaderProps {
  templatesCount: number;
  workoutsCount: number;
}

export const Header: React.FC<HeaderProps> = ({ templatesCount, workoutsCount }) => (
  <div className="mb-6 text-center">
    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
      💪 {APP_CONFIG.name}
    </h1>
    <p className="text-slate-400">{APP_CONFIG.subtitle}</p>
    <p className="text-slate-500 text-sm mt-1">
      {templatesCount} szablonów | {workoutsCount} treningów
    </p>
  </div>
);