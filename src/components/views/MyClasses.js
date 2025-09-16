import React from 'react';
import Logo from '../Logo';
import { TIME_SLOTS } from '../../utils/constants';

const MyClasses = ({ user, events, registrations, onBack, onSelectEvent, onCancelRegistration }) => {
  const getUserRegistrations = () => {
    if (!user) return [];
    return registrations
      .filter(reg => reg.user_id === user.id)
      .map(reg => {
        const event = events.find(e => e.id === reg.event_id);
        return { ...reg, event };
      })
      .filter(reg => reg.event)
      .sort((a, b) => new Date(a.event.date + ' ' + a.event.time) - new Date(b.event.date + ' ' + b.event.time));
  };

  const formatTimeDisplay = (time24) => {
    const timeSlot = TIME_SLOTS.find(slot => slot.value === time24);
    return timeSlot ? timeSlot.display : time24;
  };

  const userRegs = getUserRegistrations();
  const upcomingRegs = userRegs.filter(reg => new Date(reg.event.date) >= new Date());
  const pastRegs = userRegs.filter(reg => new Date(reg.event.date) < new Date());

  return (
    <div className="min-h-screen bg-grip-light pb-20">
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
            <h1 className="text-2xl font-montserrat font-bold text-grip-primary">
              My Classes
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {userRegs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <span className="text-6xl block mb-4">💪</span>
            <p className="text-xl font-semibold text-grip-primary">No classes registered yet!</p>
            <p className="text-gray-500 mt-2">Head back to find and register for workouts</p>
            <button
              onClick={onBack}
              className="mt-6 bg-grip-primary text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Browse Classes
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Classes */}
            {upcomingRegs.length > 0 && (
              <div>
                <h2 className="text-xl font-montserrat font-bold text-grip-primary mb-4">
                  Upcoming Classes ({upcomingRegs.length})
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingRegs.map(reg => (
                    <div key={reg.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-lg text-grip-primary">
                          {reg.event.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold
                          ${reg.event.type === 'workout' 
                            ? 'bg-grip-primary text-white' 
                            : 'bg-green-100 text-green-800'}`}
                        >
                          {reg.event.type.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-600">
                          📅 {new Date(reg.event.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-sm text-gray-600">
                          ⏰ {formatTimeDisplay(reg.event.time)}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => onSelectEvent(reg.event)}
                          className="flex-1 bg-grip-secondary text-grip-primary py-2 rounded-lg text-sm font-semibold hover:bg-grip-secondary/70 transition-all"
                        >
                          Notes
                        </button>
                        <button
                          onClick={() => onCancelRegistration?.(reg.event.id)}
                          className="flex-1 bg-grip-accent text-white py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past Classes */}
            {pastRegs.length > 0 && (
              <div>
                <h2 className="text-xl font-montserrat font-bold text-grip-primary mb-4">
                  Past Classes ({pastRegs.length})
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pastRegs.map(reg => (
                    <div key={reg.id} className="bg-white rounded-xl shadow-lg p-6 opacity-75">
                      <h3 className="font-bold text-lg text-gray-600 mb-2">
                        {reg.event.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(reg.event.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <button
                        onClick={() => onSelectEvent(reg.event)}
                        className="mt-3 w-full bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-all"
                      >
                        View Notes
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Bottom Navigation */}
<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-grip-secondary">
  <div className="max-w-md mx-auto px-4 py-2">
    <div className="flex justify-around">
      <button
        onClick={onBack}
        className="flex flex-col items-center py-2 px-4 text-gray-600 hover:text-grip-primary"
      >
        <span className="text-xl mb-1">🏠</span>
        <span className="text-xs font-semibold">Home</span>
      </button>
      
      <button
        className="flex flex-col items-center py-2 px-4 text-grip-primary"
      >
        <span className="text-xl mb-1">💪</span>
        <span className="text-xs font-semibold">My Classes</span>
      </button>
    </div>
  </div>
</div>
    </div>
  );
};

export default MyClasses;