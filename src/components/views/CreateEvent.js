import React, { useState, useEffect } from 'react';
import Header from '../Header';
import { TIME_SLOTS, normalizeTimeSlotValue } from '../../utils/constants';

function buildEditFormState(existingEvent, initialSelectedTimes) {
  const normalizedSingle = existingEvent?.time
    ? normalizeTimeSlotValue(existingEvent.time)
    : '';
  const times =
    initialSelectedTimes?.length > 0
      ? [...initialSelectedTimes]
      : normalizedSingle
        ? [normalizedSingle]
        : [];
  const maxCap =
    existingEvent?.max_capacity ?? existingEvent?.maxCapacity ?? 25;
  return {
    title: existingEvent.title,
    type: existingEvent.type,
    date: existingEvent.date,
    times,
    details: existingEvent.details || '',
    maxCapacity: maxCap
  };
}

const CreateEvent = ({
  user,
  onBack,
  onCreateEvent,
  onViewChange,
  editMode = false,
  existingEvent = null,
  initialSelectedTimes = null
}) => {
  const [eventData, setEventData] = useState(() => {
    if (editMode && existingEvent) {
      return buildEditFormState(existingEvent, initialSelectedTimes);
    }
    return {
      title: '',
      type: 'workout',
      date: '',
      times: [],
      details: '',
      maxCapacity: 25
    };
  });

  useEffect(() => {
    if (!editMode || !existingEvent) return;
    console.log('[Edit mode] existingEvent.time:', existingEvent?.time);
    console.log('[Edit mode] normalized:', normalizeTimeSlotValue(existingEvent?.time));
    console.log('[Edit mode] initialSelectedTimes:', initialSelectedTimes);
    const nextTimes =
      initialSelectedTimes?.length > 0
        ? [...initialSelectedTimes]
        : existingEvent.time
          ? [normalizeTimeSlotValue(existingEvent.time)]
          : [];
    setEventData((prev) => ({ ...prev, times: nextTimes }));
  }, [editMode, existingEvent, initialSelectedTimes]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const times = [...new Set(eventData.times.map(normalizeTimeSlotValue))].filter(Boolean);
    if (!eventData.title || !eventData.date || times.length === 0) {
      alert('Please fill in all required fields and select at least one time slot');
      return;
    }
    if (editMode) {
      console.log('[Edit Submit] eventData:', eventData);
      console.log('[Edit Submit] times being saved:', times);
    }
    onCreateEvent({ ...eventData, times });
  };

  const toggleTimeSlot = (time) => {
    const t = normalizeTimeSlotValue(time);
    if (!t) return;
    setEventData(prev => {
      const normalized = prev.times.map(normalizeTimeSlotValue);
      const idx = normalized.indexOf(t);
      if (idx >= 0) {
        const next = [...normalized];
        next.splice(idx, 1);
        return { ...prev, times: next };
      }
      return { ...prev, times: [...normalized, t] };
    });
  };

  const isTimeSlotSelected = (slotValue) => {
    const key = normalizeTimeSlotValue(slotValue);
    return eventData.times.map(normalizeTimeSlotValue).includes(key);
  };

  return (
    <div className="app-shell">
      <div className="app-shell__inner">
        <Header
          user={user}
          title={(
            <>
              {editMode ? 'EDIT' : 'CREATE'} <span className="app-header__name">EVENT</span>
            </>
          )}
          onAvatarClick={() => onViewChange?.('profileEdit')}
        />

        <form className="create-event" onSubmit={handleSubmit}>
          <div className="create-event__field">
            <p className="create-event__label">Event Type</p>
            <div className="create-event__types">
              <button
                type="button"
                className={`create-event__choice${eventData.type === 'workout' ? ' is-selected' : ''}`}
                onClick={() => setEventData((prev) => ({ ...prev, type: 'workout' }))}
              >
                💪 Workout
              </button>
              <button
                type="button"
                className={`create-event__choice${eventData.type === 'social' ? ' is-selected' : ''}`}
                onClick={() => setEventData((prev) => ({ ...prev, type: 'social' }))}
              >
                🎉 Social Event
              </button>
            </div>
          </div>

          <label className="create-event__field">
            <span className="create-event__label">Event Title *</span>
            <input
              type="text"
              className="create-event__input"
              value={eventData.title}
              onChange={(e) => setEventData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Monday Morning HIIT"
              required
            />
          </label>

          <label className="create-event__field">
            <span className="create-event__label">Date *</span>
            <input
              type="date"
              className="create-event__input create-event__date"
              value={eventData.date}
              onChange={(e) => setEventData((prev) => ({ ...prev, date: e.target.value }))}
              required
            />
          </label>

          <div className="create-event__field">
            <p className="create-event__label">Class Times *</p>
            <p className="create-event__hint">Select one or more</p>
            <div className="create-event__times">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot.value}
                  type="button"
                  className={`create-event__time${isTimeSlotSelected(slot.value) ? ' is-selected' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleTimeSlot(slot.value);
                  }}
                >
                  {slot.display}
                </button>
              ))}
            </div>
          </div>

          <label className="create-event__field">
            <span className="create-event__label">Details (Optional)</span>
            <textarea
              className="create-event__input create-event__textarea"
              value={eventData.details}
              onChange={(e) => setEventData((prev) => ({ ...prev, details: e.target.value }))}
              placeholder={`Enter workout details (one exercise per line):\n20 min EMOM\n12-15 Heel Raised Goblet Squats\n12 Bike Cals\n12-15 DB Bench Press`}
              rows="5"
            />
          </label>

          {eventData.type === 'social' && (
            <label className="create-event__field">
              <span className="create-event__label">Maximum Capacity</span>
              <input
                type="number"
                className="create-event__input"
                value={eventData.maxCapacity}
                onChange={(e) => setEventData((prev) => ({ ...prev, maxCapacity: parseInt(e.target.value, 10) }))}
                min="1"
                max="100"
              />
              <span className="create-event__hint">Workouts are automatically limited to 15 participants</span>
            </label>
          )}

          <div className="create-event__actions">
            <button type="button" className="create-event__btn create-event__btn--ghost" onClick={onBack}>
              Cancel
            </button>
            <button type="submit" className="create-event__btn create-event__btn--primary">
              {editMode ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;