// src/components/TrainingTracker.tsx
import React, { useState } from 'react';
import { Dumbbell, Calendar, Plus, TrendingUp, FileText } from 'lucide-react';
import type { TabType } from './types/index.js';
import { useFirebaseStorage } from './hooks/useFirebaseStorage.js';
import { useTemplates } from './hooks/useTemplates.js';
import { useWorkouts } from './hooks/useWorkouts.js';

import { DashboardTab } from './components/tabs/DashboardTab.js';
import { TemplatesTab } from './components/tabs/TemplatesTab.js';
import { WorkoutTab } from './components/tabs/WorkoutTab.js';
import PlanTab from './components/tabs/PlanTab.js';
import { HistoryTab } from './components/tabs/HistoryTab.js';
import StatsTab from './components/tabs/StatsTab.js';

const TrainingTracker: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const {
    workouts,
    measurements,
    saveWorkout,
    deleteWorkout,
    saveMeasurement,
    isLoading: storageLoading,
  } = useFirebaseStorage();

  const {
    allTemplates: templates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    defaultTemplates,
    customTemplates,
  } = useTemplates();

  const {
    currentWorkout,
    startWorkout,
    addSet,
    updateSet,
    removeSet,
    finishWorkout,
  } = useWorkouts();

  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'dashboard', label: 'Start', icon: Dumbbell },
    { id: 'templates', label: 'Szablony', icon: FileText },
    { id: 'plan', label: 'Plan', icon: Calendar },
    { id: 'workout', label: 'Trening', icon: Plus },
    { id: 'history', label: 'Historia', icon: Calendar },
    { id: 'stats', label: 'Postępy', icon: TrendingUp },
  ];

  if (storageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <Dumbbell size={64} className="animate-pulse text-blue-500" />
        <p className="ml-4">Ładowanie danych...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            💪 Dziennik Treningowy
          </h1>
          <p className="text-slate-400">Plan: Redukcja + Kondycja + Siła</p>
          <p className="text-slate-500 text-sm mt-1">
            {templates.length} szablonów | {workouts.length} treningów
          </p>
        </div>

        {/* Navigation Tabs */}
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

        {/* Content Area */}
        <div className="bg-slate-800 rounded-xl shadow-2xl p-6">
          {activeTab === 'dashboard' && (
            <DashboardTab
              workouts={workouts}
              measurements={measurements}
              templates={templates}
              onStartWorkout={startWorkout}
              onAddMeasurement={() => {
                const date = prompt('Data pomiaru (YYYY-MM-DD):');
                if (!date) return;
                const weightStr = prompt('Waga (kg):');
                const waistStr = prompt('Obwód talii (cm):');
                if (!weightStr || !waistStr) return;
                const weight = parseFloat(weightStr);
                const waist = parseFloat(waistStr);
                if (!isNaN(weight) && !isNaN(waist)) {
                  saveMeasurement({ date, weight, waist });
                }
              }}
            />
          )}

          {activeTab === 'templates' && (
            <TemplatesTab
              templates={templates}
              defaultTemplates={defaultTemplates}
              customTemplates={customTemplates}
              onAddTemplate={addTemplate}
              onUpdateTemplate={updateTemplate}
              onDeleteTemplate={deleteTemplate}
              onDuplicateTemplate={duplicateTemplate}
            />
          )}

          {activeTab === 'plan' && <PlanTab templates={templates} />}

          {activeTab === 'workout' && (
          <WorkoutTab
            currentWorkout={currentWorkout}
            onAddSet={addSet}
            onUpdateSet={updateSet}
            onRemoveSet={removeSet}
            onFinishWorkout={async () => {
              if (currentWorkout) {
                finishWorkout();                   
                await saveWorkout(currentWorkout);
              }
            }}
          />
        )}

        {activeTab === 'history' && (
        <HistoryTab
          workouts={workouts} 
          onView={(w) => console.log('Podgląd:', w)}
          onDelete={async (id) => await deleteWorkout(id)}
        />
      )}

          {activeTab === 'stats' && <StatsTab measurements={measurements} workouts={workouts} />}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-slate-500 text-sm">
          <p>💾 Dane są zapisywane automatycznie w Firebase</p>
        </div>
      </div>
    </div>
  );
};

export default TrainingTracker;
