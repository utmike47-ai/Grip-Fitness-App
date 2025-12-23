import React, { useState, useEffect, useRef } from 'react';
import { TIME_SLOTS } from '../../utils/constants';
import Logo from '../Logo';

const CreateEvent = ({ user, onBack, onCreateEvent, editMode = false, existingEvent = null, allEvents = [] }) => {
    const [eventData, setEventData] = useState(() => {
      // If editing, populate with existing data
      if (editMode && existingEvent) {
        // Find all related events (same title and date) to get all time slots
        const relatedEvents = allEvents.filter(e => 
          e.title === existingEvent.title && 
          e.date === existingEvent.date
        );
        // Extract all times from related events and normalize them (remove seconds if present)
        const existingTimes = relatedEvents
          .map(e => e.time)
          .filter(Boolean)
          .map(time => {
            // Normalize time format: "08:00:00" -> "08:00", "08:00" -> "08:00"
            return time.split(':').slice(0, 2).join(':');
          });
        
        console.log('Edit mode - Related events:', relatedEvents);
        console.log('Edit mode - Existing times (normalized):', existingTimes);
        
        return {
          title: existingEvent.title,
          type: existingEvent.type,
          date: existingEvent.date,
          times: existingTimes.length > 0 ? existingTimes : (existingEvent.time ? [existingEvent.time.split(':').slice(0, 2).join(':')] : []),
          details: existingEvent.details || '',
          maxCapacity: 25,
          eventIds: relatedEvents.map(e => e.id) // Store IDs for update
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

  // Update state when existingEvent changes (when switching to edit mode or editing different event)
  // Use a ref to track the last existingEvent.id we initialized from to prevent overwriting user edits
  const lastInitializedEventIdRef = useRef(null);
  
  useEffect(() => {
    // Only initialize when entering edit mode with a new existingEvent
    if (editMode && existingEvent?.id) {
      const eventId = existingEvent.id;
      
      // Only initialize if this is a different event than we last initialized
      if (lastInitializedEventIdRef.current !== eventId) {
        console.log('useEffect: Initializing eventData from existingEvent:', existingEvent);
        lastInitializedEventIdRef.current = eventId;
        
        // Find all related events (same title and date) to get all time slots
        const relatedEvents = allEvents.filter(e => 
          e.title === existingEvent.title && 
          e.date === existingEvent.date
        );
        // Extract all times from related events and normalize them (remove seconds if present)
        const existingTimes = relatedEvents
          .map(e => e.time)
          .filter(Boolean)
          .map(time => {
            // Normalize time format: "08:00:00" -> "08:00", "08:00" -> "08:00"
            return time.split(':').slice(0, 2).join(':');
          });
        
        console.log('useEffect: Related events:', relatedEvents);
        console.log('useEffect: Existing times (normalized):', existingTimes);
        
        setEventData({
          title: existingEvent.title || '',
          type: existingEvent.type || 'workout',
          date: existingEvent.date || '',
          times: existingTimes.length > 0 ? existingTimes : (existingEvent.time ? [existingEvent.time.split(':').slice(0, 2).join(':')] : []),
          details: existingEvent.details || '',
          maxCapacity: 25,
          eventIds: relatedEvents.map(e => e.id)
        });
      } else {
        console.log('useEffect: Skipping initialization - already initialized for event:', eventId);
      }
    } else if (!editMode) {
      // Reset the ref when exiting edit mode
      console.log('useEffect: Exiting edit mode, resetting ref');
      lastInitializedEventIdRef.current = null;
    }
  }, [editMode, existingEvent?.id, allEvents]); // Depend on existingEvent.id, but allEvents needed for finding related events

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('=== CreateEvent handleSubmit START ===');
    console.log('editMode:', editMode);
    console.log('eventData:', JSON.stringify(eventData, null, 2));
    console.log('onCreateEvent function:', typeof onCreateEvent);
    
    if (!eventData.title || !eventData.date || eventData.times.length === 0) {
      alert('Please fill in all required fields and select at least one time slot');
      return;
    }
    
    try {
      console.log('Calling onCreateEvent with eventData...');
      const result = await onCreateEvent(eventData);
      console.log('onCreateEvent result:', result);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    }
    console.log('=== CreateEvent handleSubmit END ===');
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
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-gym-secondary shadow-lg border-b border-gym-secondary">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="medium" variant="dark" />
          <h1 className="text-2xl font-poppins font-bold text-white">
            {editMode ? 'Edit Event' : 'Create Event'}
          </h1>
          <span className="w-16" />
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 py-6" style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
        <form onSubmit={handleSubmit} className="bg-white rounded-[12px] shadow-gym p-4 sm:p-6" style={{ overflowX: 'hidden', width: '100%', maxWidth: '100%' }}>
          {/* Event Type */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gym-text-dark mb-3">
              Event Type
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setEventData(prev => ({ ...prev, type: 'workout' }))}
                className={`flex-1 py-3 px-4 rounded-grip font-semibold transition-all
                  ${eventData.type === 'workout'
                    ? 'bg-gym-primary text-white'
                      : 'bg-gray-200 text-gym-text-dark hover:bg-gray-300'}`}
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
            <label className="block text-sm font-semibold text-gym-text-dark mb-2">
              Event Title *
            </label>
            <input
              type="text"
              value={eventData.title || ''}
              onChange={(e) => {
                console.log('Title changed to:', e.target.value);
                setEventData(prev => ({ ...prev, title: e.target.value }));
              }}
              placeholder="e.g., Monday Morning HIIT"
              className="w-full px-4 py-3 border border-gray-200 rounded-grip focus:outline-none focus:ring-2 focus:ring-gym-primary focus:border-transparent transition-colors text-gray-900 placeholder:text-gray-400"
              style={{ color: '#1f2937' }}
              required
            />
          </div>

          {/* Date */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gym-text-dark mb-2">
              Date *
            </label>
              <input
                type="date"
                value={eventData.date || ''}
                onChange={(e) => {
                  console.log('Date changed to:', e.target.value);
                  setEventData(prev => ({ ...prev, date: e.target.value }));
                }}
              className="w-full px-4 py-3 border border-gray-200 rounded-grip focus:outline-none focus:ring-2 focus:ring-gym-primary focus:border-transparent transition-colors text-gym-text-dark text-center"
              style={{ 
                color: '#2d3142',
                width: '100%',
                maxWidth: '100%',
                minWidth: '0',
                boxSizing: 'border-box',
                WebkitAppearance: 'none',
                MozAppearance: 'textfield',
                appearance: 'none'
              }}
              required
            />
          </div>

          {/* Time Slots */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gym-text-dark mb-3">
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
                      ? 'bg-gym-primary text-white'
                      : 'bg-gray-200 text-gym-text-dark hover:bg-gray-300'}`}
                >
                  {slot.display}
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gym-text-dark mb-2">
              Details (Optional)
            </label>
            <textarea
              value={eventData.details || ''}
              onChange={(e) => {
                console.log('Details changed, length:', e.target.value.length);
                setEventData(prev => ({ ...prev, details: e.target.value }));
              }}
              placeholder="Enter workout details (one exercise per line):
20 min EMOM
12-15 Heel Raised Goblet Squats
12 Bike Cals
12-15 DB Bench press
20 Sit ups"
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-grip focus:outline-none focus:ring-2 focus:ring-grip-primary focus:border-transparent transition-colors resize-none text-gray-900 placeholder:text-gray-400"
              style={{ color: '#1f2937' }}
            />
          </div>

          {/* Social Event Capacity */}
          {eventData.type === 'social' && (
            <div className="mb-8">
            <label className="block text-sm font-semibold text-gym-text-dark mb-2">
                Maximum Capacity
            </label>
              <input
                type="number"
                value={eventData.maxCapacity}
                onChange={(e) => setEventData(prev => ({ ...prev, maxCapacity: parseInt(e.target.value) }))}
                min="1"
                max="100"
                className="w-full px-4 py-3 border border-gray-200 rounded-grip focus:outline-none focus:ring-2 focus:ring-gym-primary focus:border-transparent transition-colors text-gray-900 placeholder:text-gray-400"
                style={{ color: '#1f2937' }}
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
              className="flex-1 bg-red-500 text-white py-3 rounded-grip font-semibold hover:bg-red-600 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gym-primary text-white py-3 rounded-grip font-semibold hover:bg-[#ff8555] transform hover:-translate-y-0.5 transition-all"
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