import React, { useEffect } from 'react';
import Header from '../Header';
import WeekStrip from '../WeekStrip';
import DayView from './DayView';
import SwipeContainer from '../SwipeContainer';
import { getWeekStripBounds, startOfDay } from '../../utils/dates';

const Dashboard = ({
  user,
  events,
  registrations,
  attendance = [],
  selectedDate,
  onSignOut,
  onViewChange,
  onDateSelect,
  onRegister,
  onCancelRegistration,
  onEditEvent,
  onDeleteEvent,
  onRemoveStudent,
  onAddStudent,
  onAddDropIn,
  onAddCustomTime,
  onCancelTimeSlot,
  onToggleAttendance,
}) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const activeDate = selectedDate || startOfDay(new Date());
  const { minDate, maxDate } = getWeekStripBounds();
  const needsProfileUpdate =
    user?.user_metadata?.first_name === 'User' ||
    user?.user_metadata?.first_name?.length === 8 ||
    user?.user_metadata?.last_name?.length === 8;

  return (
    <div className="app-shell">
      <div className="app-shell__inner">
        <Header
          user={user}
          onAvatarClick={() => onViewChange?.('profileEdit')}
        />

        <WeekStrip
          selectedDate={activeDate}
          onSelectDate={onDateSelect}
          events={events}
        />

        {needsProfileUpdate && (
          <div className="home-alert">
            <p className="home-alert__title">Please update your name</p>
            <p className="home-alert__body">
              We need you to update your profile information.
            </p>
            <button
              type="button"
              className="home-alert__button"
              onClick={() => onViewChange?.('profileEdit')}
            >
              Update Profile
            </button>
          </div>
        )}

        <SwipeContainer
          selectedDate={activeDate}
          minDate={minDate}
          maxDate={maxDate}
          onDateChange={onDateSelect}
        >
          <DayView
            embedded
            selectedDate={activeDate}
            events={events}
            registrations={registrations}
            attendance={attendance}
            user={user}
            onRegister={onRegister}
            onCancelRegistration={onCancelRegistration}
            onEditEvent={onEditEvent}
            onDeleteEvent={onDeleteEvent}
            onRemoveStudent={onRemoveStudent}
            onAddStudent={onAddStudent}
            onAddDropIn={onAddDropIn}
            onAddCustomTime={onAddCustomTime}
            onCancelTimeSlot={onCancelTimeSlot}
            onToggleAttendance={onToggleAttendance}
          />
        </SwipeContainer>

        <button type="button" className="home-signout" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
