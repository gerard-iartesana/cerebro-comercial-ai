// /api/contratos.js
// Vercel serverless function: CRUD operations for contratos table

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lmozoetpehmdxxremtqn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Helper: auto-upload contract snapshot to Supabase Storage
  async function uploadContratoToStorage(contrato) {
    try {
      const BUCKET = 'contratos';
      // Ensure bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = (buckets || []).some(b => b.name === BUCKET);
      if (!bucketExists) {
        await supabase.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 10485760 });
      }

      // Build a readable HTML snapshot
      const serviciosHtml = (contrato.servicios || []).map(s => 
        `<tr><td>${s.nombre || s.name || ''}</td><td>${s.descripcion || s.description || ''}</td><td>${s.precio || s.price || 0}€</td></tr>`
      ).join('');

      const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Contrato ${contrato.codigo_contrato || contrato.id}</title>
<style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:20px;color:#1a1a2e}h1{color:#0071e3;border-bottom:2px solid #0071e3;padding-bottom:12px}.section{margin:24px 0;padding:16px;border:1px solid #e5e5ea;border-radius:12px}.label{font-weight:600;color:#636366;font-size:0.85rem}.value{margin:4px 0 12px;font-size:1rem}table{width:100%;border-collapse:collapse}th,td{padding:8px 12px;border:1px solid #e5e5ea;text-align:left;font-size:0.9rem}th{background:#f5f5f7;font-weight:600}.badge{display:inline-block;padding:4px 12px;border-radius:6px;font-weight:700;font-size:0.85rem}.firmado{background:#d4edda;color:#155724}.no-firmado{background:#fff3cd;color:#856404}img{max-height:80px}</style>
</head>
<body>
<h1>📝 Contrato ${contrato.codigo_contrato || ''}</h1>
<span class="badge ${contrato.estado === 'firmado' ? 'firmado' : 'no-firmado'}">${contrato.estado === 'firmado' ? '✅ FIRMADO' : '📋 ' + (contrato.estado || 'borrador').toUpperCase()}</span>
<p style="color:#636366;font-size:0.85rem">Generado: ${new Date().toLocaleString('es-ES')}</p>

<div class="section">
  <h2>👤 Cliente</h2>
  <div class="label">Nombre</div><div class="value">${contrato.cliente_nombre || '—'}</div>
  <div class="label">Email</div><div class="value">${contrato.cliente_email || '—'}</div>
  <div class="label">Teléfono</div><div class="value">${contrato.cliente_telefono || '—'}</div>
  <div class="label">NIF/DNI</div><div class="value">${contrato.cliente_nif || '—'}</div>
  <div class="label">Dirección</div><div class="value">${contrato.cliente_direccion || '—'}</div>
</div>

<div class="section">
  <h2>🏢 Prestador</h2>
  <div class="label">Empresa</div><div class="value">${contrato.prestador_empresa || '—'}</div>
  <div class="label">Representante</div><div class="value">${contrato.prestador_nombre || '—'}</div>
  <div class="label">CIF</div><div class="value">${contrato.prestador_cif || '—'}</div>
</div>

<div class="section">
  <h2>📋 Servicios</h2>
  <table><thead><tr><th>Servicio</th><th>Descripción</th><th>Precio</th></tr></thead><tbody>${serviciosHtml || '<tr><td colspan="3">Sin servicios definidos</td></tr>'}</tbody></table>
</div>

<div class="section">
  <h2>💰 Condiciones económicas</h2>
  <div class="label">Precio total</div><div class="value" style="font-size:1.3rem;font-weight:700">${contrato.precio_total || 0}€</div>
  <div class="label">Duración</div><div class="value">${contrato.duracion_meses || '—'} meses</div>
  <div class="label">Fecha inicio</div><div class="value">${contrato.fecha_inicio || '—'}</div>
  <div class="label">Fecha fin</div><div class="value">${contrato.fecha_fin || '—'}</div>
</div>

<div class="section">
  <h2>✍️ Firmas</h2>
  <div style="display:flex;gap:40px">
    <div><div class="label">Firma cliente</div>${contrato.firma_cliente ? '<img src="' + contrato.firma_cliente + '" alt="Firma cliente">' : '<div class="value" style="color:#ff9500">⏳ Pendiente</div>'}</div>
    <div><div class="label">Firma prestador</div>${contrato.firma_prestador ? '<img src="' + contrato.firma_prestador + '" alt="Firma prestador">' : '<div class="value" style="color:#ff9500">⏳ Pendiente</div>'}</div>
  </div>
  ${contrato.firmado_at ? '<p style="margin-top:12px;color:#34c759;font-weight:600">✅ Firmado el ' + new Date(contrato.firmado_at).toLocaleString('es-ES') + '</p>' : ''}
</div>

<hr style="margin:30px 0;border:none;border-top:1px solid #e5e5ea">
<p style="font-size:0.75rem;color:#8e8e93">Documento generado automáticamente por Cerebro Comercial AI · ID: ${contrato.id}</p>
</body></html>`;

      const fileName = `${contrato.codigo_contrato || contrato.id}.html`;
      const filePath = `${contrato.id}/${fileName}`;

      // Upload (upsert)
      await supabase.storage
        .from(BUCKET)
        .upload(filePath, htmlContent, {
          contentType: 'text/html',
          upsert: true
        });

      console.log(`Contract uploaded to storage: ${BUCKET}/${filePath}`);
    } catch (uploadErr) {
      // Non-critical — don't block the response
      console.warn('Storage upload failed (non-critical):', uploadErr.message);
    }
  }

  try {
    // ── GET: List all contracts ────────────────────────────────────────────
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('contratos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contratos:', error);
        return res.status(500).json({ success: false, error: error.message });
      }

      // Unpack extra fields for response
      const mappedData = data.map(row => {
          if (row.datos_cliente && row.datos_cliente._extra) {
              return { ...row, ...row.datos_cliente._extra };
          }
          return row;
      });

      return res.status(200).json({ success: true, contratos: mappedData });
    }

    // ── POST: Create a new contract ───────────────────────────────────────
    if (req.method === 'POST') {
      const {
        estado,
        codigo_contrato,
        lead_id,
        cliente_nombre,
        cliente_email,
        cliente_telefono,
        cliente_nif,
        cliente_direccion,
        cliente_profesion,
        prestador_nombre,
        prestador_empresa,
        prestador_cif,
        prestador_direccion,
        prestador_actividad,
        servicios,
        duracion_meses,
        fecha_contrato,
        fecha_inicio,
        fecha_fin,
        precio_total,
        precio_mensual,
        formas_pago,
        notas,
        firma_cliente,
        firma_cliente_fecha,
        firma_prestador,
        firmado_at,
        pdf_url,
        objeto_texto,
        plazo_entrega,
        prueba_inicio,
        prueba_fin,
        cuota_fecha_inicio,
        cuota_concepto,
        precio_texto,
        precio_total_letras,
        cuenta_bancaria,
        datos_cliente,
        pago_config,
        clausulas_custom
      } = req.body || {};

      // Hack to save fields that don't exist in Supabase schema into datos_cliente JSONB
      const extra_fields = {};
      if (objeto_texto !== undefined) extra_fields.objeto_texto = objeto_texto;
      if (plazo_entrega !== undefined) extra_fields.plazo_entrega = plazo_entrega;
      if (prueba_inicio !== undefined) extra_fields.prueba_inicio = prueba_inicio;
      if (prueba_fin !== undefined) extra_fields.prueba_fin = prueba_fin;
      if (cuota_fecha_inicio !== undefined) extra_fields.cuota_fecha_inicio = cuota_fecha_inicio;
      if (cuota_concepto !== undefined) extra_fields.cuota_concepto = cuota_concepto;
      if (precio_texto !== undefined) extra_fields.precio_texto = precio_texto;
      if (cuenta_bancaria !== undefined) extra_fields.cuenta_bancaria = cuenta_bancaria;
      if (clausulas_custom !== undefined) extra_fields.clausulas_custom = clausulas_custom;

      let insert_datos_cliente = datos_cliente || {};
      if (Object.keys(extra_fields).length > 0) {
          insert_datos_cliente._extra = { ...(insert_datos_cliente._extra || {}), ...extra_fields };
      }

      const { data, error } = await supabase
        .from('contratos')
        .insert({
          estado: estado || 'no_firmado',
          codigo_contrato,
          lead_id,
          cliente_nombre,
          cliente_email,
          cliente_telefono,
          cliente_nif,
          cliente_direccion,
          cliente_profesion,
          prestador_nombre,
          prestador_empresa,
          prestador_cif,
          prestador_direccion,
          prestador_actividad,
          servicios,
          duracion_meses,
          fecha_contrato,
          fecha_inicio,
          fecha_fin,
          precio_total,
          precio_mensual,
          formas_pago,
          notas,
          firma_cliente,
          firma_cliente_fecha,
          firma_prestador,
          firmado_at,
          pdf_url,
          precio_total_letras,
          datos_cliente: insert_datos_cliente,
          pago_config,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error creating contrato:', error);
        return res.status(500).json({ success: false, error: error.message });
      }

      // Unpack extra fields for response
      if (data && data.datos_cliente && data.datos_cliente._extra) {
          Object.assign(data, data.datos_cliente._extra);
      }

      // Auto-upload to Storage (async, non-blocking)
      uploadContratoToStorage(data).catch(() => {});

      return res.status(201).json({ success: true, contrato: data });
    }

    // ── PUT: Update an existing contract ──────────────────────────────────
    if (req.method === 'PUT') {
      const id = req.query?.id || req.body?.id;

      if (!id) {
        return res.status(400).json({ success: false, error: 'Falta el id del contrato' });
      }

      const {
        estado,
        codigo_contrato,
        lead_id,
        cliente_nombre,
        cliente_email,
        cliente_telefono,
        cliente_nif,
        cliente_direccion,
        cliente_profesion,
        prestador_nombre,
        prestador_empresa,
        prestador_cif,
        prestador_direccion,
        prestador_actividad,
        servicios,
        duracion_meses,
        fecha_contrato,
        fecha_inicio,
        fecha_fin,
        precio_total,
        precio_mensual,
        formas_pago,
        notas,
        firma_cliente,
        firma_cliente_fecha,
        firma_prestador,
        firmado_at,
        pdf_url,
        objeto_texto,
        plazo_entrega,
        prueba_inicio,
        prueba_fin,
        cuota_fecha_inicio,
        cuota_concepto,
        precio_texto,
        precio_total_letras,
        cuenta_bancaria,
        datos_cliente,
        pago_config,
        clausulas_custom
      } = req.body || {};

      const updates = {};
      if (estado !== undefined) updates.estado = estado;
      if (codigo_contrato !== undefined) updates.codigo_contrato = codigo_contrato;
      if (lead_id !== undefined) updates.lead_id = lead_id;
      if (cliente_nombre !== undefined) updates.cliente_nombre = cliente_nombre;
      if (cliente_email !== undefined) updates.cliente_email = cliente_email;
      if (cliente_telefono !== undefined) updates.cliente_telefono = cliente_telefono;
      if (cliente_nif !== undefined) updates.cliente_nif = cliente_nif;
      if (cliente_direccion !== undefined) updates.cliente_direccion = cliente_direccion;
      if (cliente_profesion !== undefined) updates.cliente_profesion = cliente_profesion;
      if (prestador_nombre !== undefined) updates.prestador_nombre = prestador_nombre;
      if (prestador_empresa !== undefined) updates.prestador_empresa = prestador_empresa;
      if (prestador_cif !== undefined) updates.prestador_cif = prestador_cif;
      if (prestador_direccion !== undefined) updates.prestador_direccion = prestador_direccion;
      if (prestador_actividad !== undefined) updates.prestador_actividad = prestador_actividad;
      if (servicios !== undefined) updates.servicios = servicios;
      if (duracion_meses !== undefined) updates.duracion_meses = duracion_meses;
      if (fecha_contrato !== undefined) updates.fecha_contrato = fecha_contrato;
      if (fecha_inicio !== undefined) updates.fecha_inicio = fecha_inicio;
      if (fecha_fin !== undefined) updates.fecha_fin = fecha_fin;
      if (precio_total !== undefined) updates.precio_total = precio_total;
      if (precio_mensual !== undefined) updates.precio_mensual = precio_mensual;
      if (formas_pago !== undefined) updates.formas_pago = formas_pago;
      if (notas !== undefined) updates.notas = notas;
      if (firma_cliente !== undefined) updates.firma_cliente = firma_cliente;
      if (firma_cliente_fecha !== undefined) updates.firma_cliente_fecha = firma_cliente_fecha;
      if (firma_prestador !== undefined) updates.firma_prestador = firma_prestador;
      if (firmado_at !== undefined) updates.firmado_at = firmado_at;
      if (pdf_url !== undefined) updates.pdf_url = pdf_url;
      if (precio_total_letras !== undefined) updates.precio_total_letras = precio_total_letras;
      if (datos_cliente !== undefined) updates.datos_cliente = datos_cliente;
      if (pago_config !== undefined) updates.pago_config = pago_config;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, error: 'No se proporcionaron campos para actualizar' });
      }

      // Hack to save fields that don't exist in Supabase schema into datos_cliente JSONB
      const extra_fields = {};
      if (objeto_texto !== undefined) extra_fields.objeto_texto = objeto_texto;
      if (plazo_entrega !== undefined) extra_fields.plazo_entrega = plazo_entrega;
      if (prueba_inicio !== undefined) extra_fields.prueba_inicio = prueba_inicio;
      if (prueba_fin !== undefined) extra_fields.prueba_fin = prueba_fin;
      if (cuota_fecha_inicio !== undefined) extra_fields.cuota_fecha_inicio = cuota_fecha_inicio;
      if (cuota_concepto !== undefined) extra_fields.cuota_concepto = cuota_concepto;
      if (precio_texto !== undefined) extra_fields.precio_texto = precio_texto;
      if (cuenta_bancaria !== undefined) extra_fields.cuenta_bancaria = cuenta_bancaria;
      if (clausulas_custom !== undefined) extra_fields.clausulas_custom = clausulas_custom;

      if (Object.keys(extra_fields).length > 0) {
          updates.datos_cliente = updates.datos_cliente || {};
          updates.datos_cliente._extra = { ...(updates.datos_cliente._extra || {}), ...extra_fields };
      }

      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('contratos')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating contrato:', error);
        return res.status(500).json({ success: false, error: error.message });
      }

      // Unpack extra fields for response
      if (data && data.datos_cliente && data.datos_cliente._extra) {
          Object.assign(data, data.datos_cliente._extra);
      }

      // Auto-upload to Storage (async, non-blocking)
      uploadContratoToStorage(data).catch(() => {});

      return res.status(200).json({ success: true, contrato: data });
    }

    // ── DELETE: Remove a contract ─────────────────────────────────────────
    if (req.method === 'DELETE') {
      const id = req.query?.id || req.body?.id;

      if (!id) {
        return res.status(400).json({ success: false, error: 'Falta el id del contrato' });
      }

      const { data, error } = await supabase
        .from('contratos')
        .delete()
        .eq('id', id)
        .select('id, codigo_contrato, estado')
        .single();

      if (error) {
        console.error('Error deleting contrato:', error);
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.status(200).json({ success: true, message: 'Contrato eliminado', contrato: data });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in contratos handler:', error);
    return res.status(500).json({ success: false, error: error.message || 'Error interno del servidor' });
  }
};
