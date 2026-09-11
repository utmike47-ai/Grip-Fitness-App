import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { getGreeting } from '../utils/dates';

const Header = ({ user, title, onBack, onAvatarClick }) => {
  const firstName = (
    user?.user_metadata?.first_name ||
    user?.email?.split('@')[0] ||
    'there'
  ).toUpperCase();

  const firstInitial = user?.user_metadata?.first_name?.[0] || '';
  const lastInitial = user?.user_metadata?.last_name?.[0] || '';
  const initials = (firstInitial + lastInitial).toUpperCase() ||
    (user?.email?.[0] || '?').toUpperCase();

  return (
    <header className="app-header">
      <div className="app-header__row">
        {onBack && (
          <button
            type="button"
            className="app-header__back"
            onClick={onBack}
            aria-label="Go back"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        <div className="app-header__copy">
          <p className="app-header__logo">Grip Fitness</p>
          <h1 className="app-header__greeting">
            {title || (
              <>
                {getGreeting()}, <span className="app-header__name">{firstName}</span>
              </>
            )}
          </h1>
        </div>
        <button
          type="button"
          className="app-header__avatar"
          onClick={onAvatarClick}
          aria-label="Open profile"
        >
          {initials}
        </button>
      </div>
    </header>
  );
};

export default Header;
