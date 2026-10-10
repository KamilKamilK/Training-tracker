import React, { useState } from 'react';
import { Dumbbell, Calendar, Plus, TrendingUp, FileText } from 'lucide-react';
import { TabType } from '../types/index.js';
import { useFirebaseStorage } from '../hooks/useFirebaseStorage.js';
import { useMeasurements } from '../hooks/useMeasurements.js';
import { useTemplates } from '../hooks/useTemplates.js';
import { useWorkouts } from '../hooks/useWorkouts.js';

import { LoadingSpinner } from './common/LoadingSpinner.js';
import { ErrorBanner } from './common/ErrorBanner.js';
import { Modal } from './common/Modal.js';
import { MeasurementForm } from './tabs/DashboardTab/MeasurementForm.js';
import { Header } from './common/Header.js';
import { Footer } from './common/Footer.js';
import { TabNavigation } from './common/TabNavigation.js';
import { DashboardTab } from './tabs/DashboardTab/index.js';
import { TemplatesTab } from './tabs/TemplatesTab/index.js';
import { WorkoutTab } from './tabs/WorkoutTab/index.js';
import { PlanTab }  from './tabs/PlanTab/index.js';
import { HistoryTab } from './tabs/HistoryTab/index.js';
import { StatsTab } from './tabs/StatsTab/index.js';

interface TrainingTrackerProps {
  email: string | null;
  onSignOut: () => void;
}

const TrainingTracker: React.FC<TrainingTrackerProps> = ({ email, onSignOut }) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isMeasurementFormOpen, setIsMeasurementFormOpen] = useState(false);

  const {
    workouts,
    saveWorkout,
    deleteWorkout,
    isLoading: workoutsLoading,
    error: workoutsError,
    clearError: clearWorkoutsError,
  } = useFirebaseStorage();
  const {
    measurements,
    saveMeasurement,
    isLoading: measurementsLoading,
    error: measurementsError,
    clearError: clearMeasurementsError,
  } = useMeasurements();
  const {
    allTemplates: templates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    defaultTemplates,
    customTemplates,
  } = useTemplates();
  const { currentWorkout, isFinishing, startWorkout, addSet, updateSet, removeSet, finishWorkout } = useWorkouts();

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Start', icon: Dumbbell },
    { id: 'templates' as TabType, label: 'Szablony', icon: FileText },
    { id: 'plan' as TabType, label: 'Plan', icon: Calendar },
    { id: 'workout' as TabType, label: 'Trening', icon: Plus },
    { id: 'history' as TabType, label: 'Historia', icon: Calendar },
    { id: 'stats' as TabType, label: 'Postępy', icon: TrendingUp },
  ];

  const handleFinishWorkout = async () => {
    if (await finishWorkout(saveWorkout)) {
      setActiveTab('history');
    }
  };

  if (workoutsLoading || measurementsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <Header
          templatesCount={templates.length}
          workoutsCount={workouts.length}
          email={email}
          onSignOut={onSignOut}
        />
        <TabNavigation tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {workoutsError && activeTab !== 'workout' && (
          <ErrorBanner message={workoutsError} onDismiss={clearWorkoutsError} />
        )}
        {measurementsError && !isMeasurementFormOpen && (
          <ErrorBanner message={measurementsError} onDismiss={clearMeasurementsError} />
        )}

        <div className="bg-slate-800 rounded-xl shadow-2xl p-6">
          {activeTab === 'dashboard' && (
            <DashboardTab
              workouts={workouts}
              measurements={measurements}
              templates={templates}
              onStartWorkout={startWorkout}
              onAddMeasurement={() => setIsMeasurementFormOpen(true)}
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
              isFinishing={isFinishing}
              error={workoutsError}
              onDismissError={clearWorkoutsError}
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

        <Modal
          isOpen={isMeasurementFormOpen}
          onClose={() => setIsMeasurementFormOpen(false)}
          title="Nowy pomiar"
        >
          {measurementsError && <ErrorBanner message={measurementsError} onDismiss={clearMeasurementsError} />}
          <MeasurementForm onSubmit={saveMeasurement} onCancel={() => setIsMeasurementFormOpen(false)} />
        </Modal>
      </div>
    </div>
  );
};

export default TrainingTracker;