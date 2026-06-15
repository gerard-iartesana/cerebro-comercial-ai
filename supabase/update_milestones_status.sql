-- ========================================================
-- UPDATE MILESTONES CONSTRAINT AND ADD GOOGLE CALENDAR ID
-- ========================================================
-- Execute this SQL script in the Supabase SQL Editor.

-- 1. Add gcal_event_id column if it doesn't exist
ALTER TABLE client_milestones ADD COLUMN IF NOT EXISTS gcal_event_id TEXT;

-- 2. Drop the old constraint if it exists
ALTER TABLE client_milestones DROP CONSTRAINT IF EXISTS client_milestones_status_check;

-- 3. Create the new constraint supporting 'pending', 'accepted', 'rejected', and 'completed' statuses
ALTER TABLE client_milestones ADD CONSTRAINT client_milestones_status_check CHECK (status IN ('pending', 'accepted', 'rejected', 'completed'));
