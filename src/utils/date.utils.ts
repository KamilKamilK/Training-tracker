export const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pl-PL', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

// Calendar week from Monday 00:00 to the next Monday 00:00 in the browser's time zone.
// Building dates from local calendar fields keeps midnight correct across DST changes.
export const isThisWeek = (dateStr: string): boolean => {
  const d = new Date(dateStr);
  const now = new Date();
  const daysSinceMonday = (now.getDay() + 6) % 7;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
  return d >= start && d < end;
};

export const isThisMonth = (dateStr: string): boolean => {
  const d = new Date(dateStr);
  const n = new Date();
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
};

export const getCurrentDate = (): string => {
  return new Date().toISOString();
};
/** Whole minutes from `start` to `end`; undefined when either date is invalid or `end` is earlier. */
export const getMinutesBetween = (start: string, end: string): number | undefined => {
  const elapsed = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(elapsed) || elapsed < 0) return undefined;
  return Math.round(elapsed / 60_000);
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 1) return '< 1 min';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
};
