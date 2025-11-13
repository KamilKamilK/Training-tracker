export const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pl-PL', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

export const getTimeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Dziś';
  if (days === 1) return 'Wczoraj';
  return `${days} dni temu`;
};

export const isToday = (dateStr: string): boolean => {
  const today = new Date().toDateString();
  const date = new Date(dateStr).toDateString();
  return today === date;
};

export const isThisWeek = (dateStr: string): boolean => {
  const d = new Date(dateStr);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return d >= weekAgo;
};

export const isThisMonth = (dateStr: string): boolean => {
  const d = new Date(dateStr);
  const n = new Date();
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
};

export const getCurrentDate = (): string => {
  return new Date().toISOString();
};