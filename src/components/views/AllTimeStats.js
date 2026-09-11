import React, { useEffect, useMemo, useState } from 'react';
import { Award, BarChart2, CalendarDays, Check, ChevronLeft, Clock, Flame, Trophy, Zap } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import {
  computeAllTimeStats,
  formatMemberSince,
  formatMonthLabel,
  formatWeekMonth,
} from '../../utils/allTimeStats';

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F'];

const AllTimeStats = ({
  user,
  events,
  registrations,
  profiles = [],
  onBack,
}) => {
  const [memberSince, setMemberSince] = useState(user?.created_at || null);

  useEffect(() => {
    if (!user?.id) return undefined;

    const fromProfiles = (profiles || []).find((profile) => String(profile.id) === String(user.id));
    if (fromProfiles?.created_at) {
      setMemberSince(fromProfiles.created_at);
      return undefined;
    }

    supabase
      .from('profiles')
      .select('created_at')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load member since:', error);
          setMemberSince(user.created_at || null);
          return;
        }
        setMemberSince(data?.created_at || user.created_at || null);
      });

    return undefined;
  }, [user, profiles]);

  const stats = useMemo(
    () => computeAllTimeStats({
      userId: user?.id,
      registrations,
      events,
      profiles,
    }),
    [user, registrations, events, profiles]
  );

  const membership = formatMemberSince(memberSince);
  const topTwenty = stats.rank && stats.rank <= 20;
  const monthDelta = stats.monthDelta;
  const aboveGymAvg = stats.avgPerWeek > stats.gymAvg && stats.gymAvg > 0;

  return (
    <div className="app-shell">
      <div className="app-shell__inner">
        <header className="stats-topbar">
          <button type="button" className="stats-topbar__back" onClick={onBack} aria-label="Go back">
            <ChevronLeft size={22} />
          </button>
          <h1 className="stats-topbar__title">All Time Stats</h1>
        </header>

        <section className="stats-hero-row" aria-label="Headline stats">
          <div>
            <p className="stats-hero-row__value">{stats.totalClasses}</p>
            <p className="stats-hero-row__label">Total Classes</p>
          </div>
          <div>
            <p className="stats-hero-row__value">{stats.weekStreak}</p>
            <p className="stats-hero-row__label">Week Streak</p>
          </div>
          <div>
            <p className="stats-hero-row__value">{stats.bestStreak}</p>
            <p className="stats-hero-row__label">Best Streak</p>
          </div>
        </section>

        <section className="stats-rank">
          <div className="stats-rank__badge">#{stats.rank || '—'}</div>
          <div>
            <p className="stats-rank__title">
              {topTwenty ? 'Top 20 Member' : 'Your Rank'}
              {topTwenty && <span aria-hidden="true"> 🔥</span>}
            </p>
            <p className="stats-rank__copy">
              {stats.rank && stats.members
                ? `You're #${stats.rank} of ${stats.members} members in total attendance`
                : 'Ranking available after your first class'}
            </p>
          </div>
        </section>

        <h2 className="stats-section-title">Activity</h2>
        <div className="stats-activity">
          <article className="stats-activity__card">
            <CalendarDays size={16} />
            <p className="stats-activity__value">{stats.thisMonthCount}</p>
            <p className="stats-activity__label">This Month</p>
            <p className={`stats-activity__meta ${monthDelta > 0 ? 'is-up' : ''}`}>
              {monthDelta > 0
                ? `↑ +${monthDelta} more than last month`
                : monthDelta < 0
                  ? `${monthDelta} vs last month`
                  : 'Same as last month'}
            </p>
          </article>
          <article className="stats-activity__card">
            <BarChart2 size={16} />
            <p className="stats-activity__value">{stats.avgPerWeek.toFixed(1)}</p>
            <p className="stats-activity__label">Avg/Week</p>
            <p className={`stats-activity__meta ${aboveGymAvg ? 'is-up' : ''}`}>
              {stats.gymAvg > 0
                ? `${aboveGymAvg ? '↑ Above' : ''} ${stats.gymAvg.toFixed(1)} gym avg`.trim()
                : 'Gym average coming soon'}
            </p>
          </article>
          <article className="stats-activity__card">
            <Clock size={16} />
            <p className="stats-activity__value">{stats.favoriteTime}</p>
            <p className="stats-activity__label">Favorite Time</p>
          </article>
          <article className="stats-activity__card">
            <CalendarDays size={16} />
            <p className="stats-activity__value stats-activity__value--text">{stats.mostActiveDay}</p>
            <p className="stats-activity__label">Most Active Day</p>
          </article>
        </div>

        <h2 className="stats-section-title">Personal Records</h2>
        <div className="stats-records">
          <article className="stats-record">
            <span className="stats-record__icon"><Flame size={16} /></span>
            <div className="stats-record__copy">
              <p>Longest Streak</p>
              <span>
                {stats.longestPerfectStreak
                  ? `${stats.longestPerfectStreak} consecutive 5/5 weeks${stats.longestPerfectEnd ? ` · ${formatWeekMonth(stats.longestPerfectEnd)}` : ''}`
                  : 'Hit 5/5 for a full week to start this'}
              </span>
            </div>
            <strong>{stats.longestPerfectStreak ? `${stats.longestPerfectStreak} WKS` : '—'}</strong>
          </article>
          <article className="stats-record">
            <span className="stats-record__icon"><Trophy size={16} /></span>
            <div className="stats-record__copy">
              <p>50 Classes</p>
              <span>
                {stats.totalClasses >= stats.classMilestone
                  ? 'Milestone reached'
                  : 'Milestone reached · Coming soon'}
              </span>
            </div>
            <strong>{stats.totalClasses}/{stats.classMilestone}</strong>
          </article>
          <article className="stats-record">
            <span className="stats-record__icon"><Zap size={16} /></span>
            <div className="stats-record__copy">
              <p>Early Bird</p>
              <span>{stats.earlyBirdCount} classes at 6:00 AM</span>
            </div>
            <strong>{stats.earlyBirdCount}x</strong>
          </article>
          <article className="stats-record">
            <span className="stats-record__icon"><Award size={16} /></span>
            <div className="stats-record__copy">
              <p>Perfect Month</p>
              <span>
                {stats.perfectMonthKey
                  ? `20+ classes in ${formatMonthLabel(stats.perfectMonthKey)}`
                  : '20+ classes in one month'}
              </span>
            </div>
            <strong>
              {stats.perfectMonthKey
                ? new Date(`${stats.perfectMonthKey}-01T12:00:00`).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
                : '—'}
            </strong>
          </article>
        </div>

        <section className="stats-weeks">
          <div className="stats-weeks__head">
            <h2 className="stats-section-title">Last 6 Weeks</h2>
          </div>
          <div className="stats-weeks__sub">
            <span>Attendance</span>
            <span>Mon – Fri</span>
          </div>
          <div className="stats-weeks__grid" aria-label="Class calendar">
            <div className="stats-weeks__row stats-weeks__row--labels">
              <span />
              {WEEKDAY_LABELS.map((label, index) => (
                <span key={`${label}-${index}`}>{label}</span>
              ))}
              <span />
            </div>
            {stats.calendar.map((week) => (
              <div key={week.weekStart} className="stats-weeks__row">
                <span className="stats-weeks__label">{week.label}</span>
                {week.days.map((day) => (
                  <span
                    key={day.date}
                    className={[
                      'stats-weeks__dot',
                      day.active ? 'is-active' : '',
                      day.isFuture ? 'is-future' : '',
                    ].filter(Boolean).join(' ')}
                    title={day.date}
                  >
                    {day.active && <Check size={11} strokeWidth={3} />}
                  </span>
                ))}
                <span className="stats-weeks__score">
                  {week.attended}/5{week.perfect ? ' 🔥' : ''}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="stats-since">
          <p className="stats-since__label">Member Since</p>
          <p className="stats-since__date">{membership.dateLabel}</p>
          {membership.tenure && (
            <p className="stats-since__tenure">{membership.tenure} 🔥</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default AllTimeStats;
