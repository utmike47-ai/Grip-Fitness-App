import React, { useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }[type];

  return (
    <div className="fixed top-4 right-4 left-4 md:left-auto z-50 animate-slide-in">
      <div className={`${bgColor} text-white px-4 md:px-6 py-3 rounded-lg shadow-xl flex items-center space-x-3 max-w-sm ml-auto`}>
        <span className="text-lg">
          {type === 'success' && '✓'}
          {type === 'error' && '✕'}
          {type === 'warning' && '⚠'}
          {type === 'info' && 'ℹ'}
        </span>
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
};

export default Toast;