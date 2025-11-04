import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  TrendingUp,
  Calendar,
  Dumbbell,
  Eye,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// 🔹 Typy
interface Set {
  weight: string;
  reps: string;
  rir: string;
}

interface Exercise {
  name: string;
  sets: Set[];
}

type WorkoutType = "PUSH" | "PULL" | "KONDYCJA";

interface Workout {
  id: number;
  type: WorkoutType;
  date: string;
  exercises: Exercise[];
  notes: string;
}

interface Measurement {
  date: string;
  weight: number;
  waist: number;
}

interface Tab {
  id: string;
  label: string;
  icon: React.FC<{ size?: number }>;
}

// 🔹 Szablony ćwiczeń
const workoutTemplates: Record<WorkoutType, string[]> = {
  PUSH: [
    "Przysiad Hack maszyna",
    "Przysiad bułgarski z hantlami",
    "Wyciskanie Hummer pozioma",
    "Wyciskanie hantli dodatnia",
  ],
  PULL: [
    "Martwy ciąg z haków",
    "Hip Thrust",
    "Uginanie nóg leżąc",
    "Ściąganie szeroki podchwyt",
    "Wiosłowanie kettlem",
  ],
  KONDYCJA: ["Wioślarz (m)", "Ski-erg (m)", "Rower (Cal)"],
};

const TrainingTracker = () => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "workout" | "history" | "stats">("dashboard");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
  const [viewingWorkout, setViewingWorkout] = useState<Workout | null>(null);

  // 🔹 Load data from window.storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const workoutsResult = await window.storage?.get("workouts");
        const measurementsResult = await window.storage?.get("measurements");
        if (workoutsResult?.value) setWorkouts(JSON.parse(workoutsResult.value));
        if (measurementsResult?.value) setMeasurements(JSON.parse(measurementsResult.value));
      } catch {
        console.warn("Brak danych w storage, startujemy świeżo");
      }
    };
    loadData();
  }, []);

  // 🔹 Save data to window.storage
  const saveData = async () => {
    try {
      if (!window.storage) throw new Error("Brak storage");
      await window.storage.set("workouts", JSON.stringify(workouts));
      await window.storage.set("measurements", JSON.stringify(measurements));
      alert("✅ Dane zapisane!");
    } catch (e: any) {
      alert("❌ Błąd zapisu: " + e.message);
    }
  };

  // 🔹 Start new workout
  const startWorkout = (type: WorkoutType) => {
    const newWorkout: Workout = {
      id: Date.now(),
      type,
      date: new Date().toISOString().split("T")[0],
      exercises: workoutTemplates[type].map((name) => ({ name, sets: [] })),
      notes: "",
    };
    setCurrentWorkout(newWorkout);
    setActiveTab("workout");
  };

  // 🔹 Add measurement
  const addMeasurement = () => {
    const date = prompt("Data pomiaru (YYYY-MM-DD):");
    const weight = parseFloat(prompt("Waga (kg):") || "");
    const waist = parseFloat(prompt("Talia (cm):") || "");
    if (date && !isNaN(weight) && !isNaN(waist)) {
      setMeasurements([...measurements, { date, weight, waist }]);
    }
  };

  // 🔹 Add / update / remove set
  const addSet = (exerciseIndex: number) => {
    if (!currentWorkout) return;
    const updated: Workout = { ...currentWorkout };
    updated.exercises[exerciseIndex].sets.push({ weight: "", reps: "", rir: "" });
    setCurrentWorkout(updated);
  };

  const updateSet = (exIdx: number, setIdx: number, field: keyof Set, value: string) => {
    if (!currentWorkout) return;
    const updated: Workout = { ...currentWorkout };
    updated.exercises[exIdx].sets[setIdx][field] = value;
    setCurrentWorkout(updated);
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    if (!currentWorkout) return;
    const updated: Workout = { ...currentWorkout };
    updated.exercises[exIdx].sets.splice(setIdx, 1);
    setCurrentWorkout(updated);
  };

  const finishWorkout = () => {
    if (!currentWorkout) return;
    setWorkouts([...workouts, currentWorkout]);
    setCurrentWorkout(null);
    setActiveTab("history");
    alert("✅ Trening zapisany!");
  };

  const deleteWorkout = (id: number) => {
    if (confirm("Usunąć ten trening?")) {
      setWorkouts(workouts.filter((w) => w.id !== id));
    }
  };

  const getLastWorkout = (type: WorkoutType) => workouts.filter((w) => w.type === type).slice(-1)[0];

  const tabs: Tab[] = [
    { id: "dashboard", label: "Start", icon: Dumbbell },
    { id: "workout", label: "Trening", icon: Plus },
    { id: "history", label: "Historia", icon: Calendar },
    { id: "stats", label: "Postępy", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            💪 Dziennik Treningowy
          </h1>
        </div>

        {/* Navigation */}
        <div className="flex gap-2 mb-6 justify-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-slate-800 rounded-xl shadow-2xl p-6">
          {/* Dashboard */}
          {activeTab === "dashboard" && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                {Object.keys(workoutTemplates).map((type) => {
                  const last = getLastWorkout(type as WorkoutType);
                  return (
                    <div key={type} className="bg-slate-700 p-4 rounded-lg hover:bg-slate-600">
                      <h3 className="text-xl font-bold mb-2">{type}</h3>
                      {last && (
                        <p className="text-slate-400 mb-2">
                          Ostatnio: {new Date(last.date).toLocaleDateString("pl-PL")}
                        </p>
                      )}
                      <button
                        onClick={() => startWorkout(type as WorkoutType)}
                        className="w-full bg-blue-600 py-2 rounded hover:bg-blue-700"
                      >
                        Rozpocznij
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex gap-4">
                <button
                  onClick={addMeasurement}
                  className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-700"
                >
                  Dodaj pomiar
                </button>
                <button
                  onClick={saveData}
                  className="bg-green-600 px-4 py-2 rounded hover:bg-green-700"
                >
                  Zapisz Dane
                </button>
              </div>
            </div>
          )}

          {/* Workout */}
          {activeTab === "workout" && (
            <div>
              {!currentWorkout ? (
                <div className="text-center py-12">
                  <Dumbbell size={64} className="mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-400">Wybierz trening z zakładki "Start"</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">{currentWorkout.type}</h2>
                    <button
                      onClick={finishWorkout}
                      className="bg-green-600 px-6 py-2 rounded hover:bg-green-700"
                    >
                      Zakończ Trening
                    </button>
                  </div>
                  {currentWorkout.exercises.map((ex, i) => (
                    <div key={i} className="bg-slate-700 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold">{ex.name}</h3>
                        <button
                          onClick={() => addSet(i)}
                          className="flex items-center gap-1 bg-blue-600 px-2 py-1 rounded hover:bg-blue-700 text-sm"
                        >
                          <Plus size={16} /> Seria
                        </button>
                      </div>
                      {ex.sets.map((s, j) => (
                        <div key={j} className="flex gap-2 items-center mb-2">
                          <input
                            type="number"
                            value={s.weight}
                            onChange={(e) => updateSet(i, j, "weight", e.target.value)}
                            placeholder="kg"
                            className="bg-slate-800 px-2 py-1 rounded w-16 text-center"
                          />
                          <input
                            type="number"
                            value={s.reps}
                            onChange={(e) => updateSet(i, j, "reps", e.target.value)}
                            placeholder="powt."
                            className="bg-slate-800 px-2 py-1 rounded w-16 text-center"
                          />
                          <input
                            type="number"
                            value={s.rir}
                            onChange={(e) => updateSet(i, j, "rir", e.target.value)}
                            placeholder="RIR"
                            className="bg-slate-800 px-2 py-1 rounded w-16 text-center"
                          />
                          <button
                            onClick={() => removeSet(i, j)}
                            className="ml-auto text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                  <textarea
                    value={currentWorkout.notes}
                    onChange={(e) =>
                      setCurrentWorkout({ ...currentWorkout, notes: e.target.value })
                    }
                    placeholder="Notatki..."
                    className="w-full bg-slate-700 p-2 rounded mt-2"
                  />
                </div>
              )}
            </div>
          )}

          {/* History */}
          {activeTab === "history" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Historia treningów</h2>
              {workouts.length === 0 && <p className="text-slate-400">Brak treningów</p>}
              {workouts
                .slice()
                .reverse()
                .map((w) => (
                  <div key={w.id} className="bg-slate-700 p-4 rounded mb-2">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-bold">{w.type}</p>
                        <p className="text-slate-400 text-sm">
                          {new Date(w.date).toLocaleDateString("pl-PL")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setViewingWorkout(w)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Eye size={20} />
                        </button>
                        <button
                          onClick={() => deleteWorkout(w.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Stats */}
          {activeTab === "stats" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Twoje Postępy</h2>

              {/* Summary */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-700 p-4 rounded">
                  <p className="text-slate-400 text-sm">Treningi łącznie</p>
                  <p className="text-3xl font-bold">{workouts.length}</p>
                </div>
                <div className="bg-slate-700 p-4 rounded">
                  <p className="text-slate-400 text-sm">Pomiarów łącznie</p>
                  <p className="text-3xl font-bold">{measurements.length}</p>
                </div>
                <div className="bg-slate-700 p-4 rounded">
                  <p className="text-slate-400 text-sm">Ostatnia waga</p>
                  <p className="text-3xl font-bold">
                    {measurements.length > 0 ? `${measurements[measurements.length - 1].weight} kg` : "—"}
                  </p>
                </div>
              </div>

              {/* Chart */}
              {measurements.length > 1 ? (
                <div className="bg-slate-700 p-4 rounded">
                  <h3 className="font-semibold mb-3">Progresja wagi i talii</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={measurements}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="#60a5fa"
                        strokeWidth={2}
                        name="Waga (kg)"
                      />
                      <Line
                        type="monotone"
                        dataKey="waist"
                        stroke="#f87171"
                        strokeWidth={2}
                        name="Talia (cm)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-slate-400">Brak wystarczających danych, dodaj więcej pomiarów.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingTracker;
