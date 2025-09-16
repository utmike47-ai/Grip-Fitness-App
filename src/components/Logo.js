import React from 'react';

const Logo = ({ size = 'medium', showText = true }) => {
  const sizes = {
    small: { container: 'h-8', text: 'text-xl' },
    medium: { container: 'h-10', text: 'text-2xl' },
    large: { container: 'h-14', text: 'text-4xl' }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Simple text logo for now */}
      <div className={`${sizes[size].text} font-montserrat font-extrabold text-grip-primary`}>
        GRIP
      </div>
      {showText && (
        <div className="text-[10px] tracking-[0.15em] text-grip-primary opacity-70 font-medium">
          FITNESS FOR LONGEVITY
        </div>
      )}
    </div>
  );
};

export default Logo;