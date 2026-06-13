-- ============================================
-- TABLA DE ACTIVIDADES DE CHAT Y RLS
-- Ejecutar en Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS chat_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE SET NULL, -- SET NULL para mantener histórico si se borra el chat
    lead_name TEXT NOT NULL,
    action TEXT NOT NULL, -- 'send_message', 'delete_message'
    desc TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    sender_type TEXT CHECK (sender_type IN ('admin', 'lead'))
);

-- Habilitar RLS
ALTER TABLE chat_activities ENABLE ROW LEVEL SECURITY;

-- 1. Acceso administrativo total para el admin
CREATE POLICY "Admin manage all chat activities" ON chat_activities
    FOR ALL USING (auth.role() = 'authenticated');

-- 2. Permitir inserciones públicas (anon) para registrar actividad de leads
CREATE POLICY "Leads can insert chat activities" ON chat_activities
    FOR INSERT WITH CHECK (true);

-- 3. Permitir lecturas públicas (anon) si fuese necesario
CREATE POLICY "Leads can read chat activities" ON chat_activities
    FOR SELECT USING (true);
