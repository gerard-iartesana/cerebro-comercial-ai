-- 🗄️ Esquema de Base de Datos para CerebroComercial AI (iadebarrio.com)

-- 1. Tabla de Leads de Prospección (outreach_leads)
CREATE TABLE IF NOT EXISTS outreach_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    company_name TEXT,
    website TEXT,
    linkedin_url TEXT,
    status TEXT DEFAULT 'lead', 
    -- Estados: 'lead', 'enriching', 'enriched', 'sent_first', 'followup_1', 'followup_2', 'followup_3', 'followup_4', 'nurture_monthly', 'replied', 'booked', 'unsubscribed', 'lost'
    sequence_step INT DEFAULT 0, -- 0 = outreach inicial, 1 = F1, etc.
    scraped_data JSONB DEFAULT '{}'::jsonb,
    custom_icebreaker TEXT,
    custom_email_subject TEXT,
    custom_email_body TEXT,
    last_contacted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Tabla de Logs de Emails Enviados (outreach_email_logs)
CREATE TABLE IF NOT EXISTS outreach_email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES outreach_leads(id) ON DELETE CASCADE NOT NULL,
    email_type TEXT NOT NULL, -- 'step_0', 'step_1', 'inbound_reply', etc.
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    opened_at TIMESTAMPTZ DEFAULT NULL,
    clicked_at TIMESTAMPTZ DEFAULT NULL
);

-- 3. Índices para Acelerar Búsquedas y Operaciones
CREATE INDEX IF NOT EXISTS idx_outreach_leads_status ON outreach_leads(status);
CREATE INDEX IF NOT EXISTS idx_outreach_leads_email ON outreach_leads(email);
CREATE INDEX IF NOT EXISTS idx_outreach_email_logs_lead ON outreach_email_logs(lead_id);

-- 4. Habilitar Seguridad a Nivel de Fila (RLS)
ALTER TABLE outreach_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_email_logs ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Acceso RLS (Fidelidad de Permisos)
-- Permitimos inserciones públicas para captación de leads orgánicos de la landing
CREATE POLICY "Public insert allowed for leads" ON outreach_leads
    FOR INSERT WITH CHECK (true);

-- Permitimos acceso administrativo total para usuarios autenticados (Panel)
CREATE POLICY "Admin full access for leads" ON outreach_leads
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access for email logs" ON outreach_email_logs
    FOR ALL USING (auth.role() = 'authenticated');

-- 6. Tabla de Presupuestos y Plantillas (presupuestos)
CREATE TABLE IF NOT EXISTS presupuestos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    subtitulo TEXT,
    descripcion TEXT,
    categoria TEXT DEFAULT 'personalizada',
    precio_alta NUMERIC,
    precio_mensual NUMERIC,
    precio_tipo TEXT DEFAULT 'fijo',
    badge TEXT,
    es_plantilla BOOLEAN DEFAULT TRUE,
    activo BOOLEAN DEFAULT TRUE,
    numero TEXT,
    beneficios JSONB DEFAULT '[]'::jsonb,
    notas TEXT,
    lead_nombre TEXT,
    fecha TIMESTAMPTZ,
    descuento_pct NUMERIC DEFAULT 0,
    notas_internas TEXT,
    forma_pago TEXT,
    formas_pago_ofrecidas JSONB DEFAULT '[]'::jsonb,
    link_pago TEXT,
    contenido_ia TEXT,
    fecha_entrega TIMESTAMPTZ,
    lineas JSONB DEFAULT '[]'::jsonb,
    pago_config JSONB DEFAULT '{"inv_min_pct": 15, "num_cuotas": 24, "descuento_b_pct": 4, "descuento_c_pct": 8, "show_a": true, "show_b": true, "show_c": true}'::jsonb,
    bonus TEXT,
    es_prueba BOOLEAN DEFAULT FALSE,
    orden INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. Tabla de Propuestas Enviadas (propuestas_enviadas)
CREATE TABLE IF NOT EXISTS propuestas_enviadas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    presupuesto_id UUID REFERENCES presupuestos(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES outreach_leads(id) ON DELETE SET NULL,
    lead_nombre TEXT,
    lead_email TEXT,
    titulo TEXT NOT NULL,
    precio_final NUMERIC,
    precio_mensual_final NUMERIC,
    descuento_pct NUMERIC DEFAULT 0,
    canal TEXT DEFAULT 'email',
    estado TEXT DEFAULT 'entregada', -- 'entregada', 'aceptada', 'rechazada'
    lineas JSONB DEFAULT '[]'::jsonb,
    enviado_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. Tabla de Seguimiento de Propuestas y Secuencias (propuesta_seguimiento)
CREATE TABLE IF NOT EXISTS propuesta_seguimiento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES outreach_leads(id) ON DELETE CASCADE,
    lead_nombre TEXT,
    lead_email TEXT,
    presupuesto_id UUID REFERENCES presupuestos(id) ON DELETE SET NULL,
    categoria TEXT DEFAULT 'personalizada',
    columna TEXT NOT NULL DEFAULT 'enviada' CHECK (columna IN ('enviada','inmediato','mensual','anual','stop')),
    secuencia_activa TEXT CHECK (secuencia_activa IN ('inmediato','mensual','anual') OR secuencia_activa IS NULL),
    paso_actual INT DEFAULT 0,
    ultimo_email_id TEXT,
    ultimo_email_nombre TEXT,
    ultimo_envio_at TIMESTAMPTZ,
    proximo_envio_at TIMESTAMPTZ,
    fecha_propuesta_enviada TIMESTAMPTZ DEFAULT now(),
    pausada BOOLEAN DEFAULT FALSE,
    frecuencia_dias INT DEFAULT 2,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Habilitar RLS para las nuevas tablas
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE propuestas_enviadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE propuesta_seguimiento ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para las nuevas tablas (Acceso Administrativo)
CREATE POLICY "Admin full access for budgets" ON presupuestos
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access for sent proposals" ON propuestas_enviadas
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Anon can view sent proposals" ON propuestas_enviadas
    FOR SELECT USING (true);

CREATE POLICY "Admin full access for tracking" ON propuesta_seguimiento
    FOR ALL USING (auth.role() = 'authenticated');

