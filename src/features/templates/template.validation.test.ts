import { describe, expect, it } from 'vitest';
import { validateTemplateInput } from './template.validation.js';
import { defaultWorkoutTemplates } from './defaultTemplates.js';

describe('validateTemplateInput', () => {
  it('trims the name and drops empty exercise fields', () => {
    expect(validateTemplateInput({ name: '  Push A ', exercises: ['Przysiad', ' ', '', ' Wyciskanie '] })).toEqual({
      name: 'Push A',
      exercises: ['Przysiad', 'Wyciskanie'],
    });
  });

  it.each([
    ['too short a name', { name: 'AB', exercises: ['Przysiad'] }, 'name'],
    ['too long a name', { name: 'A'.repeat(51), exercises: ['Przysiad'] }, 'name'],
    ['no exercises', { name: 'Push A', exercises: [] }, 'exercises'],
    ['only empty exercises', { name: 'Push A', exercises: ['', '  '] }, 'exercises'],
    ['too many exercises', { name: 'Push A', exercises: Array.from({ length: 21 }, (_, i) => `Ćw ${i}`) }, 'exercises'],
  ])('rejects %s', (_, input, field) => {
    expect(validateTemplateInput(input)).toEqual({ errors: { [field]: expect.any(String) } });
  });

  it('accepts every default template, so duplicates of them can be edited and saved', () => {
    for (const template of defaultWorkoutTemplates) {
      expect(validateTemplateInput(template)).toHaveProperty('name');
    }
  });
});
