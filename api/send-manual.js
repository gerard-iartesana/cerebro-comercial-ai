// /api/send-manual.js
// Vercel serverless function: Sends manual commercial emails and log entries in outreach_email_logs

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lmozoetpehmdxxremtqn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtb3pvZXRwZWhtZHh4cmVtdHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTA2NDUsImV4cCI6MjA5NTgyNjY0NX0.1xkCCw7q9CDvVbqGswCeFwXpgYfMtb0wcl7lHWlKQ8U';
const RESEND_KEY = process.env.RESEND_API_KEY || 're_UVTNRfhh_EVoej22sdW9aCdhpKEFCKqkj';

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

  const { email, subject, body, isTest, attachments } = req.body || {};

  if (!email || !subject || !body) {
    return res.status(400).json({ error: 'Falta email, asunto o cuerpo' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // 1. Fetch outreach configuration for sender details
    const { data: config } = await supabase.from('outreach_config').select('*').limit(1).maybeSingle();
    const remitenteNombre = config?.remitente_nombre || 'Gerard Fanals';
    const remitenteEmail = config?.remitente_email || 'gerard@gerardfanals.online';
    const replyTo = config?.reply_to || 'gerard@iartesana.es';

    const htmlBody = body.replace(/\n/g, '<br>');
    const htmlEmail = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px;">
        ${htmlBody}
        <br><br>
        <div style="border-top: 1px solid #e0e0e0; padding-top: 16px; margin-top: 16px; font-size: 14px; color: #555555; line-height: 1.5;">
          <strong style="color: #1d1d1f; font-size: 15px;">Gerard Fanals</strong><br>
          629 49 41 67<br>
          CEO &amp; Senior IA Architect and Automation<br>
          IA de Barrio | <a href="https://iadebarrio.com" style="color: #0071e3; text-decoration: none;">iadebarrio.com</a> / <a href="https://gerardfanals.online" style="color: #0071e3; text-decoration: none;">gerardfanals.online</a><br>
          <a href="mailto:gerard@iartesana.es" style="color: #0071e3; text-decoration: none;">gerard@iartesana.es</a>
        </div>
      </div>
    `;

    // 2. Build Resend payload
    const resendPayload = {
      from: `${remitenteNombre} <${remitenteEmail}>`,
      to: [email],
      reply_to: replyTo,
      subject: subject,
      html: htmlEmail
    };

    // Add attachments if provided
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      resendPayload.attachments = attachments.map(att => ({
        filename: att.filename,
        content: att.content  // base64 string
      }));
    }

    // 3. Send email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(resendPayload)
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error('Error sending email through Resend:', errText);
      return res.status(500).json({ error: `Resend error: ${errText}` });
    }

    // 3. Log if NOT a test send
    if (!isTest) {
      const { data: lead } = await supabase.from('outreach_leads').select('id').eq('email', email).maybeSingle();
      if (lead) {
        await supabase.from('outreach_email_logs').insert({
          lead_id: lead.id,
          email_type: 'manual',
          subject: subject,
          body: htmlBody
        });
      }
    }

    return res.status(200).json({ success: true, message: 'Email enviado correctamente' });
  } catch (error) {
    console.error('Error in send-manual handler:', error);
    return res.status(500).json({ error: error.message || 'Error interno al enviar' });
  }
};
