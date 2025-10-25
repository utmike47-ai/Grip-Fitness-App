import React, { useState, useEffect } from 'react';
import { supabase } from './utils/supabaseClient';
import { TIME_SLOTS } from './utils/constants';
import LoginScreen from './components/views/LoginScreen';
import Dashboard from './components/views/Dashboard';
import DayView from './components/views/DayView';
import CreateEvent from './components/views/CreateEvent';
import MyClasses from './components/views/MyClasses';
import NotesView from './components/views/NotesView';
import WorkoutDetails from './components/views/WorkoutDetails';
import Toast from './components/common/Toast';
import BookingModal from './components/common/BookingModal';

function App() {
  // State management
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [userNotes, setUserNotes] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [toast, setToast] = useState(null);
  const [bookingModal, setBookingModal] = useState({ isOpen: false, eventDetails: null }); 
  // Check session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      setCurrentView('dashboard');
      await fetchUserProfile(session.user.id);
    }
  };

  // Auth functions
  const signIn = async (email, password, signupData = null) => {
    try {
      setLoading(true);
      
      if (signupData?.isSignUp) {
        // Sign up new user
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) throw error;
        
        if (data.user) {
          // Create profile
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
              id: data.user.id,
              first_name: signupData.firstName,
              last_name: signupData.lastName,
              role: signupData.role
            }]);
          
            if (profileError) {
              console.error('Profile creation error:', profileError);
              showToast(`Account created but profile setup failed: ${profileError.message}. Please contact support.`);
              // Don't throw here, let them continue to the app
            }
          
          // Set user with metadata immediately
          setUser({
            ...data.user,
            user_metadata: {
              first_name: signupData.firstName,
              last_name: signupData.lastName,
              role: signupData.role
            }
          });
          
          setCurrentView('dashboard');
          showToast('Account created successfully! Welcome to Grip Fitness!');
        }
      } else {
        // Regular login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        
        setUser(data.user);
        await fetchUserProfile(data.user.id);
        setCurrentView('dashboard');
      }
    } catch (error) {
      showToast('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentView('login');
    setSelectedDate(null);
    setSelectedEvent(null);
    setEvents([]);
    setRegistrations([]);
    setUserNotes([]);
    setAttendance([]);
  };

  // Fetch user profile
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }
  
      if (data) {
        setUser(prev => ({
          ...prev,
          user_metadata: {
            ...prev.user_metadata,
            role: data.role,
            first_name: data.first_name,
            last_name: data.last_name
          }
        }));
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Data fetching functions
  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*');
      
      if (error) throw error;
      
      const registrationsWithProfiles = [];
      for (const reg of data || []) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', reg.user_id)
          .single();
        
        registrationsWithProfiles.push({
          ...reg,
          user_name: profileData ? `${profileData.first_name} ${profileData.last_name}` : 'Unknown User'
        });
      }
      
      setRegistrations(registrationsWithProfiles);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const fetchUserNotes = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      setUserNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*');
      
      if (error) throw error;
      setAttendance(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  // Load data when user logs in
  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchRegistrations();
      fetchUserNotes();
      fetchAttendance();
    }
  }, [user]);

  // Event management functions
  const registerForEvent = async (eventId) => {
    try {
      const { error } = await supabase
        .from('registrations')
        .insert([{
          user_id: user.id,
          event_id: eventId
        }]);
      
      if (error) throw error;
      await fetchRegistrations();
      
      // Find the event details to show in the modal
      const registeredEvent = events.find(e => e.id === eventId);
      if (registeredEvent) {
        setBookingModal({
          isOpen: true,
          eventDetails: registeredEvent
        });
      } else {
        showToast('Successfully registered!');
      }
    } catch (error) {
      if (error.code === '23505') {
        showToast('You are already registered for this event!');
      } else {
        showToast('Registration failed: ' + error.message);
      }
    }
  };

  const cancelRegistration = async (eventId) => {
    try {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', eventId);
      
      if (error) throw error;
      await fetchRegistrations();
      showToast('Registration cancelled');
    } catch (error) {
      showToast('Failed to cancel registration: ' + error.message);
    }
  };

  const createEvent = async (eventData) => {
    try {
      const eventsToCreate = eventData.times.map(time => ({
        title: eventData.title,
        date: eventData.date,
        time: time,
        type: eventData.type,
        details: eventData.details ? eventData.details.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim() : '',
        created_by: user.id,
      }));
  
      const { data, error } = await supabase
        .from('events')
        .insert(eventsToCreate);
      
      if (error) throw error;
      
      await fetchEvents();
      setCurrentView('dashboard');
      showToast('Event created successfully!');
    } catch (error) {
      console.error('Failed to create event:', error);
      showToast('Failed to create event: ' + error.message);
    }
  };

  const updateEvent = async (eventData) => {
    try {
      // Find all events with the same title and date (they're the same workout, different times)
      const relatedEvents = events.filter(e => 
        e.title === editingEvent.title && 
        e.date === editingEvent.date
      );
      
      // Update each related event
      for (const event of relatedEvents) {
        const { error } = await supabase
          .from('events')
          .update({
            title: eventData.title,
            details: eventData.details ? eventData.details.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim() : '',
            type: eventData.type
            // Note: we don't update date or time here to preserve the original schedule
          })
          .eq('id', event.id);
        
        if (error) throw error;
      }
      
      await fetchEvents();
      showToast('Event updated successfully!');
      setCurrentView('dashboard');
      setEditingEvent(null);
    } catch (error) {
      console.error('Update error:', error);
      showToast('Failed to update event: ' + error.message);
    }
  };

  const deleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This will also remove all registrations, notes, and attendance records.')) {
      return;
    }
    
    try {
      // Find all events with same title and date (all time slots)
      const eventToDelete = events.find(e => e.id === eventId);
      if (!eventToDelete) {
        showToast('Event not found');
        return;
      }
      
      const relatedEvents = events.filter(e => 
        e.title === eventToDelete.title && 
        e.date === eventToDelete.date
      );
      
      console.log('Deleting events:', relatedEvents);
      
      // Delete in order: attendance -> notes -> registrations -> events
      for (const event of relatedEvents) {
        // Delete attendance records
        const { error: attError } = await supabase
          .from('attendance')
          .delete()
          .eq('event_id', event.id);
        
        if (attError) console.error('Error deleting attendance:', attError);
        
        // Delete notes
        const { error: notesError } = await supabase
          .from('notes')
          .delete()
          .eq('event_id', event.id);
        
        if (notesError) console.error('Error deleting notes:', notesError);
        
        // Delete registrations
        const { error: regError } = await supabase
          .from('registrations')
          .delete()
          .eq('event_id', event.id);
        
        if (regError) console.error('Error deleting registrations:', regError);
        
        // Finally delete the event
        const { error: eventError } = await supabase
          .from('events')
          .delete()
          .eq('id', event.id);
        
        if (eventError) {
          console.error('Error deleting event:', eventError);
          throw eventError;
        }
      }
      
      await fetchEvents();
      await fetchRegistrations();
      showToast('Event deleted successfully!');
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Delete failed:', error);
      showToast('Failed to delete event: ' + error.message);
    }
  };

  const handleEditEvent = (eventId) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setEditingEvent(event);
      setCurrentView('editEvent');
    }
  };

  const toggleAttendance = async (eventId, userId) => {
    try {
      const existingAttendance = attendance.find(a => a.event_id === eventId && a.user_id === userId);
      
      if (existingAttendance) {
        const { error } = await supabase
          .from('attendance')
          .update({
            attended: !existingAttendance.attended,
            checked_in_at: !existingAttendance.attended ? new Date().toISOString() : null
          })
          .eq('event_id', eventId)
          .eq('user_id', userId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('attendance')
          .insert([{
            event_id: eventId,
            user_id: userId,
            attended: true,
            checked_in_at: new Date().toISOString()
          }]);
        
        if (error) throw error;
      }
      
      await fetchAttendance();
    } catch (error) {
      showToast('Failed to update attendance: ' + error.message);
    }
  };

  const saveNote = async (eventId, noteText, existingNoteId = null) => {
    try {
      if (existingNoteId) {
        const { error } = await supabase
          .from('notes')
          .update({ 
            content: noteText.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingNoteId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notes')
          .insert([{
            user_id: user.id,
            event_id: eventId,
            content: noteText.trim()
          }]);
        
        if (error) throw error;
      }
      
      await fetchUserNotes();
      showToast('Note saved successfully!');
      return true;
    } catch (error) {
      showToast('Failed to save note: ' + error.message);
      return false;
    }
  };

  // Render based on currentView
  const renderView = () => {
    switch(currentView) {
      case 'login':
        return <LoginScreen onLogin={signIn} loading={loading} />;
      
        case 'dashboard':
          return <Dashboard 
            user={user}
            events={events}
            registrations={registrations}
            onSignOut={signOut}
            onViewChange={setCurrentView}
            onDateSelect={(date) => {
              setSelectedDate(date);
              setCurrentView('dayView');
            }}
            onEventSelect={(event) => {
              setSelectedEvent(event);
              setCurrentView('workoutDetails');
            }}
          />;
      
      case 'dayView':
        return <DayView 
          selectedDate={selectedDate}
          events={events}
          registrations={registrations}
          user={user}
          onBack={() => setCurrentView('dashboard')}
          onRegister={registerForEvent}
          onCancelRegistration={cancelRegistration}
          onToggleAttendance={toggleAttendance}
          onSelectEvent={(event) => {
            setSelectedEvent(event);
            setCurrentView('notes');
          }}
          onEditEvent={handleEditEvent}
          onDeleteEvent={deleteEvent} 
        />;
      
      case 'createEvent':
        return <CreateEvent 
          user={user}
          onBack={() => setCurrentView('dashboard')}
          onCreateEvent={createEvent}
        />;

        case 'editEvent':
          return <CreateEvent 
            user={user}
            onBack={() => setCurrentView('dashboard')}
            onCreateEvent={updateEvent}
            editMode={true}
            existingEvent={editingEvent}
          />;
        
      case 'myClasses':
        return <MyClasses 
          user={user}
          events={events}
          registrations={registrations}
          onBack={() => setCurrentView('dashboard')}
          onSelectEvent={(event) => {
            setSelectedEvent(event);
            setCurrentView('notes');
          }}
        />;
      
      case 'notes':
        return <NotesView 
          selectedEvent={selectedEvent}
          userNotes={userNotes}
          user={user}
          onBack={() => setCurrentView('dashboard')}
          onSaveNote={saveNote}
        />;

        case 'workoutDetails':
  return <WorkoutDetails 
    event={selectedEvent}
    events={events}
    registrations={registrations}
    user={user}
    onBack={() => setCurrentView('dashboard')}
    onRegister={registerForEvent}
    onCancelRegistration={cancelRegistration}
  />;
      
      default:
        return <Dashboard 
          user={user}
          events={events}
          registrations={registrations}
          onSignOut={signOut}
          onViewChange={setCurrentView}
          onDateSelect={(date) => {
            setSelectedDate(date);
            setCurrentView('dayView');
          }}
        />;
    }
  };

  return (
    <>
      {renderView()}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <BookingModal
        isOpen={bookingModal.isOpen}
        eventDetails={bookingModal.eventDetails}
        onClose={() => setBookingModal({ isOpen: false, eventDetails: null })}
      />
    </>
  );
}

export default App;