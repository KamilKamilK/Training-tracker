import React, { useState } from 'react';
import { Dumbbell, Calendar, Plus, TrendingUp, FileText } from 'lucide-react';
import { TabType } from '../types/index.js';
import { useFirebaseStorage } from '../hooks/useFirebaseStorage.js';
import { useMeasurements } from '../hooks/useMeasurements.js';
import { useTemplates } from '../hooks/useTemplates.js';
import { useWorkouts } from '../hooks/useWorkouts.js';
import { promptForMeasurement } from '../utils/measurement.utils.js';

import { LoadingSpinner } from './common/LoadingSpinner.js';
import { Header } from './common/Header.js';
import { Footer } from './common/Footer.js';
import { TabNavigation } from './common/TabNavigation.js';
import { DashboardTab } from './tabs/DashboardTab/index.js';
import { TemplatesTab } from './tabs/TemplatesTab/index.js';
import { WorkoutTab } from './tabs/WorkoutTab/index.js';
import { PlanTab }  from './tabs/PlanTab/index.js';
import { HistoryTab } from './tabs/HistoryTab/index.js';
import { StatsTab } from './tabs/StatsTab/index.js';

const TrainingTracker: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const { workouts, saveWorkout, deleteWorkout, isLoading: workoutsLoading } = useFirebaseStorage();
  const { measurements, saveMeasurement, isLoading: measurementsLoading } = useMeasurements();
  const {
    allTemplates: templates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    defaultTemplates,
    customTemplates,
  } = useTemplates();
  const { currentWorkout, startWorkout, addSet, updateSet, removeSet, finishWorkout } = useWorkouts();

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Start', icon: Dumbbell },
    { id: 'templates' as TabType, label: 'Szablony', icon: FileText },
    { id: 'plan' as TabType, label: 'Plan', icon: Calendar },
    { id: 'workout' as TabType, label: 'Trening', icon: Plus },
    { id: 'history' as TabType, label: 'Historia', icon: Calendar },
    { id: 'stats' as TabType, label: 'Postępy', icon: TrendingUp },
  ];

  const handleAddMeasurement = () => {
    const measurement = promptForMeasurement();
    if (measurement) saveMeasurement(measurement);
  };

  const handleFinishWorkout = async () => {
    const finished = finishWorkout();
    if (finished) {
      await saveWorkout(finished);
      setActiveTab('history');
    }
  };

  if (workoutsLoading || measurementsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <Header templatesCount={templates.length} workoutsCount={workouts.length} />
        <TabNavigation tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className="bg-slate-800 rounded-xl shadow-2xl p-6">
          {activeTab === 'dashboard' && (
            <DashboardTab
              workouts={workouts}
              measurements={measurements}
              templates={templates}
              onStartWorkout={startWorkout}
              onAddMeasurement={handleAddMeasurement}
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
              onFinishWorkout={handleFinishWorkout}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab workouts={workouts} onDelete={deleteWorkout} />
          )}

          {activeTab === 'stats' && <StatsTab measurements={measurements} workouts={workouts} />}
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default TrainingTracker;