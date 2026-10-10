import React, { useState } from 'react';
import { Plus, Edit, Trash2, Copy, Save, X } from 'lucide-react';
import { WorkoutTemplate } from '../../../types/index.js';
import { TemplateInputErrors, validateTemplateInput } from '../../../utils/validation.utils.js';

interface TemplatesTabProps {
  templates: WorkoutTemplate[];
  defaultTemplates: WorkoutTemplate[];
  customTemplates: WorkoutTemplate[];
  onAddTemplate: (template: WorkoutTemplate) => void;
  onUpdateTemplate: (template: WorkoutTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onDuplicateTemplate: (id: string) => void;
}

export const TemplatesTab: React.FC<TemplatesTabProps> = ({
  defaultTemplates,
  customTemplates,
  onAddTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onDuplicateTemplate
}) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [errors, setErrors] = useState<TemplateInputErrors>({});

  const [formData, setFormData] = useState<WorkoutTemplate>({
    id: '',
    name: '',
    description: '',
    category: 'strength',
    estimatedDuration: 45,
    difficulty: 'beginner',
    color: 'bg-blue-600',
    icon: '💪',
    exercises: [],
    isCustom: true,
    createdAt: new Date().toISOString(),
  });

  const handleInputChange = <K extends keyof WorkoutTemplate>(field: K, value: WorkoutTemplate[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleExerciseChange = (index: number, value: string) => {
    const newExercises = [...formData.exercises];
    newExercises[index] = value;
    setFormData(prev => ({ ...prev, exercises: newExercises }));
  };

  const addExerciseField = () => {
    setFormData(prev => ({ ...prev, exercises: [...prev.exercises, ''] }));
  };

  const removeExerciseField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index),
    }));
  };

  const resetForm = () => {
    setEditingTemplate(null);
    setErrors({});
    setFormData({
      id: '',
      name: '',
      description: '',
      category: 'strength',
      estimatedDuration: 45,
      difficulty: 'beginner',
      color: 'bg-blue-600',
      icon: '💪',
      exercises: [],
      isCustom: true,
      createdAt: new Date().toISOString(),
    });
    setIsFormVisible(false);
  };

  const handleSubmit = () => {
    const result = validateTemplateInput(formData);
    if ('errors' in result) {
      setErrors(result.errors);
      return;
    }

    const template = { ...formData, ...result };
    if (editingTemplate) {
      onUpdateTemplate(template);
    } else {
      onAddTemplate({ ...template, id: Date.now().toString() });
    }

    resetForm();
  };

  const handleEdit = (template: WorkoutTemplate) => {
    setEditingTemplate(template);
    setFormData(template);
    setErrors({});
    setIsFormVisible(true);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">🧩 Szablony Treningów</h2>
        <button
          onClick={() => setIsFormVisible(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-all"
        >
          <Plus size={18} />
          Nowy Szablon
        </button>
      </div>

      {/* FORMULARZ */}
      {isFormVisible && (
        <div className="bg-slate-700 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">
            {editingTemplate ? '✏️ Edytuj Szablon' : '➕ Nowy Szablon'}
          </h3>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="template-name" className="block text-sm mb-1 text-slate-300">Nazwa</label>
              <input
                id="template-name"
                type="text"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? 'template-name-error' : undefined}
                className="w-full bg-slate-800 rounded-lg p-2 outline-none border border-slate-600 focus:border-blue-500"
              />
              {errors.name && (
                <p id="template-name-error" className="text-red-400 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm mb-1 text-slate-300">Ikona (emoji)</label>
              <input
                type="text"
                value={formData.icon ?? ''}
                onChange={e => handleInputChange('icon', e.target.value)}
                className="w-full bg-slate-800 rounded-lg p-2 outline-none border border-slate-600 focus:border-blue-500"
                maxLength={2}
              />
            </div>

            <div>
              <label className="block text-sm mb-1 text-slate-300">Kategoria</label>
              <select
                value={formData.category}
                onChange={e => handleInputChange('category', e.target.value as WorkoutTemplate['category'])}
                className="w-full bg-slate-800 rounded-lg p-2 border border-slate-600 focus:border-blue-500"
              >
                <option value="strength">Siła</option>
                <option value="cardio">Cardio</option>
                <option value="hybrid">Hybrydowy</option>
                <option value="custom">Inny</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 text-slate-300">Poziom</label>
              <select
                value={formData.difficulty}
                onChange={e => handleInputChange('difficulty', e.target.value as WorkoutTemplate['difficulty'])}
                className="w-full bg-slate-800 rounded-lg p-2 border border-slate-600 focus:border-blue-500"
              >
                <option value="beginner">Początkujący</option>
                <option value="intermediate">Średniozaawansowany</option>
                <option value="advanced">Zaawansowany</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 text-slate-300">Czas (minuty)</label>
              <input
                type="number"
                value={formData.estimatedDuration}
                onChange={e => handleInputChange('estimatedDuration', Number(e.target.value))}
                className="w-full bg-slate-800 rounded-lg p-2 outline-none border border-slate-600 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm mb-1 text-slate-300">Kolor karty (Tailwind)</label>
              <input
                type="text"
                value={formData.color}
                onChange={e => handleInputChange('color', e.target.value)}
                className="w-full bg-slate-800 rounded-lg p-2 outline-none border border-slate-600 focus:border-blue-500"
                placeholder="np. bg-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2 text-slate-300">Opis</label>
            <textarea
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              className="w-full bg-slate-800 rounded-lg p-2 outline-none border border-slate-600 focus:border-blue-500 h-20"
            />
          </div>

          {/* Ćwiczenia */}
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Ćwiczenia</h4>
            {formData.exercises.map((ex, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={ex}
                  onChange={e => handleExerciseChange(idx, e.target.value)}
                  className="flex-1 bg-slate-800 rounded-lg p-2 border border-slate-600 focus:border-blue-500"
                  placeholder={`Ćwiczenie ${idx + 1}`}
                />
                <button
                  onClick={() => removeExerciseField(idx)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {errors.exercises && <p className="text-red-400 text-sm mb-2">{errors.exercises}</p>}
            <button
              onClick={addExerciseField}
              className="text-blue-400 hover:text-blue-500 text-sm"
            >
              ➕ Dodaj ćwiczenie
            </button>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={resetForm}
              className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded-lg"
            >
              <X size={18} /> Anuluj
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
            >
              <Save size={18} /> {editingTemplate ? 'Zapisz zmiany' : 'Utwórz'}
            </button>
          </div>
        </div>
      )}

      {/* LISTA SZABLONÓW */}
      <div>
        <h3 className="text-xl font-bold mb-2">📋 Moje Szablony</h3>
        {customTemplates.length === 0 ? (
          <p className="text-slate-400 text-center py-6">Brak własnych szablonów</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {customTemplates.map(template => (
              <div key={template.id} className={`${template.color} p-4 rounded-lg`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{template.icon}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(template)} className="text-yellow-300 hover:text-yellow-400">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => onDuplicateTemplate(template.id)} className="text-blue-300 hover:text-blue-400">
                      <Copy size={18} />
                    </button>
                    <button onClick={() => onDeleteTemplate(template.id)} className="text-red-400 hover:text-red-500">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <h4 className="text-lg font-bold mb-1">{template.name}</h4>
                <p className="text-sm opacity-90 mb-2">{template.description}</p>
                <p className="text-xs opacity-75">
                  ⏱️ {template.estimatedDuration} min • {template.exercises.length} ćw.
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DOMYŚLNE */}
      <div>
        <h3 className="text-xl font-bold mt-8 mb-2">📦 Domyślne Szablony</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {defaultTemplates.map(template => (
            <div key={template.id} className={`${template.color} p-4 rounded-lg`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{template.icon}</span>
                <button
                  onClick={() => onDuplicateTemplate(template.id)}
                  className="text-blue-300 hover:text-blue-400"
                >
                  <Copy size={18} />
                </button>
              </div>
              <h4 className="text-lg font-bold mb-1">{template.name}</h4>
              <p className="text-sm opacity-90 mb-2">{template.description}</p>
              <p className="text-xs opacity-75">
                ⏱️ {template.estimatedDuration} min • {template.exercises.length} ćw.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};