-- ========================================================
-- UPDATE MILESTONES CONSTRAINT TO ALLOW 'accepted' STATUS
-- ========================================================
-- Execute this SQL script in the Supabase SQL Editor.

-- Drop the old constraint if it exists
ALTER TABLE client_milestones DROP CONSTRAINT IF EXISTS client_milestones_status_check;

-- Create the new constraint supporting 'pending', 'accepted', and 'completed' statuses
ALTER TABLE client_milestones ADD CONSTRAINT client_milestones_status_check CHECK (status IN ('pending', 'accepted', 'completed'));
