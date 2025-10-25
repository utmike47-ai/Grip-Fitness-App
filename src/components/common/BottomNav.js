import React from 'react';

const BottomNav = ({ userRole, currentView, onNavigate }) => {
  const isCoach = userRole === 'coach';
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {/* Home Button */}
        <button
          onClick={() => {
            onNavigate('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center flex-1 py-2 ${
            currentView === 'dashboard' ? 'text-grip-primary' : 'text-gray-500'
          }`}
        >
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs">Home</span>
        </button>

        {/* Second Button - Create for Coach, My Classes for Student */}
        {isCoach ? (
          <button
            onClick={() => onNavigate('createEvent')}
            className={`flex flex-col items-center justify-center flex-1 py-2 ${
              currentView === 'createEvent' ? 'text-grip-primary' : 'text-gray-500'
            }`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs">Create</span>
          </button>
        ) : (
          <button
            onClick={() => {
              if (currentView === 'dashboard') {
                // If already on dashboard, scroll to My Classes section
                const myClassesSection = document.getElementById('my-classes-section');
                if (myClassesSection) {
                  myClassesSection.scrollIntoView({ behavior: 'smooth' });
                }
              } else {
                // If on another page, go to dashboard then scroll
                onNavigate('dashboard');
                setTimeout(() => {
                  const myClassesSection = document.getElementById('my-classes-section');
                  if (myClassesSection) {
                    myClassesSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }, 100);
              }
            }}
            className="flex flex-col items-center justify-center flex-1 py-2 text-gray-500"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className="text-xs">My Classes</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default BottomNav;

