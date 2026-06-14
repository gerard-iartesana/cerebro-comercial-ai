-- ========================================================
-- FIX: CLIENT DASHBOARD RLS POLICIES FOR ANONYMOUS CLIENTS
-- ========================================================
-- The desktop dashboard and PWAs connect to Supabase using the Anon Key
-- and do not use Supabase Native Auth (auth.uid() is NULL).
-- This script changes the policies to allow full public access (like chat_messages).

-- 1. Drop existing policies for client_document_requests
DROP POLICY IF EXISTS "Admins can manage document requests" ON client_document_requests;
DROP POLICY IF EXISTS "Leads can select their document requests" ON client_document_requests;
DROP POLICY IF EXISTS "Leads can update their document requests" ON client_document_requests;

-- 2. Drop existing policies for client_milestones
DROP POLICY IF EXISTS "Admins can manage client milestones" ON client_milestones;
DROP POLICY IF EXISTS "Leads can select their milestones" ON client_milestones;

-- 3. Create new public access policies for client_document_requests
CREATE POLICY "Public manage document requests"
    ON client_document_requests FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 4. Create new public access policies for client_milestones
CREATE POLICY "Public manage client milestones"
    ON client_milestones FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);
