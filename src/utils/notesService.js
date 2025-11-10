/**
 * Notes service helpers provide typed supabase operations for workout notes.
 */

import { supabase } from './supabaseClient';

/**
 * @typedef {Object} Note
 * @property {string} id
 * @property {string} user_id
 * @property {string} event_id
 * @property {string} content
 * @property {string} created_at
 * @property {string} updated_at
 */

const friendlyError = 'Something went wrong. Please try again.';

/**
 * Fetch the current user's note for a specific event/workout.
 *
 * @param {string} userId
 * @param {string} eventId
 * @returns {Promise<{ note: Note | null, error: string | null }>}
 */
export const fetchNoteForEvent = async (userId, eventId) => {
  if (!userId || !eventId) {
    return { note: null, error: friendlyError };
  }

  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('fetchNoteForEvent error:', error);
      return { note: null, error: 'Unable to load your note right now. Please try again.' };
    }

    return { note: data || null, error: null };
  } catch (err) {
    console.error('fetchNoteForEvent unexpected error:', err);
    return { note: null, error: friendlyError };
  }
};

/**
 * Create or update a note for a given workout using UPSERT behaviour.
 *
 * @param {string} userId
 * @param {string} eventId
 * @param {string} content
 * @returns {Promise<{ note: Note | null, error: string | null }>}
 */
export const saveNote = async (userId, eventId, content) => {
  if (!userId || !eventId) {
    console.error('saveNote missing identifiers', { userId, eventId });
    return { note: null, error: friendlyError };
  }

  const trimmedContent = (content || '').trim();

  console.log('saveNote attempt', {
    user_id: userId,
    event_id: eventId,
    content,
    content_length: trimmedContent.length,
  });

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.warn('saveNote auth lookup warning', authError);
    }

    console.log('saveNote auth context', {
      auth_user_id: authData?.user?.id || null,
      matches_param: authData?.user?.id === userId,
    });

    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('notes')
      .upsert([
        {
          user_id: userId,
          event_id: eventId,
          content: trimmedContent,
          updated_at: nowIso,
        },
      ], { onConflict: 'user_id,event_id' })
      .select('*')
      .single();

    if (error) {
      console.error('saveNote upsert error:', {
        error,
        user_id: userId,
        event_id: eventId,
        content_length: trimmedContent.length,
        auth_user_id: authData?.user?.id || null,
      });
      return { note: null, error: 'Unable to save your note. Please try again.' };
    }

    console.log('saveNote success', {
      note_id: data?.id || null,
      user_id: userId,
      event_id: eventId,
    });

    return { note: data, error: null };
  } catch (err) {
    console.error('saveNote unexpected error:', {
      error: err,
      user_id: userId,
      event_id: eventId,
    });
    return { note: null, error: friendlyError };
  }
};

/**
 * Delete a note by id.
 *
 * @param {string} noteId
 * @returns {Promise<{ error: string | null }>}
 */
export const deleteNote = async (noteId) => {
  if (!noteId) {
    return { error: friendlyError };
  }

  try {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      console.error('deleteNote error:', error);
      return { error: 'Unable to remove your note right now. Please try again.' };
    }

    return { error: null };
  } catch (err) {
    console.error('deleteNote unexpected error:', err);
    return { error: friendlyError };
  }
};
