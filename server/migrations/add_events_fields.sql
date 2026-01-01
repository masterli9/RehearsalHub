-- Add place and length fields to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS place VARCHAR(255),
ADD COLUMN IF NOT EXISTS length INTERVAL;

-- Create event_songs junction table
CREATE TABLE IF NOT EXISTS event_songs (
    event_song_id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    song_id INTEGER NOT NULL REFERENCES songs(song_id) ON DELETE CASCADE,
    CONSTRAINT unique_event_song UNIQUE (event_id, song_id)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_event_songs_event ON event_songs(event_id);
CREATE INDEX IF NOT EXISTS idx_event_songs_song ON event_songs(song_id);

