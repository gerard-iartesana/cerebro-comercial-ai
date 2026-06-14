-- ========================================================
-- HISTORIAL Y GESTIÓN DE DOCUMENTOS DEL CLIENTE (DASHBOARD)
-- ========================================================

-- 1. SOLICITUDES DE DOCUMENTOS
CREATE TABLE IF NOT EXISTS client_document_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
    due_date TIMESTAMPTZ,
    uploaded_file_url TEXT,
    uploaded_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_doc_requests_room ON client_document_requests(room_id);
CREATE INDEX IF NOT EXISTS idx_doc_requests_status ON client_document_requests(status);

-- 2. FECHAS IMPORTANTES / HITOS DEL CLIENTE
CREATE TABLE IF NOT EXISTS client_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_milestones_room ON client_milestones(room_id);
CREATE INDEX IF NOT EXISTS idx_milestones_date ON client_milestones(date);

-- Habilitar RLS (Row Level Security)
ALTER TABLE client_document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_milestones ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: ADMINISTRADORES (Acceso total)
CREATE POLICY "Admins can manage document requests"
    ON client_document_requests FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM chat_rooms
            WHERE chat_rooms.id = client_document_requests.room_id
            AND chat_rooms.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_rooms
            WHERE chat_rooms.id = client_document_requests.room_id
            AND chat_rooms.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage client milestones"
    ON client_milestones FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM chat_rooms
            WHERE chat_rooms.id = client_milestones.room_id
            AND chat_rooms.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_rooms
            WHERE chat_rooms.id = client_milestones.room_id
            AND chat_rooms.user_id = auth.uid()
        )
    );

-- POLÍTICAS: LEADS (Lectura y Actualización/Inserción de archivos en su propia sala)
CREATE POLICY "Leads can select their document requests"
    ON client_document_requests FOR SELECT
    USING (true);

CREATE POLICY "Leads can update their document requests"
    ON client_document_requests FOR UPDATE
    USING (true);

CREATE POLICY "Leads can select their milestones"
    ON client_milestones FOR SELECT
    USING (true);
