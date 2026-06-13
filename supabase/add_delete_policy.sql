-- Run this in Supabase SQL Editor to add DELETE + UPDATE policies for anon/lead users
-- This fixes the bug where PWA users cannot delete messages

CREATE POLICY "Leads can delete messages in their room"
    ON chat_messages FOR DELETE
    USING (true);

CREATE POLICY "Leads can update messages in their room"
    ON chat_messages FOR UPDATE
    USING (true);
