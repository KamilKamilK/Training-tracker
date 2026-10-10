import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router';
import { Dumbbell, Calendar, Plus, TrendingUp, FileText } from 'lucide-react';
import { ROUTES } from '../constants/routes.js';
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
import { WorkoutTab } from './tabs/WorkoutTab/index.js';

// Tabs other than the start page and the active workout are separate chunks, so the first screen
// loads faster. They are fetched in the background right after sign-in: without that, a tab opened
// for the first time without a connection (e.g. at the gym) would fail to load.
const loadTemplatesTab = () => import('./tabs/TemplatesTab/index.js');
const loadPlanTab = () => import('./tabs/PlanTab/index.js');
const loadHistoryTab = () => import('./tabs/HistoryTab/index.js');
const loadStatsTab = () => import('./tabs/StatsTab/index.js');

const TemplatesTab = lazy(() => loadTemplatesTab().then(m => ({ default: m.TemplatesTab })));
const PlanTab = lazy(() => loadPlanTab().then(m => ({ default: m.PlanTab })));
const HistoryTab = lazy(() => loadHistoryTab().then(m => ({ default: m.HistoryTab })));
const StatsTab = lazy(() => loadStatsTab().then(m => ({ default: m.StatsTab })));

const prefetchTabs = () =>
  Promise.all([loadTemplatesTab(), loadPlanTab(), loadHistoryTab(), loadStatsTab()]).catch(error => {
    // Not fatal: a tab that failed here is fetched again when opened.
    console.warn('TrainingTracker: prefetching tabs failed', error);
  });

const tabs = [
  { path: ROUTES.dashboard, label: 'Start', icon: Dumbbell },
  { path: ROUTES.templates, label: 'Szablony', icon: FileText },
  { path: ROUTES.plan, label: 'Plan', icon: Calendar },
  { path: ROUTES.workout, label: 'Trening', icon: Plus },
  { path: ROUTES.history, label: 'Historia', icon: Calendar },
  { path: ROUTES.progress, label: 'Postępy', icon: TrendingUp },
];

interface TrainingTrackerProps {
  email: string | null;
  onSignOut: () => void;
}

const TrainingTracker: React.FC<TrainingTrackerProps> = ({ email, onSignOut }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    void prefetchTabs();
  }, []);
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

  const handleFinishWorkout = async () => {
    if (await finishWorkout(saveWorkout)) {
      navigate(ROUTES.history);
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
        <TabNavigation tabs={tabs} />

        {workoutsError && pathname !== ROUTES.workout && (
          <ErrorBanner message={workoutsError} onDismiss={clearWorkoutsError} />
        )}
        {measurementsError && !isMeasurementFormOpen && (
          <ErrorBanner message={measurementsError} onDismiss={clearMeasurementsError} />
        )}

        <div className="bg-slate-800 rounded-xl shadow-2xl p-6">
          <Suspense fallback={<p className="text-slate-400 text-center py-12">Ładowanie...</p>}>
            <Routes>
              <Route
                path={ROUTES.dashboard}
                element={
                  <DashboardTab
                    workouts={workouts}
                    measurements={measurements}
                    templates={templates}
                    onStartWorkout={startWorkout}
                    onAddMeasurement={() => setIsMeasurementFormOpen(true)}
                  />
                }
              />
              <Route
                path={ROUTES.templates}
                element={
                  <TemplatesTab
                    templates={templates}
                    defaultTemplates={defaultTemplates}
                    customTemplates={customTemplates}
                    onAddTemplate={addTemplate}
                    onUpdateTemplate={updateTemplate}
                    onDeleteTemplate={deleteTemplate}
                    onDuplicateTemplate={duplicateTemplate}
                  />
                }
              />
              <Route path={ROUTES.plan} element={<PlanTab templates={templates} />} />
              <Route
                path={ROUTES.workout}
                element={
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
                }
              />
              <Route path={ROUTES.history} element={<HistoryTab workouts={workouts} onDelete={deleteWorkout} />} />
              <Route path={ROUTES.progress} element={<StatsTab measurements={measurements} workouts={workouts} />} />
              <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
            </Routes>
          </Suspense>
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