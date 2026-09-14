import React, { useMemo, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { isOnFire, WEEK_DAYS } from '../utils/streakCalculation';

const CLASS_CAPACITY = 15;

const formatMemberName = (fullName) => {
  if (!fullName) return 'Member';
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
};

const StreakBadge = ({ streak, isDropIn }) => {
  if (isDropIn) return null;
  const value = Number(streak) || 0;
  const onFire = isOnFire(value);
  return (
    <span className={`streak-badge ${onFire ? 'is-fire' : ''}`}>
      {value}/{WEEK_DAYS}{onFire ? ' 🔥' : ''}
    </span>
  );
};

const TimeSlot = ({
  timeLabel,
  capacity = 0,
  maxCapacity = CLASS_CAPACITY,
  members = [],
  userRegistered = false,
  isCoach = false,
  onRegister,
  onCancelRegistration,
  onRemoveMember,
  onCancelClass,
}) => {
  const [expanded, setExpanded] = useState(false);
  const isFull = capacity >= maxCapacity;
  const percent = Math.min((capacity / maxCapacity) * 100, 100);

  const sortedMembers = useMemo(() => (
    [...members].sort((a, b) => {
      const streakA = Number(a.streak) || 0;
      const streakB = Number(b.streak) || 0;
      if (streakB !== streakA) return streakB - streakA;
      return String(a.user_name || '').localeCompare(String(b.user_name || ''));
    })
  ), [members]);

  return (
    <div className={`time-slot ${expanded ? 'is-expanded' : ''}`}>
      <button
        type="button"
        className="time-slot__header"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
      >
        <span className="time-slot__time">{timeLabel}</span>
        <span className="time-slot__stats">
          <span className="time-slot__meter" aria-hidden="true">
            <span className="time-slot__meter-fill" style={{ width: `${percent}%` }} />
          </span>
          <span className="time-slot__count">
            {capacity}/{maxCapacity}
          </span>
          <ChevronDown
            className={`time-slot__chevron ${expanded ? 'is-open' : ''}`}
            size={16}
            aria-hidden="true"
          />
        </span>
      </button>

      {expanded && (
        <div className="time-slot__body">
          {sortedMembers.length > 0 ? (
            <ul className="member-list">
              {sortedMembers.map((member) => {
                const onFire = !member.is_drop_in && isOnFire(member.streak);
                return (
                  <li
                    key={member.id}
                    className={`member-row ${member.is_drop_in ? 'is-drop-in' : ''} ${onFire ? 'is-on-fire' : ''}`}
                  >
                    <span className="member-row__name">
                      {formatMemberName(member.user_name)}
                      {member.is_drop_in && (
                        <span className="member-row__tag">Drop-In</span>
                      )}
                    </span>
                    <span className="member-row__meta">
                      <StreakBadge streak={member.streak} isDropIn={member.is_drop_in} />
                      {isCoach && (
                        <button
                          type="button"
                          className="member-row__remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveMember?.(member);
                          }}
                          aria-label={`Remove ${member.user_name}`}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="time-slot__empty">No one registered yet</p>
          )}

          <div className="time-slot__actions">
            {!isFull && !userRegistered && (
              <button type="button" className="time-slot__register" onClick={onRegister}>
                Register
              </button>
            )}
            {userRegistered && (
              <button
                type="button"
                className="time-slot__register time-slot__register--ghost"
                onClick={onCancelRegistration}
              >
                Cancel Registration
              </button>
            )}
            {isFull && !userRegistered && (
              <p className="time-slot__full">Class is full</p>
            )}
            {isCoach && (
              <button
                type="button"
                className="time-slot__cancel-class"
                onClick={onCancelClass}
              >
                Cancel Class
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSlot;
