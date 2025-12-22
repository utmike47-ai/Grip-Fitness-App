import React from 'react';

const BookingModal = ({ isOpen, onClose, eventDetails }) => {
  if (!isOpen || !eventDetails) return null;

  const formatDate = (dateStr) => {
    // Add timezone offset to prevent day shift
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-[12px] shadow-gym p-8 max-w-md mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gym-accent"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-semibold text-grip-primary mb-4">You're Booked!</h2>
          
          <div className="bg-gray-100 rounded-grip p-4 mb-6">
            <p className="text-lg font-semibold text-gym-text-dark mb-2">{eventDetails.title}</p>
            <p className="text-gym-text-dark">{formatDate(eventDetails.date)}</p>
            <p className="text-gym-text-dark">{eventDetails.time}</p>
          </div>
          
          <p className="text-gray-600">See you there!</p>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;

