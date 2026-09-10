import React, { useState } from 'react';
import { ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { getWorkoutMeta } from '../utils/dates';

const parseExercises = (details) =>
  String(details || '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !/^\d+\s*min\.?$/i.test(line));

const WorkoutCard = ({
  dayName,
  status,
  title,
  type,
  details,
  hasNote,
  onNotes,
  isCoach,
  onEdit,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(false);
  const exercises = parseExercises(details);
  const meta = getWorkoutMeta(details, type);

  return (
    <div className={`workout-card ${expanded ? 'is-expanded' : ''}`}>
      <button
        type="button"
        className="workout-card__header"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
      >
        <div className="workout-card__header-copy">
          <p className="workout-card__status">
            {dayName} · <span>{status}</span>
          </p>
          <h2 className="workout-card__title">{title}</h2>
          <p className="workout-card__meta">{meta}</p>
        </div>
        <ChevronDown
          className={`workout-card__chevron ${expanded ? 'is-open' : ''}`}
          size={18}
          aria-hidden="true"
        />
      </button>

      {expanded && (
        <div className="workout-card__body">
          {exercises.length > 0 ? (
            <ul className="workout-card__exercises">
              {exercises.map((line, index) => (
                <li key={`${line}-${index}`}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className="workout-card__empty">No exercises listed</p>
          )}

          <div className="workout-card__actions">
            <button
              type="button"
              className={`workout-card__notes ${hasNote ? 'has-note' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onNotes?.();
              }}
            >
              📝 My Notes
            </button>
            {isCoach && (
              <div className="workout-card__coach">
                <button
                  type="button"
                  className="workout-card__icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.();
                  }}
                  aria-label="Edit workout"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  className="workout-card__icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.();
                  }}
                  aria-label="Delete workout"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutCard;
