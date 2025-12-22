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
    <div className="min-h-screen bg-grip-light pb-20">
      {/* Header */}
      <div className="bg-grip-secondary shadow-grip border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-montserrat font-semibold text-grip-primary">
            Workout Notes
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Event Info Card */}
        <div className="bg-white rounded-grip shadow-grip border border-gray-300 p-4 mb-8">
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
        <div className="bg-white rounded-grip shadow-grip border border-gray-300 p-4">
          <h3 className="text-lg font-semibold text-grip-dark mb-4">
            Your Personal Notes
          </h3>
          
          {!isEditing && existingNote ? (
            <div>
              <div className="bg-grip-secondary/20 rounded-grip p-4 whitespace-pre-wrap text-gray-800 leading-relaxed min-h-[200px]">
                {noteText}
              </div>
              <div className="flex justify-between items-center mt-6">
                <p className="text-sm text-gray-600">
                  Last updated: {new Date(existingNote.updated_at).toLocaleDateString()}
                </p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-grip-primary text-white px-4 py-2 rounded-grip font-semibold hover:shadow-grip transition-all"
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
                  className="flex-1 bg-grip-secondary text-grip-primary py-3 rounded-grip font-semibold hover:bg-grip-secondary transition-all"
                >
                  {existingNote ? 'Cancel' : 'Back'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!noteText.trim()}
                  className="flex-1 bg-grip-primary text-white py-3 rounded-grip font-semibold hover:shadow-grip disabled:bg-grip-secondary disabled:cursor-not-allowed transition-all"
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