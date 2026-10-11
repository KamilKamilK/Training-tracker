/** Icons offered in the template form; the default templates use the first ones. */
export const TEMPLATE_ICONS = [
  '💪', '🏋️', '🦵', '🔥', '💎', '⚡', '🏊', '🏃', '🚴', '🧘', '🤸', '🥊', '⚽', '🎾', '❤️', '🏆', '⏱️', '🎯',
] as const;

/** Card colours offered in the template form. Full class names, so Tailwind keeps them in the build. */
export const TEMPLATE_COLORS = [
  { value: 'bg-blue-600', label: 'Niebieski' },
  { value: 'bg-indigo-600', label: 'Indygo' },
  { value: 'bg-purple-600', label: 'Fioletowy' },
  { value: 'bg-pink-600', label: 'Różowy' },
  { value: 'bg-red-600', label: 'Czerwony' },
  { value: 'bg-orange-600', label: 'Pomarańczowy' },
  { value: 'bg-yellow-500', label: 'Żółty' },
  { value: 'bg-green-600', label: 'Zielony' },
  { value: 'bg-teal-600', label: 'Morski' },
  { value: 'bg-cyan-600', label: 'Turkusowy' },
  { value: 'bg-slate-600', label: 'Szary' },
] as const;
