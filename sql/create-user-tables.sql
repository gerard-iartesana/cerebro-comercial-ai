-- ══════════════════════════════════════════════════════════════
-- CerebroComercial AI — Tablas de Gestión de Usuarios
-- Ejecutar en Supabase SQL Editor (https://supabase.com/dashboard)
-- ══════════════════════════════════════════════════════════════

-- 1. Tabla de usuarios del dashboard
CREATE TABLE IF NOT EXISTS dashboard_users (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username    TEXT NOT NULL,
    full_name   TEXT DEFAULT '',
    email       TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'client' 
                CHECK (role IN ('superadmin', 'admin', 'client', 'guest')),
    modules     JSONB DEFAULT '"all"',
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_dashboard_users_email ON dashboard_users (email);
CREATE INDEX IF NOT EXISTS idx_dashboard_users_active ON dashboard_users (is_active);

-- 2. Tabla de tokens de reseteo de contraseña
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES dashboard_users(id) ON DELETE CASCADE,
    token       TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Índice para buscar por token
CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens (token);

-- Limpieza automática de tokens expirados (opcional, ejecutar cada hora)
-- DELETE FROM password_reset_tokens WHERE expires_at < now();

-- 3. Desactivar RLS para que la API pueda acceder sin restricciones
--    (los usuarios se autentican via la API, no via Supabase Auth)
ALTER TABLE dashboard_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Política: permitir todo al service_role (que es lo que usa la API)
CREATE POLICY "Allow service role full access on dashboard_users"
    ON dashboard_users FOR ALL
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on password_reset_tokens"
    ON password_reset_tokens FOR ALL
    USING (true) WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════
-- ✅ Listo. Ahora puedes crear usuarios desde el dashboard.
-- ══════════════════════════════════════════════════════════════
