import React from 'react';

const Logo = ({ size = 'medium', showText = true }) => {
  const sizes = {
    small: 'text-lg',
    medium: 'text-xl',
    large: 'text-2xl'
  };

  return (
    <div className="flex items-center">
      <span className={`${sizes[size]} font-montserrat font-bold text-grip-primary`}>
        GRIP FITNESS FOR LONGEVITY
      </span>
    </div>
  );
};

export default Logo;