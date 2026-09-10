import { addDays, formatDateKey, startOfDay } from './dates';

export function getWeekStartMonday(date = new Date()) {
  const day = startOfDay(date);
  const weekday = day.getDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  return addDays(day, offset);
}

export function getRegistrationDate(record, events = []) {
  if (!record) return null;
  if (record.date) return String(record.date).slice(0, 10);
  const event = events.find((item) => String(item.id) === String(record.event_id));
  return event?.date ? String(event.date).slice(0, 10) : null;
}

export function calculateStreak(userId, weekStartDate, registrations = [], events = []) {
  if (!userId) return 0;

  const weekStart = formatDateKey(weekStartDate);
  const weekEnd = formatDateKey(addDays(weekStartDate, 4));
  const uniqueDays = new Set();

  registrations.forEach((record) => {
    if (record.is_drop_in) return;
    if (String(record.user_id) !== String(userId)) return;
    const date = getRegistrationDate(record, events);
    if (!date) return;
    if (date >= weekStart && date <= weekEnd) {
      uniqueDays.add(date);
    }
  });

  return Math.min(uniqueDays.size, 5);
}

export function isOnFire(streak) {
  return Number(streak) >= 3;
}

export function withMemberStreaks(members = [], weekStartDate, registrations = [], events = []) {
  return members
    .map((member) => {
      const streak = member.is_drop_in || !member.user_id
        ? 0
        : calculateStreak(member.user_id, weekStartDate, registrations, events);
      return { ...member, streak };
    })
    .sort((a, b) => {
      if (b.streak !== a.streak) return b.streak - a.streak;
      return String(a.user_name || '').localeCompare(String(b.user_name || ''));
    });
}
