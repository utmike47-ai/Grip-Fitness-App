import { TIME_SLOTS, normalizeTimeSlotValue } from './constants';
import { addDays, formatDateKey, startOfDay } from './dates';
import { getWeekStartMonday, WEEK_DAYS } from './streakCalculation';

const WEEK_HIT = 3;
const PERFECT_WEEK = WEEK_DAYS;
const PERFECT_MONTH = 20;
const CLASS_MILESTONE = 50;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function getUserClassRecords(userId, registrations = [], events = []) {
  if (!userId) return [];
  return (registrations || [])
    .filter((reg) => String(reg.user_id) === String(userId) && !reg.is_drop_in)
    .map((reg) => {
      const event = (events || []).find((item) => String(item.id) === String(reg.event_id));
      if (!event?.date) return null;
      return {
        date: String(event.date).slice(0, 10),
        time: normalizeTimeSlotValue(event.time),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}

function monthKey(dateKey) {
  return String(dateKey || '').slice(0, 7);
}

function countBy(items, getKey) {
  const counts = {};
  items.forEach((item) => {
    const key = getKey(item);
    if (!key) return;
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

function topKey(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || null;
}

function formatTimeLabel(time) {
  const slot = TIME_SLOTS.find((item) => item.value === time);
  if (slot?.display) {
    return slot.display.replace(':00', '');
  }
  if (!time) return '—';
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return minutes ? `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}` : `${hour12} ${suffix}`;
}

function weekStartKey(dateKey) {
  return formatDateKey(getWeekStartMonday(new Date(`${dateKey}T12:00:00`)));
}

function registrationWeekCounts(records) {
  const counts = {};
  records.forEach((record) => {
    const week = weekStartKey(record.date);
    counts[week] = (counts[week] || 0) + 1;
  });
  return counts;
}

function uniqueWeekdayCounts(records) {
  const days = {};
  records.forEach((record) => {
    const date = new Date(`${record.date}T12:00:00`);
    const weekday = date.getDay();
    if (weekday === 0) return;
    const week = weekStartKey(record.date);
    if (!days[week]) days[week] = new Set();
    days[week].add(record.date);
  });
  const counts = {};
  Object.entries(days).forEach(([week, set]) => {
    counts[week] = set.size;
  });
  return counts;
}

function countConsecutiveWeeks(counts, today, threshold) {
  const thisMonday = getWeekStartMonday(startOfDay(today));
  let cursor = thisMonday;
  if ((counts[formatDateKey(cursor)] || 0) < threshold) {
    cursor = addDays(cursor, -7);
  }

  let current = 0;
  while ((counts[formatDateKey(cursor)] || 0) >= threshold) {
    current += 1;
    cursor = addDays(cursor, -7);
  }

  const weeks = Object.keys(counts).sort();
  let best = 0;
  let run = 0;
  let prev = null;
  let bestEnd = null;
  weeks.forEach((week) => {
    if ((counts[week] || 0) < threshold) {
      run = 0;
      prev = week;
      return;
    }
    if (prev) {
      const expected = formatDateKey(addDays(new Date(`${prev}T12:00:00`), 7));
      run = week === expected ? run + 1 : 1;
    } else {
      run = 1;
    }
    if (run >= best) {
      best = run;
      bestEnd = week;
    }
    prev = week;
  });

  return { current, best, bestEnd };
}

export function getWeekStreaks(records, today = new Date()) {
  return countConsecutiveWeeks(registrationWeekCounts(records), today, WEEK_HIT);
}

export function getMemberRanking(userId, registrations = [], profiles = []) {
  const counts = {};
  (registrations || []).forEach((reg) => {
    if (reg.is_drop_in || !reg.user_id) return;
    const id = String(reg.user_id);
    counts[id] = (counts[id] || 0) + 1;
  });

  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const index = ranked.findIndex(([id]) => id === String(userId));
  const members = profiles.length || ranked.length;

  return {
    rank: index >= 0 ? index + 1 : null,
    members,
  };
}

export function buildCalendarGrid(records, today = new Date(), weekCount = 6) {
  const dates = new Set(records.map((record) => record.date));
  const thisMonday = getWeekStartMonday(startOfDay(today));
  const start = addDays(thisMonday, -7 * (weekCount - 1));
  const todayKey = formatDateKey(startOfDay(today));

  return Array.from({ length: weekCount }, (_, weekIndex) => {
    const weekStart = addDays(start, weekIndex * 7);
    const weekStartKey = formatDateKey(weekStart);
    const days = Array.from({ length: WEEK_DAYS }, (_, dayIndex) => {
      const date = addDays(weekStart, dayIndex);
      const key = formatDateKey(date);
      return {
        date: key,
        active: dates.has(key),
        isToday: key === todayKey,
        isFuture: key > todayKey,
      };
    });
    const attended = days.filter((day) => day.active).length;
    const isCurrent = weekStartKey === formatDateKey(thisMonday);
    return {
      weekStart: weekStartKey,
      label: isCurrent
        ? 'This week'
        : weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      attended,
      perfect: attended === PERFECT_WEEK,
      days,
    };
  }).reverse();
}

function gymAveragePerWeek(registrations, events, today) {
  const dated = (registrations || [])
    .filter((reg) => !reg.is_drop_in && reg.user_id)
    .map((reg) => {
      const event = (events || []).find((item) => String(item.id) === String(reg.event_id));
      return event?.date ? String(event.date).slice(0, 10) : null;
    })
    .filter(Boolean)
    .sort();

  if (!dated.length) return 0;
  const users = new Set(
    (registrations || []).filter((reg) => !reg.is_drop_in && reg.user_id).map((reg) => String(reg.user_id))
  );
  const first = startOfDay(new Date(`${dated[0]}T12:00:00`));
  const weeks = Math.max(1, Math.round((startOfDay(today) - first) / (7 * 24 * 60 * 60 * 1000)));
  return dated.length / Math.max(1, users.size) / weeks;
}

export function computeAllTimeStats({
  userId,
  registrations = [],
  events = [],
  profiles = [],
  today = new Date(),
}) {
  const records = getUserClassRecords(userId, registrations, events);
  const totalClasses = records.length;
  const todayDate = startOfDay(today);
  const thisMonth = monthKey(formatDateKey(todayDate));
  const lastMonthDate = new Date(todayDate.getFullYear(), todayDate.getMonth() - 1, 1);
  const lastMonth = monthKey(formatDateKey(lastMonthDate));

  const thisMonthCount = records.filter((record) => monthKey(record.date) === thisMonth).length;
  const lastMonthCount = records.filter((record) => monthKey(record.date) === lastMonth).length;

  const firstDate = records[0]?.date;
  const first = firstDate ? startOfDay(new Date(`${firstDate}T12:00:00`)) : todayDate;
  const elapsedWeeks = Math.max(1, Math.round((todayDate - first) / (7 * 24 * 60 * 60 * 1000)));
  const avgPerWeek = totalClasses / elapsedWeeks;
  const gymAvg = gymAveragePerWeek(registrations, events, todayDate);

  const favoriteTimeValue = topKey(countBy(records, (record) => record.time));
  const favoriteTime = formatTimeLabel(favoriteTimeValue);
  const mostActiveDay = WEEKDAYS[Number(topKey(countBy(records, (record) => {
    const day = new Date(`${record.date}T12:00:00`).getDay();
    if (day === 0 || day === 6) return null;
    return String(day);
  })))] || '—';

  const { current: weekStreak, best: bestStreak } = getWeekStreaks(records, todayDate);
  const ranking = getMemberRanking(userId, registrations, profiles);
  const calendar = buildCalendarGrid(records, todayDate);

  const perfectWeeks = uniqueWeekdayCounts(records);
  const perfectStreak = countConsecutiveWeeks(perfectWeeks, todayDate, PERFECT_WEEK);
  const earlyBirdCount = records.filter((record) => record.time === '06:00').length;
  const months = countBy(records, (record) => monthKey(record.date));
  const perfectMonth = Object.entries(months)
    .filter(([, count]) => count >= PERFECT_MONTH)
    .sort((a, b) => b[0].localeCompare(a[0]))[0];

  return {
    totalClasses,
    weekStreak,
    bestStreak,
    rank: ranking.rank,
    members: ranking.members,
    thisMonthCount,
    lastMonthCount,
    monthDelta: thisMonthCount - lastMonthCount,
    avgPerWeek,
    gymAvg,
    favoriteTime,
    mostActiveDay,
    calendar,
    longestPerfectStreak: perfectStreak.best,
    longestPerfectEnd: perfectStreak.bestEnd,
    earlyBirdCount,
    classMilestone: CLASS_MILESTONE,
    perfectMonthKey: perfectMonth?.[0] || null,
    perfectMonthCount: perfectMonth?.[1] || 0,
  };
}

export function formatMemberSince(isoDate) {
  if (!isoDate) return { dateLabel: '—', tenure: '' };
  const parts = String(isoDate).slice(0, 10).split('-').map(Number);
  const date = parts.length === 3
    ? new Date(parts[0], parts[1] - 1, parts[2])
    : new Date(isoDate);
  if (Number.isNaN(date.getTime())) return { dateLabel: '—', tenure: '' };

  const dateLabel = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const now = new Date();
  let years = now.getFullYear() - date.getFullYear();
  let months = now.getMonth() - date.getMonth();
  if (now.getDate() < date.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const tenureParts = [];
  if (years > 0) tenureParts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  if (months > 0) tenureParts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
  return { dateLabel, tenure: tenureParts.join(', ') || 'This month' };
}

export function formatMonthLabel(key) {
  if (!key) return '';
  const [year, month] = key.split('-');
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function formatWeekMonth(weekStart) {
  if (!weekStart) return '';
  return new Date(`${weekStart}T12:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}
