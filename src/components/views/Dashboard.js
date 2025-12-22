import React, { useEffect, useMemo } from 'react';
import Logo from '../Logo';
import Calendar from '../common/Calendar';
import WorkoutStats from '../common/WorkoutStats';
import LoadingSpinner from '../common/LoadingSpinner';

const Dashboard = ({ user, events, registrations, attendance, onSignOut, onViewChange, onDateSelect, onEventSelect, loadingEvents, loadingRegistrations, loadingError }) => {   
    useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const getUserRegistrations = () => {
    if (!user) return [];
    const now = new Date();
    return registrations
      .filter(reg => reg.user_id === user.id)
      .map(reg => {
        const event = events.find(e => e.id === reg.event_id);
        return { ...reg, event };
      })
      .filter(reg => {
        if (!reg.event) return false;
        // Filter out past classes - only show upcoming
        const eventDateTime = new Date(reg.event.date + ' ' + reg.event.time);
        return eventDateTime >= now;
      })
      .sort((a, b) => new Date(a.event.date + ' ' + a.event.time) - new Date(b.event.date + ' ' + b.event.time));
  };

  const userRegs = getUserRegistrations();
  const userRole = user?.user_metadata?.role || 'student';

  // Calculate personal attendance stats - only PAST events (date <= today)
  // Memoized to recalculate when user, registrations, or events change
  const personalStats = useMemo(() => {
    if (!user || !registrations || !events) {
      return {
        classesThisWeek: 0,
        classesThisMonth: 0,
        streak: 0
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get user's past registrations (date <= today)
    const userPastRegs = registrations
      .filter(reg => reg.user_id === user.id)
      .map(reg => {
        const event = events.find(e => e.id === reg.event_id);
        return event ? { ...reg, event } : null;
      })
      .filter(reg => reg !== null && reg.event)
      .filter(reg => {
        const eventDate = new Date(reg.event.date + 'T00:00:00');
        eventDate.setHours(0, 0, 0, 0);
        return eventDate <= today;
      });

    if (userPastRegs.length === 0) {
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

    const classesThisWeek = userPastRegs.filter(reg => {
      const eventDate = new Date(reg.event.date + 'T00:00:00');
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= weekStart && eventDate <= weekEnd && eventDate <= today;
    }).length;

    // 2. My Classes This Month (past only)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    const classesThisMonth = userPastRegs.filter(reg => {
      const eventDate = new Date(reg.event.date + 'T00:00:00');
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= monthStart && eventDate <= monthEnd && eventDate <= today;
    }).length;

    // 3. Current Streak - consecutive days going backwards from today
    const registrationDates = new Set(
      userPastRegs.map(reg => {
        const eventDate = new Date(reg.event.date + 'T00:00:00');
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.toISOString().split('T')[0];
      })
    );

    let streak = 0;
    let checkDate = new Date(today);
    checkDate.setHours(0, 0, 0, 0);

    while (true) {
      const dateString = checkDate.toISOString().split('T')[0];
      if (registrationDates.has(dateString)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }

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
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-gym-secondary shadow-lg border-b border-gym-secondary">
        <div className="max-w-7xl mx-auto px-4 py-4 h-18 flex items-center">
          <div className="flex justify-between items-center w-full">
            <Logo size="medium" variant="dark" />
            <div className="flex items-center gap-2">
              {userRole === 'coach' && (
                <button
                  onClick={() => onViewChange('createEvent')}
                  className="bg-gym-primary text-white px-4 py-2 rounded-grip hover:bg-[#ff8555] transition-all font-semibold"
                >
                  + Create Event
                </button>
              )}
              <button
                onClick={onSignOut}
                className="bg-gym-primary text-white px-4 py-2 rounded-grip hover:bg-[#ff8555] transition-all min-h-[48px] font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-6">
        <div className="mb-8">
          <h1 className="text-3xl font-poppins font-bold text-white mb-2">
          Welcome back, {user?.user_metadata?.first_name || user?.email?.split('@')[0]}!
          </h1>
          <span className="inline-block bg-white text-gym-text-dark px-4 py-2 rounded-full text-sm font-medium mt-2">
            {userRole === 'coach' ? '👨‍🏫 Coach' : '🏋️‍♂️ Student'} Account
          </span>
          
          {/* Profile Update Alert for users with broken names */}
          {(user?.user_metadata?.first_name === 'User' || 
            user?.user_metadata?.first_name?.length === 8 ||
            user?.user_metadata?.last_name?.length === 8) && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mt-2 rounded-grip">
              <p className="font-bold mb-2">⚠️ Please Update Your Name</p>
              <p className="text-sm mb-2">We need you to update your profile information.</p>
              <button
                onClick={() => onViewChange('profileEdit')}
                className="bg-yellow-600 text-white px-4 py-2 rounded-grip text-sm font-semibold hover:shadow-grip transition-all"
              >
                Update Profile Now
              </button>
            </div>
          )}

          {/* Regular Edit Profile Link - for all users */}
          <div className="mt-2">
            <button
              onClick={() => onViewChange('profileEdit')}
              className="text-sm text-gym-accent underline hover:text-[#00b8e6] transition-colors font-semibold"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Workout Stats for Students */}
        {userRole === 'student' && (
          <WorkoutStats 
            attendance={attendance}
            registrations={registrations}
            events={events}
            user={user}
          />
        )}

        {/* Loading Error Message */}
        {loadingError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-grip p-4">
            <p className="text-red-800 font-medium">{loadingError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-red-600 underline hover:text-red-800"
            >
              Refresh page
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            {loadingEvents ? (
              <div className="bg-white rounded-[12px] shadow-gym p-8 flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : events.length === 0 ? (
              <div className="bg-white rounded-[12px] shadow-gym p-8 text-center">
                <span className="text-6xl block mb-4">📅</span>
                <p className="text-xl font-semibold text-gym-text-dark mb-2">No classes scheduled yet</p>
                <p className="text-gray-600 mb-4">Click + to create one</p>
              </div>
            ) : (
              <Calendar events={events} onDateSelect={onDateSelect} />
            )}
          </div>

          {/* Side Panel */}
          <div className="space-y-8">
            {userRole === 'student' && (
              <div id="my-classes-section" className="bg-white rounded-[12px] shadow-gym p-4">
                <h2 className="text-xl font-poppins font-bold text-gym-text-dark mb-4">
                  My Upcoming Classes
                </h2>
                {loadingRegistrations ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="md" />
                  </div>
                ) : userRegs.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-5xl block mb-2">💪</span>
                    <p className="text-gym-text-dark font-medium">You haven't registered for any classes yet</p>
                    <p className="text-sm text-gray-600 mt-2">
                      Click on calendar dates to find workouts
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userRegs.slice(0, 3).map(reg => (
                      <div 
                      key={reg.id} 
                      className="border border-gray-200 rounded-grip p-4 hover:shadow-gym-lg transition-all cursor-pointer"
                      onClick={() => onEventSelect?.(reg.event)} 
                      >
                        <h3 className="font-semibold text-gym-text-dark">{reg.event.title}</h3>
                        <p className="text-sm text-gray-600 mt-2">
                          {new Date(reg.event.date + 'T12:00:00').toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold
                            ${reg.event.type === 'workout' 
                              ? 'bg-gym-primary text-white' 
                              : 'bg-green-100 text-green-800'}`}
                          >
                            {reg.event.type.toUpperCase()}
                          </span>
                          <span className="text-gym-accent text-sm font-semibold">
  View →
</span>
                        </div>
                      </div>
                    ))}
                    {userRegs.length > 3 && (
                      <button
                        onClick={() => onViewChange('myClasses')}
                        className="w-full text-gym-accent font-semibold py-2 hover:bg-gym-accent/10 rounded-grip transition-all"
                      >
                        View All ({userRegs.length} classes)
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Quick Stats */}
            {loadingEvents || loadingRegistrations ? (
              <div className="bg-white rounded-[12px] shadow-gym p-8 flex items-center justify-center">
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <div className="bg-white rounded-[12px] shadow-gym p-4">
                <h2 className="text-xl font-poppins font-bold text-gym-text-dark mb-4">
                  Quick Stats
                </h2>
              <div className="space-y-2">
                {userRole === 'coach' ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Events</span>
                      <span className="text-4xl font-extrabold text-grip-dark">{events.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-grip-dark">Total Registrations</span>
                      <span className="text-4xl font-extrabold text-grip-dark">{registrations.length}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center py-2 border-b border-gray-300-card">
                      <span className="text-grip-dark font-semibold">My Classes This Week</span>
                      <span className="text-4xl font-extrabold text-grip-dark">{personalStats.classesThisWeek}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-300-card">
                      <span className="text-grip-dark font-semibold">My Classes This Month</span>
                      <span className="text-4xl font-extrabold text-grip-dark">{personalStats.classesThisMonth}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-grip-dark font-semibold">Current Streak</span>
                      <span className="text-4xl font-extrabold text-grip-dark">
                        🔥 {personalStats.streak} {personalStats.streak === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                  </>
                )}
              </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300">
        <div className="max-w-md mx-auto px-4 py-2">
          <div className="flex justify-around">
            <button
              className="flex flex-col items-center py-2 px-4 text-gym-primary"
            >
              <span className="text-xl mb-1">🏠</span>
              <span className="text-xs font-semibold">Home</span>
            </button>
            
            {userRole === 'student' && (
              <button
                onClick={() => onViewChange('myClasses')}
                className="flex flex-col items-center py-2 px-4 text-gym-gray hover:text-gym-primary"
              >
                <span className="text-xl mb-1">💪</span>
                <span className="text-xs font-semibold">My Classes</span>
              </button>
            )}
            
            {userRole === 'coach' && (
              <button
                onClick={() => onViewChange('createEvent')}
                className="flex flex-col items-center py-2 px-4 text-gym-gray hover:text-gym-primary"
              >
                <span className="text-xl mb-1">➕</span>
                <span className="text-xs font-semibold">Create</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;