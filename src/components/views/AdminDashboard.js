import React, { useMemo, useEffect } from 'react';
import { TIME_SLOTS } from '../../utils/constants';
import Logo from '../Logo';

const AdminDashboard = ({ user, events, registrations, profiles = [], attendance = [], onNavigate, onEventSelect }) => {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Today's date string (YYYY-MM-DD)
    const todayStr = today.toISOString().split('T')[0];
    
    // Get all unique user IDs from registrations for "Active This Week"
    const weekEventIds = events
      .filter(event => {
        const eventDate = new Date(event.date + 'T00:00:00');
        return eventDate >= startOfWeek && eventDate <= endOfWeek;
      })
      .map(event => event.id);
    
    const activeUsersThisWeek = new Set(
      registrations
        .filter(reg => weekEventIds.includes(reg.event_id))
        .map(reg => reg.user_id)
    ).size;

    // Total classes this week
    const classesThisWeek = events.filter(event => {
      const eventDate = new Date(event.date + 'T00:00:00');
      return eventDate >= startOfWeek && eventDate <= endOfWeek;
    }).length;

    // Today's classes
    const todaysClasses = events.filter(event => event.date === todayStr);

    return {
      totalMembers: profiles.length,
      activeThisWeek: activeUsersThisWeek,
      classesThisWeek,
      todaysClasses: todaysClasses.length
    };
  }, [events, registrations, profiles]);

  // Get today's classes with registration counts
  const todaysClassesWithCounts = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return events
      .filter(event => event.date === todayStr)
      .map(event => {
        const regCount = registrations.filter(reg => reg.event_id === event.id).length;
        // Use event's maxCapacity if available, otherwise default to 15
        const maxCapacity = event.max_capacity || event.maxCapacity || 15;
        return {
          ...event,
          registrationCount: regCount,
          maxCapacity,
          isFull: regCount >= maxCapacity
        };
      })
      .sort((a, b) => {
        // Sort by time
        const timeA = a.time?.split(':').slice(0, 2).join(':') || '00:00';
        const timeB = b.time?.split(':').slice(0, 2).join(':') || '00:00';
        return timeA.localeCompare(timeB);
      });
  }, [events, registrations]);

  // Calculate Member Activity metrics
  const memberActivity = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Most Active This Month - Top 5 by class attendance (past classes only)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthEventIds = events
      .filter(event => {
        const eventDate = new Date(event.date + 'T00:00:00');
        return eventDate >= startOfMonth && eventDate < today; // Past events only
      })
      .map(event => event.id);

    const memberClassCounts = {};
    registrations
      .filter(reg => monthEventIds.includes(reg.event_id))
      .forEach(reg => {
        memberClassCounts[reg.user_id] = (memberClassCounts[reg.user_id] || 0) + 1;
      });

    const mostActive = Object.entries(memberClassCounts)
      .map(([userId, count]) => {
        const profile = profiles.find(p => p.id === userId);
        if (!profile) return null;
        return {
          id: userId,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown',
          count
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Need Attention - Members inactive 30+ days
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const recentEventIds = events
      .filter(event => {
        const eventDate = new Date(event.date + 'T00:00:00');
        return eventDate >= thirtyDaysAgo;
      })
      .map(event => event.id);

    const recentAttendees = new Set(
      registrations
        .filter(reg => recentEventIds.includes(reg.event_id))
        .map(reg => reg.user_id)
    );

    const inactive = profiles
      .filter(profile => !recentAttendees.has(profile.id))
      .map(profile => {
        // Find their last registration
        const userRegs = registrations
          .filter(reg => reg.user_id === profile.id)
          .map(reg => {
            const event = events.find(e => e.id === reg.event_id);
            return event ? { reg, eventDate: new Date(event.date + 'T00:00:00') } : null;
          })
          .filter(Boolean)
          .sort((a, b) => b.eventDate - a.eventDate);

        const lastRegistration = userRegs[0];
        let daysAgo = null;
        
        if (lastRegistration) {
          const daysDiff = Math.floor((today - lastRegistration.eventDate) / (1000 * 60 * 60 * 24));
          daysAgo = daysDiff;
        } else {
          // Never attended
          daysAgo = 999; // Large number for sorting
        }

        return {
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown',
          daysAgo
        };
      })
      .filter(m => m.daysAgo >= 30)
      .sort((a, b) => b.daysAgo - a.daysAgo)
      .slice(0, 5);

    // Current Streaks - Members with active streaks (3+ days)
    // Streaks based on consecutive days with class registrations
    const calculateStreak = (userId) => {
      // Get all unique class dates for this user (past events only)
      const userClassDates = new Set(
        registrations
          .filter(reg => reg.user_id === userId)
          .map(reg => {
            const event = events.find(e => e.id === reg.event_id);
            if (!event) return null;
            const eventDate = new Date(event.date + 'T00:00:00');
            // Only count past events
            if (eventDate >= today) return null;
            return eventDate.toISOString().split('T')[0]; // Get YYYY-MM-DD string
          })
          .filter(Boolean)
      );

      if (userClassDates.size === 0) return 0;

      // Convert to sorted array of dates
      const sortedDates = Array.from(userClassDates)
        .map(d => new Date(d + 'T00:00:00'))
        .sort((a, b) => b - a); // Most recent first

      // Check if streak is active (most recent class was yesterday or today)
      const lastClassDate = sortedDates[0];
      const daysSince = Math.floor((today - lastClassDate) / (1000 * 60 * 60 * 24));
      
      if (daysSince > 1) return 0; // Streak broken (last class was 2+ days ago)

      // Count consecutive days backwards from most recent
      let streak = 1;
      let checkDate = new Date(lastClassDate);
      
      while (true) {
        checkDate.setDate(checkDate.getDate() - 1);
        const checkDateStr = checkDate.toISOString().split('T')[0];
        
        if (userClassDates.has(checkDateStr)) {
          streak++;
        } else {
          break; // Streak ends
        }
      }

      return streak;
    };

    const streaks = profiles
      .map(profile => {
        const streak = calculateStreak(profile.id);
        if (streak < 3) return null; // Only streaks of 3+ days
        
        return {
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown',
          streak
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 3);

    return {
      mostActive,
      inactive,
      streaks
    };
  }, [events, registrations, profiles, attendance]);

  // Helper functions (regular functions, not hooks - can be defined here)
  const formatTime = (time24) => {
    if (!time24) return '';
    const timeWithoutSeconds = time24.split(':').slice(0, 2).join(':');
    const timeSlot = TIME_SLOTS.find(slot => slot.value === timeWithoutSeconds);
    return timeSlot ? timeSlot.display : time24;
  };

  const handleClassClick = (event) => {
    if (onEventSelect) {
      onEventSelect(event);
    }
    // Navigate to dayView - the parent will handle setting the selectedDate
    onNavigate('dayView');
  };

  // NOW check authorization AFTER all hooks have been called
  const userRole = user?.user_metadata?.role || 'student';
  const isAuthorized = userRole === 'coach' || userRole === 'admin';

  // Block unauthorized access
  if (!isAuthorized) {
    return (
      <div className="min-h-screen pb-20 pb-20 flex items-center justify-center px-4">
        <div className="bg-white rounded-[12px] shadow-gym p-4 text-center max-w-md w-full">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-semibold text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-8">You don't have permission to access the admin dashboard.</p>
          <button
            onClick={() => onNavigate('dashboard')}
            className="bg-gym-primary text-white px-4 py-3 rounded-grip font-medium hover:opacity-90 transition-all min-h-[48px]"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-gym-secondary shadow-lg border-b border-gym-secondary">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Logo size="medium" variant="dark" />
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-poppins font-bold text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Manage gym members and view analytics</p>
        </div>

        {/* Quick Stats Section */}
        <div className="mb-8">
          <h2 className="text-xl font-poppins font-bold text-white mb-4">
            Quick Stats
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Members */}
            <div className="bg-white rounded-[12px] shadow-gym p-4">
              <div className="text-sm text-gray-600 mb-2">Total Members</div>
              <div className="text-3xl font-bold text-gym-text-dark">{stats.totalMembers}</div>
            </div>

            {/* Active This Week */}
            <div className="bg-white rounded-[12px] shadow-gym p-4">
              <div className="text-sm text-gray-600 mb-2">Active This Week</div>
              <div className="text-3xl font-bold text-gym-text-dark">{stats.activeThisWeek}</div>
            </div>

            {/* Total Classes This Week */}
            <div className="bg-white rounded-[12px] shadow-gym p-4">
              <div className="text-sm text-gray-600 mb-2">Classes This Week</div>
              <div className="text-3xl font-bold text-gym-text-dark">{stats.classesThisWeek}</div>
            </div>

            {/* Today's Classes */}
            <div className="bg-white rounded-[12px] shadow-gym p-4">
              <div className="text-sm text-gray-600 mb-2">Today's Classes</div>
              <div className="text-3xl font-bold text-gym-text-dark">{stats.todaysClasses}</div>
            </div>
          </div>
        </div>

        {/* Today's Classes Section */}
        <div className="mb-8">
          <h2 className="text-xl font-poppins font-bold text-white mb-4">
            Today's Classes
          </h2>
          {todaysClassesWithCounts.length === 0 ? (
            <div className="bg-white rounded-[12px] shadow-gym p-4 text-center">
              <span className="text-4xl block mb-2">📅</span>
              <p className="text-gym-text-dark text-lg font-medium">No classes scheduled for today</p>
              <p className="text-gray-600 text-sm mt-2">Click "Create Workout" to schedule one</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todaysClassesWithCounts.map((event) => (
                <div
                  key={event.id}
                  onClick={() => handleClassClick(event)}
                  className={`bg-white rounded-grip shadow-lg p-4 border-2 cursor-pointer transition-all hover:shadow-lg-lg min-h-[80px] flex items-center ${
                    event.isFull 
                      ? 'border-mjg-error bg-red-50' 
                      : 'border-gray-300 hover:border-mjg-accent'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg text-gym-text-dark">
                          {event.title}
                        </h3>
                        {event.isFull && (
                          <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded">
                            FULL
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm">{formatTime(event.time)}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gym-text-dark">
                        {event.registrationCount}/{event.maxCapacity}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">registered</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Member Activity Section */}
        <div className="mb-8">
          <h2 className="text-xl font-poppins font-bold text-white mb-4">
            Member Activity
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Most Active This Month */}
            <div className="bg-white rounded-[12px] shadow-gym p-4">
              <h3 className="text-lg font-semibold text-gym-text-dark mb-4">
                🏆 Most Active This Month
              </h3>
              {memberActivity.mostActive.length === 0 ? (
                <div className="text-center py-4">
                  <span className="text-2xl block mb-2">📊</span>
                  <p className="text-gray-600 text-sm">No activity this month</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {memberActivity.mostActive.map((member, index) => (
                    <div key={member.id} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {index === 0 && <span className="text-lg">🏆</span>}
                        <span className="text-sm text-gym-accent font-medium">
                          {member.name}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gym-accent">
                        {member.count} {member.count === 1 ? 'class' : 'classes'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Need Attention */}
            <div className="bg-white rounded-[12px] shadow-gym p-4">
              <h3 className="text-lg font-semibold text-gym-text-dark mb-4">
                ⚠️ Need Attention
              </h3>
              {memberActivity.inactive.length === 0 ? (
                <div className="text-center py-4">
                  <div className="text-center py-4">
                    <span className="text-2xl block mb-2">🎉</span>
                    <p className="text-gym-text-dark text-sm font-medium">All members active!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {memberActivity.inactive.map((member) => (
                    <div key={member.id} className="flex justify-between items-center">
                      <span className="text-sm text-gym-accent font-medium">
                        {member.name}
                      </span>
                      <span className="text-xs text-gray-600">
                        Last class: {member.daysAgo === 999 ? 'Never' : `${member.daysAgo} days ago`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Current Streaks */}
            <div className="bg-white rounded-[12px] shadow-gym p-4">
              <h3 className="text-lg font-semibold text-gym-text-dark mb-4">
                🔥 Current Streaks
              </h3>
              {memberActivity.streaks.length === 0 ? (
                <div className="text-center py-4">
                  <span className="text-2xl block mb-2">🔥</span>
                  <p className="text-gray-600 text-sm">No active streaks</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {memberActivity.streaks.map((member) => (
                    <div key={member.id} className="flex justify-between items-center">
                      <span className="text-sm text-gym-accent font-medium">
                        {member.name}
                      </span>
                      <span className="text-sm font-semibold text-gym-accent">
                        🔥 {member.streak} {member.streak === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div>
          <h2 className="text-xl font-poppins font-bold text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => onNavigate('manageMembers')}
              className="bg-white rounded-grip shadow-lg p-4 border-2 border-gray-300 hover:border-mjg-accent transition-all hover:shadow-lg text-left min-h-[48px]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gym-secondary rounded-grip flex items-center justify-center">
                  <svg className="w-6 h-6 text-gym-text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gym-text-dark">Manage Members</h3>
                  <p className="text-sm text-gray-600 mt-1">View and manage gym members</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigate('createEvent')}
              className="bg-white rounded-grip shadow-lg p-4 border-2 border-gray-300 hover:border-mjg-accent transition-all hover:shadow-lg text-left min-h-[48px]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gym-secondary rounded-grip flex items-center justify-center">
                  <svg className="w-6 h-6 text-gym-text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gym-text-dark">Create Workout</h3>
                  <p className="text-sm text-gray-600 mt-1">Schedule a new workout class</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

