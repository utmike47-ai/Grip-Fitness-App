import React, { useMemo } from 'react';
import { TIME_SLOTS } from '../../utils/constants';

const MyClasses = ({ user, events, registrations, onBack, onSelectEvent, onCancelRegistration }) => {
    const formatTimeDisplay = (time24) => {
        // Remove seconds if present
        const timeWithoutSeconds = time24?.split(':').slice(0, 2).join(':');
        const timeSlot = TIME_SLOTS.find(slot => slot.value === timeWithoutSeconds);
        return timeSlot ? timeSlot.display : time24;
      };
      
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

  

  const userRegs = getUserRegistrations();
  const upcomingRegs = userRegs.filter(reg => new Date(reg.event.date) >= new Date());
  const pastRegs = userRegs.filter(reg => new Date(reg.event.date) < new Date());

  // Calculate Quick Stats - memoized to recalculate when registrations or events change
  // Only counts PAST events (date <= today) for the logged-in user
  const stats = useMemo(() => {
    if (!user || !registrations || !events) {
      return {
        classesThisWeek: 0,
        classesThisMonth: 0,
        streak: 0
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Step 1: Filter registrations by current user
    const userRegistrations = registrations.filter(reg => reg.user_id === user.id);
    
    if (userRegistrations.length === 0) {
      return {
        classesThisWeek: 0,
        classesThisMonth: 0,
        streak: 0
      };
    }

    // Step 2: Map to events and filter out invalid/missing events
    const userRegsWithEvents = userRegistrations
      .map(reg => {
        const event = events.find(e => e.id === reg.event_id);
        return event ? { ...reg, event } : null;
      })
      .filter(reg => reg !== null && reg.event);

    // Step 3: Filter to only PAST events (date <= today)
    const pastRegistrations = userRegsWithEvents.filter(reg => {
      const eventDate = new Date(reg.event.date + 'T00:00:00'); // Parse date string properly
      eventDate.setHours(0, 0, 0, 0);
      return eventDate <= today;
    });

    if (pastRegistrations.length === 0) {
      return {
        classesThisWeek: 0,
        classesThisMonth: 0,
        streak: 0
      };
    }

    // 1. My Classes This Week (Monday-Sunday, past only)
    const getWeekStart = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday = start of week
      const weekStart = new Date(d);
      weekStart.setDate(diff);
      return weekStart;
    };
    
    const weekStart = getWeekStart(today);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const classesThisWeek = pastRegistrations.filter(reg => {
      const eventDate = new Date(reg.event.date + 'T00:00:00');
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= weekStart && eventDate <= weekEnd && eventDate <= today;
    }).length;

    // 2. My Classes This Month (past only)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    
    const classesThisMonth = pastRegistrations.filter(reg => {
      const eventDate = new Date(reg.event.date + 'T00:00:00');
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= monthStart && eventDate <= monthEnd && eventDate <= today;
    }).length;

    // 3. Current Streak - consecutive days going backwards from today
    // Get unique dates (YYYY-MM-DD format) when user had registrations
    const registrationDates = new Set(
      pastRegistrations.map(reg => {
        const eventDate = new Date(reg.event.date + 'T00:00:00');
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.toISOString().split('T')[0]; // Use YYYY-MM-DD format
      })
    );

    let streak = 0;
    let checkDate = new Date(today);
    checkDate.setHours(0, 0, 0, 0);
    
    // Check backwards from today, counting consecutive days with registrations
    // Streak breaks if we hit a day with no registration
    while (true) {
      const dateString = checkDate.toISOString().split('T')[0];
      if (registrationDates.has(dateString)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // No registration for this day - streak breaks
        break;
      }
      
      // Safety check to prevent infinite loop (max 365 days back)
      const daysAgo = Math.floor((today.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysAgo > 365) {
        break;
      }
    }

    return {
      classesThisWeek,
      classesThisMonth,
      streak
    };
  }, [user, registrations, events]);

  return (
    <div className="min-h-screen pb-20 pb-20">
      {/* Header */}
      <div className="bg-gym-secondary shadow-lg border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-4 text-gym-accent hover:text-gym-accent/80 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-poppins font-bold text-gym-accent">
              My Classes
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Quick Stats Section */}
        {userRegs.length > 0 && (
          <div className="mb-8 bg-white rounded-grip shadow-lg border border-gray-300 p-4">
            <h2 className="text-xl font-poppins font-bold text-gym-accent mb-4">
              Quick Stats
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-300">
                <span className="text-gym-accent font-semibold">My Classes This Week</span>
                <span className="text-2xl font-bold text-gym-accent">{stats.classesThisWeek}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-300">
                <span className="text-gym-accent font-semibold">My Classes This Month</span>
                <span className="text-2xl font-bold text-gym-accent">{stats.classesThisMonth}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gym-accent font-semibold">Current Streak</span>
                <span className="text-2xl font-bold text-gym-accent">
                  🔥 {stats.streak} {stats.streak === 1 ? 'day' : 'days'}
                </span>
              </div>
            </div>
          </div>
        )}

        {userRegs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-grip shadow-lg border border-gray-300">
            <span className="text-6xl block mb-4">💪</span>
            <p className="text-xl font-semibold text-gym-text-dark">You haven't registered for any classes yet</p>
            <p className="text-gray-600 mt-2">Head back to find and register for workouts</p>
            <button
              onClick={onBack}
              className="mt-6 bg-gym-primary text-white px-4 py-3 rounded-grip font-semibold hover:shadow-lg transition-all"
            >
              Browse Classes
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Classes */}
            {upcomingRegs.length > 0 && (
              <div>
                <h2 className="text-xl font-poppins font-bold text-gym-accent mb-4">
                  Upcoming Classes ({upcomingRegs.length})
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingRegs.map(reg => (
                    <div key={reg.id} className="bg-white rounded-grip shadow-lg border border-gray-300 p-4 hover:shadow-lg-lg transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-lg text-gym-accent">
                          {reg.event.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold
                          ${reg.event.type === 'workout' 
                            ? 'bg-gym-primary text-white' 
                            : 'bg-green-100 text-green-800'}`}
                        >
                          {reg.event.type.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-600">
                          📅 {new Date(reg.event.date + 'T12:00:00').toLocaleDateString('en-US', { 
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
                          className="flex-1 bg-gym-secondary text-gym-accent py-2 rounded-grip text-sm font-semibold hover:bg-gym-secondary/70 transition-all"
                        >
                          Notes
                        </button>
                        <button
                          onClick={() => onCancelRegistration?.(reg.event.id)}
                          className="flex-1 bg-gym-primary text-white py-2 rounded-grip text-sm font-semibold hover:shadow-lg transition-all"
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
                <h2 className="text-xl font-poppins font-bold text-gym-accent mb-4">
                  Past Classes ({pastRegs.length})
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pastRegs.map(reg => (
                    <div key={reg.id} className="bg-white rounded-grip shadow-lg border border-gray-300 p-4 opacity-75">
                      <h3 className="font-bold text-lg text-gray-600 mb-2">
                        {reg.event.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(reg.event.date + 'T12:00:00').toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <button
                        onClick={() => onSelectEvent(reg.event)}
                        className="mt-3 w-full bg-gym-secondary text-gym-accent py-2 rounded-grip text-sm font-semibold hover:bg-gym-secondary transition-all"
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
<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300">
  <div className="max-w-md mx-auto px-4 py-2">
    <div className="flex justify-around">
      <button
        onClick={onBack}
        className="flex flex-col items-center py-2 px-4 text-gray-600 hover:text-gym-accent"
      >
        <span className="text-xl mb-1">🏠</span>
        <span className="text-xs font-semibold">Home</span>
      </button>
      
      <button
        className="flex flex-col items-center py-2 px-4 text-gym-accent"
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