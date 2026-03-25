/**
 * Normalize DB or UI time strings to HH:mm so slot keys and comparisons stay consistent
 * (e.g. "12:00:00" and "12:00" both become "12:00").
 */
export function normalizeTimeSlotValue(time) {
  if (time == null || time === '') return '';
  const s = String(time).trim();
  const parts = s.split(':');
  if (parts.length >= 2) {
    const h = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    return `${h}:${m}`;
  }
  return s;
}

export const TIME_SLOTS = [
    { value: '06:00', label: '6:00 AM', display: '6:00 AM' },
    { value: '08:00', label: '8:00 AM', display: '8:00 AM' },
    { value: '09:00', label: '9:00 AM', display: '9:00 AM' },
    { value: '12:00', label: '12:00 PM', display: '12:00 PM' },
    { value: '16:30', label: '4:30 PM', display: '4:30 PM' },
    { value: '17:30', label: '5:30 PM', display: '5:30 PM' }
  ];