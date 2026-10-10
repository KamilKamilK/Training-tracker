export const ROUTES = {
  dashboard: '/',
  templates: '/templates',
  plan: '/plan',
  workout: '/workout',
  history: '/history',
  progress: '/progress',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
