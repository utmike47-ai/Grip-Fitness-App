import React from 'react';

const BottomNav = ({ userRole, currentView, onNavigate }) => {
  const isCoach = userRole === 'coach' || userRole === 'admin';
  const isAdmin = userRole === 'admin';
  
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

        {/* Second Button - Create for Coach/Admin, My Classes for Student */}
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

        {/* Admin Button - Only visible to admins */}
        {isAdmin && (
          <button
            onClick={() => {
              onNavigate('adminDashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center flex-1 py-2 ${
              currentView === 'adminDashboard' ? 'text-grip-primary' : 'text-gray-500'
            }`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs">Admin</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default BottomNav;

