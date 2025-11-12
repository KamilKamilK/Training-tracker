import React from 'react';
import { Measurement } from '../../types/index.js';


interface Props {
measurements: Measurement[];
limit?: number;
}


const MeasurementsList: React.FC<Props> = ({ measurements, limit = 5 }) => {
const items = measurements.slice(-limit).reverse();


if (items.length === 0) {
return <p className="text-slate-400 text-center py-4">Brak pomiarów. Dodaj pierwszy!</p>;
}


return (
<div className="space-y-2">
{items.map((m, idx) => (
<div key={idx} className="flex justify-between bg-slate-600 p-3 rounded">
<span>{new Date(m.date).toLocaleDateString('pl-PL')}</span>
<span className="font-bold">{m.weight} kg | {m.waist} cm</span>
</div>
))}
</div>
);
};


export default MeasurementsList;