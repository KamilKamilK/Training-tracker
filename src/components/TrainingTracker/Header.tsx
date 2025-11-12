import React from 'react';
import { Workout } from '../../types/index.js';

interface HeaderProps {
  templates: any[];
  workouts: Workout[];
}

export const Header: React.FC<HeaderProps> = ({ templates, workouts }) => (
  <div className="mb-6 text-center">
    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
      💪 Dziennik Treningowy
    </h1>
    <p className="text-slate-400">Plan: Redukcja + Kondycja + Siła</p>
    <p className="text-slate-500 text-sm mt-1">
      {templates.length} szablonów | {workouts.length} treningów
    </p>
  </div>
);