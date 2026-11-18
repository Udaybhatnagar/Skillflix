import { useState, useEffect } from 'react';
import { request } from '../services/api';
import { Check } from './Common';
export function LessonNotes({
  resourceId,
  videoId,
}: {
  resourceId: string;
  videoId?: string | null;
}) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const path = `/me/learning/notes/${encodeURIComponent(resourceId)}${videoId ? `?video=${encodeURIComponent(videoId)}` : ''}`;
  useEffect(() => {
    let active = true;
    setLoading(true);
    request<{ notes: string }>(path)
      .then((x) => {
        if (active) setNotes(x.notes);
      })
      .catch(() => {
        if (active) setError('Unable to load your notes. Try reloading the lesson.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [path]);
  return (
    <div>
      <h3>Your ideas, in one place.</h3>
      <label htmlFor="lesson-notes">Notes for this lesson</label>
      <textarea
        id="lesson-notes"
        rows={7}
        maxLength={20000}
        placeholder="What stood out? What will you try?"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        disabled={loading || !!error}
      />
      <button
        className="btn mt-4"
        disabled={loading || !!error}
        onClick={async () => {
          try {
            await request(path, { method: 'PUT', body: JSON.stringify({ notes }) });
            setMessage('Notes saved to your account.');
          } catch {
            setMessage('Unable to save notes. Please try again.');
          }
        }}
      >
        Save notes
        <Check className="icon" />
      </button>
      {error && <p role="alert">{error}</p>}
      <p className="sample-note" role="status">
        {message || 'Your lesson notes are private and synced to your account.'}
      </p>
    </div>
  );
}
