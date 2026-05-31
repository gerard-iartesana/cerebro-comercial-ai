// /api/inbound-webhook.js
// Vercel serverless function: Handles both incoming email replies (Resend Inbound) and calendar bookings (Calendly / Cal.com) to stop outreach sequences

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uidilhuybmtuokunutgz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpZGlsaHV5Ym10dW9rdW51dGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDU0NTAsImV4cCI6MjA5MTQyMTQ1MH0.ir9FnuHhW_1i4OslE_SNbOCIgLUEWakScP71WYqnfJM';

function parseEmail(fromHeader) {
  if (!fromHeader) return '';
  const match = fromHeader.match(/<([^>]+)>/) || fromHeader.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  return match ? match[1].trim().toLowerCase() : fromHeader.trim().toLowerCase();
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const payload = req.body || {};
    
    // 1. Detectar si es un agendamiento de Calendario (Calendly o Cal.com)
    const isCalendarBooking = 
      payload.event === 'invitee.created' || 
      payload.triggerEvent === 'BOOKING_CREATED' || 
      (payload.invitee && payload.invitee.email) || 
      (payload.attendees && payload.attendees.length > 0) ||
      payload.meetingDate;

    if (isCalendarBooking) {
      let email = '';
      let meetingDate = '';

      if (payload.event === 'invitee.created') {
        email = payload.payload.email;
        meetingDate = payload.payload.start_time || '';
      } else if (payload.triggerEvent === 'BOOKING_CREATED') {
        const attendee = payload.payload.attendees && payload.payload.attendees[0];
        email = attendee ? attendee.email : '';
        meetingDate = payload.payload.startTime || '';
      } else {
        email = payload.email || (payload.invitee && payload.invitee.email) || '';
        meetingDate = payload.startTime || payload.meetingDate || '';
      }

      if (!email) {
        return res.status(400).json({ error: 'No se pudo identificar el email en el webhook de calendario' });
      }

      const cleanEmail = email.trim().toLowerCase();
      console.log(`Procesando agendamiento de cita en calendario para: ${cleanEmail}`);

      const { data: lead, error: fetchErr } = await supabase
        .from('outreach_leads')
        .select('*')
        .eq('email', cleanEmail)
        .single();

      if (fetchErr || !lead) {
        console.log(`Cita de remitente no registrado en outbound: ${cleanEmail}. Creando meeting orgánico.`);
        await supabase.from('meetings').insert({
          contact_name: cleanEmail.split('@')[0],
          contact_email: cleanEmail,
          meeting_date: meetingDate || new Date().toISOString(),
          meeting_type: 'consultoria_ia',
          status: 'scheduled',
          notes: 'Agendado orgánicamente vía webhook'
        }).catch(() => {});

        return res.status(200).json({ success: true, message: 'Cita registrada para lead orgánico' });
      }

      const { error: updateErr } = await supabase
        .from('outreach_leads')
        .update({
          status: 'booked',
          scraped_data: {
            ...lead.scraped_data,
            meeting_booked_at: new Date().toISOString(),
            meeting_date: meetingDate
          }
        })
        .eq('id', lead.id);

      if (updateErr) throw updateErr;

      await supabase.from('meetings').insert({
        contact_name: lead.first_name || cleanEmail.split('@')[0],
        contact_email: lead.email,
        meeting_date: meetingDate || new Date().toISOString(),
        meeting_type: 'consultoria_ia',
        status: 'scheduled',
        notes: `Reunión agendada de campaña outbound. Empresa: ${lead.company_name}`
      }).catch(() => {});

      console.log(`Lead marcado como BOOKED con éxito: ${cleanEmail}`);
      return res.status(200).json({ success: true, message: 'Lead marcado como BOOKED', email: cleanEmail });
    }

    // 2. Procesar como Respuesta de Email (Resend Inbound Webhook)
    const rawFrom = payload.from || (payload.data && payload.data.from);
    if (!rawFrom) {
      return res.status(400).json({ error: 'Falta el remitente en el payload' });
    }

    const leadEmail = parseEmail(rawFrom);
    if (!leadEmail) {
      return res.status(400).json({ error: 'No se pudo parsear el email del remitente' });
    }

    console.log(`Procesando respuesta de email para: ${leadEmail}`);

    const { data: lead, error: fetchErr } = await supabase
      .from('outreach_leads')
      .select('*')
      .eq('email', leadEmail)
      .single();

    if (fetchErr || !lead) {
      console.log(`Email de respuesta de remitente desconocido: ${leadEmail}`);
      return res.status(200).json({ success: true, message: 'Remitente desconocido. No requiere acción.' });
    }

    if (lead.status === 'replied' || lead.status === 'booked') {
      return res.status(200).json({ success: true, message: 'El lead ya estaba marcado como contestado/agendado.' });
    }

    const { error: updateErr } = await supabase
      .from('outreach_leads')
      .update({
        status: 'replied',
        scraped_data: {
          ...lead.scraped_data,
          last_reply_subject: payload.subject || 'Sin asunto',
          last_reply_at: new Date().toISOString()
        }
      })
      .eq('id', lead.id);

    if (updateErr) throw updateErr;

    await supabase.from('outreach_email_logs').insert({
      lead_id: lead.id,
      email_type: 'inbound_reply',
      subject: payload.subject || 'Respuesta del lead',
      body: payload.text || 'Contenido del correo entrante'
    });

    console.log(`Secuencia detenida con éxito para el lead: ${leadEmail}`);
    return res.status(200).json({
      success: true,
      message: 'Secuencia detenida correctamente.',
      email: leadEmail,
      company: lead.company_name
    });

  } catch (error) {
    console.error('Inbound handler error:', error);
    return res.status(500).json({ error: error.message || 'Error interno' });
  }
};
