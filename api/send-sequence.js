// /api/send-sequence.js
// Vercel serverless function: Processes the cold outbound outreach and monthly nurture email sequences

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uidilhuybmtuokunutgz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpZGlsaHV5Ym10dW9rdW51dGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDU0NTAsImV4cCI6MjA5MTQyMTQ1MH0.ir9FnuHhW_1i4OslE_SNbOCIgLUEWakScP71WYqnfJM';
const RESEND_KEY = process.env.RESEND_API_KEY || 're_UVTNRfhh_EVoej22sdW9aCdhpKEFCKqkj';
const OUTBOUND_FROM = process.env.OUTBOUND_FROM || 'gerard@gerardfanals.online';
const OUTBOUND_FROM_NAME = process.env.OUTBOUND_FROM_NAME || 'Gerard Fanals';
const BOOKING_URL = 'https://calendar.app.google/QMiJY3UbKChYgEcu6';

const SEQUENCE_STEPS = [
  {
    step: 0,
    statusBefore: 'enriched',
    statusAfter: 'sent_first',
    daysWait: 0,
    subject: (lead) => `${lead.first_name || 'hola'}, una idea para ${lead.company_name}`,
    body: (lead) => `Hola ${lead.first_name || 'allí'},\n\n${lead.custom_icebreaker || 'Estuve revisando vuestra web corporativa y me pareció muy interesante lo que hacéis.'}\n\nSoy Gerard. Ayudamos a negocios y agencias a captar más clientes, multiplicar su productividad y automatizar todos esos trabajos manuales y repetitivos combinando Inteligencia Artificial con desarrollo a medida.\n\nTe escribo de forma directa porque veo una oportunidad súper clara en tu web para automatizar algunos de tus procesos y me gustaría proponerte algo muy sencillo:\n\n¿Te vendría bien charlar 10 o 15 minutos esta semana por Meet para ver si os podemos ayudar a liberar tiempo del equipo y captar más clientes con automatizaciones? Sin rodeos, directo al grano y solo para aportarte valor real.\n\nSi te cuadra, puedes elegir el día y hora que mejor te vengan directamente en mi calendario:\n${BOOKING_URL}\n\nUn abrazo,\nGerard`
  },
  {
    step: 1,
    statusBefore: 'sent_first',
    statusAfter: 'followup_1',
    daysWait: 2,
    subject: (lead) => `re: idea para ${lead.company_name}`,
    body: (lead) => `Hola ${lead.first_name || 'allí'},\n\nTe escribo de forma muy breve por si se te pasó mi correo anterior entre el lío de la semana.\n\n¿Has calculado alguna vez cuánto tiempo pierde tu equipo en tareas repetitivas de administración o captación de leads que una IA programada a medida podría resolver en segundos por una fracción de su coste?\n\nSi te da curiosidad saber cómo lo hacemos, podemos charlar 10 minutos por aquí sin compromiso: ${BOOKING_URL}\n\nUn abrazo,\nGerard`
  },
  {
    step: 2,
    statusBefore: 'followup_1',
    statusAfter: 'followup_2',
    daysWait: 5,
    subject: (lead) => `automatizar tareas repetitivas en ${lead.company_name}`,
    body: (lead) => `Hola ${lead.first_name || 'allí'},\n\nSolo quería compartir contigo un dato rápido. Hace poco ayudamos a una empresa similar a la vuestra a automatizar por completo su flujo de entrada de leads y la generación automática de presupuestos con IA. Consiguieron ahorrar más de 15 horas de trabajo manual a la semana.\n\nMi objetivo es ver si en ${lead.company_name} podemos lograr un impacto similar para que vuestro equipo se centre en lo que de verdad aporta valor.\n\nSi quieres que analicemos tu caso rápido, puedes elegir un hueco cuando te venga bien: ${BOOKING_URL}\n\nUn abrazo,\nGerard`
  },
  {
    step: 3,
    statusBefore: 'followup_2',
    statusAfter: 'followup_3',
    daysWait: 7,
    subject: (lead) => `¿demasiado lío, ${lead.first_name || 'allí'}?`,
    body: (lead) => `Hola ${lead.first_name || 'allí'},\n\nImagino que estarás hasta arriba de trabajo con la gestión diaria de ${lead.company_name} (¡lo cual es excelente!).\n\nNo quiero ser pesado, así que solo te escribo para saber si os encajaría explorar cómo liberar parte de esa carga administrativa y automatizar procesos este trimestre.\n\nSi te cuadra, dime y lo organizamos en un momento. Si es un mal momento, no te preocupes, no volveré a insistir en este tema.\n\n¡Que tengas una gran semana!\n\nUn abrazo,\nGerard`
  },
  {
    step: 4,
    statusBefore: 'followup_3',
    statusAfter: 'followup_4',
    daysWait: 7,
    subject: (lead) => `último intento por mi parte`,
    body: (lead) => `Hola ${lead.first_name || 'allí'},\n\nAsumo que ahora mismo no es una prioridad para ${lead.company_name} automatizar tareas o implementar IA para captar más clientes. Lo entiendo perfectamente.\n\nA partir de ahora te dejaré tranquilo, pero si en el futuro decides que es el momento de hacer que tu negocio sea 10 veces más productivo y eficiente, ya sabes dónde encontrarme.\n\nEstaré al otro lado de este correo o en mi calendario si te surge cualquier duda: ${BOOKING_URL}\n\n¡Te deseo el mayor de los éxitos con ${lead.company_name}!\n\nUn abrazo,\nGerard`
  },
  {
    step: 5,
    statusBefore: 'followup_4',
    statusAfter: 'nurture_monthly',
    daysWait: 30,
    subject: (lead) => `un consejo rápido de IA para ${lead.company_name}`,
    body: (lead) => `Hola ${lead.first_name || 'allí'},\n\nEspero que todo vaya genial en ${lead.company_name}.\n\nComo te prometí, no te escribo para venderte nada, sino para compartir un consejo práctico de automatización que puedes implementar en tu negocio hoy mismo:\n\n💡 CONSEJO DEL MES: Automatiza tus reportes y la clasificación de correos repetitivos usando una simple API de Gemini conectada a tu bandeja. Te ahorrará un par de horas semanales de clasificación manual.\n\nSi en algún momento quieres que lo montemos a medida por ti o quieres explorar otras ideas, avísame.\n\nUn abrazo,\nGerard`
  }
];

function getMonthlyNurtureTemplate(step, lead) {
  const tips = [
    "Usa ChatGPT/Gemini para redactar propuestas y resúmenes comerciales automáticos a partir de tus notas de reuniones.",
    "Centraliza tus leads en una base de datos segura y crea alertas automáticas en tu móvil cuando entre un lead de gran valor.",
    "Implementa un agente IA de soporte básico en tu web para resolver el 80% de las dudas recurrentes de tus clientes sin coste de personal.",
    "Automatiza la facturación y el envío de recibos conectando tu software de cobros con tu contabilidad de forma directa.",
    "Crea un dashboard automatizado para ver en tiempo real la rentabilidad de cada proyecto sin tener que hacer cálculos mensuales en Excel.",
    "Usa herramientas de scraping e IA para monitorizar las novedades de tus competidores más directos de forma 100% automatizada."
  ];

  const tipIndex = (step - 5) % tips.length;
  const tip = tips[tipIndex];

  return `Hola ${lead.first_name || 'allí'},\n\nEspero que el mes esté yendo de maravilla en ${lead.company_name}.\n\nAquí tienes tu píldora de productividad mensual sobre Inteligencia Artificial y Automatización:\n\n💡 TIP DE AUTOMATIZACIÓN: ${tip}\n\nSi crees que esto podría beneficiar a tu negocio y quieres ver cómo estructurarlo a medida, podemos agendar un café rápido por Meet aquí: ${BOOKING_URL}\n\nUn abrazo,\nGerard`;
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const now = new Date();
    let sentCount = 0;
    const sendLogs = [];

    // 1. Procesar secuencias iniciales
    for (const rule of SEQUENCE_STEPS) {
      let query = supabase
        .from('outreach_leads')
        .select('*')
        .eq('status', rule.statusBefore)
        .eq('sequence_step', rule.step);

      const { data: leads, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;

      for (const lead of leads) {
        if (lead.last_contacted_at) {
          const lastContact = new Date(lead.last_contacted_at);
          const diffTime = Math.abs(now - lastContact);
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays < rule.daysWait) {
            continue;
          }
        }

        const subject = rule.subject(lead);
        const body = rule.body(lead).replace(/\n/g, '<br>');

        const htmlEmail = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px;">
            ${body}
            <br><br>
            <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 24px 0;">
            <p style="font-size: 12px; color: #888888; text-align: center; line-height: 1.4;">
              Enviado por Gerard Fanals · Consultoría de IA y Automatización<br>
              Si no deseas recibir más correos de mi parte, puedes responder a este email pidiéndomelo o hacer <a href="${process.env.SITE_URL || 'https://gerardfanals.online'}/unsubscribe?email=${encodeURIComponent(lead.email)}" style="color: #007aff; text-decoration: none;">clic aquí para darte de baja</a>.
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
            from: `${OUTBOUND_FROM_NAME} <${OUTBOUND_FROM}>`,
            to: [lead.email],
            subject: subject,
            html: htmlEmail
          })
        });

        if (!emailRes.ok) {
          const errText = await emailRes.text();
          console.error(`Error enviando email a ${lead.email}:`, errText);
          continue;
        }

        await supabase.from('outreach_email_logs').insert({
          lead_id: lead.id,
          email_type: `step_${rule.step}`,
          subject: subject,
          body: body
        });

        await supabase
          .from('outreach_leads')
          .update({
            status: rule.statusAfter,
            sequence_step: rule.step + 1,
            last_contacted_at: now.toISOString()
          })
          .eq('id', lead.id);

        sentCount++;
        sendLogs.push({ email: lead.email, step: rule.step });
      }
    }

    // 2. Procesar Nutrición Mensual
    const { data: nurtureLeads, error: nurtureErr } = await supabase
      .from('outreach_leads')
      .select('*')
      .eq('status', 'nurture_monthly')
      .gte('sequence_step', 6);

    if (nurtureErr) throw nurtureErr;

    for (const lead of nurtureLeads) {
      if (lead.sequence_step > 17) {
        await supabase.from('outreach_leads').update({ status: 'lost' }).eq('id', lead.id);
        continue;
      }

      if (lead.last_contacted_at) {
        const lastContact = new Date(lead.last_contacted_at);
        const diffTime = Math.abs(now - lastContact);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 30) {
          continue;
        }
      }

      const subject = `consejo de productividad B2B para ${lead.company_name}`;
      const bodyText = getMonthlyNurtureTemplate(lead.sequence_step, lead);
      const htmlBody = bodyText.replace(/\n/g, '<br>');

      const htmlEmail = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${htmlBody}
          <br><br>
          <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 24px 0;">
          <p style="font-size: 12px; color: #888888; text-align: center;">
            Enviado por Gerard Fanals · Consultoría de IA y Automatización<br>
            <a href="${process.env.SITE_URL || 'https://gerardfanals.online'}/unsubscribe?email=${encodeURIComponent(lead.email)}" style="color: #007aff; text-decoration: none;">Darse de baja de estos consejos</a>.
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
          from: `${OUTBOUND_FROM_NAME} <${OUTBOUND_FROM}>`,
          to: [lead.email],
          subject: subject,
          html: htmlEmail
        })
      });

      if (emailRes.ok) {
        await supabase.from('outreach_email_logs').insert({
          lead_id: lead.id,
          email_type: `nurture_${lead.sequence_step}`,
          subject: subject,
          body: htmlBody
        });

        await supabase
          .from('outreach_leads')
          .update({
            sequence_step: lead.sequence_step + 1,
            last_contacted_at: now.toISOString()
          })
          .eq('id', lead.id);

        sentCount++;
        sendLogs.push({ email: lead.email, step: lead.sequence_step });
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
