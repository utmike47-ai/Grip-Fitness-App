import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { fetchNoteForEvent, saveNote, deleteNote } from '../../utils/notesService';
import { TIME_SLOTS } from '../../utils/constants';

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
    const base = time24?.split(':').slice(0, 2).join(':');
    const match = TIME_SLOTS.find(slot => slot.value === base);
    return match ? match.display : time24;
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
    <div className="min-h-screen bg-mjg-bg-primary pb-20">
      {/* Header */}
      <div className="bg-mjg-bg-secondary shadow-mjg border-b border-mjg-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="text-mjg-text-primary hover:text-mjg-accent font-semibold"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            ← Back
          </button>
          <h1 className="text-2xl font-poppins font-semibold text-mjg-text-primary">
            {event.title}
          </h1>
          <span className="w-16" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Workout Info */}
        <div className="bg-mjg-card rounded-mjg shadow-mjg border border-mjg-border p-4 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 pr-6">
              <h2 className="text-xl font-bold text-mjg-text-card mb-2">
                {new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h2>
              {event.details && (
                <div className="text-mjg-text-card leading-relaxed">
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
            <div className="w-full max-w-xs">
              <div className="flex flex-col gap-2">
                <span
                  className={`w-full inline-flex items-center justify-center px-4 py-3 rounded-full text-sm font-semibold ${
                    event.type === 'workout'
                      ? 'bg-mjg-accent text-white'
                      : 'bg-green-100 text-green-800'
                  }`}
                  style={{ minHeight: 48 }}
                >
                  {event.type === 'workout' ? 'WORKOUT' : 'SOCIAL EVENT'}
                </span>
                <button
                  type="button"
                  onClick={() => openModal(event)}
                  className="w-full px-4 py-3 rounded-full font-semibold text-white transition-all shadow-sm bg-[#C67158] hover:bg-[#b2604b]"
                  style={{ minHeight: 48 }}
                >
                  {noteButtonLabel}
                </button>
              </div>
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
              className={`bg-mjg-card rounded-mjg shadow-mjg-lg border border-mjg-border w-full max-w-lg p-4 sm:p-4 transition-all duration-200 transform ${
                modalActive ? 'scale-100 translate-y-0' : 'scale-95 -translate-y-4'
              } max-h-[90vh] overflow-y-auto flex flex-col`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-mjg-text-secondary font-semibold">Workout</p>
                  <h2 id={modalTitleId} className="text-2xl font-poppins font-semibold text-mjg-text-card">
                    {event.title}
                  </h2>
                  {activeEvent && (
                    <p className="text-sm text-mjg-text-secondary mt-1">
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
                  className="text-mjg-text-secondary hover:text-mjg-text-primary text-sm font-semibold"
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
                  className={`mb-4 rounded-mjg px-4 py-3 text-sm font-semibold text-center ${
                    feedback.type === 'success'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {feedback.message}
                </div>
              )}

              <label className="block text-sm font-semibold text-mjg-text-card mb-2" htmlFor="workout-note">
                Your Notes
              </label>

              {noteLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="w-8 h-8 border-4 border-mjg-border border-t-mjg-accent rounded-full animate-spin" aria-label="Loading note" />
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
                  className="w-full min-h-[200px] border border-mjg-border rounded-mjg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-mjg-accent text-gray-800 resize-none overflow-y-auto"
                  aria-busy={noteSaving}
                />
              )}

              <div className="flex items-center justify-between mt-2 text-xs text-mjg-text-secondary">
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
                  className={`flex-1 px-4 py-3 rounded-mjg font-semibold text-white transition-colors ${
                    noteSaving || noteLoading
                      ? 'bg-mjg-accent/60 cursor-not-allowed'
                      : 'bg-mjg-accent hover:bg-mjg-accent'
                  }`}
                  style={{ minHeight: 48 }}
                >
                  {noteSaving ? 'Saving...' : (noteId ? 'Update Note' : 'Save Note')}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 rounded-mjg font-semibold border border-mjg-border text-mjg-text-primary hover:bg-mjg-bg-secondary/30 transition-colors"
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
          <h3 className="text-lg font-semibold text-mjg-text-card">Available Times</h3>
          {relatedEvents.map((slot) => {
            const regs = getRegistrationsForEvent(slot.id);
            const userRegistered = isUserRegistered(slot.id);
            const isFull = regs.length >= 15;
            const slotDate = new Date(slot.date + 'T00:00:00');
            const isPastWorkout = slotDate < today;

            return (
              <div key={slot.id} className="bg-mjg-card rounded-mjg shadow-mjg border border-mjg-border p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-xl font-bold text-mjg-text-card">
                      {formatTime(slot.time)}
                    </p>
                    <p className="text-sm text-mjg-text-secondary">
                      {regs.length}/15 registered
                    </p>
                  </div>
                  <div>
                    {isPastWorkout ? (
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold bg-mjg-bg-secondary text-mjg-text-secondary border border-mjg-border">
                        Past Workout
                      </span>
                    ) : userRegistered ? (
                      <button
                        onClick={() => onCancelRegistration(slot.id)}
                        className="bg-mjg-accent text-white px-4 py-2 rounded-full font-semibold hover:shadow-mjg transition-all"
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
                            ? 'bg-mjg-bg-secondary text-mjg-text-secondary cursor-not-allowed' 
                            : 'bg-mjg-accent text-white hover:shadow-mjg'}`}
                        style={{ minHeight: 44, minWidth: 120 }}
                      >
                        {isFull ? 'FULL' : 'Register'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Registered Users List */}
                {regs.length > 0 && (
                  <div className="pt-4 border-t border-mjg-border">
                    <p className="font-semibold text-mjg-text-card mb-2">
                      Registered Participants ({regs.length}):
                    </p>
                    <div className="space-y-2">
                      {regs.map(reg => (
                        <div key={reg.id} className="text-sm text-mjg-text-card">
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