import React from 'react';

const Logo = ({ size = 'medium', showText = false }) => {
  const sizes = {
    small: 'h-10',
    medium: 'h-14', // Increased from h-10 to h-14 (~56px)
    large: 'h-20'
  };

  return (
    <div className="flex items-center py-2">
      <img 
        src="/logo-mjg.png" 
        alt="MJG Fitness" 
        className={sizes[size]}
        style={{ objectFit: 'contain', filter: 'brightness(1.1)' }} // Slightly brighten logo for dark bg
      />
    </div>
  );
};

export default Logo;