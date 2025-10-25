import React, { useState } from 'react';

const Calendar = ({ events, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="p-2 text-grip-primary hover:bg-grip-secondary/20 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-montserrat font-bold text-grip-primary">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="p-2 text-grip-primary hover:bg-grip-secondary/20 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center font-semibold text-grip-primary text-sm opacity-70">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const dayEvents = getEventsForDate(day);
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const isToday = day.toDateString() === new Date().toDateString();
          
          return (
            <button
              key={index}
              onClick={() => onDateSelect(day)}
              className={`p-3 h-14 text-sm relative rounded-lg transition-all
                ${isCurrentMonth ? 'text-grip-primary' : 'text-gray-400'} 
                ${isToday ? 'bg-grip-accent text-white font-bold' : 'hover:bg-grip-secondary/20'}`}
            >
              {day.getDate()}
              {dayEvents.length > 0 && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
                  {dayEvents.some(e => e.type === 'workout') && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                  {dayEvents.some(e => e.type === 'social') && (
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;