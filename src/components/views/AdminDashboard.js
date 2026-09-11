import React, { useMemo, useEffect } from 'react';
import { Plus, Users } from 'lucide-react';
import Header from '../Header';
import { TIME_SLOTS, normalizeTimeSlotValue } from '../../utils/constants';
import { formatDateKey } from '../../utils/dates';

const capacityTone = (count, max) => {
  const pct = max > 0 ? count / max : 0;
  if (pct >= 0.75) return 'hot';
  if (pct >= 0.5) return 'mid';
  return 'ok';
};

const AdminDashboard = ({ user, events, registrations, profiles = [], onNavigate, onEventSelect }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const todayStr = formatDateKey(today);

    const weekEventIds = events
      .filter((event) => {
        const eventDate = new Date(event.date + 'T00:00:00');
        return eventDate >= startOfWeek && eventDate <= endOfWeek;
      })
      .map((event) => event.id);

    const activeUsersThisWeek = new Set(
      registrations
        .filter((reg) => weekEventIds.includes(reg.event_id))
        .map((reg) => reg.user_id)
    ).size;

    const classesThisWeek = events.filter((event) => {
      const eventDate = new Date(event.date + 'T00:00:00');
      return eventDate >= startOfWeek && eventDate <= endOfWeek;
    }).length;

    const todaysClasses = events.filter((event) => event.date === todayStr);

    return {
      totalMembers: profiles.length,
      activeThisWeek: activeUsersThisWeek,
      classesThisWeek,
      todaysClasses: todaysClasses.length,
    };
  }, [events, registrations, profiles]);

  const todaysClassesWithCounts = useMemo(() => {
    const todayStr = formatDateKey(new Date());
    return events
      .filter((event) => event.date === todayStr)
      .map((event) => {
        const regCount = registrations.filter((reg) => reg.event_id === event.id).length;
        const maxCapacity = event.max_capacity || event.maxCapacity || 15;
        return {
          ...event,
          registrationCount: regCount,
          maxCapacity,
          isFull: regCount >= maxCapacity,
        };
      })
      .sort((a, b) => {
        const timeA = normalizeTimeSlotValue(a.time) || '00:00';
        const timeB = normalizeTimeSlotValue(b.time) || '00:00';
        return timeA.localeCompare(timeB);
      });
  }, [events, registrations]);

  const memberActivity = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthEventIds = events
      .filter((event) => {
        const eventDate = new Date(event.date + 'T00:00:00');
        return eventDate >= startOfMonth && eventDate < today;
      })
      .map((event) => event.id);

    const memberClassCounts = {};
    registrations
      .filter((reg) => monthEventIds.includes(reg.event_id))
      .forEach((reg) => {
        memberClassCounts[reg.user_id] = (memberClassCounts[reg.user_id] || 0) + 1;
      });

    const mostActive = Object.entries(memberClassCounts)
      .map(([userId, count]) => {
        const profile = profiles.find((p) => p.id === userId);
        if (!profile) return null;
        return {
          id: userId,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown',
          count,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(today.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const recentEventIds = events
      .filter((event) => {
        const eventDate = new Date(event.date + 'T00:00:00');
        return eventDate >= fourteenDaysAgo;
      })
      .map((event) => event.id);

    const recentAttendees = new Set(
      registrations
        .filter((reg) => recentEventIds.includes(reg.event_id))
        .map((reg) => reg.user_id)
    );

    const inactive = profiles
      .filter((profile) => !recentAttendees.has(profile.id))
      .map((profile) => {
        const userRegs = registrations
          .filter((reg) => reg.user_id === profile.id)
          .map((reg) => {
            const event = events.find((e) => e.id === reg.event_id);
            return event ? { reg, eventDate: new Date(event.date + 'T00:00:00') } : null;
          })
          .filter(Boolean)
          .sort((a, b) => b.eventDate - a.eventDate);

        const lastRegistration = userRegs[0];
        let daysAgo = null;

        if (lastRegistration) {
          daysAgo = Math.floor((today - lastRegistration.eventDate) / (1000 * 60 * 60 * 24));
        } else {
          daysAgo = 999;
        }

        return {
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown',
          daysAgo,
        };
      })
      .filter((m) => m.daysAgo >= 14)
      .sort((a, b) => b.daysAgo - a.daysAgo)
      .slice(0, 5);

    const calculateStreak = (userId) => {
      const userClassDates = new Set(
        registrations
          .filter((reg) => reg.user_id === userId)
          .map((reg) => {
            const event = events.find((e) => e.id === reg.event_id);
            if (!event) return null;
            const eventDate = new Date(event.date + 'T00:00:00');
            if (eventDate >= today) return null;
            return eventDate.toISOString().split('T')[0];
          })
          .filter(Boolean)
      );

      if (userClassDates.size === 0) return 0;

      const sortedDates = Array.from(userClassDates)
        .map((d) => new Date(d + 'T00:00:00'))
        .sort((a, b) => b - a);

      const lastClassDate = sortedDates[0];
      const daysSince = Math.floor((today - lastClassDate) / (1000 * 60 * 60 * 24));

      if (daysSince > 1) return 0;

      let streak = 1;
      const checkDate = new Date(lastClassDate);

      while (true) {
        checkDate.setDate(checkDate.getDate() - 1);
        const checkDateStr = checkDate.toISOString().split('T')[0];

        if (userClassDates.has(checkDateStr)) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    };

    const streaks = profiles
      .map((profile) => {
        const streak = calculateStreak(profile.id);
        if (streak < 3) return null;

        return {
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown',
          streak,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 3);

    return {
      mostActive,
      inactive,
      streaks,
    };
  }, [events, registrations, profiles]);

  const formatTime = (time24) => {
    if (!time24) return '';
    const normalized = normalizeTimeSlotValue(time24);
    const timeSlot = TIME_SLOTS.find((slot) => slot.value === normalized);
    return timeSlot ? timeSlot.display : normalized || time24;
  };

  const formatWeekday = (dateStr) => {
    if (!dateStr) return '';
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
  };

  const handleClassClick = (event) => {
    if (onEventSelect) {
      onEventSelect(event);
    }
    onNavigate('dayView');
  };

  const userRole = user?.user_metadata?.role || 'student';
  const isAuthorized = userRole === 'admin';

  if (!isAuthorized) {
    return (
      <div className="app-shell">
        <div className="app-shell__inner admin-denied">
          <p className="admin-denied__icon" aria-hidden="true">🔒</p>
          <h2>Access Denied</h2>
          <p>You don't have permission to access the admin dashboard.</p>
          <button type="button" className="admin-denied__btn" onClick={() => onNavigate('dashboard')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-shell__inner">
        <Header
          user={user}
          title={(
            <>
              ADMIN <span className="app-header__name">DASHBOARD</span>
            </>
          )}
          onAvatarClick={() => onNavigate('profileEdit')}
        />

        <section className="admin-section" aria-label="Quick stats">
          <h2 className="admin-section__title">Quick Stats</h2>
          <div className="admin-stats">
            <article className="admin-stat admin-stat--accent">
              <p className="admin-stat__value">{stats.totalMembers}</p>
              <p className="admin-stat__label">Total Members</p>
            </article>
            <article className="admin-stat">
              <p className="admin-stat__value">{stats.activeThisWeek}</p>
              <p className="admin-stat__label">Active This Week</p>
            </article>
            <article className="admin-stat">
              <p className="admin-stat__value">{stats.classesThisWeek}</p>
              <p className="admin-stat__label">Classes This Week</p>
            </article>
            <article className="admin-stat">
              <p className="admin-stat__value">{stats.todaysClasses}</p>
              <p className="admin-stat__label">Today's Classes</p>
            </article>
          </div>
        </section>

        <section className="admin-section" aria-label="Today's classes">
          <h2 className="admin-section__title">Today's Classes</h2>
          {todaysClassesWithCounts.length === 0 ? (
            <div className="admin-empty">
              <p>No classes scheduled for today</p>
            </div>
          ) : (
            <div className="admin-class-list">
              {todaysClassesWithCounts.map((event) => {
                const tone = capacityTone(event.registrationCount, event.maxCapacity);
                const fill = Math.min(100, Math.round((event.registrationCount / event.maxCapacity) * 100));
                return (
                  <button
                    key={event.id}
                    type="button"
                    className="admin-class"
                    onClick={() => handleClassClick(event)}
                  >
                    <div className="admin-class__copy">
                      <p className="admin-class__day">{formatWeekday(event.date)}</p>
                      <p className="admin-class__count">
                        {event.registrationCount}
                        <span>/{event.maxCapacity}</span>
                      </p>
                      <p className="admin-class__time">{formatTime(event.time)}</p>
                    </div>
                    <span className={`admin-class__meter admin-class__meter--${tone}`} aria-hidden="true">
                      <span style={{ width: `${Math.max(fill, 8)}%` }} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="admin-section" aria-label="Member activity">
          <h2 className="admin-section__title">Member Activity</h2>

          <article className="admin-activity">
            <h3 className="admin-activity__title">🏆 Most Active This Month</h3>
            {memberActivity.mostActive.length === 0 ? (
              <p className="admin-activity__empty">No activity this month</p>
            ) : (
              <ul className="admin-activity__list">
                {memberActivity.mostActive.map((member, index) => (
                  <li key={member.id} className="admin-activity__row">
                    <span className="admin-activity__name">
                      {index === 0 && <span className="admin-activity__medal" aria-hidden="true">🥇</span>}
                      {member.name}
                    </span>
                    <span className="admin-activity__value">
                      {member.count} {member.count === 1 ? 'class' : 'classes'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="admin-activity">
            <h3 className="admin-activity__title">⚠️ Need Attention</h3>
            {memberActivity.inactive.length === 0 ? (
              <p className="admin-activity__empty">All members active!</p>
            ) : (
              <ul className="admin-activity__list">
                {memberActivity.inactive.map((member) => (
                  <li key={member.id} className="admin-activity__row">
                    <span className="admin-activity__name">{member.name}</span>
                    <span className="admin-activity__value admin-activity__value--warn">
                      {member.daysAgo === 999 ? 'Never' : `${member.daysAgo} days`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="admin-activity">
            <h3 className="admin-activity__title">🔥 Current Streaks</h3>
            {memberActivity.streaks.length === 0 ? (
              <p className="admin-activity__empty">No active streaks</p>
            ) : (
              <ul className="admin-activity__list">
                {memberActivity.streaks.map((member) => (
                  <li key={member.id} className="admin-activity__row">
                    <span className="admin-activity__name">{member.name}</span>
                    <span className="admin-activity__value">
                      🔥 {member.streak} {member.streak === 1 ? 'day' : 'days'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>

        <section className="admin-section" aria-label="Quick actions">
          <h2 className="admin-section__title">Quick Actions</h2>
          <div className="admin-actions">
            <button
              type="button"
              className="admin-action"
              onClick={() => onNavigate('manageMembers')}
            >
              <span className="admin-action__icon" aria-hidden="true">
                <Users size={20} />
              </span>
              <span className="admin-action__title">Manage Members</span>
              <span className="admin-action__copy">View and manage gym members</span>
            </button>
            <button
              type="button"
              className="admin-action"
              onClick={() => onNavigate('createEvent')}
            >
              <span className="admin-action__icon" aria-hidden="true">
                <Plus size={20} />
              </span>
              <span className="admin-action__title">Create Workout</span>
              <span className="admin-action__copy">Schedule a new workout class</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
