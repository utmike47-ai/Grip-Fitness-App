import React from 'react';

const Navigation = ({ currentView, setCurrentView, user, signOut }) => {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-bold text-grip-primary">Grip Fitness</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'dashboard' 
                      ? 'bg-grip-primary text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('classes')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'classes' 
                      ? 'bg-grip-primary text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Classes
                </button>
                <button
                  onClick={signOut}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
