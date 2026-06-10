-- ============================================
-- CHAT CON LEADS - Tablas Supabase
-- ============================================

-- 1. CHAT ROOMS (una sala por lead)
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID,
    lead_name TEXT NOT NULL,
    lead_company TEXT DEFAULT '',
    lead_email TEXT DEFAULT '',
    link_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
    last_message_at TIMESTAMPTZ DEFAULT now(),
    unread_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_chat_rooms_user ON chat_rooms(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_token ON chat_rooms(link_token);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_lead ON chat_rooms(lead_id);

-- 2. CHAT MESSAGES
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('admin', 'lead')),
    sender_name TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    file_url TEXT,
    file_name TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(room_id, created_at);

-- 3. MENSAJES PROGRAMADOS
CREATE TABLE IF NOT EXISTS chat_scheduled_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_scheduled_status ON chat_scheduled_messages(status, scheduled_at);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_scheduled_messages ENABLE ROW LEVEL SECURITY;

-- CHAT ROOMS: admin ve sus salas
CREATE POLICY "Users can manage their chat rooms"
    ON chat_rooms FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- CHAT ROOMS: lead puede ver su sala por token (anon)
CREATE POLICY "Leads can view their room by token"
    ON chat_rooms FOR SELECT
    USING (true);

-- CHAT MESSAGES: admin ve mensajes de sus salas
CREATE POLICY "Users can manage messages in their rooms"
    ON chat_messages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM chat_rooms
            WHERE chat_rooms.id = chat_messages.room_id
            AND chat_rooms.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_rooms
            WHERE chat_rooms.id = chat_messages.room_id
            AND chat_rooms.user_id = auth.uid()
        )
    );

-- CHAT MESSAGES: lead puede ver/enviar mensajes en su sala (anon con token)
CREATE POLICY "Leads can read messages in their room"
    ON chat_messages FOR SELECT
    USING (true);

CREATE POLICY "Leads can insert messages in their room"
    ON chat_messages FOR INSERT
    WITH CHECK (true);

-- SCHEDULED: admin gestiona sus programados
CREATE POLICY "Users can manage their scheduled messages"
    ON chat_scheduled_messages FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCIÓN: enviar mensajes programados (para pg_cron)
-- ============================================
CREATE OR REPLACE FUNCTION send_scheduled_chat_messages()
RETURNS void AS $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT id, room_id, content
        FROM chat_scheduled_messages
        WHERE status = 'pending'
        AND scheduled_at <= now()
    LOOP
        -- Insertar el mensaje
        INSERT INTO chat_messages (room_id, sender_type, sender_name, content)
        VALUES (rec.room_id, 'admin', 'Mensaje Automático', rec.content);

        -- Actualizar last_message_at y unread
        UPDATE chat_rooms
        SET last_message_at = now(),
            unread_count = unread_count + 1
        WHERE id = rec.room_id;

        -- Marcar como enviado
        UPDATE chat_scheduled_messages
        SET status = 'sent', sent_at = now()
        WHERE id = rec.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ACTIVAR REALTIME en chat_messages
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
