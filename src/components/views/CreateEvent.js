import React, { useState } from 'react';
import { TIME_SLOTS } from '../../utils/constants';

const CreateEvent = ({ user, onBack, onCreateEvent, editMode = false, existingEvent = null }) => {
    const [eventData, setEventData] = useState(() => {
      // If editing, populate with existing data
      if (editMode && existingEvent) {
        return {
          title: existingEvent.title,
          type: existingEvent.type,
          date: existingEvent.date,
          times: [existingEvent.time],
          details: existingEvent.details || '',
          maxCapacity: 25
        };
      }
      // Otherwise, start with empty form
      return {
        title: '',
        type: 'workout',
        date: '',
        times: [],
        details: '',
        maxCapacity: 25
      };
    });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!eventData.title || !eventData.date || eventData.times.length === 0) {
      alert('Please fill in all required fields and select at least one time slot');
      return;
    }
    onCreateEvent(eventData);
  };

  const toggleTimeSlot = (time) => {
    setEventData(prev => ({
      ...prev,
      times: prev.times.includes(time)
        ? prev.times.filter(t => t !== time)
        : [...prev.times, time]
    }));
  };

  return (
    <div className="min-h-screen bg-grip-light pb-20">
      {/* Header */}
      <div className="bg-grip-secondary shadow-grip border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-montserrat font-semibold text-grip-primary">
            {editMode ? 'Edit Event' : 'Create Event'}
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-grip shadow-grip border border-gray-300 p-4">
          {/* Event Type */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-grip-dark mb-3">
              Event Type
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setEventData(prev => ({ ...prev, type: 'workout' }))}
                className={`flex-1 py-3 px-4 rounded-grip font-semibold transition-all
                  ${eventData.type === 'workout'
                    ? 'bg-grip-primary text-white'
                      : 'bg-grip-secondary text-grip-dark hover:bg-grip-secondary/70'}`}
              >
                💪 Workout
              </button>
              <button
                type="button"
                onClick={() => setEventData(prev => ({ ...prev, type: 'social' }))}
                className={`flex-1 py-3 px-4 rounded-grip font-semibold transition-all
                  ${eventData.type === 'social'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
              >
                🎉 Social Event
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-grip-dark mb-2">
              Event Title *
            </label>
            <input
              type="text"
              value={eventData.title}
              onChange={(e) => setEventData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Monday Morning HIIT"
              className="w-full px-4 py-3 border border-gray-300 rounded-grip focus:outline-none focus:ring-2 focus:ring-grip-primary focus:border-transparent transition-colors"
              required
            />
          </div>

          {/* Date */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-grip-dark mb-2">
              Date *
            </label>
            <input
              type="date"
              value={eventData.date}
              onChange={(e) => setEventData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-grip focus:outline-none focus:ring-2 focus:ring-grip-primary focus:border-transparent transition-colors"
              required
            />
          </div>

          {/* Time Slots */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-grip-dark mb-3">
              Class Times * (Select one or more)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TIME_SLOTS.map(slot => (
                <button
                  key={slot.value}
                  type="button"
                  onClick={() => toggleTimeSlot(slot.value)}
                  className={`py-3 px-4 rounded-grip font-semibold transition-all
                    ${eventData.times.includes(slot.value)
                      ? 'bg-grip-primary text-white'
                      : 'bg-grip-secondary text-grip-dark hover:bg-grip-secondary'}`}
                >
                  {slot.display}
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-grip-dark mb-2">
              Details (Optional)
            </label>
            <textarea
              value={eventData.details}
              onChange={(e) => setEventData(prev => ({ ...prev, details: e.target.value }))}
              placeholder="Enter workout details (one exercise per line):
20 min EMOM
12-15 Heel Raised Goblet Squats
12 Bike Cals
12-15 DB Bench press
20 Sit ups"
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-grip focus:outline-none focus:ring-2 focus:ring-grip-primary focus:border-transparent transition-colors resize-none"
            />
          </div>

          {/* Social Event Capacity */}
          {eventData.type === 'social' && (
            <div className="mb-8">
            <label className="block text-sm font-semibold text-grip-dark mb-2">
                Maximum Capacity
            </label>
              <input
                type="number"
                value={eventData.maxCapacity}
                onChange={(e) => setEventData(prev => ({ ...prev, maxCapacity: parseInt(e.target.value) }))}
                min="1"
                max="100"
                className="w-full px-4 py-3 border border-gray-300 rounded-grip focus:outline-none focus:ring-2 focus:ring-grip-primary focus:border-transparent transition-colors"
              />
              <p className="text-xs text-gray-600 mt-1">
                Workouts are automatically limited to 15 participants
              </p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-grip-secondary text-grip-dark py-3 rounded-grip font-semibold hover:bg-grip-secondary transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-grip-primary text-white py-3 rounded-grip font-semibold hover:opacity-90 transform hover:-translate-y-0.5 transition-all"
            >
              {editMode ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;