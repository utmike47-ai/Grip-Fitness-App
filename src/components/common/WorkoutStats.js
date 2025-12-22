import React from 'react';

const WorkoutStats = ({ attendance, registrations, events, user }) => {
  // Safety checks
  if (!attendance || !registrations || !events || !user) {
    return null;
  }

  // Calculate workout streak
  const calculateStreak = () => {
    if (!attendance || attendance.length === 0) return 0;
    
    const userAttendance = attendance
      .filter(a => a.user_id === user.id && a.attended)
      .map(a => {
        const event = events.find(e => e.id === a.event_id);
        return event ? new Date(event.date) : null;
      })
      .filter(date => date !== null)
      .sort((a, b) => b - a); // Most recent first
    
    if (userAttendance.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if user worked out today or yesterday to maintain streak
    const lastWorkout = new Date(userAttendance[0]);
    lastWorkout.setHours(0, 0, 0, 0);
    
    const daysSinceLastWorkout = Math.floor((today - lastWorkout) / (1000 * 60 * 60 * 24));
    if (daysSinceLastWorkout > 1) return 0; // Streak broken
    
    // Count consecutive workout days
    const uniqueDates = [...new Set(userAttendance.map(d => d.toDateString()))];
    
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const current = new Date(uniqueDates[i]);
      const next = new Date(uniqueDates[i + 1]);
      const dayDiff = Math.floor((current - next) / (1000 * 60 * 60 * 24));
      
      if (dayDiff <= 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak + 1; // Add 1 for the first day
  };

  // Calculate workouts this month
  const getMonthlyWorkouts = () => {
    if (!attendance || !events) return 0;
    
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return attendance.filter(a => {
      if (a.user_id !== user.id || !a.attended) return false;
      const event = events.find(e => e.id === a.event_id);
      if (!event) return false;
      const eventDate = new Date(event.date);
      return eventDate >= firstDayOfMonth;
    }).length;
  };

  // Get this week's workout pattern
  const getWeekPattern = () => {
    if (!attendance || !events) return [];
    
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const weekWorkouts = [];
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(startOfWeek);
      checkDate.setDate(startOfWeek.getDate() + i);
      
      const hasWorkout = attendance.some(a => {
        if (a.user_id !== user.id || !a.attended) return false;
        const event = events.find(e => e.id === a.event_id);
        if (!event) return false;
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === checkDate.getTime();
      });
      
      weekWorkouts.push({
        day: days[i],
        worked: hasWorkout,
        isToday: i === today.getDay()
      });
    }
    
    return weekWorkouts;
  };

  const streak = calculateStreak();
  const monthlyCount = getMonthlyWorkouts();
  const weekPattern = getWeekPattern();

  return (
    <div className="bg-white rounded-grip shadow-gym-lg border border-gray-300-card p-4 mb-8">
      {/* Streak Counter */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-3xl">🔥</span>
          <span className="text-2xl font-bold text-gym-accent">{streak}</span>
        </div>
        <p className="text-gray-600">Day Streak</p>
      </div>

      {/* Week Pattern */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-600 mb-2">This Week</p>
        <div className="flex justify-between">
          {weekPattern.map((day, index) => (
            <div
              key={index}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                ${day.worked 
                  ? 'bg-grip-primary text-white' 
                  : day.isToday 
                    ? 'bg-grip-primary/50 text-white' 
                    : 'bg-grip-secondary text-gray-600'}`}
            >
              {day.day}
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="flex justify-center">
        <div className="text-center p-4 bg-grip-secondary rounded-grip w-full max-w-xs">
          <p className="text-2xl font-bold text-gym-accent">{monthlyCount}</p>
          <p className="text-xs text-gray-600">This Month</p>
        </div>
      </div>
    </div>
  );
};

export default WorkoutStats;

