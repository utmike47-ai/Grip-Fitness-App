import React, { useState, useEffect } from 'react';
import Logo from '../Logo';

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
      <div className="bg-white shadow-sm border-b border-grip-secondary">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-4 text-grip-accent hover:text-grip-primary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-montserrat font-bold text-grip-primary">
              Workout Notes
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Event Info Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-grip-primary mb-2">
            {selectedEvent?.title}
          </h2>
          <p className="text-gray-600">
            {selectedEvent?.date && new Date(selectedEvent.date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>

        {/* Notes Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-grip-primary mb-4">
            Your Personal Notes
          </h3>
          
          {!isEditing && existingNote ? (
            <div>
              <div className="bg-grip-secondary/20 rounded-lg p-6 whitespace-pre-wrap text-gray-800 leading-relaxed min-h-[200px]">
                {noteText}
              </div>
              <div className="flex justify-between items-center mt-6">
                <p className="text-sm text-gray-500">
                  Last updated: {new Date(existingNote.updated_at).toLocaleDateString()}
                </p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-grip-primary text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
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
                className="w-full h-48 px-4 py-3 border border-grip-secondary rounded-lg focus:outline-none focus:border-grip-primary transition-colors resize-none"
                autoFocus
              />
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  {existingNote ? 'Cancel' : 'Back'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!noteText.trim()}
                  className="flex-1 bg-grip-primary text-white py-3 rounded-lg font-semibold hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
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