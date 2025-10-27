import React, { useEffect } from 'react';
import Logo from '../Logo';
import Calendar from '../common/Calendar';
import WorkoutStats from '../common/WorkoutStats';

const Dashboard = ({ user, events, registrations, attendance, onSignOut, onViewChange, onDateSelect, onEventSelect }) => {   
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

  const getWeekStats = () => {
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    currentWeekStart.setHours(0, 0, 0, 0);
    
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6); // End of week (Saturday)
    currentWeekEnd.setHours(23, 59, 59, 999);
    
    // Get all classes this week
    const classesThisWeek = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= currentWeekStart && eventDate <= currentWeekEnd;
    });
    
    // Get user's registered classes this week
    const myClassesThisWeek = classesThisWeek.filter(event => 
      registrations.some(reg => 
        reg.event_id === event.id && reg.user_id === user.id
      )
    );
    
    return {
      totalThisWeek: classesThisWeek.length,
      registeredThisWeek: myClassesThisWeek.length
    };
  };

  return (
    <div className="min-h-screen bg-grip-light pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-grip-secondary">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Logo size="medium" />
            <div className="flex items-center gap-4">
              {userRole === 'coach' && (
                <button
                  onClick={() => onViewChange('createEvent')}
                  className="bg-grip-accent text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all font-semibold"
                >
                  + Create Event
                </button>
              )}
              <button
                onClick={onSignOut}
                className="bg-grip-primary text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
        <h1 className="text-3xl font-montserrat font-bold text-grip-primary mb-2">
          Welcome back, {user?.user_metadata?.first_name || user?.email?.split('@')[0]}!
          </h1>
          <span className="inline-block bg-grip-secondary text-grip-primary px-4 py-2 rounded-full text-sm font-semibold">
            {userRole === 'coach' ? '👨‍🏫 Coach' : '🏋️‍♂️ Student'} Account
          </span>
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <Calendar events={events} onDateSelect={onDateSelect} />
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {userRole === 'student' && (
              <div id="my-classes-section" className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-montserrat font-bold text-grip-primary mb-4">
                  My Upcoming Classes
                </h2>
                {userRegs.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-5xl block mb-3">💪</span>
                    <p className="text-grip-dark font-medium">No classes registered yet!</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Click on calendar dates to find workouts
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userRegs.slice(0, 3).map(reg => (
                      <div 
                      key={reg.id} 
                      className="border border-grip-secondary rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => onEventSelect?.(reg.event)} 
                      >
                        <h3 className="font-semibold text-grip-primary">{reg.event.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(reg.event.date + 'T12:00:00').toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        <div className="flex justify-between items-center mt-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold
                            ${reg.event.type === 'workout' 
                              ? 'bg-grip-primary text-white' 
                              : 'bg-green-100 text-green-800'}`}
                          >
                            {reg.event.type.toUpperCase()}
                          </span>
                          <span className="text-grip-accent text-sm font-semibold">
  View →
</span>
                        </div>
                      </div>
                    ))}
                    {userRegs.length > 3 && (
                      <button
                        onClick={() => onViewChange('myClasses')}
                        className="w-full text-grip-accent font-semibold py-2 hover:bg-grip-secondary/20 rounded-lg transition-all"
                      >
                        View All ({userRegs.length} classes)
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-montserrat font-bold text-grip-primary mb-4">
                Quick Stats
              </h2>
              <div className="space-y-3">
                {userRole === 'coach' ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Events</span>
                      <span className="text-2xl font-bold text-grip-primary">{events.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Registrations</span>
                      <span className="text-2xl font-bold text-grip-primary">{registrations.length}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Classes This Week</span>
                      <span className="text-2xl font-bold text-grip-primary">{getWeekStats().totalThisWeek}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">My Classes This Week</span>
                      <span className="text-2xl font-bold text-grip-primary">{getWeekStats().registeredThisWeek}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-grip-secondary">
        <div className="max-w-md mx-auto px-4 py-2">
          <div className="flex justify-around">
            <button
              className="flex flex-col items-center py-2 px-4 text-grip-primary"
            >
              <span className="text-xl mb-1">🏠</span>
              <span className="text-xs font-semibold">Home</span>
            </button>
            
            {userRole === 'student' && (
              <button
                onClick={() => onViewChange('myClasses')}
                className="flex flex-col items-center py-2 px-4 text-gray-600 hover:text-grip-primary"
              >
                <span className="text-xl mb-1">💪</span>
                <span className="text-xs font-semibold">My Classes</span>
              </button>
            )}
            
            {userRole === 'coach' && (
              <button
                onClick={() => onViewChange('createEvent')}
                className="flex flex-col items-center py-2 px-4 text-gray-600 hover:text-grip-primary"
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