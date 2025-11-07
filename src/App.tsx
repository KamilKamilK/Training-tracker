import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, TrendingUp, Calendar, Dumbbell, Eye, X } from 'lucide-react';

interface WorkoutSet {
  weight: string;
  reps: string;
  rir: string;
}

interface Exercise {
  name: string;
  sets: WorkoutSet[];
}

interface Workout {
  id: number;
  type: string;
  date: string;
  exercises: Exercise[];
  notes: string;
}

interface Measurement {
  date: string;
  weight: number;
  waist: number;
}

const TrainingTracker = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
  const [viewingWorkout, setViewingWorkout] = useState<Workout | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!window.storage) return;
    
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
      console.log('Brak zapisanych danych, zaczynam od nowa');
    }
  };

  const saveData = async () => {
    if (!window.storage) {
      alert('❌ Storage nie jest dostępny');
      return;
    }
    
    try {
      await window.storage.set('workouts', JSON.stringify(workouts));
      await window.storage.set('measurements', JSON.stringify(measurements));
      alert('✅ Dane zapisane!');
    } catch (error) {
      const err = error as Error;
      alert('❌ Błąd zapisu: ' + err.message);
    }
  };

  const workoutTemplates: Record<string, string[]> = {
    PUSH: [
      '1. Przysiad Hack maszyna',
      '2. Wyciskanie Hummer pozioma',
      '3. Wyciskanie hantli nad głowę',
      '4. Przysiad bułgarski',
      '5. Wspięcia na palce',
      '6. Wznosy bokiem hantli',
      '7. Wyciskanie hantli dodatnia',
      '8. Rozpiętki butterfly',
      'Plank (2x MAX)',
      'Triceps - górny wyciąg'
    ],
    PULL: [
      '1. Martwy ciąg z haków',
      '2. Ściąganie szeroki podchwyt',
      '3. Wiosłowanie kettlem',
      '4. Ściąganie V-bloczek',
      '5. Uginanie nóg leżąc',
      '6. Hip Thrust',
      '7. Face Pulls',
      '8. Biceps - młotek',
      '8. Triceps - francuskie',
      '9. Biceps - dolny wyciąg',
      '9. Triceps - górny wyciąg',
      'AirBike 30Cal'
    ],
    KONDYCJA: [
      'Rower 10Cal (4 rundy)',
      'Ski-erg 250m (4 rundy)',
      'AMRAP - Sit-up x15',
      'AMRAP - Martwy ciąg kettla x15',
      'AMRAP - Wioślarz 500m',
      'AMRAP - Rundy total',
      'Pchanie sanek 20m',
      'Przyciąganie sanek 20m',
      'Wyciskanie klatka 14/10',
      'Wykroki 20m worek 10kg',
      'Core - Plank 60s',
      'Core - Dead Bug x20',
      'Core - Russian Twist x40'
    ]
  };

  const startWorkout = (type: string) => {
    const newWorkout: Workout = {
      id: Date.now(),
      type: type,
      date: new Date().toISOString().split('T')[0],
      exercises: workoutTemplates[type].map(name => ({
        name: name,
        sets: []
      })),
      notes: ''
    };
    setCurrentWorkout(newWorkout);
    setActiveTab('workout');
  };

  const addSet = (exerciseIndex: number) => {
    if (!currentWorkout) return;
    const updated = { ...currentWorkout };
    updated.exercises[exerciseIndex].sets.push({
      weight: '',
      reps: '',
      rir: ''
    });
    setCurrentWorkout(updated);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: keyof WorkoutSet, value: string) => {
    if (!currentWorkout) return;
    const updated = { ...currentWorkout };
    updated.exercises[exerciseIndex].sets[setIndex][field] = value;
    setCurrentWorkout(updated);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    if (!currentWorkout) return;
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
    
    const weightStr = prompt('Waga (kg):');
    const waistStr = prompt('Obwód talii (cm):');
    
    if (!weightStr || !waistStr) return;
    
    const weight = parseFloat(weightStr);
    const waist = parseFloat(waistStr);
    
    if (weight && waist) {
      const newMeasurements = [...measurements, { date, weight, waist }];
      setMeasurements(newMeasurements);
    }
  };

  const deleteWorkout = (id: number) => {
    if (window.confirm('Usunąć ten trening?')) {
      setWorkouts(workouts.filter(w => w.id !== id));
    }
  };

  const getLastWorkout = (type: string): Workout | undefined => {
    return workouts.filter(w => w.type === type).slice(-1)[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            💪 Dziennik Treningowy
          </h1>
          <p className="text-slate-400">Plan: Redukcja + Kondycja + Siła</p>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'dashboard', label: 'Start', icon: Dumbbell },
            { id: 'plan', label: 'Plan', icon: Calendar },
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

        <div className="bg-slate-800 rounded-xl shadow-2xl p-6">
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

          {activeTab === 'plan' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Plan Treningowy</h2>
              
              <div className="bg-slate-700 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-blue-400">📅 Układ Tygodniowy</h3>
                <div className="space-y-2">
                  {[
                    { day: 'Poniedziałek', activity: 'PUSH', duration: '75 min', color: 'bg-red-600' },
                    { day: 'Wtorek', activity: 'Basen', duration: '45-60 min', color: 'bg-blue-600' },
                    { day: 'Środa', activity: 'Odpoczynek', duration: '-', color: 'bg-slate-600' },
                    { day: 'Czwartek', activity: 'PULL', duration: '75 min', color: 'bg-green-600' },
                    { day: 'Piątek', activity: 'Basen', duration: '45-60 min', color: 'bg-blue-600' },
                    { day: 'Sobota', activity: 'KONDYCJA', duration: '60 min', color: 'bg-purple-600' },
                    { day: 'Niedziela', activity: 'Odpoczynek', duration: '-', color: 'bg-slate-600' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-slate-600 p-3 rounded">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="font-bold w-32">{item.day}</span>
                      <span className="flex-1">{item.activity}</span>
                      <span className="text-slate-400 text-sm">{item.duration}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <span className="text-2xl">💪</span>
                    PUSH
                  </h3>
                  <p className="text-sm text-slate-400 mb-3">Klatka + Barki + Nogi Przednie</p>
                  <ul className="text-sm space-y-1 text-slate-300">
                    {workoutTemplates.PUSH.map((ex, i) => (
                      <li key={i}>• {ex}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <span className="text-2xl">🏋️</span>
                    PULL
                  </h3>
                  <p className="text-sm text-slate-400 mb-3">Plecy + Nogi Tylne + Ręce</p>
                  <ul className="text-sm space-y-1 text-slate-300">
                    {workoutTemplates.PULL.map((ex, i) => (
                      <li key={i}>• {ex}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <span className="text-2xl">🔥</span>
                    KONDYCJA
                  </h3>
                  <p className="text-sm text-slate-400 mb-3">Funkcjonalność + Core</p>
                  <ul className="text-sm space-y-1 text-slate-300">
                    {workoutTemplates.KONDYCJA.map((ex, i) => (
                      <li key={i}>• {ex}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-slate-700 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-purple-400">🎯 Kluczowe Zasady</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-bold mb-2 text-green-400">✅ Rób:</h4>
                    <ul className="text-sm space-y-1 text-slate-300">
                      <li>• Zwiększaj ciężary co tydzień (+2.5-5kg)</li>
                      <li>• Notuj każdy trening</li>
                      <li>• Śpij 7-9h każdej nocy</li>
                      <li>• Jedz 1.8-2.2g białka/kg</li>
                      <li>• Mierz się raz w tygodniu</li>
                      <li>• Deficyt -300 do -500 kcal</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2 text-red-400">❌ Unikaj:</h4>
                    <ul className="text-sm space-y-1 text-slate-300">
                      <li>• Treningu więcej niż 3x siłownia</li>
                      <li>• Za dużo cardio (utrata mięśni)</li>
                      <li>• Alkoholu podczas redukcji</li>
                      <li>• Pomijania rozgrzewki</li>
                      <li>• Treningu na zakwasach {'>'} 4 dni</li>
                      <li>• Głodówki (wolny metabolizm)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">💡 Wskazówki Pro</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>RIR (Reps In Reserve):</strong> Ile powtórzeń zostało do wyczerpania. RIR 2 = mogłeś zrobić jeszcze 2.</p>
                  <p><strong>Progresja:</strong> Najważniejsza rzecz! Bez progresji = brak wzrostu.</p>
                  <p><strong>Brzuch:</strong> Nie ma spalania miejscowego. Schudniesz ogólnie, z brzucha ostatni.</p>
                  <p><strong>Basen:</strong> Świetna regeneracja aktywna + spalanie kalorii bez stresu dlastawów.</p>
                  <p><strong>Deload:</strong> Co 8-12 tygodni zrób tydzień z 50-60% objętości.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workout' && (
            <div className="space-y-4">
              {!currentWorkout ? (
                <div className="text-center py-12">
                  <Dumbbell size={64} className="mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-400 text-lg">Wybierz trening z zakładki &quot;Start&quot;</p>
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

          {activeTab === 'stats' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Twoje Postępy</h2>
              
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

              {measurements.length > 1 && (
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-4">Progresja Wagi i Talii</h3>
                  <div className="space-y-2">
                    {measurements.slice(-10).map((m, idx) => {
                      const allMeasurements = measurements;
                      const currentIndex = allMeasurements.indexOf(m);
                      const prev = currentIndex > 0 ? allMeasurements[currentIndex - 1] : null;
                      const weightDiff = prev ? (m.weight - prev.weight).toFixed(1) : '0';
                      const waistDiff = prev ? (m.waist - prev.waist).toFixed(1) : '0';
                      
                      return (
                        <div key={idx} className="flex justify-between items-center bg-slate-600 p-3 rounded">
                          <span className="text-slate-300">{new Date(m.date).toLocaleDateString('pl-PL')}</span>
                          <div className="flex gap-4">
                            <span className="font-bold">
                              {m.weight} kg
                              {prev && (
                                <span className={`ml-2 text-sm ${parseFloat(weightDiff) < 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {parseFloat(weightDiff) > 0 ? '+' : ''}{weightDiff}
                                </span>
                              )}
                            </span>
                            <span className="font-bold">
                              {m.waist} cm
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

              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-4">Rozkład Treningów</h3>
                <div className="space-y-2">
                  {Object.keys(workoutTemplates).map(type => {
                    const count = workouts.filter(w => w.type === type).length;
                    const percentage = workouts.length > 0 ? (count / workouts.length * 100).toFixed(0) : '0';
                    return (
                      <div key={type} className="flex items-center gap-3">
                        <span className="w-24 text-slate-300">{type}</span>
                        <div className="flex-1 bg-slate-600 rounded-full h-6 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full flex items-center justify-end pr-2 text-xs font-bold"
                            style={{ width: `${percentage}%` }}
                          >
                            {parseInt(percentage) > 10 && `${count} (${percentage}%)`}
                          </div>
                        </div>
                        {parseInt(percentage) <= 10 && (
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

        <div className="mt-6 text-center text-slate-500 text-sm">
          <p>💾 Dane są zapisywane automatycznie</p>
          <p className="mt-1">Pamiętaj klikać &quot;Zapisz Dane&quot; regularnie!</p>
        </div>
      </div>
    </div>
  );
};

export default TrainingTracker;