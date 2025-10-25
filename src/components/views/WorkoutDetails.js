import React from 'react';
import { TIME_SLOTS } from '../../utils/constants';

const WorkoutDetails = ({ 
  event, 
  events,
  registrations, 
  user,
  onBack,
  onRegister,
  onCancelRegistration 
}) => {
  // Get all time slots for this workout on this date
  const relatedEvents = events.filter(e => 
    e.title === event.title && 
    e.date === event.date
  );

  const formatTimeDisplay = (time24) => {
    const timeWithoutSeconds = time24?.split(':').slice(0, 2).join(':');
    const timeSlot = TIME_SLOTS.find(slot => slot.value === timeWithoutSeconds);
    return timeSlot ? timeSlot.display : time24;
  };

  const getEventRegistrations = (eventId) => {
    return registrations.filter(reg => reg.event_id === eventId);
  };

  const isUserRegistered = (eventId) => {
    return registrations.some(reg => 
      reg.event_id === eventId && reg.user_id === user.id
    );
  };

  return (
    <div className="min-h-screen bg-grip-light pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-grip-secondary">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-montserrat font-bold text-grip-primary">
            {event.title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Workout Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-grip-primary mb-2">
                {new Date(event.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h2>
              {event.details && (
                <div className="text-gray-700 leading-relaxed">
                  {event.details
                    .split('\n')
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
            <span className={`px-4 py-2 rounded-full text-sm font-semibold
              ${event.type === 'workout' 
                ? 'bg-grip-primary text-white' 
                : 'bg-green-100 text-green-800'}`}
            >
              {event.type === 'workout' ? 'WORKOUT' : 'SOCIAL EVENT'}
            </span>
          </div>
        </div>

        {/* Time Slots */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-grip-primary">Available Times</h3>
          {relatedEvents.map(timeEvent => {
            const regs = getEventRegistrations(timeEvent.id);
            const userRegistered = isUserRegistered(timeEvent.id);
            const isFull = regs.length >= 15;

            return (
              <div key={timeEvent.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-xl font-bold text-grip-primary">
                      {formatTimeDisplay(timeEvent.time)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {regs.length}/15 registered
                    </p>
                  </div>
                  <div>
                    {userRegistered ? (
                      <button
                        onClick={() => onCancelRegistration(timeEvent.id)}
                        className="bg-grip-accent text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg transition-all"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        onClick={() => onRegister(timeEvent.id)}
                        disabled={isFull}
                        className={`px-6 py-2 rounded-full font-semibold transition-all
                          ${isFull 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-grip-primary text-white hover:shadow-lg'}`}
                      >
                        {isFull ? 'FULL' : 'Register'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Registered Users List */}
                {regs.length > 0 && (
                  <div className="pt-4 border-t border-grip-secondary">
                    <p className="font-semibold text-grip-primary mb-2">
                      Registered Participants ({regs.length}):
                    </p>
                    <div className="space-y-2">
                      {regs.map(reg => (
                        <div key={reg.id} className="text-sm text-gray-700">
                          • {reg.user_name}
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
  );
};

export default WorkoutDetails;