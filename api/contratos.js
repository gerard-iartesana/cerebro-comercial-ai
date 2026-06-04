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

      return res.status(200).json({ success: true, contratos: data });
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
        clausula_plazo,
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
          objeto_texto,
          plazo_entrega,
          clausula_plazo,
          prueba_inicio,
          prueba_fin,
          cuota_fecha_inicio,
          cuota_concepto,
          precio_texto,
          precio_total_letras,
          cuenta_bancaria,
          datos_cliente,
          pago_config,
          clausulas_custom,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error creating contrato:', error);
        return res.status(500).json({ success: false, error: error.message });
      }

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
        clausula_plazo,
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
      if (objeto_texto !== undefined) updates.objeto_texto = objeto_texto;
      if (plazo_entrega !== undefined) updates.plazo_entrega = plazo_entrega;
      if (clausula_plazo !== undefined) updates.clausula_plazo = clausula_plazo;
      if (prueba_inicio !== undefined) updates.prueba_inicio = prueba_inicio;
      if (prueba_fin !== undefined) updates.prueba_fin = prueba_fin;
      if (cuota_fecha_inicio !== undefined) updates.cuota_fecha_inicio = cuota_fecha_inicio;
      if (cuota_concepto !== undefined) updates.cuota_concepto = cuota_concepto;
      if (precio_texto !== undefined) updates.precio_texto = precio_texto;
      if (precio_total_letras !== undefined) updates.precio_total_letras = precio_total_letras;
      if (cuenta_bancaria !== undefined) updates.cuenta_bancaria = cuenta_bancaria;
      if (datos_cliente !== undefined) updates.datos_cliente = datos_cliente;
      if (pago_config !== undefined) updates.pago_config = pago_config;
      if (clausulas_custom !== undefined) updates.clausulas_custom = clausulas_custom;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, error: 'No se proporcionaron campos para actualizar' });
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
