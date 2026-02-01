-- Add must_change_password column to users table
ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 1;

-- Set admin to not require password change (already has secure password)
UPDATE users SET must_change_password = 0 WHERE role = 'admin';
