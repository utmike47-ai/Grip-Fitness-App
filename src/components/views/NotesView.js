import React, { useState, useEffect } from 'react';

const NotesView = ({ selectedEvent, userNotes, user, onBack, onSaveNote }) => {
  const [noteText, setNoteText] = useState('');
  const [existingNote, setExistingNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (selectedEvent && user) {
      const note = userNotes.find(n => n.event_id === selectedEvent.id && n.user_id === user.id);
      if (note) {
        setExistingNote(note);
        setNoteText(note.content);
        setIsEditing(false);
      } else {
        setNoteText('');
        setExistingNote(null);
        setIsEditing(true);
      }
    }
  }, [selectedEvent, user, userNotes]);

  const handleSave = async () => {
    if (!noteText.trim()) {
      alert('Please enter some content for your note.');
      return;
    }

    const success = await onSaveNote(selectedEvent.id, noteText, existingNote?.id);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (existingNote) {
      setNoteText(existingNote.content);
      setIsEditing(false);
    } else {
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-mjg-bg-primary pb-20">
      {/* Header */}
      <div className="bg-mjg-bg-secondary shadow-mjg border-b border-mjg-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-poppins font-semibold text-mjg-text-primary">
            Workout Notes
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Event Info Card */}
        <div className="bg-mjg-card rounded-mjg shadow-mjg border border-mjg-border p-4 mb-8">
          <h2 className="text-xl font-bold text-white mb-2">
            {selectedEvent?.title}
          </h2>
          <p className="text-mjg-text-secondary">
            {selectedEvent?.date && new Date(selectedEvent.date + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>

        {/* Notes Card */}
        <div className="bg-mjg-card rounded-mjg shadow-mjg border border-mjg-border p-4">
          <h3 className="text-lg font-semibold text-mjg-text-card mb-4">
            Your Personal Notes
          </h3>
          
          {!isEditing && existingNote ? (
            <div>
              <div className="bg-mjg-bg-secondary/20 rounded-mjg p-4 whitespace-pre-wrap text-gray-800 leading-relaxed min-h-[200px]">
                {noteText}
              </div>
              <div className="flex justify-between items-center mt-6">
                <p className="text-sm text-mjg-text-secondary">
                  Last updated: {new Date(existingNote.updated_at).toLocaleDateString()}
                </p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-mjg-accent text-white px-4 py-2 rounded-mjg font-semibold hover:shadow-mjg transition-all"
                >
                  Edit Note
                </button>
              </div>
            </div>
          ) : (
            <div>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="How did the workout go? Record your time, difficulty, improvements, or any thoughts..."
                className="w-full h-48 px-4 py-3 border border-mjg-border rounded-mjg focus:outline-none focus:ring-2 focus:ring-mjg-accent focus:border-transparent transition-colors resize-none"
                autoFocus
              />
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-mjg-bg-secondary text-mjg-text-primary py-3 rounded-mjg font-semibold hover:bg-mjg-bg-secondary transition-all"
                >
                  {existingNote ? 'Cancel' : 'Back'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!noteText.trim()}
                  className="flex-1 bg-mjg-accent text-white py-3 rounded-mjg font-semibold hover:shadow-mjg disabled:bg-mjg-bg-secondary disabled:cursor-not-allowed transition-all"
                >
                  Save Note
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesView;