import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, TrendingUp, Calendar, Dumbbell, Eye, X } from 'lucide-react';

const TrainingTracker = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [workouts, setWorkouts] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [showExerciseModal, setShowExerciseModal] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const workoutsResult = await window.storage.get('workouts');
      const measurementsResult = await window.storage.get('measurements');
      
      if (workoutsResult?.value) {
        setWorkouts(JSON.parse(workoutsResult.value));
      }
      if (measurementsResult?.value) {
        setMeasurements(JSON.parse(measurementsResult.value));
      }
    } catch (error) {
      console.log('No existing data found, starting fresh');
    }
  };

  const saveData = async () => {
    try {
      await window.storage.set('workouts', JSON.stringify(workouts));
      await window.storage.set('measurements', JSON.stringify(measurements));
      alert('✅ Dane zapisane!');
    } catch (error) {
      alert('❌ Błąd zapisu: ' + error.message);
    }
  };

  const workoutTemplates = {
    PUSH: [
      'Przysiad Hack maszyna',
      'Przysiad bułgarski z hantlami',
      'Wyciskanie Hummer pozioma',
      'Wyciskanie hantli dodatnia',
      'Rozpiętki butterfly',
      'Wyciskanie hantli nad głowę',
      'Wznosy bokiem hantli',
      'Wspięcia na palce',
      'Triceps - górny wyciąg'
    ],
    PULL: [
      'Martwy ciąg z haków',
      'Hip Thrust',
      'Uginanie nóg leżąc',
      'Ściąganie szeroki podchwyt',
      'Ściąganie V-bloczek',
      'Wiosłowanie kettlem',
      'Face Pulls',
      'Biceps - młotek',
      'Triceps - francuskie',
      'Biceps - dolny wyciąg',
      'Triceps - górny wyciąg'
    ],
    KONDYCJA: [
      'Wioślarz (m)',
      'Ski-erg (m)',
      'Rower (Cal)',
      'AirBike (Cal)',
      'Pchanie sanek (m)',
      'AMRAP - rundy'
    ]
  };

  const startWorkout = (type) => {
    const newWorkout = {
      id: Date.now(),
      type,
      date: new Date().toISOString().split('T')[0],
      exercises: workoutTemplates[type].map(name => ({
        name,
        sets: []
      })),
      notes: ''
    };
    setCurrentWorkout(newWorkout);
    setActiveTab('workout');
  };

  const addSet = (exerciseIndex) => {
    const updated = { ...currentWorkout };
    updated.exercises[exerciseIndex].sets.push({
      weight: '',
      reps: '',
      rir: ''
    });
    setCurrentWorkout(updated);
  };

  const updateSet = (exerciseIndex, setIndex, field, value) => {
    const updated = { ...currentWorkout };
    updated.exercises[exerciseIndex].sets[setIndex][field] = value;
    setCurrentWorkout(updated);
  };

  const removeSet = (exerciseIndex, setIndex) => {
    const updated = { ...currentWorkout };
    updated.exercises[exerciseIndex].sets.splice(setIndex, 1);
    setCurrentWorkout(updated);
  };

  const finishWorkout = () => {
    if (!currentWorkout) return;
    
    const updatedWorkouts = [...workouts, currentWorkout];
    setWorkouts(updatedWorkouts);
    setCurrentWorkout(null);
    setActiveTab('history');
    alert('✅ Trening zapisany!');
  };

  const addMeasurement = () => {
    const date = prompt('Data pomiaru (YYYY-MM-DD):');
    if (!date) return;
    
    const weight = parseFloat(prompt('Waga (kg):'));
    const waist = parseFloat(prompt('Obwód talii (cm):'));
    
    if (weight && waist) {
      const newMeasurements = [...measurements, { date, weight, waist }];
      setMeasurements(newMeasurements);
    }
  };

  const deleteWorkout = (id) => {
    if (confirm('Usunąć ten trening?')) {
      setWorkouts(workouts.filter(w => w.id !== id));
    }
  };

  const getLastWorkout = (type) => {
    return workouts.filter(w => w.type === type).slice(-1)[0];
  };

  const [viewingWorkout, setViewingWorkout] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            💪 Dziennik Treningowy
          </h1>
          <p className="text-slate-400">Plan: Redukcja + Kondycja + Siła</p>
        </div>

        {/* Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'dashboard', label: 'Start', icon: Dumbbell },
            { id: 'workout', label: 'Trening', icon: Plus },
            { id: 'history', label: 'Historia', icon: Calendar },
            { id: 'stats', label: 'Postępy', icon: TrendingUp }
          ].map(tab => (
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

        {/* Content */}
        <div className="bg-slate-800 rounded-xl shadow-2xl p-6">
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Rozpocznij Trening</h2>
                <button
                  onClick={saveData}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium transition-all"
                >
                  <Save size={18} />
                  Zapisz Dane
                </button>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                {Object.keys(workoutTemplates).map(type => {
                  const last = getLastWorkout(type);
                  return (
                    <div key={type} className="bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-all">
                      <h3 className="text-xl font-bold mb-2">{type}</h3>
                      {last && (
                        <p className="text-sm text-slate-400 mb-3">
                          Ostatnio: {new Date(last.date).toLocaleDateString('pl-PL')}
                        </p>
                      )}
                      <button
                        onClick={() => startWorkout(type)}
                        className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded font-medium transition-all"
                      >
                        Rozpocznij
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="bg-slate-700 rounded-lg p-4 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Pomiary</h3>
                  <button
                    onClick={addMeasurement}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm transition-all"
                  >
                    <Plus size={16} />
                    Dodaj
                  </button>
                </div>
                {measurements.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">Brak pomiarów. Dodaj pierwszy!</p>
                ) : (
                  <div className="space-y-2">
                    {measurements.slice(-5).reverse().map((m, idx) => (
                      <div key={idx} className="flex justify-between bg-slate-600 p-3 rounded">
                        <span>{new Date(m.date).toLocaleDateString('pl-PL')}</span>
                        <span className="font-bold">{m.weight} kg | {m.waist} cm</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Workout */}
          {activeTab === 'workout' && (
            <div className="space-y-4">
              {!currentWorkout ? (
                <div className="text-center py-12">
                  <Dumbbell size={64} className="mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-400 text-lg">Wybierz trening z zakładki "Start"</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold">{currentWorkout.type}</h2>
                      <p className="text-slate-400">{new Date(currentWorkout.date).toLocaleDateString('pl-PL')}</p>
                    </div>
                    <button
                      onClick={finishWorkout}
                      className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-medium transition-all"
                    >
                      Zakończ Trening
                    </button>
                  </div>

                  <div className="space-y-4">
                    {currentWorkout.exercises.map((exercise, exIdx) => (
                      <div key={exIdx} className="bg-slate-700 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-bold text-lg">{exercise.name}</h3>
                          <button
                            onClick={() => addSet(exIdx)}
                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-all"
                          >
                            <Plus size={16} />
                            Seria
                          </button>
                        </div>
                        
                        {exercise.sets.length === 0 ? (
                          <p className="text-slate-500 text-center py-2">Dodaj pierwszą serię</p>
                        ) : (
                          <div className="space-y-2">
                            {exercise.sets.map((set, setIdx) => (
                              <div key={setIdx} className="flex gap-2 items-center bg-slate-600 p-2 rounded">
                                <span className="text-slate-400 w-8">#{setIdx + 1}</span>
                                <input
                                  type="number"
                                  placeholder="kg"
                                  value={set.weight}
                                  onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                                  className="w-20 bg-slate-700 border border-slate-500 rounded px-2 py-1 text-center"
                                />
                                <span className="text-slate-400">×</span>
                                <input
                                  type="number"
                                  placeholder="powt."
                                  value={set.reps}
                                  onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                                  className="w-20 bg-slate-700 border border-slate-500 rounded px-2 py-1 text-center"
                                />
                                <input
                                  type="number"
                                  placeholder="RIR"
                                  value={set.rir}
                                  onChange={(e) => updateSet(exIdx, setIdx, 'rir', e.target.value)}
                                  className="w-20 bg-slate-700 border border-slate-500 rounded px-2 py-1 text-center"
                                />
                                <button
                                  onClick={() => removeSet(exIdx, setIdx)}
                                  className="ml-auto text-red-400 hover:text-red-300"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-700 rounded-lg p-4">
                    <label className="block text-sm font-medium mb-2">Notatki</label>
                    <textarea
                      value={currentWorkout.notes}
                      onChange={(e) => setCurrentWorkout({...currentWorkout, notes: e.target.value})}
                      className="w-full bg-slate-600 border border-slate-500 rounded p-2 min-h-20"
                      placeholder="Samopoczucie, trudności, osiągnięcia..."
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* History */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-4">Historia Treningów</h2>
              {workouts.length === 0 ? (
                <p className="text-slate-400 text-center py-12">Brak treningów. Rozpocznij pierwszy!</p>
              ) : (
                <div className="space-y-3">
                  {[...workouts].reverse().map((workout) => (
                    <div key={workout.id} className="bg-slate-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-lg">{workout.type}</h3>
                          <p className="text-slate-400 text-sm">
                            {new Date(workout.date).toLocaleDateString('pl-PL')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setViewingWorkout(workout)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Eye size={20} />
                          </button>
                          <button
                            onClick={() => deleteWorkout(workout.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-slate-400">
                        {workout.exercises.filter(e => e.sets.length > 0).length} ćwiczeń ·{' '}
                        {workout.exercises.reduce((sum, e) => sum + e.sets.length, 0)} serii
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Twoje Postępy</h2>
              
              {/* Summary cards */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="text-slate-400 text-sm mb-2">Treningi Łącznie</h3>
                  <p className="text-3xl font-bold">{workouts.length}</p>
                </div>
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="text-slate-400 text-sm mb-2">Ten Miesiąc</h3>
                  <p className="text-3xl font-bold">
                    {workouts.filter(w => {
                      const date = new Date(w.date);
                      const now = new Date();
                      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="text-slate-400 text-sm mb-2">Ten Tydzień</h3>
                  <p className="text-3xl font-bold">
                    {workouts.filter(w => {
                      const date = new Date(w.date);
                      const now = new Date();
                      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                      return date >= weekAgo;
                    }).length}
                  </p>
                </div>
              </div>

              {/* Weight progression */}
              {measurements.length > 1 && (
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-4">Progresja Wagi i Talii</h3>
                  <div className="space-y-2">
                    {measurements.slice(-10).map((m, idx) => {
                      const prev = measurements[measurements.indexOf(m) - 1];
                      const weightDiff = prev ? (m.weight - prev.weight).toFixed(1) : 0;
                      const waistDiff = prev ? (m.waist - prev.waist).toFixed(1) : 0;
                      
                      return (
                        <div key={idx} className="flex justify-between items-center bg-slate-600 p-3 rounded">
                          <span className="text-slate-300">{new Date(m.date).toLocaleDateString('pl-PL')}</span>
                          <div className="flex gap-4">
                            <span className="font-bold">
                              {m.weight} kg
                              {prev && (
                                <span className={`ml-2 text-sm ${weightDiff < 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {weightDiff > 0 ? '+' : ''}{weightDiff}
                                </span>
                              )}
                            </span>
                            <span className="font-bold">
                              {m.waist} cm
                              {prev && (
                                <span className={`ml-2 text-sm ${waistDiff < 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {waistDiff > 0 ? '+' : ''}{waistDiff}
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

              {/* Workout distribution */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-4">Rozkład Treningów</h3>
                <div className="space-y-2">
                  {Object.keys(workoutTemplates).map(type => {
                    const count = workouts.filter(w => w.type === type).length;
                    const percentage = workouts.length > 0 ? (count / workouts.length * 100).toFixed(0) : 0;
                    return (
                      <div key={type} className="flex items-center gap-3">
                        <span className="w-24 text-slate-300">{type}</span>
                        <div className="flex-1 bg-slate-600 rounded-full h-6 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full flex items-center justify-end pr-2 text-xs font-bold"
                            style={{ width: `${percentage}%` }}
                          >
                            {percentage > 10 && `${count} (${percentage}%)`}
                          </div>
                        </div>
                        {percentage <= 10 && (
                          <span className="text-sm text-slate-400 w-16">{count} ({percentage}%)</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Workout Detail Modal */}
        {viewingWorkout && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{viewingWorkout.type}</h2>
                  <p className="text-slate-400">{new Date(viewingWorkout.date).toLocaleDateString('pl-PL')}</p>
                </div>
                <button
                  onClick={() => setViewingWorkout(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {viewingWorkout.exercises.filter(e => e.sets.length > 0).map((exercise, idx) => (
                  <div key={idx} className="bg-slate-700 rounded-lg p-4">
                    <h3 className="font-bold mb-3">{exercise.name}</h3>
                    <div className="space-y-2">
                      {exercise.sets.map((set, setIdx) => (
                        <div key={setIdx} className="flex gap-3 text-sm bg-slate-600 p-2 rounded">
                          <span className="text-slate-400">Seria {setIdx + 1}:</span>
                          <span className="font-bold">{set.weight} kg × {set.reps} powt.</span>
                          {set.rir && <span className="text-slate-400">RIR: {set.rir}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {viewingWorkout.notes && (
                <div className="bg-slate-700 rounded-lg p-4 mt-4">
                  <h3 className="font-bold mb-2">Notatki</h3>
                  <p className="text-slate-300">{viewingWorkout.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-slate-500 text-sm">
          <p>💾 Dane są automatycznie zapisywane w przeglądarce</p>
          <p className="mt-1">Pamiętaj regularnie eksportować kopię zapasową!</p>
        </div>
      </div>
    </div>
  );
};

export default TrainingTracker;