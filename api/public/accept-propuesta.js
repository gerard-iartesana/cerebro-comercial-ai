const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

// Init Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://lmozoetpehmdxxremtqn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

// Init Resend
const resend = new Resend(process.env.RESEND_API_KEY || 're_3MvY86D9_P1UjS4P6g84k4J6P6M3V2D7S'); // Using the known Resend key or env var

export default async function handler(req, res) {
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

        // 2.5 Sync data with outreach_leads
        let finalLeadId = prop.lead_id;
        
        const leadPayload = {
            first_name: datos.lead.nombre,
            last_name: datos.lead.apellidos,
            phone: datos.lead.telefono,
            company_name: datos.negocio.empresa,
            status: 'cliente', // Because they accepted the proposal
            nif: datos.lead.nif,
            fecha_nacimiento: datos.lead.fecha_nacimiento,
            position: datos.lead.cargo,
            nombre_comercial: datos.negocio.comercial,
            cif: datos.negocio.cif,
            actividad: datos.negocio.actividad,
            direccion: datos.negocio.direccion,
            cp: datos.negocio.cp,
            localidad: datos.negocio.localidad,
            provincia: datos.negocio.provincia,
            pais: datos.negocio.pais || 'España',
            email_negocio: datos.negocio.email,
            telefono_negocio: datos.negocio.telefono,
            web: datos.negocio.web,
            instagram: datos.negocio.instagram,
            facebook: datos.negocio.facebook,
            linkedin: datos.negocio.linkedin,
            tiktok: datos.negocio.tiktok,
            twitter: datos.negocio.twitter,
            pinterest: datos.negocio.pinterest,
            youtube: datos.negocio.youtube,
            otra_red: datos.negocio.otra_red,
            iban: datos.lead.iban,
            iban_titular: datos.lead.iban_titular
        };

        if (finalLeadId) {
            // Update existing lead linked to proposal
            await supabase.from('outreach_leads').update(leadPayload).eq('id', finalLeadId);
        } else {
            // Search by email to avoid duplicates
            const { data: existingLeads } = await supabase
                .from('outreach_leads')
                .select('id')
                .eq('email', datos.lead.email);
            
            if (existingLeads && existingLeads.length > 0) {
                finalLeadId = existingLeads[0].id;
                await supabase.from('outreach_leads').update(leadPayload).eq('id', finalLeadId);
            } else {
                // Create new lead
                leadPayload.email = datos.lead.email;
                const { data: newLead } = await supabase.from('outreach_leads').insert([leadPayload]).select('id').single();
                if (newLead) {
                    finalLeadId = newLead.id;
                }
            }
        }

        // 3. Create Contract Draft
        const contratoId = 'cont_' + Math.random().toString(36).substr(2, 9);
        
        // Prepare lineas for contract
        const lineas = prop.content?.lineas?.filter(l => l.activo !== false && !l.recomendado) || [];
        let totalNeto = 0;
        let totalMant = 0;

        lineas.forEach(l => {
            const p = l.precio || 0;
            const d = l.descuento || 0;
            totalNeto += p * (1 - d/100);
            if (l.mantenimiento) {
                totalMant += (l.mantenimiento_precio || 0);
            }
        });

        // Formas de pago structure for Contract
        const formasPagoContrato = {
            stripe: { active: forma_pago_elegida === 'stripe' },
            giro: { active: forma_pago_elegida === 'giro' },
            transferencia: { active: forma_pago_elegida === 'transferencia' },
            bizum: { active: forma_pago_elegida === 'bizum' },
            efectivo: { active: forma_pago_elegida === 'efectivo' }
        };

        const nuevoContrato = {
            id: contratoId,
            estado: 'borrador', // You will review it
            lead_id: prop.lead_id, // Might be null if it was generated ad-hoc
            presupuesto_id: prop.presupuesto_id,
            cliente_nombre: datos.lead.nombre,
            cliente_email: datos.lead.email,
            cliente_telefono: datos.lead.telefono,
            cliente_empresa: datos.negocio.empresa,
            cliente_nif: datos.lead.nif,
            cliente_direccion: datos.negocio.direccion,
            total_neto: totalNeto,
            mantenimiento_mensual: totalMant,
            datos_cliente: {
                apellidos: datos.lead.apellidos,
                fecha_nacimiento: datos.lead.fecha_nacimiento,
                nombre_negocio: datos.negocio.empresa,
                nombre_comercial: datos.negocio.comercial,
                cif_negocio: datos.negocio.cif,
                actividad: datos.negocio.actividad,
                direccion_negocio: datos.negocio.direccion,
                codigo_postal: datos.negocio.cp,
                localidad: datos.negocio.localidad,
                provincia: datos.negocio.provincia,
                pais: 'España',
                email_negocio: datos.negocio.email,
                telefono_negocio: datos.negocio.telefono,
                web: datos.negocio.web,
                instagram: datos.negocio.instagram,
                facebook: datos.negocio.facebook,
                linkedin: datos.negocio.linkedin,
                tiktok: datos.negocio.tiktok
            },
            formas_pago: formasPagoContrato,
            content: {
                ...prop.content, // inherit details
                firma_propuesta: firma,
                datos_aceptacion: datos,
                forma_pago_elegida: forma_pago_elegida,
                lead_iban: datos.lead.iban,
                lead_iban_titular: datos.lead.iban_titular
            }
        };

        const { error: contErr } = await supabase
            .from('contratos')
            .insert([nuevoContrato]);

        if (contErr) {
            console.error('Error creating contract:', contErr);
            // We don't throw, we want to finish the email process at least
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
