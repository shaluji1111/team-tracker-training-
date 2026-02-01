-- Add start_time and end_time columns to tasks table
ALTER TABLE tasks ADD COLUMN start_time TIME;
ALTER TABLE tasks ADD COLUMN end_time TIME;
