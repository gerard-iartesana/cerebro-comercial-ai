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
