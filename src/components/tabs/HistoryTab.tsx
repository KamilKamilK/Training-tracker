import React from 'react';
import { Workout } from '../../types/index.js';
import { Eye, Trash2 } from 'lucide-react';


interface Props {
workouts: Workout[];
onView: (w: Workout) => void;
onDelete: (id: number) => void;
}


const HistoryTab: React.FC<Props> = ({ workouts, onView, onDelete }) => {
if (workouts.length === 0) {
return <p className="text-slate-400 text-center py-12">Brak treningów. Rozpocznij pierwszy!</p>;
}


return (
<div className="space-y-3">
{[...workouts].reverse().map(workout => (
<div key={workout.id} className="bg-slate-700 rounded-lg p-4 flex justify-between items-start">
<div>
<h3 className="font-bold text-lg">{workout.type}</h3>
<p className="text-slate-400 text-sm">{new Date(workout.date).toLocaleDateString('pl-PL')}</p>
<div className="text-sm text-slate-400 mt-2">
{workout.exercises.filter(e => e.sets.length > 0).length} ćwiczeń · {workout.exercises.reduce((sum, e) => sum + e.sets.length, 0)} serii
</div>
</div>


<div className="flex gap-2 mt-1">
<button onClick={() => onView(workout)} className="text-blue-400 hover:text-blue-300"><Eye size={18} /></button>
<button onClick={() => onDelete(workout.id)} className="text-red-400 hover:text-red-300"><Trash2 size={18} /></button>
</div>
</div>
))}
</div>
);
};


export default HistoryTab;