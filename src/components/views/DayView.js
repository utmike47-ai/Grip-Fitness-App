import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { TIME_SLOTS } from '../../utils/constants';
import { useSwipeable } from 'react-swipeable';
import { fetchNoteForEvent, saveNote, deleteNote } from '../../utils/notesService';
import { supabase } from '../../utils/supabaseClient';
import { ChevronDown, ChevronUp, X, StickyNote, Pencil, Trash2 } from 'lucide-react';

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
  onDateChange,
  onRemoveStudent,
  onAddStudent,
  onCancelTimeSlot
}) => {
  console.log('[DayView] registrations prop received:', registrations?.length);
  const NOTE_MAX_LENGTH = 500;
  const dateStr = selectedDate?.toISOString().split('T')[0];
  const dayEvents = events.filter(event => event.date === dateStr);
  // DEBUG: Log day events and their IDs/times for registration matching
  useEffect(() => {
    if (dayEvents.length > 0) {
      console.log('[DayView] selectedDate:', selectedDate, 'dateStr:', dateStr);
      console.log('[DayView] dayEvents (event.id, event.time, event.date):', dayEvents.map(e => ({ id: e.id, id_type: typeof e.id, time: e.time, date: e.date })));
    }
  }, [dayEvents, selectedDate, dateStr]);
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
  const [removeModal, setRemoveModal] = useState({
    isOpen: false,
    studentName: '',
    registrationId: null,
  });
  const [addStudentModal, setAddStudentModal] = useState({
    isOpen: false,
    group: null,
    selectedTimeId: null,
  });
  const addModalContainerRef = useRef(null);
  const [cancelClassModal, setCancelClassModal] = useState({
    isOpen: false,
    timeSlot: null,
  });
  const cancelClassModalRef = useRef(null);
  const [isCancelingClass, setIsCancelingClass] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [expandedTimeSlots, setExpandedTimeSlots] = useState(new Set());
 
  const getRegistrationCount = useCallback((eventId) => {
    // Use String() for comparison - fixes type mismatch (e.g. UUID string vs number)
    const matching = registrations.filter(reg => String(reg.event_id) === String(eventId));
    // DEBUG: Log lookup
    console.log('[DayView getRegistrationCount] event_id:', eventId, 'count:', matching.length);
    return matching.length;
  }, [registrations]);

  const isUserRegistered = useCallback((eventId) => (
    registrations.some(reg => String(reg.event_id) === String(eventId) && reg.user_id === user.id)
  ), [registrations, user?.id]);

  const isCoach = user?.user_metadata?.role === 'coach' || user?.user_metadata?.role === 'admin';

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
      registeredUsers: registrations.filter(reg => String(reg.event_id) === String(event.id))
    });
    return groups;
  }, {}), [dayEvents, registrations, getRegistrationCount, isUserRegistered]);

  const eventGroupList = useMemo(() => Object.values(groupedEvents), [groupedEvents]);

  // DEBUG: Log groupedEvents with registration counts
  useEffect(() => {
    if (eventGroupList?.length > 0 && registrations?.length > 0) {
      console.log('[DayView] groupedEvents registration counts:', eventGroupList.map(g => g.times?.map(t => ({ eventId: t.id, time: t.time, registrationCount: t.registrationCount }))));
    }
  }, [eventGroupList, registrations]);

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

  const openRemoveModal = useCallback((registration) => {
    if (!registration) return;
    setRemoveModal({
      isOpen: true,
      studentName: registration.user_name || 'this student',
      registrationId: registration.id,
    });
  }, []);

  const closeRemoveModal = useCallback(() => {
    setRemoveModal({ isOpen: false, studentName: '', registrationId: null });
  }, []);

  const handleConfirmRemove = useCallback(async () => {
    if (!removeModal.registrationId) return;
    await onRemoveStudent?.(removeModal.registrationId);
    closeRemoveModal();
  }, [removeModal.registrationId, onRemoveStudent, closeRemoveModal]);

  const openAddStudentModal = useCallback((group) => {
    if (!group) return;
    // Sort times chronologically and select the first one
    const sortedTimes = (group.times || []).slice().sort((a, b) => {
      const dateA = new Date(`${selectedDate?.toISOString().split('T')[0]}T${a.time}`);
      const dateB = new Date(`${selectedDate?.toISOString().split('T')[0]}T${b.time}`);
      return dateA - dateB;
    });
    const firstTime = sortedTimes[0];
    setAddStudentModal({
      isOpen: true,
      group,
      selectedTimeId: firstTime?.id || null,
    });
    setStudentSearch('');
    setSelectedStudentId(null);
  }, [selectedDate]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setStudentsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('role', 'student');

        if (error) {
          console.error('Failed to load students:', error);
          return;
        }

        setAllStudents(data || []);
      } catch (error) {
        console.error('Unexpected error fetching students:', error);
      } finally {
        setStudentsLoading(false);
      }
    };

    if (isCoach && addStudentModal.isOpen && allStudents.length === 0) {
      fetchStudents();
    }
  }, [isCoach, addStudentModal.isOpen, allStudents.length]);

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    if (!query) {
      return allStudents.slice(0, 10);
    }
    return allStudents
      .filter((student) => {
        const name = `${student.first_name || ''} ${student.last_name || ''}`.trim().toLowerCase();
        return name.includes(query);
      })
      .slice(0, 10);
  }, [allStudents, studentSearch]);

  const closeAddStudentModal = useCallback(() => {
    setAddStudentModal({ isOpen: false, group: null, selectedTimeId: null });
  }, []);

  const openCancelClassModal = useCallback((timeSlot) => {
    if (!timeSlot) return;
    setIsCancelingClass(false);
    setCancelClassModal({
      isOpen: true,
      timeSlot,
    });
  }, []);

  const closeCancelClassModal = useCallback(() => {
    setCancelClassModal({ isOpen: false, timeSlot: null });
    setIsCancelingClass(false);
  }, []);

  useEffect(() => {
    if (addStudentModal.isOpen) {
      const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
          closeAddStudentModal();
        }
      };

      const handleClickOutside = (event) => {
        if (addModalContainerRef.current && event.target === addModalContainerRef.current) {
          closeAddStudentModal();
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
    }
  }, [addStudentModal.isOpen, closeAddStudentModal]);

  useEffect(() => {
    if (cancelClassModal.isOpen) {
      const handleKeyDown = (event) => {
        if (event.key === 'Escape' && !isCancelingClass) {
          closeCancelClassModal();
        }
      };

      const handleClickOutside = (event) => {
        if (cancelClassModalRef.current && event.target === cancelClassModalRef.current && !isCancelingClass) {
          closeCancelClassModal();
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
    }
  }, [cancelClassModal.isOpen, isCancelingClass, closeCancelClassModal]);

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
  
  {isCoach ? (
    // Coach/Admin view: Circular icon buttons (Notes, Edit, Delete) - no WORKOUT badge
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex justify-center items-center gap-3 flex-wrap">
        {/* Notes Icon */}
        <button
          type="button"
          onClick={() => openNotesModal(eventGroup)}
          aria-label={noteButtonLabel}
          className="flex flex-col items-center justify-center"
        >
          <div className="w-14 h-14 rounded-full bg-grip-accent flex items-center justify-center mb-1 hover:bg-[#B86450] transition-colors">
            <StickyNote className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs text-gray-600 font-medium">Notes</span>
        </button>

        {/* Edit Icon */}
        <button
          type="button"
          onClick={() => onEditEvent(eventGroup.times[0].id)}
          className="flex flex-col items-center justify-center"
        >
          <div className="w-14 h-14 rounded-full bg-grip-accent flex items-center justify-center mb-1 hover:bg-[#B86450] transition-colors">
            <Pencil className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs text-gray-600 font-medium">Edit</span>
        </button>

        {/* Delete Icon */}
        <button
          type="button"
          onClick={() => onDeleteEvent(eventGroup.times[0].id)}
          className="flex flex-col items-center justify-center"
        >
          <div className="w-14 h-14 rounded-full bg-grip-accent flex items-center justify-center mb-1 hover:bg-[#B86450] transition-colors">
            <Trash2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs text-gray-600 font-medium">Delete</span>
        </button>
      </div>
    </div>
  ) : (
    // Student view: Only circular Notes icon button (no WORKOUT button)
    <div className="flex justify-center items-start">
      <button
        type="button"
        onClick={() => openNotesModal(eventGroup)}
        aria-label={noteButtonLabel}
        className="flex flex-col items-center justify-center"
      >
        <div className="w-14 h-14 rounded-full bg-grip-accent flex items-center justify-center mb-1 hover:bg-[#B86450] transition-colors">
          <StickyNote className="w-6 h-6 text-white" />
        </div>
        <span className="text-xs text-gray-600 font-medium">Notes</span>
      </button>
    </div>
  )}
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
                  {isCoach && (
                    <button
                      type="button"
                      onClick={() => openAddStudentModal(eventGroup)}
                      className="w-full px-4 py-3 mb-4 rounded-full font-semibold text-white transition-all shadow-sm bg-[#C67158] hover:bg-[#b2604b]"
                      style={{ minHeight: 48 }}
                    >
                      + Add Student to Class
                    </button>
                  )}
                  <div className="flex flex-col gap-2">
                    {eventGroup.times
                      .slice()
                      .sort((a, b) => {
                        const dateA = new Date(`${selectedDate?.toISOString().split('T')[0]}T${a.time}`);
                        const dateB = new Date(`${selectedDate?.toISOString().split('T')[0]}T${b.time}`);
                        return dateA - dateB;
                      })
                      .map(timeSlot => {
                      const isFull = timeSlot.registrationCount >= 15;
                      const isExpanded = expandedTimeSlots.has(timeSlot.id);
                      const capacity = timeSlot.registrationCount;
                      const capacityPercent = (capacity / 15) * 100;
                      
                      // Get progress bar color - color-coded by capacity
                      let progressColor = 'bg-gray-400'; // 0%
                      if (capacityPercent >= 100) {
                        progressColor = 'bg-red-500'; // 100%
                      } else if (capacityPercent >= 75) {
                        progressColor = 'bg-orange-500'; // 75-99%
                      } else if (capacityPercent >= 50) {
                        progressColor = 'bg-amber-400'; // 50-74%
                      } else if (capacityPercent >= 1) {
                        progressColor = 'bg-emerald-500'; // 1-49%
                      }
                      
                      // Get member preview text
                      const getMemberPreview = () => {
                        if (timeSlot.registeredUsers.length === 0) return 'No one registered yet';
                        const first3 = timeSlot.registeredUsers.slice(0, 3).map(u => u.user_name);
                        const remaining = timeSlot.registeredUsers.length - 3;
                        if (remaining > 0) {
                          return `${first3.join(', ')} +${remaining} more`;
                        }
                        return first3.join(', ');
                      };
                      
                      const toggleExpand = () => {
                        setExpandedTimeSlots(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(timeSlot.id)) {
                            newSet.delete(timeSlot.id);
                          } else {
                            newSet.add(timeSlot.id);
                          }
                          return newSet;
                        });
                      };
                      
                      return (
                        <div key={timeSlot.id} className="border border-grip-secondary rounded-lg overflow-hidden bg-white">
                          {/* Collapsed State */}
                          {!isExpanded && (
                            <button
                              type="button"
                              onClick={toggleExpand}
                              className="w-full p-4 text-left hover:bg-grip-light transition-colors"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-2xl font-extrabold text-grip-primary">
                                  {formatTimeDisplay(timeSlot.time)}
                                </p>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-semibold text-grip-primary">
                                    {capacity}/15
                                  </span>
                                  <ChevronDown className="w-5 h-5 text-gray-400" />
                                </div>
                              </div>
                              
                              {/* Progress Bar */}
                              <div className="w-full h-2 bg-gray-200 rounded-full mb-2">
                                <div
                                  className={`h-full rounded-full transition-all ${progressColor}`}
                                  style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                                />
                              </div>
                              
                              {/* Member Preview */}
                              <p className="text-sm text-gray-600 truncate">
                                {getMemberPreview()}
                              </p>
                            </button>
                          )}
                          
                          {/* Expanded State */}
                          {isExpanded && (
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <p className="text-2xl font-extrabold text-grip-primary">
                                    {formatTimeDisplay(timeSlot.time)}
                                  </p>
                                  <span className="text-sm font-semibold text-grip-primary">
                                    {capacity}/15 registered
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={toggleExpand}
                                  className="text-gray-400 hover:text-grip-primary"
                                >
                                  <ChevronUp className="w-5 h-5" />
                                </button>
                              </div>
                              
                              {/* Progress Bar */}
                              <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
                                <div
                                  className={`h-full rounded-full transition-all ${progressColor}`}
                                  style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                                />
                              </div>
                              
                              {/* Member Pills */}
                              {timeSlot.registeredUsers.length > 0 && (
                                <div className="mb-4">
                                  <div className="flex flex-wrap gap-2">
                                    {timeSlot.registeredUsers.map(reg => (
                                      <div
                                        key={reg.id}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-grip-secondary rounded-full text-sm text-grip-primary"
                                      >
                                        <span>{reg.user_name}</span>
                                        {isCoach && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openRemoveModal(reg);
                                            }}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Action Buttons */}
                              <div className="flex flex-col gap-2 mt-4">
                                {!isFull && !timeSlot.userRegistered && (
                                  <button
                                    onClick={() => onRegister(timeSlot.id)}
                                    className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-grip-accent hover:bg-[#B86450] hover:shadow-lg transition-all"
                                  >
                                    Register
                                  </button>
                                )}
                                {timeSlot.userRegistered && (
                                  <button
                                    onClick={() => onCancelRegistration(timeSlot.id)}
                                    className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-grip-accent hover:bg-[#B86450] hover:shadow-lg transition-all"
                                  >
                                    Cancel Registration
                                  </button>
                                )}
                                {isCoach && (
                                  <button
                                    type="button"
                                    onClick={() => openCancelClassModal(timeSlot)}
                                    className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-red-600 border-2 border-red-600 hover:bg-red-50 transition-all"
                                  >
                                    Cancel Class
                                  </button>
                                )}
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

      {removeModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transition-all">
            <h2 className="text-xl font-montserrat font-bold text-grip-primary mb-2">
              Remove Student
            </h2>
            <p className="text-gray-700 mb-6">
              Remove {removeModal.studentName} from this class?
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={closeRemoveModal}
                className="flex-1 px-4 py-3 rounded-xl font-semibold border border-grip-secondary text-grip-primary hover:bg-grip-secondary/30 transition-colors"
                style={{ minHeight: 48 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-colors bg-red-500 hover:bg-red-600"
                style={{ minHeight: 48 }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {addStudentModal.isOpen && (
        <div
          ref={addModalContainerRef}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black/60"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-montserrat font-bold text-grip-primary">Add Student to Class</h2>
              <button
                type="button"
                onClick={closeAddStudentModal}
                className="text-gray-500 hover:text-grip-primary text-sm font-semibold"
                aria-label="Close add student modal"
                style={{ minWidth: 44, minHeight: 44 }}
              >
                ×
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-grip-primary mb-2" htmlFor="add-student-time">
                Select Time:
              </label>
              <select
                id="add-student-time"
                value={addStudentModal.selectedTimeId || ''}
                onChange={(e) => setAddStudentModal(prev => ({ ...prev, selectedTimeId: e.target.value }))}
                className="w-full border border-grip-secondary rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-grip-primary text-gray-800"
              >
                {(addStudentModal.group?.times || [])
                  .slice()
                  .sort((a, b) => {
                    const dateA = new Date(`${selectedDate?.toISOString().split('T')[0]}T${a.time}`);
                    const dateB = new Date(`${selectedDate?.toISOString().split('T')[0]}T${b.time}`);
                    return dateA - dateB;
                  })
                  .map((timeSlot) => (
                    <option key={timeSlot.id} value={timeSlot.id}>
                      {formatTimeDisplay(timeSlot.time)} ({timeSlot.registrationCount}/15)
                    </option>
                  ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-grip-primary mb-2" htmlFor="add-student-search">
                Search Student:
              </label>
              <input
                id="add-student-search"
                type="text"
                placeholder="Type student name..."
                className="w-full border border-grip-secondary rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-grip-primary text-gray-800"
                value={studentSearch}
                onChange={(e) => {
                  setStudentSearch(e.target.value);
                  setSelectedStudentId(null);
                }}
              />
              <div className="mt-3 border border-grip-secondary rounded-xl max-h-64 overflow-y-auto">
                {studentsLoading ? (
                  <div className="py-6 text-center text-sm text-gray-500">Loading students...</div>
                ) : filteredStudents.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-500">No students found</div>
                ) : (
                  <ul className="divide-y divide-grip-secondary/40">
                    {filteredStudents.map((student) => {
                      const studentId = student.id;
                      const name = `${student.first_name || ''} ${student.last_name || ''}`.trim();
                      const isSelected = selectedStudentId === studentId;
                      return (
                        <li key={studentId}>
                          <button
                            type="button"
                            onClick={() => setSelectedStudentId(studentId)}
                            className={`w-full text-left px-4 py-3 text-sm ${
                              isSelected ? 'bg-grip-primary text-white' : 'hover:bg-grip-secondary/20'
                            }`}
                          >
                            {name || 'Unnamed Student'}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={async () => {
                  if (!addStudentModal.selectedTimeId || !selectedStudentId) return;
                  const result = await onAddStudent?.(addStudentModal.selectedTimeId, selectedStudentId);
                  if (result?.success) {
                    closeAddStudentModal();
                  }
                }}
                disabled={!addStudentModal.selectedTimeId || !selectedStudentId}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-colors ${
                  !addStudentModal.selectedTimeId || !selectedStudentId
                    ? 'bg-[#C67158]/60 cursor-not-allowed'
                    : 'bg-[#C67158] hover:bg-[#b2604b]'
                }`}
                style={{ minHeight: 48 }}
              >
                Add Student
              </button>
              <button
                type="button"
                onClick={closeAddStudentModal}
                className="flex-1 px-4 py-3 rounded-xl font-semibold border border-grip-secondary text-grip-primary hover:bg-grip-secondary/30 transition-colors"
                style={{ minHeight: 48 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelClassModal.isOpen && cancelClassModal.timeSlot && (
        <div
          ref={cancelClassModalRef}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black/60"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8">
            <h2 className="text-2xl font-montserrat font-bold text-grip-primary mb-4">
              Cancel {formatTimeDisplay(cancelClassModal.timeSlot.time)} Class?
            </h2>
            
            {(!cancelClassModal.timeSlot.registrationCount || cancelClassModal.timeSlot.registrationCount === 0) ? (
              <p className="text-gray-700 mb-6">
                This will <strong>permanently delete</strong> this time slot. No students are currently registered.
              </p>
            ) : (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-800 mb-2 font-semibold">
                  ⚠️ Warning: {cancelClassModal.timeSlot.registrationCount} {cancelClassModal.timeSlot.registrationCount === 1 ? 'student is' : 'students are'} currently registered for this class.
                </p>
                <p className="text-red-700 mb-2">
                  They will be automatically unregistered when you delete this class.
                </p>
                <p className="text-red-800 font-bold text-sm">
                  This action cannot be undone.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={closeCancelClassModal}
                disabled={isCancelingClass}
                className="flex-1 px-4 py-3 rounded-xl font-semibold border border-grip-secondary text-grip-primary hover:bg-grip-secondary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ minHeight: 48 }}
              >
                Keep Class
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!cancelClassModal.timeSlot?.id || isCancelingClass) return;
                  setIsCancelingClass(true);
                  try {
                    const result = await onCancelTimeSlot?.(cancelClassModal.timeSlot.id);
                    if (result?.success) {
                      closeCancelClassModal();
                    } else {
                      setIsCancelingClass(false);
                    }
                  } catch (error) {
                    console.error('Error canceling class:', error);
                    setIsCancelingClass(false);
                  }
                }}
                disabled={isCancelingClass}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-colors bg-red-600 hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ minHeight: 48 }}
              >
                {isCancelingClass ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  'Delete Class'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DayView;