import React, { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from './utils/supabaseClient';
import { TIME_SLOTS } from './utils/constants';
import LoginScreen from './components/views/LoginScreen';
import Dashboard from './components/views/Dashboard';
import DayView from './components/views/DayView';
import CreateEvent from './components/views/CreateEvent';
import MyClasses from './components/views/MyClasses';
import NotesView from './components/views/NotesView';
import ProfileEdit from './components/views/ProfileEdit';
import AdminDashboard from './components/views/AdminDashboard';
import MemberManagement from './components/views/MemberManagement';
import BookingModal from './components/common/BookingModal';
import BottomNav from './components/common/BottomNav';

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
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [bookingModal, setBookingModal] = useState({ isOpen: false, details: null }); 
  const fetchUserProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist - get role from auth metadata
        const { data: userData } = await supabase.auth.getUser();
        const userRole = userData?.user?.user_metadata?.role || 'student';
        
        // Create profile with correct role from metadata
        const { error: createError } = await supabase
          .from('profiles')
          .insert([{ 
            id: userId,
            first_name: userData?.user?.user_metadata?.first_name || userData?.user?.email?.split('@')[0] || 'User',
            last_name: userData?.user?.user_metadata?.last_name || 'User',
            role: userRole
          }]);
        
        if (!createError) {
          // Fetch the newly created profile
          const { data: newProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (newProfile) {
            setUser(prev => ({
              ...prev,
              user_metadata: {
                ...prev.user_metadata,
                role: newProfile.role,
                first_name: newProfile.first_name,
                last_name: newProfile.last_name
              }
            }));
          }
        }
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
  }, []);

  const checkSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      setCurrentView('dashboard');
      await fetchUserProfile(session.user.id);
    }
  }, [fetchUserProfile]);

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Auth functions
  const signIn = async (email, password, signupData = null) => {
    try {
      setLoading(true);
      
      if (signupData?.isSignUp) {
        // Add a small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: signupData.firstName,
              last_name: signupData.lastName,
              role: signupData.role  // Store role in user metadata
            }
          }
        });
        
        if (error) {
          if (error.message.includes('rate limit') || error.message.includes('security purposes')) {
            throw new Error('Please wait a moment before trying again');
          }
          if (error.message.includes('already registered')) {
            throw new Error('An account with this email already exists. Please sign in instead.');
          }
          throw error;
        }
        
        if (data.user) {
          // Always use the role from signupData, not default
          const userRole = signupData.role || 'student';
          
          // Create profile with correct role
          let profileCreated = false;
          let retries = 0;
          
          while (!profileCreated && retries < 3) {
            try {
              const { error: profileError } = await supabase
                .from('profiles')
                .insert([{
                  id: data.user.id,
                  first_name: signupData.firstName || 'New',
                  last_name: signupData.lastName || 'User',
                  role: userRole  // Use the actual selected role
                }]);
              
              if (!profileError || profileError.code === '23505') {
                profileCreated = true;
              } else {
                retries++;
                if (retries < 3) {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
              }
            } catch (err) {
              console.error(`Profile creation attempt ${retries + 1} failed:`, err);
              retries++;
            }
          }
          
          // Set user data with correct role
          setUser({
            ...data.user,
            user_metadata: {
              first_name: signupData.firstName || 'New',
              last_name: signupData.lastName || 'User',
              role: userRole
            }
          });
          
          setCurrentView('dashboard');
          toast.success(`Account created as ${userRole}! Please check your email to confirm.`);
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
      toast.error(error.message);
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


  // Data fetching functions
  const fetchEvents = useCallback(async () => {
    try {
      setLoadingEvents(true);
      setLoadingError(null);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setLoadingError('Couldn\'t load classes. Try refreshing the page?');
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoadingRegistrations(true);
      // Fetch registrations first
      const { data: regData, error: regError } = await supabase
        .from('registrations')
        .select('*');
      
      if (regError) {
        console.error('Error fetching registrations:', regError);
        setRegistrations([]);
        return;
      }
      
      // Get all unique user IDs from registrations
      const userIds = [...new Set(regData?.map(r => r.user_id) || [])];
      
      // Fetch profile names for those users
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);
      
      // Create a map of user ID to full name
      const userMap = {};
      profileData?.forEach(p => {
        userMap[p.id] = `${p.first_name || 'User'} ${p.last_name || ''}`.trim();
      });
      
      // Add names to registrations
      const registrationsWithNames = regData?.map(reg => ({
        ...reg,
        user_name: userMap[reg.user_id] || 'Loading...'
      })) || [];
      
      setRegistrations(registrationsWithNames);
    } catch (error) {
      console.error('Unexpected error in fetchRegistrations:', error);
      setRegistrations([]);
    } finally {
      setLoadingRegistrations(false);
    }
  }, []);

  const fetchUserNotes = useCallback(async () => {
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
  }, [user]);

  const fetchAttendance = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*');
      
      if (error) throw error;
      setAttendance(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  }, []);

  const fetchProfiles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .order('last_name', { ascending: true });
      
      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  }, []);

  // Load data when user logs in
  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchRegistrations();
      fetchUserNotes();
      fetchAttendance();
      fetchProfiles();
    }
  }, [user, fetchEvents, fetchRegistrations, fetchUserNotes, fetchAttendance, fetchProfiles]);

  // Backup refresh to ensure registrations display
  useEffect(() => {
    if (currentView === 'dashboard' || currentView === 'dayView') {
      const timer = setTimeout(() => {
        fetchRegistrations();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentView, fetchRegistrations]);

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
      
      // Get event details for modal
      const event = events.find(e => e.id === eventId);
      const timeSlot = TIME_SLOTS.find(slot => slot.value === event.time?.split(':').slice(0, 2).join(':'));
      
      setBookingModal({
        isOpen: true,
        details: {
          title: event.title,
          date: event.date,
          time: timeSlot?.display || event.time
        }
      });
      
      toast.success('Registered successfully! ✓');
    } catch (error) {
      if (error.code === '23505') {
        toast.error('You\'re already registered for this event!');
      } else {
        toast.error('Couldn\'t register. Please try again.');
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
      toast.success('Registration cancelled ✓');
    } catch (error) {
        toast.error('Couldn\'t cancel registration. Please try again.');
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
  
      const { error } = await supabase
        .from('events')
        .insert(eventsToCreate);
      
      if (error) throw error;
      
      await fetchEvents();
      setCurrentView('dashboard');
      toast.success('Class created! ✓');
    } catch (error) {
      console.error('Failed to create event:', error);
        toast.error('Couldn\'t create class. Please try again.');
    }
  };

  const updateEvent = async (eventData) => {
    try {
      if (!editingEvent) {
        throw new Error('No event selected for editing');
      }

      // Find all events with the same title and date (they're the same workout, different times)
      const relatedEvents = events.filter(e => 
        e.title === editingEvent.title && 
        e.date === editingEvent.date
      );
      
      if (relatedEvents.length === 0) {
        throw new Error('Could not find related events to update');
      }

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
      toast.success('Event updated successfully!');
      setCurrentView('dashboard');
      setEditingEvent(null);
    } catch (error) {
      console.error('Update error:', error);
        toast.error('Couldn\'t update class. Please try again.');
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
        toast.'Event not found');
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
      toast.success('Class deleted! ✓');
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete event: ' + error.message);
    }
  };

  const cancelTimeSlot = useCallback(async (eventId) => {
    // Verify user is a coach
    if (user?.user_metadata?.role !== 'coach') {
      toast.error('Only coaches can cancel classes');
      return { success: false };
    }

    try {
      // Delete attendance records for this event
      const { error: attError } = await supabase
        .from('attendance')
        .delete()
        .eq('event_id', eventId);
      
      if (attError) console.error('Error deleting attendance:', attError);

      // Delete notes for this event
      const { error: notesError } = await supabase
        .from('notes')
        .delete()
        .eq('event_id', eventId);
      
      if (notesError) console.error('Error deleting notes:', notesError);

      // Delete registrations for this event (cascade should handle this, but doing it explicitly)
      const { error: regError } = await supabase
        .from('registrations')
        .delete()
        .eq('event_id', eventId);
      
      if (regError) console.error('Error deleting registrations:', regError);

      // Delete the event itself
      const { error: eventError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (eventError) {
        console.error('Error deleting event:', eventError);
        throw eventError;
      }

      // Refresh data to update UI
      await fetchEvents();
      await fetchRegistrations();
      toast.'Class cancelled! ✓', .success(
      return { success: true };
    } catch (error) {
      console.error('Failed to cancel class:', error);
        toast.error('Couldn\'t cancel class. Please try again.');
      return { success: false, error };
    }
  }, [user, fetchEvents, fetchRegistrations]);

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
      toast.'Failed to update attendance: ' + error.message);
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
      toast.success('Note saved! ✓');
      return true;
    } catch (error) {
      toast.'Failed to save note: ' + error.message);
      return false;
    }
  };

  const removeStudentFromClass = useCallback(async (registrationId) => {
    try {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', registrationId);

      if (error) throw error;

      await fetchRegistrations();
      toast.success('Student removed! ✓');
    } catch (error) {
      console.error('Failed to remove student:', error);
        toast.error('Couldn\'t remove student. Please try again.');
    }
  }, [fetchRegistrations]);

  const addStudentToClass = useCallback(async (eventId, studentId) => {
    try {
      const { error } = await supabase
        .from('registrations')
        .insert([{ user_id: studentId, event_id: eventId }]);

      if (error) {
        if (error.code === '23505') {
          toast.'Student already registered for this time'.error();
          return { success: false, error };
        }
        throw error;
      }

      await fetchRegistrations();
      toast.success('Student added to class!');
      return { success: true };
    } catch (error) {
      console.error('Failed to add student:', error);
        toast.error('Couldn\'t add student. Please try again.');
      return { success: false, error };
    }
  }, [fetchRegistrations]);

  // Render based on currentView
  const renderView = () => {
    const userRole = user?.user_metadata?.role || 'student';
    const isCoach = userRole === 'coach' || userRole === 'admin';
    
    // Protect admin routes
    if ((currentView === 'adminDashboard' || currentView === 'manageMembers') && !isCoach) {
      return <Dashboard 
        user={user}
        events={events}
        registrations={registrations}
        attendance={attendance}
        onSignOut={signOut}
        onViewChange={setCurrentView}
        onDateSelect={(date) => {
          setSelectedDate(date);
          setCurrentView('dayView');
        }}
        onEventSelect={(event) => {
          if (!event?.date) return;
          const eventDate = new Date(event.date + 'T00:00:00');
          setSelectedDate(eventDate);
          setCurrentView('dayView');
        }}
      />;
    }
    
    switch(currentView) {
      case 'login':
        return <LoginScreen onLogin={signIn} loading={loading} />;
      
        case 'dashboard':
          return <Dashboard 
            user={user}
            events={events}
            registrations={registrations}
            attendance={attendance}
            onSignOut={signOut}
            onViewChange={setCurrentView}
            onDateSelect={(date) => {
              setSelectedDate(date);
              setCurrentView('dayView');
            }}
            onEventSelect={(event) => {
              if (!event?.date) return;
              const eventDate = new Date(event.date + 'T00:00:00');
              setSelectedDate(eventDate);
              setCurrentView('dayView');
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
          onEditEvent={handleEditEvent}
          onDeleteEvent={deleteEvent}
          onDateChange={setSelectedDate}
          onRemoveStudent={removeStudentFromClass}
          onAddStudent={addStudentToClass}
          onCancelTimeSlot={cancelTimeSlot}
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
          onCancelRegistration={cancelRegistration}
        />;
      
      case 'notes':
        return <NotesView 
          selectedEvent={selectedEvent}
          userNotes={userNotes}
          user={user}
          onBack={() => setCurrentView('dashboard')}
          onSaveNote={saveNote}
        />;

        case 'profileEdit':
          return <ProfileEdit 
            user={user}
            onBack={() => setCurrentView('dashboard')}
            onProfileUpdate={(updatedData) => {
              setUser(prev => ({
                ...prev,
                user_metadata: {
                  ...prev.user_metadata,
                  ...updatedData
                }
              }));
              fetchUserProfile(user.id); // Refresh profile data
            }}
          />;

        case 'adminDashboard':
          return <AdminDashboard 
            user={user}
            events={events}
            registrations={registrations}
            profiles={profiles}
            attendance={attendance}
            onNavigate={(view) => {
              setCurrentView(view);
            }}
            onEventSelect={(event) => {
              setSelectedEvent(event);
              if (event && event.date) {
                setSelectedDate(new Date(event.date + 'T00:00:00'));
              }
            }}
          />;

        case 'manageMembers':
          return <MemberManagement 
            user={user}
            profiles={profiles}
            onBack={() => setCurrentView('adminDashboard')}
            onRefreshProfiles={fetchProfiles}
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
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#ffffff',
            color: '#2d3142',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '15px',
            fontWeight: '500',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
          info: {
            iconTheme: {
              primary: '#ff6b35',
              secondary: '#fff',
            },
          },
        }}
      />
      <BookingModal 
        isOpen={bookingModal.isOpen}
        eventDetails={bookingModal.details}
        onClose={() => {
          setBookingModal({ isOpen: false, details: null });
          setCurrentView('dashboard');
        }}
      />
      {currentView !== 'login' && (
        <BottomNav 
          userRole={user?.user_metadata?.role}
          currentView={currentView}
          onNavigate={setCurrentView}
        />
      )}
    </>
  );
}

export default App;