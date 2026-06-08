const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

// Init Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://lmozoetpehmdxxremtqn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtb3pvZXRwZWhtZHh4cmVtdHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTA2NDUsImV4cCI6MjA5NTgyNjY0NX0.1xkCCw7q9CDvVbqGswCeFwXpgYfMtb0wcl7lHWlKQ8U';

// Init Resend
const resend = new Resend(process.env.RESEND_API_KEY || 're_3MvY86D9_P1UjS4P6g84k4J6P6M3V2D7S'); // Using the known Resend key or env var

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { propuesta_id, forma_pago_elegida, firma, datos } = req.body;

    if (!propuesta_id || !datos || !firma) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Fetch original proposal
        const { data: prop, error: propErr } = await supabase
            .from('propuestas_enviadas')
            .select('*')
            .eq('presupuesto_id', propuesta_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (propErr || !prop) {
            console.error('Error fetching propuesta:', propErr);
            return res.status(404).json({ error: 'Propuesta no encontrada' });
        }

        // 1.5 Fetch original presupuesto for full content (lineas, formas_pago, etc.)
        const { data: presupuesto } = await supabase
            .from('presupuestos')
            .select('*')
            .eq('id', propuesta_id)
            .single();

        // Merge presupuesto content into prop for easy access
        if (presupuesto) {
            prop.content = presupuesto;
        }

        // 2. Mark proposal as accepted
        const { error: updateErr } = await supabase
            .from('propuestas_enviadas')
            .update({ 
                estado: 'aceptada',
                datos_cliente_aceptacion: {
                    forma_pago: forma_pago_elegida,
                    datos_formulario: datos,
                    fecha_aceptacion: new Date().toISOString()
                }
            })
            .eq('presupuesto_id', propuesta_id);

        if (updateErr) {
            console.error('Error updating propuesta:', updateErr);
            throw updateErr;
        }

        // 2.5 Sync data with outreach_leads (best-effort, don't crash if columns missing)
        let finalLeadId = prop.lead_id;
        
        try {
            const leadPayload = {
                first_name: datos.lead.nombre,
                last_name: datos.lead.apellidos || '',
                phone: datos.lead.telefono,
                company_name: datos.negocio.empresa,
                status: 'cliente'
            };

            if (finalLeadId) {
                await supabase.from('outreach_leads').update(leadPayload).eq('id', finalLeadId);
            } else {
                const { data: existingLeads } = await supabase
                    .from('outreach_leads')
                    .select('id')
                    .eq('email', datos.lead.email);
                
                if (existingLeads && existingLeads.length > 0) {
                    finalLeadId = existingLeads[0].id;
                    await supabase.from('outreach_leads').update(leadPayload).eq('id', finalLeadId);
                } else {
                    leadPayload.email = datos.lead.email;
                    const { data: newLead } = await supabase.from('outreach_leads').insert([leadPayload]).select('id').single();
                    if (newLead) finalLeadId = newLead.id;
                }
            }
        } catch (leadErr) {
            console.error('Error syncing lead (non-fatal):', leadErr);
        }

        // 3. Create Contract Draft (best-effort)
        const contratoId = 'cont_' + Math.random().toString(36).substr(2, 9);
        
        try {
            const lineas = prop.content?.lineas?.filter(l => l.activo !== false && !l.recomendado) || [];
            let totalNeto = 0;
            let totalMant = 0;

            lineas.forEach(l => {
                const p = l.precio || 0;
                const d = l.descuento || 0;
                totalNeto += p * (1 - d/100);
                if (l.mantenimiento) totalMant += (l.mantenimiento_precio || 0);
            });

            const formasPagoContrato = {
                seleccionada: forma_pago_elegida || '',
                stripe: { active: forma_pago_elegida === 'stripe' },
                giro: { active: forma_pago_elegida === 'giro' },
                transferencia: { active: forma_pago_elegida === 'transferencia' },
                bizum: { active: forma_pago_elegida === 'bizum' },
                efectivo: { active: forma_pago_elegida === 'efectivo' }
            };

            const nuevoContrato = {
                id: contratoId,
                estado: 'borrador',
                lead_id: finalLeadId || prop.lead_id || null,
                cliente_nombre: datos.lead.nombre + (datos.lead.apellidos ? ' ' + datos.lead.apellidos : ''),
                cliente_email: datos.lead.email,
                cliente_telefono: datos.lead.telefono,
                cliente_nif: datos.lead.nif || '',
                cliente_direccion: datos.negocio.direccion || '',
                cliente_profesion: datos.lead.profesion || '',
                precio_total: totalNeto,
                precio_mensual: totalMant,
                duracion_meses: 12,
                fecha_contrato: new Date().toISOString().split('T')[0],
                formas_pago: formasPagoContrato,
                firma_cliente: firma,
                firma_cliente_fecha: new Date().toISOString(),
                datos_cliente: {
                    apellidos: datos.lead.apellidos || '',
                    fecha_nacimiento: datos.lead.fecha_nacimiento || '',
                    nombre_negocio: datos.negocio.empresa || '',
                    nombre_comercial: datos.negocio.comercial || '',
                    cif_negocio: datos.negocio.cif || '',
                    actividad: datos.negocio.actividad || '',
                    direccion_negocio: datos.negocio.direccion || '',
                    codigo_postal: datos.negocio.cp || '',
                    localidad: datos.negocio.localidad || '',
                    provincia: datos.negocio.provincia || '',
                    pais: 'España',
                    email_negocio: datos.negocio.email || '',
                    telefono_negocio: datos.negocio.telefono || '',
                    web: datos.negocio.web || '',
                    instagram: datos.negocio.instagram || '',
                    facebook: datos.negocio.facebook || '',
                    linkedin: datos.negocio.linkedin || '',
                    tiktok: datos.negocio.tiktok || '',
                    iban: datos.lead.iban || '',
                    iban_titular: datos.lead.iban_titular || '',
                    _extra: {
                        presupuesto_id: prop.presupuesto_id,
                        firma_propuesta: firma,
                        forma_pago_elegida: forma_pago_elegida
                    }
                },
                servicios: lineas.map(l => l.concepto || l.nombre || '').filter(Boolean),
                notas: 'Contrato generado automáticamente al aceptar propuesta ' + (prop.presupuesto_id || '')
            };

            const { error: contErr } = await supabase
                .from('contratos')
                .insert([nuevoContrato]);

            if (contErr) {
                console.error('Error creating contract (non-fatal):', contErr);
            }
        } catch (contCatchErr) {
            console.error('Error creating contract (non-fatal):', contCatchErr);
        }

        // 4. Send Email Notification to Gerard
        try {
            await resend.emails.send({
                from: 'iArtesana Notificaciones <no-reply@iartesana.es>',
                to: ['gerard@iartesana.es'], // Email to the owner
                subject: `🎉 Propuesta Aceptada: ${datos.negocio.empresa || datos.lead.nombre}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #34c759;">¡Propuesta Aceptada!</h2>
                        <p>El cliente <strong>${datos.lead.nombre} ${datos.lead.apellidos}</strong> ha aceptado la propuesta <em>${prop.titulo || ''}</em>.</p>
                        
                        <div style="background: #f5f5f7; padding: 16px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Datos rellenados:</h3>
                            <ul style="line-height: 1.5; color: #333;">
                                <li><strong>Empresa:</strong> ${datos.negocio.empresa || '-'}</li>
                                <li><strong>Email:</strong> ${datos.lead.email}</li>
                                <li><strong>Teléfono:</strong> ${datos.lead.telefono}</li>
                                <li><strong>Forma de pago elegida:</strong> ${forma_pago_elegida || 'No especificada'}</li>
                            </ul>
                        </div>

                        <p>Se ha generado automáticamente un borrador de contrato en la plataforma.</p>
                        <p><strong>Acción requerida:</strong> Entra en la plataforma, ve a la sección de Contratos, revisa las cláusulas, firma y envíalo al cliente.</p>
                        
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="https://cerebro-comercial-ai.vercel.app/" style="background: #0071e3; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">Ir a la plataforma</a>
                        </div>
                    </div>
                `
            });
        } catch (emailErr) {
            console.error('Error sending email:', emailErr);
        }

        return res.status(200).json({ success: true, message: 'Propuesta aceptada correctamente', contrato_id: contratoId });

    } catch (err) {
        console.error('API Error:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}
