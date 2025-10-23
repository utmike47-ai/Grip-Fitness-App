import React from 'react';
import Logo from '../Logo';
import { TIME_SLOTS } from '../../utils/constants';

const DayView = ({ 
  selectedDate, 
  events, 
  registrations, 
  user,
  onBack,
  onRegister,
  onCancelRegistration,
  onToggleAttendance,
  onSelectEvent,
  onEditEvent,
  onDeleteEvent
}) => {
  const dateStr = selectedDate?.toISOString().split('T')[0];
  const dayEvents = events.filter(event => event.date === dateStr);

  const getRegistrationCount = (eventId) => {
    return registrations.filter(reg => reg.event_id === eventId).length;
  };

  const isUserRegistered = (eventId) => {
    return registrations.some(reg => reg.event_id === eventId && reg.user_id === user.id);
  };

  const formatTimeDisplay = (time24) => {
    // Remove seconds if present (e.g., "16:30:00" becomes "16:30")
    const timeWithoutSeconds = time24.split(':').slice(0, 2).join(':');
    const timeSlot = TIME_SLOTS.find(slot => slot.value === timeWithoutSeconds);
    return timeSlot ? timeSlot.display : time24;
  };

  // Group events by title
  const groupedEvents = dayEvents.reduce((groups, event) => {
    const key = `${event.title}-${event.type}`;
    if (!groups[key]) {
      groups[key] = {
        title: event.title,
        type: event.type,
        details: event.details,
        times: []
      };
    }
    groups[key].times.push({
      id: event.id,
      time: event.time,
      registrationCount: getRegistrationCount(event.id),
      userRegistered: isUserRegistered(event.id),
      registeredUsers: registrations.filter(reg => reg.event_id === event.id)
    });
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-grip-light">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-grip-secondary">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-4 text-grip-accent hover:text-grip-primary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-montserrat font-bold text-grip-primary">
                {selectedDate?.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Events */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <span className="text-6xl block mb-4">📅</span>
            <p className="text-xl font-semibold text-grip-primary">No events scheduled</p>
            <p className="text-gray-500 mt-2">Check back later for new workouts!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.values(groupedEvents).map((eventGroup, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-3">
  <h2 className="text-2xl font-montserrat font-bold text-grip-primary">
    {eventGroup.title}
  </h2>
  
  <div className="flex flex-col gap-3">
    <span className={`px-4 py-2 rounded-full text-sm font-semibold text-center
      ${eventGroup.type === 'workout' 
        ? 'bg-grip-primary text-white' 
        : 'bg-green-100 text-green-800'}`}
    >
      {eventGroup.type === 'workout' ? 'WORKOUT' : 'SOCIAL EVENT'}
    </span>
    {user?.user_metadata?.role === 'coach' && (
        <>
      <button
        onClick={() => onEditEvent(eventGroup.times[0].id)}
        className="bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-yellow-600 transition-all"
      >
        Edit
      </button>
      <button
      onClick={() => onDeleteEvent(eventGroup.times[0].id)}
      className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-red-600 transition-all"
    >
      Delete
    </button>
    </>
    )}
  </div>
</div>
{eventGroup.details && (
  <div className="text-gray-700 leading-relaxed">
    {eventGroup.details
      .split(/(?=\d+\s+[a-zA-Z])|(?=Go\s)|(?=go\s)|\n/)
      .filter(line => line.trim())
      .map((line, index) => (
        <div 
          key={index} 
          style={{ 
            display: 'block', 
            width: '100%',
            marginBottom: '8px',
            lineHeight: '1.5'
          }}
        >
          {line.trim()}
        </div>
      ))}
  </div>
)}
                </div>

                <div className="border-t border-grip-secondary pt-4">
                  <h3 className="font-semibold text-grip-primary mb-4">Available Times:</h3>
                  <div className="flex flex-col gap-3">
                    {eventGroup.times.map(timeSlot => {
                      const isFull = timeSlot.registrationCount >= 15;
                      
                      return (
                        <div key={timeSlot.id} className="border border-grip-secondary rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="text-xl font-bold text-grip-primary">
                                {formatTimeDisplay(timeSlot.time)}
                              </span>
                              <span className="text-sm text-gray-600">
                                {timeSlot.registrationCount}/15 registered
                              </span>
                            </div>
                            
                            <div className="flex flex-col gap-2">
  {timeSlot.userRegistered ? (
    <button
      onClick={() => onCancelRegistration(timeSlot.id)}
      className="bg-grip-accent text-white px-6 py-2 rounded-full text-sm font-semibold hover:shadow-lg transition-all"
    >
      Cancel
    </button>
  ) : (
    <button
      onClick={() => onRegister(timeSlot.id)}
      disabled={isFull}
      className={`px-6 py-2 rounded-full text-sm font-semibold transition-all
        ${isFull 
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
          : 'bg-grip-primary text-white hover:shadow-lg'}`}
    >
      {isFull ? 'FULL' : 'Register'}
    </button>
  )}
</div>
                          </div>

                          {/* Show registered participants to everyone */}
                          {timeSlot.registeredUsers.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-grip-secondary">
                              <p className="font-semibold text-grip-primary mb-2">
                                Registered Participants ({timeSlot.registeredUsers.length}):
                              </p>
                              <div className="space-y-2">
                                {timeSlot.registeredUsers.map(reg => (
                                  <div key={reg.id} className="flex items-center justify-between">
                                    <span className="text-sm">{reg.user_name}</span>
                                    {user?.user_metadata?.role === 'coach' && (
                                      <button
                                        onClick={() => onToggleAttendance?.(timeSlot.id, reg.user_id)}
                                        className="text-xs px-3 py-1 rounded-full bg-grip-secondary text-grip-primary"
                                      >
                                        Mark Present
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DayView;