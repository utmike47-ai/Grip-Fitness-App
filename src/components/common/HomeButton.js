import React from 'react';

const HomeButton = ({ onGoHome }) => {
  return (
    <button
      onClick={onGoHome}
      className="fixed bottom-6 right-6 bg-grip-primary text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-40"
      aria-label="Go to home"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    </button>
  );
};

export default HomeButton;

