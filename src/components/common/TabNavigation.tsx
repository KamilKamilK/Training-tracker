import React from 'react';
import { TabType } from '../../types/index.js';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ElementType;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: TabType;
  onChange: (tab: TabType) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ tabs, activeTab, onChange }) => (
  <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
    {tabs.map(tab => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
          activeTab === tab.id
            ? 'bg-blue-600 text-white shadow-lg'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        }`}
      >
        <tab.icon size={18} />
        {tab.label}
      </button>
    ))}
  </div>
);
