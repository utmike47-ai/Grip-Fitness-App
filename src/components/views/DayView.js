import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { TIME_SLOTS } from '../../utils/constants';
import { useSwipeable } from 'react-swipeable';
import { fetchNoteForEvent, saveNote, deleteNote } from '../../utils/notesService';

const DayView = ({ 
  selectedDate, 
  events, 
  registrations, 
  user,
  onBack,
  onRegister,
  onCancelRegistration,
  onToggleAttendance,
  onEditEvent,
  onDeleteEvent,
  onDateChange
}) => {
  const NOTE_MAX_LENGTH = 500;
  const dateStr = selectedDate?.toISOString().split('T')[0];
  const dayEvents = events.filter(event => event.date === dateStr);
  const textareaRef = useRef(null);
  const modalContainerRef = useRef(null);
  const [noteMap, setNoteMap] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [modalActive, setModalActive] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteId, setNoteId] = useState(null);
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteFeedback, setNoteFeedback] = useState(null);
  const [activeContext, setActiveContext] = useState(null); // { group, event }

  const getRegistrationCount = useCallback((eventId) => (
    registrations.filter(reg => reg.event_id === eventId).length
  ), [registrations]);

  const isUserRegistered = useCallback((eventId) => (
    registrations.some(reg => reg.event_id === eventId && reg.user_id === user.id)
  ), [registrations, user?.id]);

  const formatTimeDisplay = (time24) => {
    // Remove seconds if present (e.g., "16:30:00" becomes "16:30")
    const timeWithoutSeconds = time24.split(':').slice(0, 2).join(':');
    const timeSlot = TIME_SLOTS.find(slot => slot.value === timeWithoutSeconds);
    return timeSlot ? timeSlot.display : time24;
  };

  // Group events by title
  const groupedEvents = useMemo(() => dayEvents.reduce((groups, event) => {
    const key = `${event.title}-${event.type}`;
    if (!groups[key]) {
      groups[key] = {
        title: event.title,
        type: event.type,
        details: event.details,
        times: []
      };
    }
    groups[key].times.push({
      id: event.id,
      time: event.time,
      registrationCount: getRegistrationCount(event.id),
      userRegistered: isUserRegistered(event.id),
      registeredUsers: registrations.filter(reg => reg.event_id === event.id)
    });
    return groups;
  }, {}), [dayEvents, registrations, getRegistrationCount, isUserRegistered]);

  const eventGroupList = useMemo(() => Object.values(groupedEvents), [groupedEvents]);

  useEffect(() => {
    if (!user || eventGroupList.length === 0) {
      setNoteMap({});
      return;
    }

    let cancelled = false;

    const preload = async () => {
      const entries = await Promise.all(eventGroupList.map(async (group) => {
        const primary = group.times[0];
        if (!primary) return null;
        const { note } = await fetchNoteForEvent(user.id, primary.id);
        const noteText = note?.content || '';
        const hasNote = noteText.trim().length > 0;
        return [primary.id, { hasNote, note }];
      }));

      if (!cancelled) {
        const mapped = {};
        entries.forEach(entry => {
          if (entry) {
            mapped[entry[0]] = entry[1];
          }
        });
        setNoteMap(mapped);
      }
    };

    preload();

    return () => {
      cancelled = true;
    };
  }, [user, eventGroupList]);

  const closeModal = useCallback(() => {
    setModalActive(false);
    setTimeout(() => {
      setModalVisible(false);
      setActiveContext(null);
      setNoteContent('');
      setNoteId(null);
      setNoteFeedback(null);
      setNoteLoading(false);
      setNoteSaving(false);
    }, 200);
  }, []);

  const openNotesModal = useCallback(async (group) => {
    if (!user) return;
    const primary = group.times[0];
    if (!primary) return;

    setActiveContext({ group, primary });
    setModalVisible(true);
    setNoteLoading(true);
    setNoteContent('');
    setNoteId(null);
    setNoteFeedback(null);

    requestAnimationFrame(() => setModalActive(true));

    const { note, error } = await fetchNoteForEvent(user.id, primary.id);
    if (error) {
      setNoteFeedback({ type: 'error', message: error });
    }
    if (note) {
      setNoteContent(note.content || '');
      setNoteId(note.id);
      setNoteMap(prev => ({
        ...prev,
        [primary.id]: { hasNote: Boolean((note.content || '').trim()), note },
      }));
    } else {
      setNoteMap(prev => ({
        ...prev,
        [primary.id]: { hasNote: false, note: null },
      }));
    }
    setNoteLoading(false);
  }, [user]);

  useEffect(() => {
    if (modalActive && !noteLoading) {
      textareaRef.current?.focus();
    }
  }, [modalActive, noteLoading]);

  useEffect(() => {
    if (!modalActive) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    const handleClickOutside = (event) => {
      if (modalContainerRef.current && event.target === modalContainerRef.current) {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('touchstart', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('touchstart', handleClickOutside);
    };
  }, [modalActive, closeModal]);

  const handleSaveNote = useCallback(async () => {
    if (!user || !activeContext) return;
    const primary = activeContext.primary;
    const trimmed = noteContent.trim();

    if (!trimmed && !noteId) {
      setNoteFeedback({ type: 'error', message: 'Please add a note before saving.' });
      return;
    }

    setNoteSaving(true);
    setNoteFeedback(null);

    if (!trimmed && noteId) {
      const { error } = await deleteNote(noteId);
      if (error) {
        setNoteFeedback({ type: 'error', message: error });
      } else {
        setNoteId(null);
        setNoteMap(prev => ({
          ...prev,
          [primary.id]: { hasNote: false, note: null },
        }));
        setNoteFeedback({ type: 'success', message: 'Note removed.' });
        setTimeout(closeModal, 1200);
      }
      setNoteSaving(false);
      return;
    }

    const { note, error } = await saveNote(user.id, primary.id, trimmed);
    if (error) {
      setNoteFeedback({ type: 'error', message: error });
      setNoteSaving(false);
      return;
    }

    if (note) {
      setNoteId(note.id);
    }

    setNoteContent(trimmed);
    setNoteMap(prev => ({
      ...prev,
      [primary.id]: { hasNote: Boolean(trimmed), note },
    }));

    setNoteFeedback({ type: 'success', message: 'Note saved successfully!' });
    setNoteSaving(false);
    setTimeout(closeModal, 1200);
  }, [user, activeContext, noteContent, noteId, closeModal]);

  // Swipe handlers for date navigation
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      // Swipe left = next day
      const nextDate = new Date(selectedDate);
      nextDate.setDate(nextDate.getDate() + 1);
      onDateChange(nextDate);
    },
    onSwipedRight: () => {
      // Swipe right = previous day
      const prevDate = new Date(selectedDate);
      prevDate.setDate(prevDate.getDate() - 1);
      onDateChange(prevDate);
    },
    preventScrollOnSwipe: true,
    trackMouse: false,
    trackTouch: true,
    delta: 50, // Min distance for swipe
  });

  return (
    <div {...handlers} className="min-h-screen bg-grip-light pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-grip-secondary">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-gray-400 text-sm">←</span>
            <h1 className="text-2xl font-montserrat font-bold text-grip-primary">
              {selectedDate?.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric',
                timeZone: 'UTC'
              })}
            </h1>
            <span className="text-gray-400 text-sm">→</span>
          </div>
        </div>
      </div>

      {/* Events */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <span className="text-6xl block mb-4">📅</span>
            <p className="text-xl font-semibold text-grip-primary">No events scheduled</p>
            <p className="text-gray-500 mt-2">Check back later for new workouts!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {eventGroupList.map((eventGroup, index) => {
              const primary = eventGroup.times[0];
              const hasNote = primary ? noteMap[primary.id]?.hasNote : false;
              const noteButtonLabel = hasNote ? 'VIEW/EDIT NOTES' : 'WORKOUT NOTES';

              return (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-3">
  <h2 className="text-2xl font-montserrat font-bold text-grip-primary">
    {eventGroup.title}
  </h2>
  
  <div className="flex flex-col gap-2 w-full sm:w-auto max-w-xs">
    <span className={`w-full inline-flex items-center justify-center px-4 py-3 rounded-full text-sm font-semibold
      ${eventGroup.type === 'workout' 
        ? 'bg-grip-primary text-white' 
        : 'bg-green-100 text-green-800'}`}
      style={{ minHeight: 48 }}
    >
      {eventGroup.type === 'workout' ? 'WORKOUT' : 'SOCIAL EVENT'}
    </span>
    <button
      type="button"
      onClick={() => openNotesModal(eventGroup)}
      className="w-full px-4 py-3 rounded-full font-semibold text-white transition-all shadow-sm bg-[#C67158] hover:bg-[#b2604b]"
      style={{ minHeight: 48 }}
    >
      {noteButtonLabel}
    </button>
    {user?.user_metadata?.role === 'coach' && (
        <>
      <button
        onClick={() => onEditEvent(eventGroup.times[0].id)}
        className="bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-yellow-600 transition-all"
      >
        Edit
      </button>
      <button
      onClick={() => onDeleteEvent(eventGroup.times[0].id)}
      className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-red-600 transition-all"
    >
      Delete
    </button>
    </>
    )}
  </div>
</div>
{eventGroup.details && (
  <div className="text-gray-700 leading-relaxed">
    {eventGroup.details
      .split('\n')
      .filter(line => line.trim())
      .map((line, index) => (
        <div 
          key={index} 
          style={{ 
            display: 'block', 
            width: '100%',
            marginBottom: '8px',
            lineHeight: '1.5'
          }}
        >
          {line.trim()}
        </div>
      ))}
  </div>
)}
                </div>

                <div className="border-t border-grip-secondary pt-4">
                  <h3 className="font-semibold text-grip-primary mb-4">Available Times:</h3>
                  <div className="flex flex-col gap-3">
                    {eventGroup.times.map(timeSlot => {
                      const isFull = timeSlot.registrationCount >= 15;
                      
                      return (
                        <div key={timeSlot.id} className="border border-grip-secondary rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="text-xl font-bold text-grip-primary">
                                {formatTimeDisplay(timeSlot.time)}
                              </span>
                              <span className="text-sm text-gray-600">
                                {timeSlot.registrationCount}/15 registered
                              </span>
                            </div>
                            
                            <div className="flex flex-col gap-2">
  {timeSlot.userRegistered ? (
    <button
      onClick={() => onCancelRegistration(timeSlot.id)}
      className="bg-grip-accent text-white px-6 py-2 rounded-full text-sm font-semibold hover:shadow-lg transition-all"
    >
      Cancel
    </button>
  ) : (
    <button
      onClick={() => onRegister(timeSlot.id)}
      disabled={isFull}
      className={`px-6 py-2 rounded-full text-sm font-semibold transition-all
        ${isFull 
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
          : 'bg-grip-primary text-white hover:shadow-lg'}`}
    >
      {isFull ? 'FULL' : 'Register'}
    </button>
  )}
</div>
                          </div>

                          {/* Show registered participants to everyone */}
                          {timeSlot.registeredUsers.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-grip-secondary">
                              <p className="font-semibold text-grip-primary mb-2">
                                Registered Participants ({timeSlot.registeredUsers.length}):
                              </p>
                              <div className="space-y-2">
                                {timeSlot.registeredUsers.map(reg => (
                                  <div key={reg.id} className="text-sm">
                                    {reg.user_name}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {modalVisible && (
        <div
          ref={modalContainerRef}
          className={`fixed inset-0 z-50 flex items-center justify-center px-4 py-6 transition-opacity duration-200 ${
            modalActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
          } bg-black/60`}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="day-view-notes-title"
            className={`bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 transition-all duration-200 transform ${
              modalActive ? 'scale-100 translate-y-0' : 'scale-95 -translate-y-4'
            } max-h-[90vh] overflow-y-auto flex flex-col`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-grip-secondary font-semibold">Workout</p>
                <h2 id="day-view-notes-title" className="text-2xl font-montserrat font-bold text-grip-primary">
                  {activeContext?.group?.title || 'Workout Notes'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedDate?.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-500 hover:text-grip-primary text-sm font-semibold"
                aria-label="Close notes modal"
                style={{ minWidth: 44, minHeight: 44 }}
              >
                Close
              </button>
            </div>

            {noteFeedback && (
              <div
                role="status"
                aria-live="polite"
                className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold text-center ${
                  noteFeedback.type === 'success'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {noteFeedback.message}
              </div>
            )}

            <label className="block text-sm font-semibold text-grip-primary mb-2" htmlFor="day-view-note">
              Your Notes
            </label>

            {noteLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="w-8 h-8 border-4 border-grip-secondary border-t-grip-primary rounded-full animate-spin" aria-label="Loading note" />
              </div>
            ) : (
              <textarea
                id="day-view-note"
                ref={textareaRef}
                rows={6}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value.slice(0, NOTE_MAX_LENGTH))}
                maxLength={NOTE_MAX_LENGTH}
                disabled={noteSaving}
                placeholder="Add notes about this workout..."
                className="w-full min-h-[200px] border border-grip-secondary rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-grip-primary text-gray-800 resize-none overflow-y-auto"
                aria-busy={noteSaving}
              />
            )}

            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>{noteContent.length}/{NOTE_MAX_LENGTH} characters</span>
              <span>{noteSaving ? 'Saving...' : noteLoading ? 'Loading note...' : 'Tap save to keep your note'}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={noteSaving || noteLoading}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-colors ${
                  noteSaving || noteLoading
                    ? 'bg-grip-primary/60 cursor-not-allowed'
                    : 'bg-grip-primary hover:bg-grip-accent'
                }`}
                style={{ minHeight: 48 }}
              >
                {noteSaving ? 'Saving...' : (noteId ? 'Update Note' : 'Save Note')}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 px-4 py-3 rounded-xl font-semibold border border-grip-secondary text-grip-primary hover:bg-grip-secondary/30 transition-colors"
                style={{ minHeight: 48 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DayView;