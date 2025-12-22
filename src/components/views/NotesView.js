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
    <div className="min-h-screen pb-20 pb-20">
      {/* Header */}
      <div className="bg-gym-secondary shadow-lg border-b border-gym-secondary">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="medium" variant="dark" />
          <button
            onClick={onBack}
            className="text-white hover:text-gym-accent transition-colors"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Event Info Card */}
        <div className="bg-white rounded-grip shadow-lg border border-gray-300 p-4 mb-8">
          <h2 className="text-xl font-bold text-white mb-2">
            {selectedEvent?.title}
          </h2>
          <p className="text-gray-600">
            {selectedEvent?.date && new Date(selectedEvent.date + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>

        {/* Notes Card */}
        <div className="bg-white rounded-grip shadow-lg border border-gray-300 p-4">
          <h3 className="text-lg font-semibold text-gym-text-dark mb-4">
            Your Personal Notes
          </h3>
          
          {!isEditing && existingNote ? (
            <div>
              <div className="bg-gym-secondary/20 rounded-grip p-4 whitespace-pre-wrap text-gray-800 leading-relaxed min-h-[200px]">
                {noteText}
              </div>
              <div className="flex justify-between items-center mt-6">
                <p className="text-sm text-gray-600">
                  Last updated: {new Date(existingNote.updated_at).toLocaleDateString()}
                </p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-gym-primary text-white px-4 py-2 rounded-grip font-semibold hover:shadow-lg transition-all"
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
                className="w-full h-48 px-4 py-3 border border-gray-300 rounded-grip focus:outline-none focus:ring-2 focus:ring-grip-primary focus:border-transparent transition-colors resize-none"
                autoFocus
              />
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gym-secondary text-gym-accent py-3 rounded-grip font-semibold hover:bg-gym-secondary transition-all"
                >
                  {existingNote ? 'Cancel' : 'Back'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!noteText.trim()}
                  className="flex-1 bg-gym-primary text-white py-3 rounded-grip font-semibold hover:shadow-lg disabled:bg-gym-secondary disabled:cursor-not-allowed transition-all"
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