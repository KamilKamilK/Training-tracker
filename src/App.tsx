import { useState, useEffect } from "react";

type WorkoutType = "PUSH" | "PULL" | "KONDYCJA";

interface Set {
  weight: string;
  reps: string;
  rir: string;
}

interface Exercise {
  name: string;
  sets: Set[];
}

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

const workoutTemplates: Record<WorkoutType, string[]> = {
  PUSH: [
    "Przysiad Hack maszyna",
    "Przysiad bułgarski z hantlami",
    "Wyciskanie Hummer pozioma",
  ],
  PULL: [
    "Martwy ciąg z haków",
    "Ściąganie szeroki podchwyt",
    "Wiosłowanie hantlem",
  ],
  KONDYCJA: ["Wioślarz (m)", "Ski-erg (m)", "AirBike (Cal)"],
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);

  // 🔹 Ładowanie danych z localStorage
  useEffect(() => {
    try {
      const w = localStorage.getItem("workouts");
      const m = localStorage.getItem("measurements");
      if (w) setWorkouts(JSON.parse(w));
      if (m) setMeasurements(JSON.parse(m));
    } catch (e) {
      console.warn("Błąd przy ładowaniu danych:", e);
    }
  }, []);

  // 🔹 Zapisywanie danych
  const saveData = () => {
    localStorage.setItem("workouts", JSON.stringify(workouts));
    localStorage.setItem("measurements", JSON.stringify(measurements));
    alert("✅ Dane zapisane!");
  };

  // 🔹 Rozpoczęcie nowego treningu
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

  // 🔹 Dodawanie serii
  const addSet = (exerciseIndex: number) => {
    if (!currentWorkout) return;
    const updated = structuredClone(currentWorkout);
    updated.exercises[exerciseIndex].sets.push({ weight: "", reps: "", rir: "" });
    setCurrentWorkout(updated);
  };

  // 🔹 Edycja serii
  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: keyof Set,
    value: string
  ) => {
    if (!currentWorkout) return;
    const updated = structuredClone(currentWorkout);
    updated.exercises[exerciseIndex].sets[setIndex][field] = value;
    setCurrentWorkout(updated);
  };

  // 🔹 Zakończenie treningu
  const finishWorkout = () => {
    if (!currentWorkout) return;
    setWorkouts((prev) => [...prev, currentWorkout]);
    setCurrentWorkout(null);
    setActiveTab("history");
    alert("✅ Trening zapisany!");
  };

  // 🔹 Pomiar
  const addMeasurement = () => {
    const date = prompt("Data pomiaru (YYYY-MM-DD):") || "";
    const weightStr = prompt("Waga (kg):") || "0";
    const waistStr = prompt("Talia (cm):") || "0";
    const weight = parseFloat(weightStr);
    const waist = parseFloat(waistStr);
    if (date && weight && waist) {
      setMeasurements((prev) => [...prev, { date, weight, waist }]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">
          💪 Dziennik Treningowy
        </h1>

        <div className="flex gap-2 justify-center mb-4">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-3 py-2 rounded ${
              activeTab === "dashboard" ? "bg-blue-600" : "bg-slate-700"
            }`}
          >
            Start
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-3 py-2 rounded ${
              activeTab === "history" ? "bg-blue-600" : "bg-slate-700"
            }`}
          >
            Historia
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-3 py-2 rounded ${
              activeTab === "stats" ? "bg-blue-600" : "bg-slate-700"
            }`}
          >
            Statystyki
          </button>
        </div>

        {activeTab === "dashboard" && (
          <div className="flex flex-col gap-3">
            {(["PUSH", "PULL", "KONDYCJA"] as WorkoutType[]).map((type) => (
              <button
                key={type}
                onClick={() => startWorkout(type)}
                className="bg-blue-500 hover:bg-blue-600 py-3 rounded-lg"
              >
                Rozpocznij {type}
              </button>
            ))}
            <button
              onClick={addMeasurement}
              className="bg-green-500 hover:bg-green-600 py-3 rounded-lg"
            >
              Dodaj pomiar
            </button>
            <button
              onClick={saveData}
              className="bg-purple-500 hover:bg-purple-600 py-3 rounded-lg"
            >
              Zapisz dane
            </button>
          </div>
        )}

        {activeTab === "workout" && currentWorkout && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">
              Trening {currentWorkout.type} ({currentWorkout.date})
            </h2>
            {currentWorkout.exercises.map((ex, i) => (
              <div key={i} className="mb-6">
                <h3 className="text-xl mb-2">{ex.name}</h3>
                {ex.sets.map((s, j) => (
                  <div key={j} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="kg"
                      value={s.weight}
                      onChange={(e) =>
                        updateSet(i, j, "weight", e.target.value)
                      }
                      className="bg-slate-800 rounded p-1 w-16 text-center"
                    />
                    <input
                      type="text"
                      placeholder="powt."
                      value={s.reps}
                      onChange={(e) => updateSet(i, j, "reps", e.target.value)}
                      className="bg-slate-800 rounded p-1 w-16 text-center"
                    />
                    <input
                      type="text"
                      placeholder="RIR"
                      value={s.rir}
                      onChange={(e) => updateSet(i, j, "rir", e.target.value)}
                      className="bg-slate-800 rounded p-1 w-16 text-center"
                    />
                  </div>
                ))}
                <button
                  onClick={() => addSet(i)}
                  className="bg-slate-700 px-3 py-1 rounded"
                >
                  + seria
                </button>
              </div>
            ))}
            <button
              onClick={finishWorkout}
              className="bg-green-600 hover:bg-green-700 w-full py-3 rounded-lg"
            >
              Zakończ trening
            </button>
          </div>
        )}

        {activeTab === "history" && (
          <div>
            <h2 className="text-2xl mb-4 font-semibold">Historia treningów</h2>
            {workouts.length === 0 && <p>Brak zapisanych treningów.</p>}
            {workouts.map((w) => (
              <div
                key={w.id}
                className="border border-slate-700 rounded p-3 mb-3"
              >
                <p>
                  {w.type} — {w.date}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
