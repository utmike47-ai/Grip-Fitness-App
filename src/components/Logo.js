import React from 'react';

const Logo = ({ size = 'medium', showText = true, variant = 'dark' }) => {
  // variant: 'dark' for dark backgrounds (white text), 'light' for light backgrounds (dark text)
  const sizes = {
    small: { container: 'h-8', text: 'text-xl' },
    medium: { container: 'h-10', text: 'text-2xl' },
    large: { container: 'h-14', text: 'text-4xl' }
  };

  const textColor = variant === 'dark' ? 'text-white' : 'text-gym-text-dark';
  const subtitleColor = variant === 'dark' ? 'text-white opacity-80' : 'text-gym-text-dark opacity-70';

  return (
    <div className="flex items-center gap-2">
      {/* GRIP - Bold, Large */}
      <div className={`${sizes[size].text} font-poppins font-extrabold ${textColor}`}>
        GRIP
      </div>
      {showText && (
        <div className={`text-[10px] tracking-[0.15em] ${subtitleColor} font-medium`}>
          FITNESS FOR LONGEVITY
        </div>
      )}
    </div>
  );
};

export default Logo;