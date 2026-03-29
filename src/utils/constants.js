/**
 * Normalize DB or UI time strings to HH:mm so slot keys and comparisons stay consistent.
 * Handles: "12:00", "12:00:00", ISO datetimes like "1970-01-01T12:00:00+00:00".
 */
export function normalizeTimeSlotValue(time) {
  if (time == null || time === '') return '';
  const s = String(time).trim();
  const iso = s.match(/T(\d{1,2}):(\d{2})/);
  if (iso) {
    return `${iso[1].padStart(2, '0')}:${iso[2].padStart(2, '0')}`;
  }
  const plain = s.match(/^(\d{1,2}):(\d{2})/);
  if (plain) {
    return `${plain[1].padStart(2, '0')}:${plain[2].padStart(2, '0')}`;
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