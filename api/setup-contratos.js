// /api/setup-contratos.js
// One-time setup: creates the contratos table in Supabase
// DELETE THIS FILE AFTER RUNNING ONCE

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lmozoetpehmdxxremtqn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // Try to select from contratos to see if it exists
    const { data, error } = await supabase.from('contratos').select('id').limit(1);
    
    if (error && error.message.includes('does not exist')) {
      return res.status(200).json({ 
        success: false, 
        message: 'Table "contratos" does not exist. Please create it manually in Supabase SQL Editor.',
        sql: `CREATE TABLE IF NOT EXISTS contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  estado TEXT DEFAULT 'no_firmado',
  codigo_contrato TEXT,
  lead_id TEXT,
  cliente_nombre TEXT,
  cliente_email TEXT,
  cliente_telefono TEXT,
  cliente_nif TEXT,
  cliente_direccion TEXT,
  cliente_profesion TEXT,
  cliente_representacion TEXT DEFAULT 'en su propio nombre y representación',
  prestador_nombre TEXT DEFAULT 'Gerard Fanals',
  prestador_empresa TEXT DEFAULT 'Vigila y Actúa S.L.',
  prestador_nombre_comercial TEXT DEFAULT 'Proyecto IARTESANA',
  prestador_cif TEXT DEFAULT 'B 57973562',
  prestador_direccion TEXT DEFAULT 'Avda. Fort de Leau 131, Mahón 07701, Menorca',
  prestador_actividad TEXT DEFAULT 'Tecnología Online y OFFline a través de inteligencia artificial',
  prestador_telefono TEXT DEFAULT '+34 629494167',
  prestador_email TEXT DEFAULT 'gerard@iartesana.es',
  servicios JSONB DEFAULT '[]',
  duracion_meses INT DEFAULT 12,
  fecha_contrato DATE,
  fecha_inicio DATE,
  fecha_fin DATE,
  precio_total NUMERIC DEFAULT 0,
  precio_total_letras TEXT,
  precio_mensual NUMERIC DEFAULT 0,
  formas_pago JSONB DEFAULT '{}',
  pago_config JSONB DEFAULT '{}',
  lugar TEXT DEFAULT 'Mahón (Menorca)',
  notas TEXT,
  firma_cliente TEXT,
  firma_cliente_fecha TIMESTAMPTZ,
  firma_cliente_ip TEXT,
  firma_token TEXT,
  firma_token_expires TIMESTAMPTZ,
  firma_prestador TEXT,
  firmado_at TIMESTAMPTZ,
  pdf_url TEXT,
  datos_cliente JSONB DEFAULT '{}'
);
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON contratos FOR ALL USING (true);`
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Table "contratos" exists!', 
      rows: (data || []).length 
    });
  } catch (e) {
    return res.status(200).json({ success: false, error: e.message });
  }
};
