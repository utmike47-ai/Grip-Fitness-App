import React, { useMemo, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import Header from '../Header';
import { TIME_SLOTS, normalizeTimeSlotValue } from '../../utils/constants';
import { getWorkoutMeta, startOfDay } from '../../utils/dates';
import { calculateStreak, getWeekStartMonday, isOnFire } from '../../utils/streakCalculation';

const WEEK_TARGET = 5;
const eventDateKey = (event) => String(event?.date || '').slice(0, 10);

const formatTimeDisplay = (time24) => {
  const normalized = normalizeTimeSlotValue(time24);
  const timeSlot = TIME_SLOTS.find((slot) => slot.value === normalized);
  return timeSlot ? timeSlot.display : (normalized || time24);
};

const eventDateTime = (event) => {
  const dateKey = eventDateKey(event);
  const time = normalizeTimeSlotValue(event?.time) || '00:00';
  if (!dateKey) return null;
  return new Date(`${dateKey}T${time}:00`);
};

const formatDayDate = (event) => {
  const dateKey = eventDateKey(event);
  if (!dateKey) return '';
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).replace(',', ' ·');
};

const ClassCard = ({ registration, variant, onCancel }) => {
  const event = registration.event;
  const timeLabel = formatTimeDisplay(event.time);
  const meta = getWorkoutMeta(event.details, event.type);
  const isPast = variant === 'past';

  return (
    <article className={`my-class-card ${isPast ? 'my-class-card--past' : ''}`}>
      {isPast && (
        <span className="my-class-card__badge" aria-hidden="true">
          <Check size={14} strokeWidth={3} />
        </span>
      )}
      <p className="my-class-card__when">{formatDayDate(event)}</p>
      <h3 className="my-class-card__title">{event.title}</h3>
      <p className="my-class-card__meta">
        {timeLabel} · {meta}
      </p>
      {!isPast && (
        <button
          type="button"
          className="my-class-card__cancel"
          onClick={() => onCancel?.(event.id)}
        >
          Cancel Registration
        </button>
      )}
    </article>
  );
};

const MyClasses = ({
  user,
  events,
  registrations,
  onBack,
  onViewChange,
  onCancelRegistration,
}) => {
  const [historyOpen, setHistoryOpen] = useState(false);

  const userRegs = useMemo(() => {
    if (!user) return [];
    return (registrations || [])
      .filter((reg) => String(reg.user_id) === String(user.id) && !reg.is_drop_in)
      .map((reg) => {
        const event = (events || []).find((item) => String(item.id) === String(reg.event_id));
        return { ...reg, event };
      })
      .filter((reg) => reg.event)
      .sort((a, b) => {
        const aKey = `${eventDateKey(a.event)} ${normalizeTimeSlotValue(a.event.time)}`;
        const bKey = `${eventDateKey(b.event)} ${normalizeTimeSlotValue(b.event.time)}`;
        return aKey.localeCompare(bKey);
      });
  }, [user, events, registrations]);

  const { upcomingRegs, pastRegs } = useMemo(() => {
    const now = new Date();
    const upcoming = [];
    const past = [];

    userRegs.forEach((reg) => {
      const when = eventDateTime(reg.event);
      if (when && when >= now) {
        upcoming.push(reg);
      } else {
        past.push(reg);
      }
    });

    return {
      upcomingRegs: upcoming,
      pastRegs: [...past].reverse(),
    };
  }, [userRegs]);

  const streak = useMemo(
    () => calculateStreak(user?.id, getWeekStartMonday(startOfDay(new Date())), registrations, events),
    [user, registrations, events]
  );
  const remaining = Math.max(0, WEEK_TARGET - streak);
  const onFire = isOnFire(streak);

  const handleAllTimeStats = () => {
    onViewChange?.('allTimeStats');
  };

  return (
    <div className="app-shell">
      <div className="app-shell__inner">
        <Header
          user={user}
          title="My Classes"
          onAvatarClick={() => onViewChange?.('profileEdit')}
        />

        <section className="my-classes-streak" aria-label="This week streak">
          {onFire && <span className="my-classes-streak__fire" aria-hidden="true">🔥</span>}
          <p className="my-classes-streak__label">This Week</p>
          <p className="my-classes-streak__count">{streak}/{WEEK_TARGET}</p>
          <div className="my-classes-streak__bar" aria-hidden="true">
            <span
              className="my-classes-streak__fill"
              style={{ width: `${(Math.min(streak, WEEK_TARGET) / WEEK_TARGET) * 100}%` }}
            />
          </div>
          <p className="my-classes-streak__sub">
            {remaining} {remaining === 1 ? 'class' : 'classes'} remaining this week
          </p>
        </section>

        <div className="my-classes-actions">
          <button
            type="button"
            className="my-classes-actions__btn my-classes-actions__btn--primary"
            onClick={onBack}
          >
            View Schedule
          </button>
          <button
            type="button"
            className="my-classes-actions__btn"
            onClick={handleAllTimeStats}
          >
            All Time Stats
          </button>
        </div>

        <section className="my-classes-section">
          <h2 className="my-classes-section__title">Upcoming</h2>
          {upcomingRegs.length === 0 ? (
            <div className="my-classes-empty">
              <p className="my-classes-empty__title">No upcoming classes</p>
              <p className="my-classes-empty__copy">Jump back to the schedule to register.</p>
              <button type="button" className="my-classes-empty__btn" onClick={onBack}>
                Browse Classes
              </button>
            </div>
          ) : (
            <div className="my-classes-list">
              {upcomingRegs.map((reg) => (
                <ClassCard
                  key={reg.id}
                  registration={reg}
                  variant="upcoming"
                  onCancel={onCancelRegistration}
                />
              ))}
            </div>
          )}
        </section>

        {pastRegs.length > 0 && (
          <section className="my-classes-section">
            <button
              type="button"
              className="my-classes-history-toggle"
              onClick={() => setHistoryOpen((open) => !open)}
              aria-expanded={historyOpen}
            >
              <h2 className="my-classes-section__title">History</h2>
              <span className="my-classes-history-toggle__meta">
                {pastRegs.length}
                <ChevronDown
                  className={`my-classes-history-toggle__chevron ${historyOpen ? 'is-open' : ''}`}
                  size={18}
                  aria-hidden="true"
                />
              </span>
            </button>
            {historyOpen && (
              <div className="my-classes-list">
                {pastRegs.map((reg) => (
                  <ClassCard
                    key={reg.id}
                    registration={reg}
                    variant="past"
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default MyClasses;
