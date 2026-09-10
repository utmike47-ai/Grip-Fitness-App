import React, { useEffect, useMemo, useRef } from 'react';
import { addDays, formatDateKey, getWeekStripBounds, WEEK_STRIP_LENGTH } from '../utils/dates';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const WeekStrip = ({ selectedDate, onSelectDate, events = [] }) => {
  const scrollRef = useRef(null);
  const selectedRef = useRef(null);
  const hasCentered = useRef(false);

  const { today, minDate } = useMemo(() => getWeekStripBounds(), []);
  const todayKey = formatDateKey(today);
  const selectedKey = formatDateKey(selectedDate || today);

  const days = useMemo(() => {
    return Array.from({ length: WEEK_STRIP_LENGTH }, (_, index) => addDays(minDate, index));
  }, [minDate]);

  const workoutDates = useMemo(() => {
    const set = new Set();
    events.forEach((event) => {
      if (event?.date) set.add(event.date);
    });
    return set;
  }, [events]);

  useEffect(() => {
    const node = selectedRef.current;
    if (!node) return;

    const behavior = hasCentered.current ? 'smooth' : 'auto';
    const frame = requestAnimationFrame(() => {
      node.scrollIntoView({
        behavior,
        inline: 'center',
        block: 'nearest',
      });
      hasCentered.current = true;
    });

    return () => cancelAnimationFrame(frame);
  }, [selectedKey]);

  return (
    <div className="week-strip">
      <div ref={scrollRef} className="week-strip__scroller scrollbar-hide">
        {days.map((day) => {
          const key = formatDateKey(day);
          const isSelected = key === selectedKey;
          const isToday = key === todayKey;
          const isPast = day.getTime() < today.getTime();
          const isFuture = day.getTime() > today.getTime();
          const hasWorkout = workoutDates.has(key);

          let tone = 'week-strip__day--today';
          if (!isSelected) {
            if (isPast) tone = 'week-strip__day--past';
            else if (isFuture) tone = 'week-strip__day--future';
          }

          return (
            <button
              key={key}
              ref={isSelected ? selectedRef : null}
              type="button"
              className={`week-strip__day ${tone} ${isSelected ? 'week-strip__day--selected' : ''}`}
              onClick={() => onSelectDate?.(day)}
              aria-label={day.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
              aria-current={isToday ? 'date' : undefined}
              aria-pressed={isSelected}
            >
              <span className="week-strip__letter">{DAY_LETTERS[day.getDay()]}</span>
              <span className="week-strip__number">{day.getDate()}</span>
              <span className={`week-strip__dot ${hasWorkout ? 'is-visible' : ''}`} />
            </button>
          );
        })}
      </div>
      <p className="week-strip__hint">← swipe calendar for more weeks →</p>
    </div>
  );
};

export default WeekStrip;
