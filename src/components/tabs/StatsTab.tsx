import React from 'react';
import { Workout, Measurement } from '../../types/index.js';


interface Props {
workouts: Workout[];
measurements: Measurement[];
}


const StatsTab: React.FC<Props> = ({ workouts, measurements }) => {
const total = workouts.length;
const thisMonth = workouts.filter(w => {
const d = new Date(w.date);
const n = new Date();
return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}).length;


const thisWeek = workouts.filter(w => {
const d = new Date(w.date);
const now = new Date();
const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
return d >= weekAgo;
}).length;


return (
<div className="space-y-6">
<h2 className="text-2xl font-bold mb-4">Twoje Postępy</h2>
<div className="grid md:grid-cols-3 gap-4">
<div className="bg-slate-700 rounded-lg p-4">
<h3 className="text-slate-400 text-sm mb-2">Treningi Łącznie</h3>
<p className="text-3xl font-bold">{total}</p>
</div>
<div className="bg-slate-700 rounded-lg p-4">
<h3 className="text-slate-400 text-sm mb-2">Ten Miesiąc</h3>
<p className="text-3xl font-bold">{thisMonth}</p>
</div>
<div className="bg-slate-700 rounded-lg p-4">
<h3 className="text-slate-400 text-sm mb-2">Ten Tydzień</h3>
<p className="text-3xl font-bold">{thisWeek}</p>
</div>
</div>


{measurements.length > 1 && (
<div className="bg-slate-700 rounded-lg p-4">
<h3 className="font-bold text-lg mb-4">Progresja Wagi i Talii</h3>
<div className="space-y-2">
{measurements.slice(-10).map((m, idx) => {
const all = measurements;
const i = all.indexOf(m);
const prev = i > 0 ? all[i - 1] : null;
const weightDiff = prev ? (m.weight - prev.weight).toFixed(1) : '0';
const waistDiff = prev ? (m.waist - prev.waist).toFixed(1) : '0';


return (
<div key={idx} className="flex justify-between items-center bg-slate-600 p-3 rounded">
<span className="text-slate-300">{new Date(m.date).toLocaleDateString('pl-PL')}</span>
<div className="flex gap-4">
<span className="font-bold">{m.weight} kg
{prev && (
<span className={`ml-2 text-sm ${parseFloat(weightDiff) < 0 ? 'text-green-400' : 'text-red-400'}`}>
{parseFloat(weightDiff) > 0 ? '+' : ''}{weightDiff}
</span>
)}
</span>
<span className="font-bold">{m.waist} cm
{prev && (
<span className={`ml-2 text-sm ${parseFloat(waistDiff) < 0 ? 'text-green-400' : 'text-red-400'}`}>
{parseFloat(waistDiff) > 0 ? '+' : ''}{waistDiff}
</span>
)}
</span>
</div>
</div>
);
})}
</div>
</div>
)}
</div>
);
};


export default StatsTab;