import React from 'react';
import { NavLink } from 'react-router';
import { RoutePath } from '../../constants/routes.js';

interface Tab {
  path: RoutePath;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

interface TabNavigationProps {
  tabs: Tab[];
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ tabs }) => (
  <nav className="flex gap-2 mb-6 overflow-x-auto pb-2">
    {tabs.map(tab => (
      <NavLink
        key={tab.path}
        to={tab.path}
        end
        className={({ isActive }) =>
          `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
            isActive ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`
        }
      >
        <tab.icon size={18} />
        {tab.label}
      </NavLink>
    ))}
  </nav>
);
