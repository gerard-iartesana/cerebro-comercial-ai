-- 🗄️ Tablas para Secuencias de Emails (Outreach y Propuestas)

-- 1. Tabla de Secuencias de Outreach (outreach_sequences)
CREATE TABLE IF NOT EXISTS outreach_sequences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cadena_num INT NOT NULL, -- 1 = Bienvenida, 2 = Seguimiento, 3 = Mantenimiento
    orden INT NOT NULL,      -- Paso en la cadena: 1, 2, 3...
    version TEXT DEFAULT 'A', -- 'A' (Conocidos), 'B' (Desconocidos), 'C' (Formularios)
    nombre TEXT NOT NULL,
    asunto TEXT,
    contenido_html TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (cadena_num, orden, version)
);

-- 2. Tabla de Configuración de Outreach (outreach_config)
CREATE TABLE IF NOT EXISTS outreach_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auto_envio BOOLEAN DEFAULT TRUE,
    remitente_nombre TEXT DEFAULT 'Gerard Fanals',
    remitente_email TEXT DEFAULT 'gerard@gerardfanals.online',
    reply_to TEXT DEFAULT 'gerard@iartesana.es',
    url_privacidad TEXT DEFAULT 'https://gerardfanals.com/privacidad',
    direccion_fisica TEXT DEFAULT 'Avda Fort de Leau 131, Mahón',
    modo_c1_a TEXT DEFAULT 'auto',
    modo_c1_b TEXT DEFAULT 'off',
    modo_c1_c TEXT DEFAULT 'off',
    modo_c2_a TEXT DEFAULT 'auto',
    modo_c2_b TEXT DEFAULT 'off',
    modo_c2_c TEXT DEFAULT 'off',
    modo_c3_a TEXT DEFAULT 'auto',
    modo_c3_b TEXT DEFAULT 'off',
    modo_c3_c TEXT DEFAULT 'off',
    intervalo_c1_a INT DEFAULT 2,
    intervalo_c1_b INT DEFAULT 2,
    intervalo_c1_c INT DEFAULT 2,
    intervalo_c2_a INT DEFAULT 3,
    intervalo_c2_b INT DEFAULT 3,
    intervalo_c2_c INT DEFAULT 3,
    dia_c3_a INT DEFAULT 5,
    dia_c3_b INT DEFAULT 5,
    dia_c3_c INT DEFAULT 5,
    fin_c3_a DATE DEFAULT NULL,
    fin_c3_b DATE DEFAULT NULL,
    fin_c3_c DATE DEFAULT NULL,
    cron_externo_activo BOOLEAN DEFAULT FALSE,
    cron_externo_frecuencia TEXT DEFAULT 'cada_hora',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Insertar configuración inicial por defecto si está vacía
INSERT INTO outreach_config (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM outreach_config);

-- 3. Tabla de Secuencias de Propuestas (proposal_sequences)
CREATE TABLE IF NOT EXISTS proposal_sequences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    secuencia_id TEXT NOT NULL,  -- 'inmediato', 'mensual', 'anual'
    categoria_key TEXT NOT NULL, -- 'consultoria', 'agentes_ia', 'apps_web', 'automatizacion', 'personalizada'
    step INT NOT NULL,           -- Paso: 1, 2, 3...
    nombre TEXT NOT NULL,
    asunto TEXT,
    contenido_html TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (secuencia_id, categoria_key, step)
);

-- 4. Tabla de Configuración de Seguimiento de Propuestas (proposal_config)
CREATE TABLE IF NOT EXISTS proposal_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auto_envio BOOLEAN DEFAULT TRUE,
    remitente_nombre TEXT DEFAULT 'Gerard Fanals',
    remitente_email TEXT DEFAULT 'gerard@gerardfanals.online',
    reply_to TEXT DEFAULT 'gerard@iartesana.es',
    url_privacidad TEXT DEFAULT 'https://gerardfanals.com/privacidad',
    direccion_fisica TEXT DEFAULT 'Avda Fort de Leau 131, Mahón',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Insertar configuración inicial por defecto si está vacía
INSERT INTO proposal_config (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM proposal_config);

-- 5. Añadir columna 'version' a outreach_leads si no existe
ALTER TABLE outreach_leads ADD COLUMN IF NOT EXISTS version TEXT DEFAULT 'A';

-- 6. Habilitar Seguridad a Nivel de Fila (RLS)
ALTER TABLE outreach_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_config ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de Acceso RLS (Administrador autenticado)
CREATE POLICY "Admin full access for outreach sequences" ON outreach_sequences
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access for outreach config" ON outreach_config
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access for proposal sequences" ON proposal_sequences
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access for proposal config" ON proposal_config
    FOR ALL USING (auth.role() = 'authenticated');

-- Permitir lectura pública de las configuraciones y secuencias si el frontend lo consulta sin estar autenticado en Supabase
CREATE POLICY "Public read for outreach sequences" ON outreach_sequences
    FOR SELECT USING (true);

CREATE POLICY "Public read for outreach config" ON outreach_config
    FOR SELECT USING (true);

CREATE POLICY "Public read for proposal sequences" ON proposal_sequences
    FOR SELECT USING (true);

CREATE POLICY "Public read for proposal config" ON proposal_config
    FOR SELECT USING (true);
