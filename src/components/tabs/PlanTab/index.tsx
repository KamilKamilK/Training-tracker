// components/tabs/PlanTab/index.tsx
import React from "react";
import { Save, Trash2, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { DayOfWeek, WorkoutTemplate } from "../../../types/index.js";
import { useWeekPlan } from "../../../hooks/useWeekPlan.js";
import { ErrorBanner } from "../../common/ErrorBanner.js";

interface PlanTabProps {
  templates: WorkoutTemplate[];
}

const daysConfig = [
  { id: 'monday' as DayOfWeek, label: 'Poniedziałek', short: 'Pon' },
  { id: 'tuesday' as DayOfWeek, label: 'Wtorek', short: 'Wt' },
  { id: 'wednesday' as DayOfWeek, label: 'Środa', short: 'Śr' },
  { id: 'thursday' as DayOfWeek, label: 'Czwartek', short: 'Czw' },
  { id: 'friday' as DayOfWeek, label: 'Piątek', short: 'Pt' },
  { id: 'saturday' as DayOfWeek, label: 'Sobota', short: 'Sob' },
  { id: 'sunday' as DayOfWeek, label: 'Niedziela', short: 'Nd' }
];

export const PlanTab: React.FC<PlanTabProps> = ({ templates }) => {
  const {
    weekPlan,
    isLoading,
    isSaving,
    lastSaved,
    error,
    clearError,
    updateDay,
    clearDay,
    clearAllDays,
    saveWeekPlan,
    getStats
  } = useWeekPlan();

  const handleUpdateDay = async (day: DayOfWeek, templateId: string) => {
    const value = templateId === "" ? null : templateId;
    await updateDay(day, value);
  };

  const handleClearDay = async (day: DayOfWeek) => {
    if (window.confirm(`Usunąć trening z dnia ${daysConfig.find(d => d.id === day)?.label}?`)) {
      await clearDay(day);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Czy na pewno chcesz wyczyścić cały plan tygodniowy?')) {
      const success = await clearAllDays();
      if (success) {
        alert('✅ Plan wyczyszczony');
      }
    }
  };

  const getTemplateById = (id: string | null) => {
    if (!id) return null;
    return templates.find(t => t.id === id);
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <RefreshCw size={64} className="mx-auto text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400">Ładowanie planu z Firebase...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <ErrorBanner message={error} onDismiss={clearError} />}

      {/* Header z akcjami */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">📅 Plan Treningowy</h2>
          <div className="flex items-center gap-3 text-xs">
            {lastSaved && (
              <p className="text-slate-400">
                Ostatni zapis: {new Date(lastSaved).toLocaleString('pl-PL')}
              </p>
            )}
            {isSaving && (
              <span className="flex items-center gap-1 text-blue-400">
                <RefreshCw size={12} className="animate-spin" />
                Zapisywanie...
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={saveWeekPlan}
            disabled={isSaving}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded-lg font-medium text-sm transition-all"
          >
            <Save size={16} />
            {isSaving ? 'Zapisywanie...' : 'Zapisz Plan'}
          </button>
          
          <button
            onClick={handleClearAll}
            disabled={isSaving}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-2 rounded-lg font-medium text-sm transition-all"
          >
            <Trash2 size={16} />
            Wyczyść
          </button>
        </div>
      </div>

      {/* Statystyki planu */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={20} className="text-green-400" />
            <span className="text-slate-400 text-sm">Dni treningowe</span>
          </div>
          <p className="text-2xl font-bold">{stats.activeDays}</p>
        </div>
        
        <div className="bg-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw size={20} className="text-blue-400" />
            <span className="text-slate-400 text-sm">Dni odpoczynku</span>
          </div>
          <p className="text-2xl font-bold">{stats.restDays}</p>
        </div>
        
        <div className="bg-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={20} className="text-purple-400" />
            <span className="text-slate-400 text-sm">Obciążenie</span>
          </div>
          <p className="text-2xl font-bold">{stats.workloadPercentage}%</p>
        </div>
      </div>

      {/* Plan tygodniowy */}
      <div className="bg-slate-700 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-blue-400">
            📆 Układ Tygodniowy
          </h3>
          <div className="flex items-center gap-2 text-xs text-green-400">
            <Save size={14} />
            <span>Auto-save do Firebase</span>
          </div>
        </div>

        <div className="space-y-3">
          {daysConfig.map(({ id, label }) => {
            const selectedTemplate = getTemplateById(weekPlan[id]);
            
            return (
              <div
                key={id}
                className="flex flex-col md:flex-row md:items-center gap-3 bg-slate-600 p-4 rounded-lg"
              >
                <span className="font-bold capitalize w-32 text-slate-200">
                  {label}
                </span>

                <div className="flex-1">
                  <select
                    className="w-full bg-slate-800 border border-slate-500 p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={weekPlan[id] ?? ""}
                    onChange={e => handleUpdateDay(id, e.target.value)}
                    disabled={isSaving}
                  >
                    <option value="">🛌 Odpoczynek</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.icon} {t.name} ({t.estimatedDuration} min)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Akcje dla dnia */}
                <div className="flex gap-2">
                  {selectedTemplate && (
                    <button
                      onClick={() => handleClearDay(id)}
                      disabled={isSaving}
                      className="p-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded transition-all"
                      title="Usuń"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Podgląd wybranego treningu */}
                {selectedTemplate && (
                  <div className="md:ml-4 text-xs text-slate-400 flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${selectedTemplate.color}`}></span>
                    <span>{selectedTemplate.exercises.length} ćwiczeń</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Podgląd treningów */}
      <div className="bg-slate-700 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4 text-blue-400">🔍 Dostępne Szablony</h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <div key={t.id} className={`${t.color} rounded-lg p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{t.icon}</span>
                <h4 className="font-bold">{t.name}</h4>
              </div>
              <p className="text-sm opacity-90 mb-3">{t.description}</p>
              
              <div className="text-xs opacity-75 mb-2">
                ⏱️ {t.estimatedDuration} min | 📊 {t.exercises.length} ćwiczeń
              </div>
              
              <div className="space-y-1">
                <p className="text-xs opacity-80 font-semibold">Przykładowe:</p>
                <ul className="text-xs opacity-75 space-y-1 ml-2">
                  {t.exercises.slice(0, 3).map((ex, idx) => (
                    <li key={idx}>• {ex.substring(0, 40)}{ex.length > 40 ? '...' : ''}</li>
                  ))}
                  {t.exercises.length > 3 && (
                    <li className="italic">
                      ... +{t.exercises.length - 3} więcej
                    </li>
                  )}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wskazówki i rekomendacje */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">💡 Wskazówki Planowania</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-bold mb-2 text-green-400">✅ Dobre praktyki:</h4>
            <ul className="space-y-2 text-sm text-slate-200">
              <li>• 3-5 treningów w tygodniu dla większości osób</li>
              <li>• Min. 48h przerwy między tą samą partią mięśniową</li>
              <li>• 1-2 dni całkowitego odpoczynku w tygodniu</li>
              <li>• Regularność ważniejsza niż intensywność</li>
              <li>• Słuchaj swojego ciała i regeneruj się</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-2 text-orange-400">⚠️ Unikaj:</h4>
            <ul className="space-y-2 text-sm text-slate-200">
              <li>• Trenowania 7 dni w tygodniu bez przerwy</li>
              <li>• Tej samej partii 2 dni z rzędu</li>
              <li>• Zbyt dużo cardio podczas budowania masy</li>
              <li>• Treningu na silnych zakwasach</li>
              <li>• Ignorowania sygnałów o przeciążeniu</li>
            </ul>
          </div>
        </div>

        {stats.workloadPercentage > 70 && (
          <div className="mt-4 bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-4">
            <p className="text-yellow-200 text-sm flex items-center gap-2">
              <AlertCircle size={20} />
              <strong>Uwaga:</strong> Twój plan ma obciążenie powyżej 70%. Upewnij się, że Twoja regeneracja jest na wysokim poziomie!
            </p>
          </div>
        )}
      </div>

      {/* Info o zapisie */}
      <div className="text-center text-slate-500 text-sm">
        <p>💾 Plan jest automatycznie zapisywany do Firebase po każdej zmianie</p>
      </div>
    </div>
  );
};