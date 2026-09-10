export const WEEK_STRIP_DAYS_BACK = 21;
export const WEEK_STRIP_LENGTH = 35;

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDateKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date, amount) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return startOfDay(d);
}

export function getWeekStripBounds(from = new Date()) {
  const today = startOfDay(from);
  const minDate = addDays(today, -WEEK_STRIP_DAYS_BACK);
  const maxDate = addDays(minDate, WEEK_STRIP_LENGTH - 1);
  return { today, minDate, maxDate };
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'GOOD MORNING';
  if (hour < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

export function getDayStatus(date) {
  const today = startOfDay(new Date()).getTime();
  const target = startOfDay(date).getTime();
  if (target === today) return 'TODAY';
  if (target < today) return 'COMPLETED';
  return 'UPCOMING';
}

export function getWorkoutTypeLabel(type) {
  const normalized = String(type || 'workout').toLowerCase();
  if (normalized === 'workout') return 'Strength';
  return normalized.replace(/^\w/, (letter) => letter.toUpperCase());
}

export function getWorkoutMeta(details, type) {
  const typeLabel = getWorkoutTypeLabel(type);
  const match = String(details || '').match(/(\d+)\s*min/i);
  if (match) return `${match[1]} min · ${typeLabel}`;
  return typeLabel;
}
