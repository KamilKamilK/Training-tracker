import React from 'react';
import { Workout, Measurement, WorkoutTemplate } from '../../types/index.js';
import { QuickStats } from './QuickStats.js';
import { TemplateGrid } from './TemplateGrid.js';
import { MeasurementsWidget } from '../measurements/MeasurementsWidget.js';

interface DashboardTabProps {
  workouts: Workout[];
  measurements: Measurement[];
  templates: WorkoutTemplate[];
  onStartWorkout: (template: WorkoutTemplate) => void;
  onAddMeasurement: () => void;
  onEditMeasurement: (measurement: Measurement) => void;
  onDeleteMeasurement: (measurement: Measurement) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  workouts,
  measurements,
  templates,
  onStartWorkout,
  onAddMeasurement,
  onEditMeasurement,
  onDeleteMeasurement,
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Rozpocznij Trening</h2>
      <QuickStats workouts={workouts} measurements={measurements} />
      <TemplateGrid templates={templates} workouts={workouts} onStart={onStartWorkout} />
      <MeasurementsWidget measurements={measurements} onAdd={onAddMeasurement} onEdit={onEditMeasurement} onDelete={onDeleteMeasurement} />
    </div>
  );
};
