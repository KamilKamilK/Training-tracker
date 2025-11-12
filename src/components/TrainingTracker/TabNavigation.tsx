import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

interface Props {
  tabs: Tab[];
  activeTab: string;
  setActiveTab: (id: string) => void;
}

export const TabNavigation: React.FC<Props> = ({ tabs, activeTab, setActiveTab }) => (
  <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
    {tabs.map(tab => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
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
