import React from 'react';
import { Modal } from '../../components/common/Modal.js';
import { Workout } from '../../types/index.js';
import { formatDate } from '../../utils/date.utils.js';

interface WorkoutModalProps {
  workout: Workout;
  onClose: () => void;
}

export const WorkoutModal: React.FC<WorkoutModalProps> = ({ workout, onClose }) => {
  return (
    <Modal isOpen onClose={onClose} title={workout.type}>
      <p className="text-slate-400 -mt-4 mb-4">{formatDate(workout.date)}</p>

      <div className="space-y-4">
        {workout.exercises.filter(e => e.sets.length > 0).map((exercise, idx) => (
          <div key={idx} className="bg-slate-700 rounded-lg p-4">
            <h3 className="font-bold mb-3">{exercise.name}</h3>
            <div className="space-y-2">
              {exercise.sets.map((set, sIdx) => (
                <div key={sIdx} className="flex gap-3 text-sm bg-slate-600 p-2 rounded-sm items-center">
                  <span className="text-slate-400">Seria {sIdx + 1}:</span>
                  <span className="font-bold">{set.weight} kg × {set.reps} powt.</span>
                  {set.rir && <span className="text-slate-400">RIR: {set.rir}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}

        {workout.notes && (
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="font-bold mb-2">Notatki</h4>
            <p className="text-slate-300">{workout.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
