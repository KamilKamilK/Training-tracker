import React from 'react';
import { X } from 'lucide-react';
import { Workout } from '../../types/index.js';


interface Props {
workout: Workout;
onClose: () => void;
}


const WorkoutModal: React.FC<Props> = ({ workout, onClose }) => {
return (
<div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
<div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
<div className="flex justify-between items-start mb-4">
<div>
<h2 className="text-2xl font-bold">{workout.type}</h2>
<p className="text-slate-400">{new Date(workout.date).toLocaleDateString('pl-PL')}</p>
</div>
<button onClick={onClose} className="text-slate-400 hover:text-white">
<X size={24} />
</button>
</div>


<div className="space-y-4">
{workout.exercises.filter(e => e.sets.length > 0).map((exercise, idx) => (
<div key={idx} className="bg-slate-700 rounded-lg p-4">
<h3 className="font-bold mb-3">{exercise.name}</h3>
<div className="space-y-2">
{exercise.sets.map((set, sIdx) => (
<div key={sIdx} className="flex gap-3 text-sm bg-slate-600 p-2 rounded items-center">
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
</div>
</div>
);
};


export default WorkoutModal;