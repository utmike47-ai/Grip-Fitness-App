import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { fetchNoteForEvent, saveNote, deleteNote } from '../../utils/notesService';
import { TIME_SLOTS } from '../../utils/constants';
import Logo from '../Logo';
import { FileText, StickyNote } from 'lucide-react';

const NOTE_MAX_LENGTH = 500;
const MODAL_CLOSE_DELAY = 1200;

const WorkoutDetails = ({ 
  event, 
  events,
  registrations, 
  user,
  onBack,
  onRegister,
  onCancelRegistration 
}) => {
  const [noteMap, setNoteMap] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [modalActive, setModalActive] = useState(false);
  const [activeEvent, setActiveEvent] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [noteId, setNoteId] = useState(null);
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const textareaRef = useRef(null);
  const modalContainerRef = useRef(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const relatedEvents = useMemo(() => (
    events.filter(e => e.title === event.title && e.date === event.date)
  ), [events, event]);

  useEffect(() => {
    if (!user) {
      setNoteMap({});
      return;
    }

    let cancelled = false;

    const preload = async () => {
      const entries = await Promise.all(relatedEvents.map(async (slot) => {
        const { note } = await fetchNoteForEvent(user.id, slot.id);
        const hasNote = Boolean(note && (note.content || '').trim());
        return [slot.id, { hasNote, note }];
      }));

      if (!cancelled) {
        setNoteMap(Object.fromEntries(entries));
      }
    };

    preload();

    return () => {
      cancelled = true;
    };
  }, [user, relatedEvents]);

  const isUserRegistered = useCallback((eventId) => (
    registrations.some(reg => reg.event_id === eventId && reg.user_id === user?.id)
  ), [registrations, user]);

  const getRegistrationsForEvent = useCallback((eventId) => (
    registrations.filter(reg => reg.event_id === eventId)
  ), [registrations]);

  const formatTime = useCallback((time24) => {
    if (!time24) return 'Time TBD';
    try {
      // Remove seconds if present (e.g., "16:30:00" becomes "16:30")
      const timeWithoutSeconds = time24.split(':').slice(0, 2).join(':');
      const match = TIME_SLOTS.find(slot => slot.value === timeWithoutSeconds);
      return match ? match.display : timeWithoutSeconds;
    } catch (error) {
      console.error('Error formatting time:', error);
      return time24 || 'Time TBD';
    }
  }, []);

  const closeModal = useCallback(() => {
    setModalActive(false);
    setTimeout(() => {
      setModalVisible(false);
      setActiveEvent(null);
      setNoteContent('');
      setNoteId(null);
      setFeedback(null);
      setNoteLoading(false);
      setNoteSaving(false);
    }, 200);
  }, []);

  const openModal = useCallback(async (slot) => {
    if (!user) return;

    setActiveEvent(slot);
    setModalVisible(true);
    setNoteLoading(true);
    setFeedback(null);
    setNoteContent('');
    setNoteId(null);

    requestAnimationFrame(() => setModalActive(true));

    const { note, error } = await fetchNoteForEvent(user.id, slot.id);

    if (error) {
      setFeedback({ type: 'error', message: error });
    }

    if (note) {
      setNoteContent(note.content || '');
      setNoteId(note.id);
      setNoteMap(prev => ({
        ...prev,
        [slot.id]: { hasNote: Boolean((note.content || '').trim()), note },
      }));
    } else {
      setNoteContent('');
      setNoteId(null);
      setNoteMap(prev => ({
        ...prev,
        [slot.id]: { hasNote: false, note: null },
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

  const handleSave = async () => {
    if (!user || !activeEvent) return;

    const cleaned = noteContent.trim();
    if (!cleaned && !noteId) {
      setFeedback({ type: 'error', message: 'Please add a note before saving.' });
      return;
    }

    setNoteSaving(true);
    setFeedback(null);

    let response;
    if (!cleaned && noteId) {
      response = await deleteNote(noteId);
      if (response.error) {
        setFeedback({ type: 'error', message: response.error });
      } else {
        setNoteId(null);
        setNoteMap(prev => ({
          ...prev,
          [activeEvent.id]: { hasNote: false, note: null },
        }));
        setFeedback({ type: 'success', message: 'Note removed.' });
        setTimeout(closeModal, MODAL_CLOSE_DELAY);
      }
      setNoteSaving(false);
      return;
    }

    const { note, error } = await saveNote(user.id, activeEvent.id, cleaned);

    if (error) {
      setFeedback({ type: 'error', message: error });
      setNoteSaving(false);
      return;
    }

    if (note) {
      setNoteId(note.id);
    }

    setNoteMap(prev => ({
      ...prev,
      [activeEvent.id]: { hasNote: Boolean(cleaned), note },
    }));

    setFeedback({ type: 'success', message: 'Note saved successfully!' });
    setNoteSaving(false);
    setTimeout(closeModal, MODAL_CLOSE_DELAY);
  };

  const modalTitleId = useMemo(() => (
    activeEvent ? `notes-modal-title-${activeEvent.id}` : 'notes-modal-title'
  ), [activeEvent]);

  const hasWorkoutNote = noteMap[event.id]?.hasNote;
  const noteButtonLabel = hasWorkoutNote ? 'VIEW/EDIT NOTES' : 'WORKOUT NOTES';

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-gym-secondary shadow-lg border-b border-gym-secondary">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="medium" variant="dark" />
          <button
            type="button"
            onClick={onBack}
            className="text-white hover:text-gym-accent font-semibold"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Workout Info */}
        <div className="bg-white rounded-[12px] shadow-gym p-4 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-poppins font-bold text-gym-text-dark mb-2">
              {event.title || new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h2>
            {event.details && (
              <div className="text-gym-text-dark leading-relaxed mt-3">
                {event.details
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

          {/* Icon Action Row */}
          <div className="bg-gray-50 rounded-[12px] p-4 mb-6">
            <div className="flex justify-center items-center gap-3 flex-wrap">
              {/* Workout Icon */}
              <button
                type="button"
                className="flex flex-col items-center justify-center"
                disabled
              >
                <div className="w-14 h-14 rounded-full bg-gym-primary flex items-center justify-center mb-1">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-gray-600 font-medium">Workout</span>
              </button>

              {/* Notes Icon */}
              <button
                type="button"
                onClick={() => openModal(event)}
                className="flex flex-col items-center justify-center"
              >
                <div className="w-14 h-14 rounded-full bg-gym-primary flex items-center justify-center mb-1 hover:bg-[#ff8555] transition-colors">
                  <StickyNote className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-gray-600 font-medium">Notes</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal */}
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
              aria-labelledby={modalTitleId}
              className={`bg-white rounded-[12px] shadow-gym w-full max-w-lg p-4 sm:p-4 transition-all duration-200 transform ${
                modalActive ? 'scale-100 translate-y-0' : 'scale-95 -translate-y-4'
              } max-h-[90vh] overflow-y-auto flex flex-col`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Workout</p>
                  <h2 id={modalTitleId} className="text-2xl font-poppins font-bold text-gym-text-dark">
                    {event.title}
                  </h2>
                  {activeEvent && (
                    <p className="text-sm text-gray-600 mt-1">
                      {formatTime(activeEvent.time)} on {new Date(activeEvent.date + 'T12:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-gray-600 hover:text-gym-accent text-sm font-semibold"
                  aria-label="Close notes modal"
                  style={{ minWidth: 44, minHeight: 44 }}
                >
                  Close
                </button>
              </div>

              {feedback && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`mb-4 rounded-grip px-4 py-3 text-sm font-semibold text-center ${
                    feedback.type === 'success'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {feedback.message}
                </div>
              )}

              <label className="block text-sm font-semibold text-grip-dark mb-2" htmlFor="workout-note">
                Your Notes
              </label>

              {noteLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="w-8 h-8 border-4 border-gray-300 border-t-grip-primary rounded-full animate-spin" aria-label="Loading note" />
                </div>
              ) : (
                <textarea
                  id="workout-note"
                  ref={textareaRef}
                  rows={6}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value.slice(0, NOTE_MAX_LENGTH))}
                  maxLength={NOTE_MAX_LENGTH}
                  disabled={noteSaving}
                  placeholder="Add notes about this workout..."
                  className="w-full min-h-[200px] border border-gray-300 rounded-grip px-4 py-3 focus:outline-none focus:ring-2 focus:ring-grip-primary text-gray-800 resize-none overflow-y-auto"
                  aria-busy={noteSaving}
                />
              )}

              <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
                <span>{noteContent.length}/{NOTE_MAX_LENGTH} characters</span>
                <span>
                  {noteSaving ? 'Saving...' : noteLoading ? 'Loading note...' : 'Tap save to keep your note'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-6">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={noteSaving || noteLoading}
                  className={`flex-1 px-4 py-3 rounded-grip font-semibold text-white transition-colors ${
                    noteSaving || noteLoading
                      ? 'bg-gym-primary/60 cursor-not-allowed'
                      : 'bg-gym-primary hover:bg-[#ff8555]'
                  }`}
                  style={{ minHeight: 48 }}
                >
                  {noteSaving ? 'Saving...' : (noteId ? 'Update Note' : 'Save Note')}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 rounded-grip font-semibold border-2 border-gym-accent text-gym-accent bg-transparent hover:bg-gym-accent hover:text-white transition-colors"
                  style={{ minHeight: 48 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Time Slots */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">Available Times:</h3>
          {relatedEvents.map((slot) => {
            const regs = getRegistrationsForEvent(slot.id);
            const userRegistered = isUserRegistered(slot.id);
            const isFull = regs.length >= 15;
            const slotDate = new Date(slot.date + 'T00:00:00');
            const isPastWorkout = slotDate < today;

            return (
              <div key={slot.id} className="bg-white rounded-[12px] shadow-gym p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex-1">
                    <p className="text-4xl font-extrabold mb-1" style={{ color: '#2d3142' }}>
                      {formatTime(slot.time) || 'Time TBD'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {regs.length}/15 registered
                    </p>
                  </div>
                  <div>
                    {isPastWorkout ? (
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold bg-gray-200 text-gray-600 border border-gray-300">
                        Past Workout
                      </span>
                    ) : userRegistered ? (
                      <button
                        onClick={() => onCancelRegistration(slot.id)}
                        className="bg-gym-primary text-white px-4 py-2 rounded-full font-semibold hover:bg-[#ff8555] transition-all"
                        style={{ minHeight: 44, minWidth: 120 }}
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        onClick={() => onRegister(slot.id)}
                        disabled={isFull}
                        className={`px-4 py-2 rounded-full font-semibold transition-all
                          ${isFull 
                            ? 'bg-gray-200 text-gray-600 cursor-not-allowed' 
                            : 'bg-gym-primary text-white hover:bg-[#ff8555]'}`}
                        style={{ minHeight: 44, minWidth: 120 }}
                      >
                        {isFull ? 'FULL' : 'Register'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Registered Users List */}
                {regs.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="font-semibold text-gym-text-dark mb-2">
                      Registered Participants ({regs.length}):
                    </p>
                    <div className="space-y-2">
                      {regs.map(reg => (
                        <div key={reg.id} className="text-sm text-gym-text-dark">
                          • {reg.user_name}
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
};

export default WorkoutDetails;