-- Migration: Add Chat Features to messages table
-- Run this in your PostgreSQL database

ALTER TABLE messages 
ADD COLUMN is_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN message_type VARCHAR(10) DEFAULT 'text',
ADD COLUMN media_url TEXT;

-- Index for performance (optional but recommended for larger datasets)
CREATE INDEX idx_messages_is_deleted ON messages(is_deleted);
