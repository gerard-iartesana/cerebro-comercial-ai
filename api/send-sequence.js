// /api/send-sequence.js
// Vercel serverless function: Processes the cold outreach and proposal followup email sequences

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lmozoetpehmdxxremtqn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtb3pvZXRwZWhtZHh4cmVtdHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTA2NDUsImV4cCI6MjA5NTgyNjY0NX0.1xkCCw7q9CDvVbqGswCeFwXpgYfMtb0wcl7lHWlKQ8U';
const RESEND_KEY = process.env.RESEND_API_KEY || 're_UVTNRfhh_EVoej22sdW9aCdhpKEFCKqkj';
const BOOKING_URL = 'https://calendar.app.google/QMiJY3UbKChYgEcu6';

const tips = [
  "Usa ChatGPT/Gemini para redactar propuestas y resúmenes comerciales automáticos a partir de tus notas de reuniones.",
  "Centraliza tus leads en una base de datos segura y crea alertas automáticas en tu móvil cuando entre un lead de gran valor.",
  "Implementa un agente IA de soporte básico en tu web para resolver el 80% de las dudas recurrentes de tus clientes sin coste de personal.",
  "Automatiza la facturación y el envío de recibos conectando tu software de cobros con tu contabilidad de forma directa.",
  "Crea un dashboard automatizado para ver en tiempo real la rentabilidad de cada proyecto sin tener que hacer cálculos mensuales en Excel.",
  "Usa herramientas de scraping e IA para monitorizar las novedades de tus competidores más directos de forma 100% automatizada."
];

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const now = new Date();
  
  // Resolve host site URL
  const host = req.headers.host || 'cerebrocomercial-ia.iadebarrio.com';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const SITE_URL = `${protocol}://${host}`;

  try {
    const { lead_id } = req.body || req.query || {};

    // 1. Fetch config objects
    const { data: outConfig } = await supabase.from('outreach_config').select('*').limit(1).maybeSingle();
    const { data: propConfig } = await supabase.from('proposal_config').select('*').limit(1).maybeSingle();

    const outreachCfg = outConfig || {
      auto_envio: true,
      remitente_nombre: 'Gerard Fanals',
      remitente_email: 'gerard@gerardfanals.online',
      reply_to: 'gerard@iartesana.es',
      url_privacidad: 'https://gerardfanals.com/privacidad',
      direccion_fisica: 'Avda Fort de Leau 131, Mahón'
    };

    const proposalCfg = propConfig || {
      auto_envio: true,
      remitente_nombre: 'Gerard Fanals',
      remitente_email: 'gerard@gerardfanals.online',
      reply_to: 'gerard@iartesana.es',
      url_privacidad: 'https://gerardfanals.com/privacidad',
      direccion_fisica: 'Avda Fort de Leau 131, Mahón'
    };

    let sentCount = 0;
    const sendLogs = [];

    // ==========================================
    // CASE A: Processing single lead trigger
    // ==========================================
    if (lead_id) {
      const { data: lead, error: leadErr } = await supabase.from('outreach_leads').select('*').eq('id', lead_id).single();
      if (leadErr || !lead) {
        return res.status(404).json({ error: 'Lead no encontrado' });
      }

      // Check current step mapping (0 to 5)
      const currentStep = lead.sequence_step || 0;
      if (currentStep > 5) {
        return res.status(400).json({ error: 'El lead ya ha completado la secuencia inicial de outreach' });
      }

      const chainNum = Math.floor(currentStep / 2) + 1; // 1, 2, 3
      const stepOrder = (currentStep % 2) + 1; // 1, 2
      const version = lead.version || 'A';

      // Load template from DB
      const { data: template } = await supabase.from('outreach_sequences')
        .select('*')
        .eq('cadena_num', chainNum)
        .eq('orden', stepOrder)
        .eq('version', version)
        .maybeSingle();

      if (!template) {
        return res.status(404).json({ error: `Plantilla no encontrada para Cadena ${chainNum}, Paso ${stepOrder}, Versión ${version}` });
      }

      const subject = (template.asunto || '').replace(/{{first_name}}/g, lead.first_name || 'hola').replace(/{{company_name}}/g, lead.company_name || 'tu empresa');
      let bodyText = (template.contenido_html || template.contenido || '').replace(/{{first_name}}/g, lead.first_name || 'allí').replace(/{{company_name}}/g, lead.company_name || 'tu empresa').replace(/{{booking_url}}/g, BOOKING_URL);
      
      const htmlEmail = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${bodyText}
          <br><br>
          <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 24px 0;">
          <p style="font-size: 12px; color: #888888; text-align: center; line-height: 1.4;">
            Enviado por ${outreachCfg.remitente_nombre || 'Gerard Fanals'} · Consultoría de IA y Automatización B2B<br>
            Si no deseas recibir más correos, puedes responder a este email o hacer <a href="${SITE_URL}/unsubscribe?email=${encodeURIComponent(lead.email)}" style="color: #007aff; text-decoration: none;">clic aquí para darte de baja</a>.<br>
            ${outreachCfg.direccion_fisica || 'Avda Fort de Leau 131, Mahón'}
          </p>
        </div>
      `;

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `${outreachCfg.remitente_nombre} <${outreachCfg.remitente_email}>`,
          to: [lead.email],
          reply_to: outreachCfg.reply_to || undefined,
          subject: subject,
          html: htmlEmail
        })
      });

      if (!emailRes.ok) {
        const errText = await emailRes.text();
        return res.status(500).json({ error: `Error Resend: ${errText}` });
      }

      await supabase.from('outreach_email_logs').insert({
        lead_id: lead.id,
        email_type: `step_${currentStep}`,
        subject: subject,
        body: bodyText
      });

      const nextStatusMap = ['sent_first', 'followup_1', 'followup_2', 'followup_3', 'followup_4', 'nurture_monthly'];
      const nextStatus = nextStatusMap[currentStep] || 'nurture_monthly';

      await supabase
        .from('outreach_leads')
        .update({
          status: nextStatus,
          sequence_step: currentStep + 1,
          last_contacted_at: now.toISOString()
        })
        .eq('id', lead.id);

      return res.status(200).json({ success: true, message: `Email enviado a ${lead.email}` });
    }

    // ==========================================
    // CASE B: Running Cron (Process all outreach & proposals)
    // ==========================================
    
    // 1. Process Cold Outreach Leads
    if (outreachCfg.auto_envio !== false) {
      // Load all outreach templates
      const { data: templates } = await supabase.from('outreach_sequences').select('*');
      
      const SEQUENCE_RULES = [
        { step: 0, statusBefore: 'enriched', daysWait: 0, chain: 1, orden: 1, nextStatus: 'sent_first' },
        { step: 1, statusBefore: 'sent_first', daysWait: outreachCfg.intervalo_c1_a || 2, chain: 1, orden: 2, nextStatus: 'followup_1' },
        { step: 2, statusBefore: 'followup_1', daysWait: outreachCfg.intervalo_c1_a || 2, chain: 2, orden: 1, nextStatus: 'followup_2' },
        { step: 3, statusBefore: 'followup_2', daysWait: outreachCfg.intervalo_c2_a || 3, chain: 2, orden: 2, nextStatus: 'followup_3' },
        { step: 4, statusBefore: 'followup_3', daysWait: outreachCfg.intervalo_c2_a || 3, chain: 3, orden: 1, nextStatus: 'followup_4' },
        { step: 5, statusBefore: 'followup_4', daysWait: outreachCfg.dia_c3_a || 30, chain: 3, orden: 2, nextStatus: 'nurture_monthly' }
      ];

      for (const rule of SEQUENCE_RULES) {
        const { data: leads, error: fetchErr } = await supabase
          .from('outreach_leads')
          .select('*')
          .eq('status', rule.statusBefore)
          .eq('sequence_step', rule.step);

        if (fetchErr) throw fetchErr;

        for (const lead of leads) {
          if (lead.last_contacted_at) {
            const lastContact = new Date(lead.last_contacted_at);
            const diffTime = Math.abs(now - lastContact);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            // Resolve custom intervals based on lead version
            let daysToWait = rule.daysWait;
            const versionLower = (lead.version || 'a').toLowerCase();
            if (rule.step === 1 || rule.step === 2) {
              daysToWait = outreachCfg[`intervalo_c1_${versionLower}`] || rule.daysWait;
            } else if (rule.step === 3 || rule.step === 4) {
              daysToWait = outreachCfg[`intervalo_c2_${versionLower}`] || rule.daysWait;
            } else if (rule.step === 5) {
              daysToWait = outreachCfg[`dia_c3_${versionLower}`] || rule.daysWait;
            }

            if (diffDays < daysToWait) {
              continue;
            }
          }

          const template = (templates || []).find(t => t.cadena_num === rule.chain && t.orden === rule.orden && t.version === (lead.version || 'A'));
          if (!template) continue;

          const subject = (template.asunto || '').replace(/{{first_name}}/g, lead.first_name || 'hola').replace(/{{company_name}}/g, lead.company_name || 'tu empresa');
          let bodyText = (template.contenido_html || template.contenido || '').replace(/{{first_name}}/g, lead.first_name || 'allí').replace(/{{company_name}}/g, lead.company_name || 'tu empresa').replace(/{{booking_url}}/g, BOOKING_URL);

          const htmlEmail = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px;">
              ${bodyText}
              <br><br>
              <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 24px 0;">
              <p style="font-size: 12px; color: #888888; text-align: center; line-height: 1.4;">
                Enviado por ${outreachCfg.remitente_nombre || 'Gerard Fanals'} · Consultoría de IA y Automatización B2B<br>
                Si no deseas recibir más correos, puedes responder a este email o hacer <a href="${SITE_URL}/unsubscribe?email=${encodeURIComponent(lead.email)}" style="color: #007aff; text-decoration: none;">clic aquí para darte de baja</a>.<br>
                ${outreachCfg.direccion_fisica || 'Avda Fort de Leau 131, Mahón'}
              </p>
            </div>
          `;

          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: `${outreachCfg.remitente_nombre} <${outreachCfg.remitente_email}>`,
              to: [lead.email],
              reply_to: outreachCfg.reply_to || undefined,
              subject: subject,
              html: htmlEmail
            })
          });

          if (!emailRes.ok) continue;

          await supabase.from('outreach_email_logs').insert({
            lead_id: lead.id,
            email_type: `step_${rule.step}`,
            subject: subject,
            body: bodyText
          });

          await supabase
            .from('outreach_leads')
            .update({
              status: rule.nextStatus,
              sequence_step: rule.step + 1,
              last_contacted_at: now.toISOString()
            })
            .eq('id', lead.id);

          sentCount++;
          sendLogs.push({ email: lead.email, type: 'outreach', step: rule.step });
        }
      }

      // 2. Process Monthly Nurtures
      const { data: nurtureLeads } = await supabase
        .from('outreach_leads')
        .select('*')
        .eq('status', 'nurture_monthly')
        .gte('sequence_step', 6);

      for (const lead of nurtureLeads || []) {
        if (lead.sequence_step > 17) {
          await supabase.from('outreach_leads').update({ status: 'lost' }).eq('id', lead.id);
          continue;
        }

        if (lead.last_contacted_at) {
          const lastContact = new Date(lead.last_contacted_at);
          const diffTime = Math.abs(now - lastContact);
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays < 30) continue;
        }

        const template = (templates || []).find(t => t.cadena_num === 3 && t.orden === 2 && t.version === (lead.version || 'A'));
        if (!template) continue;

        const tip = tips[(lead.sequence_step - 6) % tips.length];
        const subject = `consejo de productividad B2B para ${lead.company_name}`;
        
        let bodyText = (template.contenido_html || template.contenido || '')
          .replace(/{{first_name}}/g, lead.first_name || 'allí')
          .replace(/{{company_name}}/g, lead.company_name || 'tu empresa')
          .replace(/{{booking_url}}/g, BOOKING_URL)
          .replace(/{{tip}}/g, tip)
          .replace(/{{consejo}}/g, tip);

        const htmlEmail = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px;">
            ${bodyText}
            <br><br>
            <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 24px 0;">
            <p style="font-size: 12px; color: #888888; text-align: center; line-height: 1.4;">
              Enviado por ${outreachCfg.remitente_nombre || 'Gerard Fanals'} · Consultoría de IA y Automatización B2B<br>
              Si no deseas recibir más correos, puedes hacer <a href="${SITE_URL}/unsubscribe?email=${encodeURIComponent(lead.email)}" style="color: #007aff; text-decoration: none;">clic aquí para darte de baja</a>.<br>
              ${outreachCfg.direccion_fisica || 'Avda Fort de Leau 131, Mahón'}
            </p>
          </div>
        `;

        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: `${outreachCfg.remitente_nombre} <${outreachCfg.remitente_email}>`,
            to: [lead.email],
            reply_to: outreachCfg.reply_to || undefined,
            subject: subject,
            html: htmlEmail
          })
        });

        if (emailRes.ok) {
          await supabase.from('outreach_email_logs').insert({
            lead_id: lead.id,
            email_type: `nurture_${lead.sequence_step}`,
            subject: subject,
            body: bodyText
          });

          await supabase
            .from('outreach_leads')
            .update({
              sequence_step: lead.sequence_step + 1,
              last_contacted_at: now.toISOString()
            })
            .eq('id', lead.id);

          sentCount++;
          sendLogs.push({ email: lead.email, type: 'nurture', step: lead.sequence_step });
        }
      }
    }

    // 3. Process Proposal Followup Sequences (propuesta_seguimiento)
    if (proposalCfg.auto_envio !== false) {
      const { data: activeSegs } = await supabase
        .from('propuesta_seguimiento')
        .select('*')
        .eq('pausada', false)
        .not('secuencia_activa', 'is', null)
        .lte('proximo_envio_at', now.toISOString());

      for (const seg of activeSegs || []) {
        const activeSeq = seg.secuencia_activa; // 'inmediato', 'mensual', 'anual'
        const nextStep = (seg.paso_actual || 0) + 1;

        // Fetch template from DB
        const { data: template } = await supabase
          .from('proposal_sequences')
          .select('*')
          .eq('secuencia_id', activeSeq)
          .eq('categoria_key', seg.categoria || 'personalizada')
          .eq('step', nextStep)
          .maybeSingle();

        if (!template) {
          // No more steps in this sequence, transition to next sequence
          let newSeq = null;
          let newFreqDays = 30;
          
          if (activeSeq === 'inmediato') {
            newSeq = 'mensual';
            newFreqDays = 7;
          } else if (activeSeq === 'mensual') {
            newSeq = 'anual';
            newFreqDays = 30;
          } else if (activeSeq === 'anual') {
            // Restart anual from step 1
            newSeq = 'anual';
            newFreqDays = 30;
          }

          const patchBody = {
            secuencia_activa: newSeq,
            paso_actual: 0,
            proximo_envio_at: newSeq ? new Date(Date.now() + newFreqDays * 24 * 60 * 60 * 1000).toISOString() : null,
            columna: newSeq || 'stop',
            updated_at: now.toISOString()
          };

          await supabase.from('propuesta_seguimiento').update(patchBody).eq('id', seg.id);
          continue;
        }

        // Replace template variables
        const linkConfirmar = `${SITE_URL}/api/propuestas/confirmar?id=${seg.presupuesto_id}`;
        const linkPdf = `${SITE_URL}/api/download?id=${seg.presupuesto_id}`;

        const subject = (template.asunto || '').replace(/{{nombre}}/g, seg.lead_nombre || 'Prospecto');
        let bodyText = (template.contenido_html || template.contenido || '')
          .replace(/{{nombre}}/g, seg.lead_nombre || 'Prospecto')
          .replace(/{{link_confirmar}}/g, linkConfirmar)
          .replace(/{{link_pdf}}/g, linkPdf);

        const htmlEmail = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px;">
            ${bodyText}
            <br><br>
            <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 24px 0;">
            <p style="font-size: 12px; color: #888888; text-align: center; line-height: 1.4;">
              Enviado por ${proposalCfg.remitente_nombre || 'Gerard Fanals'} · CerebroComercial AI<br>
              Si no deseas recibir más correos de seguimiento, puedes hacer <a href="${SITE_URL}/unsubscribe?email=${encodeURIComponent(seg.lead_email)}" style="color: #007aff; text-decoration: none;">clic aquí para darte de baja</a>.<br>
              ${proposalCfg.direccion_fisica || 'Avda Fort de Leau 131, Mahón'}
            </p>
          </div>
        `;

        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: `${proposalCfg.remitente_nombre} <${proposalCfg.remitente_email}>`,
            to: [seg.lead_email],
            reply_to: proposalCfg.reply_to || undefined,
            subject: subject,
            html: htmlEmail
          })
        });

        if (emailRes.ok) {
          // Log sent proposal email
          await supabase.from('outreach_email_logs').insert({
            lead_id: seg.lead_id,
            email_type: `proposal_${activeSeq}_${nextStep}`,
            subject: subject,
            body: bodyText
          });

          // Schedule next email
          let freqDays = seg.frecuencia_dias || 3;
          if (activeSeq === 'inmediato') freqDays = 3;
          else if (activeSeq === 'mensual') freqDays = 7;
          else if (activeSeq === 'anual') freqDays = 30;

          await supabase.from('propuesta_seguimiento')
            .update({
              paso_actual: nextStep,
              ultimo_email_id: template.id,
              ultimo_email_nombre: template.nombre,
              ultimo_envio_at: now.toISOString(),
              proximo_envio_at: new Date(Date.now() + freqDays * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: now.toISOString()
            })
            .eq('id', seg.id);

          sentCount++;
          sendLogs.push({ email: seg.lead_email, type: 'proposal', step: nextStep });
        }
      }
    }

    return res.status(200).json({
      success: true,
      sentEmailsCount: sentCount,
      logs: sendLogs
    });

  } catch (error) {
    console.error('Sequence sending error:', error);
    return res.status(500).json({ error: error.message || 'Error interno' });
  }
};
