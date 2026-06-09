// api/formularios.js — Vercel Serverless Function
// CRUD for formularios + formularios_respuestas

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lmozoetpehmdxxremtqn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

// ─── CORS Headers ────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(res, data, status = 200) {
  res.status(status).json(data);
}

function error(res, message, status = 400) {
  res.status(status).json({ error: message });
}

// ─── Default "Ficha de Cliente" seed data ────────────────────────────────────
const DEFAULT_FICHA_CLIENTE = {
  nombre: 'Ficha de Cliente',
  descripcion: 'Formulario principal de registro de clientes. Recoge datos personales y del negocio.',
  tipo: 'ficha_cliente',
  activo: true,
  campos: [
    { id: 'lead_nombre', label: 'Nombre', type: 'text', required: true, section: 'personal', placeholder: 'Nombre' },
    { id: 'lead_apellidos', label: 'Apellidos', type: 'text', required: true, section: 'personal', placeholder: 'Apellidos' },
    { id: 'lead_nif', label: 'NIF/DNI', type: 'text', required: true, section: 'personal', placeholder: '12345678A' },
    { id: 'lead_fecha_nac', label: 'Fecha de Nacimiento', type: 'date', required: false, section: 'personal' },
    { id: 'lead_profesion', label: 'Profesión', type: 'text', required: false, section: 'personal', placeholder: 'Profesión' },
    { id: 'lead_email', label: 'Email', type: 'email', required: true, section: 'personal', placeholder: 'email@ejemplo.com' },
    { id: 'lead_telefono', label: 'Teléfono', type: 'tel', required: true, section: 'personal', placeholder: '+34 600 000 000' },
    { id: 'lead_iban', label: 'IBAN', type: 'text', required: false, section: 'personal', placeholder: 'ES00 0000 0000 0000 0000 0000' },
    { id: 'lead_iban_titular', label: 'Titular IBAN', type: 'text', required: false, section: 'personal', placeholder: 'Nombre del titular' },
    { id: 'neg_empresa', label: 'Nombre de la Empresa', type: 'text', required: false, section: 'negocio', placeholder: 'Empresa S.L.' },
    { id: 'neg_comercial', label: 'Nombre Comercial', type: 'text', required: false, section: 'negocio', placeholder: 'Marca o nombre comercial' },
    { id: 'neg_cif', label: 'CIF', type: 'text', required: false, section: 'negocio', placeholder: 'B12345678' },
    { id: 'neg_actividad', label: 'Actividad', type: 'text', required: false, section: 'negocio', placeholder: 'Sector de actividad' },
    { id: 'neg_direccion', label: 'Dirección', type: 'text', required: false, section: 'negocio', placeholder: 'Calle, número' },
    { id: 'neg_cp', label: 'Código Postal', type: 'text', required: false, section: 'negocio', placeholder: '07001' },
    { id: 'neg_localidad', label: 'Localidad', type: 'text', required: false, section: 'negocio', placeholder: 'Ciudad' },
    { id: 'neg_provincia', label: 'Provincia', type: 'text', required: false, section: 'negocio', placeholder: 'Provincia' },
    { id: 'neg_email', label: 'Email del Negocio', type: 'email', required: false, section: 'negocio', placeholder: 'info@empresa.com' },
    { id: 'neg_telefono', label: 'Teléfono del Negocio', type: 'tel', required: false, section: 'negocio', placeholder: '+34 900 000 000' },
    { id: 'neg_web', label: 'Web', type: 'url', required: false, section: 'negocio', placeholder: 'https://www.empresa.com' },
    { id: 'neg_instagram', label: 'Instagram', type: 'text', required: false, section: 'redes', placeholder: '@usuario' },
    { id: 'neg_facebook', label: 'Facebook', type: 'text', required: false, section: 'redes', placeholder: 'Facebook URL' },
    { id: 'neg_linkedin', label: 'LinkedIn', type: 'text', required: false, section: 'redes', placeholder: 'LinkedIn URL' },
    { id: 'neg_tiktok', label: 'TikTok', type: 'text', required: false, section: 'redes', placeholder: '@usuario' },
  ],
  config: {
    color_primary: '#0071e3',
    color_bg: '#ffffff',
    submit_text: 'Enviar datos',
    success_message: '¡Gracias! Tus datos se han enviado correctamente.',
    sections: {
      personal: { title: '👤 Datos Personales', order: 1 },
      negocio: { title: '🏢 Datos del Negocio', order: 2 },
      redes: { title: '📱 Redes Sociales', order: 3 },
    },
  },
};

// ─── SQL for table setup ─────────────────────────────────────────────────────
const SETUP_SQL = `
-- Tabla de formularios
CREATE TABLE IF NOT EXISTS formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT DEFAULT 'custom',
  campos JSONB DEFAULT '[]',
  config JSONB DEFAULT '{}',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE formularios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON formularios FOR ALL USING (true);

-- Tabla de respuestas
CREATE TABLE IF NOT EXISTS formularios_respuestas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID REFERENCES formularios(id) ON DELETE CASCADE,
  datos JSONB NOT NULL DEFAULT '{}',
  lead_id UUID,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE formularios_respuestas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON formularios_respuestas FOR ALL USING (true);
`.trim();

// ─── Handler ─────────────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  // CORS preflight
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Validate config
  if (!SUPABASE_KEY) {
    return error(res, 'SUPABASE_KEY no configurada', 500);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, supabase);
      case 'POST':
        return await handlePost(req, res, supabase);
      case 'PUT':
        return await handlePut(req, res, supabase);
      case 'DELETE':
        return await handleDelete(req, res, supabase);
      default:
        return error(res, `Método ${req.method} no soportado`, 405);
    }
  } catch (err) {
    console.error('[formularios] Error:', err);
    return error(res, err.message || 'Error interno', 500);
  }
};

// ─── GET ─────────────────────────────────────────────────────────────────────
async function handleGet(req, res, supabase) {
  const { id, action, respuestas } = req.query;

  // ── action=setup → check tables and return SQL if needed ───────────────
  if (action === 'setup') {
    const { error: checkErr } = await supabase
      .from('formularios')
      .select('id')
      .limit(1);

    if (checkErr) {
      return json(res, {
        ok: false,
        message: 'La tabla "formularios" no existe. Ejecuta el siguiente SQL en Supabase:',
        sql: SETUP_SQL,
      });
    }

    return json(res, {
      ok: true,
      message: 'Las tablas ya existen.',
    });
  }

  // ── action=seed-default → create default Ficha de Cliente ─────────────
  if (action === 'seed-default') {
    // Check if it already exists
    const { data: existing } = await supabase
      .from('formularios')
      .select('id, nombre')
      .eq('tipo', 'ficha_cliente')
      .limit(1);

    if (existing && existing.length > 0) {
      return json(res, {
        ok: true,
        message: 'El formulario "Ficha de Cliente" ya existe.',
        formulario: existing[0],
      });
    }

    const { data, error: insertErr } = await supabase
      .from('formularios')
      .insert(DEFAULT_FICHA_CLIENTE)
      .select()
      .single();

    if (insertErr) {
      return error(res, `Error al crear formulario por defecto: ${insertErr.message}`, 500);
    }

    return json(res, {
      ok: true,
      message: 'Formulario "Ficha de Cliente" creado correctamente.',
      formulario: data,
    }, 201);
  }

  // ── Get single formulario by id ───────────────────────────────────────
  if (id) {
    const { data, error: fetchErr } = await supabase
      .from('formularios')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr) {
      return json(res, { success: false, error: `Formulario no encontrado: ${fetchErr.message}` }, 404);
    }

    // Optionally include responses
    let respuestasData = [];
    if (respuestas === 'true') {
      const { data: rData, error: respErr } = await supabase
        .from('formularios_respuestas')
        .select('*')
        .eq('formulario_id', id)
        .order('created_at', { ascending: false });

      if (!respErr) {
        respuestasData = rData || [];
      }
    }

    return json(res, { success: true, formulario: data, respuestas: respuestasData });
  }

  // ── List all formularios ──────────────────────────────────────────────
  const { data, error: listErr } = await supabase
    .from('formularios')
    .select('*')
    .order('created_at', { ascending: false });

  if (listErr) {
    return json(res, { success: false, error: `Error al listar formularios: ${listErr.message}` }, 500);
  }

  return json(res, { success: true, formularios: data || [] });
}

// ─── POST ────────────────────────────────────────────────────────────────────
async function handlePost(req, res, supabase) {
  const { nombre, descripcion, tipo, campos, config, activo } = req.body || {};

  if (!nombre) {
    return error(res, 'El campo "nombre" es obligatorio');
  }

  const record = {
    nombre,
    descripcion: descripcion || null,
    tipo: tipo || 'custom',
    campos: campos || [],
    config: config || {},
    activo: activo !== undefined ? activo : true,
  };

  const { data, error: insertErr } = await supabase
    .from('formularios')
    .insert(record)
    .select()
    .single();

  if (insertErr) {
    return json(res, { success: false, error: `Error al crear formulario: ${insertErr.message}` }, 500);
  }

  return json(res, { success: true, formulario: data }, 201);
}

// ─── PUT ─────────────────────────────────────────────────────────────────────
async function handlePut(req, res, supabase) {
  const { id, ...fields } = req.body || {};

  if (!id) {
    return error(res, 'El campo "id" es obligatorio para actualizar');
  }

  // Only allow known fields
  const allowedFields = ['nombre', 'descripcion', 'tipo', 'campos', 'config', 'activo'];
  const updates = {};
  for (const key of allowedFields) {
    if (fields[key] !== undefined) {
      updates[key] = fields[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return error(res, 'No se proporcionaron campos para actualizar');
  }

  updates.updated_at = new Date().toISOString();

  const { data, error: updateErr } = await supabase
    .from('formularios')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (updateErr) {
    return json(res, { success: false, error: `Error al actualizar formulario: ${updateErr.message}` }, 500);
  }

  return json(res, { success: true, formulario: data });
}

// ─── DELETE ──────────────────────────────────────────────────────────────────
async function handleDelete(req, res, supabase) {
  const { id } = req.query || {};

  if (!id) {
    return error(res, 'El parámetro "id" es obligatorio para eliminar');
  }

  // Delete responses first (cascade should handle it, but be explicit)
  await supabase
    .from('formularios_respuestas')
    .delete()
    .eq('formulario_id', id);

  const { error: deleteErr } = await supabase
    .from('formularios')
    .delete()
    .eq('id', id);

  if (deleteErr) {
    return json(res, { success: false, error: `Error al eliminar formulario: ${deleteErr.message}` }, 500);
  }

  return json(res, { success: true, message: 'Formulario eliminado correctamente' });
}
