// /api/reset-password.js
// Vercel serverless function: Password reset flow with token generation and email via Resend

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lmozoetpehmdxxremtqn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtb3pvZXRwZWhtZHh4cmVtdHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTA2NDUsImV4cCI6MjA5NTgyNjY0NX0.1xkCCw7q9CDvVbqGswCeFwXpgYfMtb0wcl7lHWlKQ8U';
const RESEND_KEY = process.env.RESEND_API_KEY || 're_UVTNRfhh_EVoej22sdW9aCdhpKEFCKqkj';

function buildResetEmailHtml(resetLink, username) {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 60px 20px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color: #1c1c1e; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.6);">
          <!-- Header gradient -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7);"></td>
          </tr>
          <!-- Logo area -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px;">
              <div style="font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                Cerebro<span style="color: #a855f7;">Comercial</span> AI
              </div>
              <div style="font-size: 12px; color: #86868b; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 6px;">
                by iadebarrio.com
              </div>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 1px; background-color: #2c2c2e;"></div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px 40px 16px 40px;">
              <p style="color: #f5f5f7; font-size: 20px; font-weight: 600; margin: 0 0 8px 0;">
                Restablece tu contraseña
              </p>
              <p style="color: #a1a1a6; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                Hola${username ? ' <strong style="color:#e5e5ea;">' + username + '</strong>' : ''},<br>
                Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón de abajo para crear una nueva contraseña.
              </p>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 0 40px 24px 40px;">
              <a href="${resetLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 40px; border-radius: 12px; letter-spacing: 0.3px;">
                Restablecer Contraseña
              </a>
            </td>
          </tr>
          <!-- Expiry notice -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <p style="color: #86868b; font-size: 13px; line-height: 1.5; margin: 0; text-align: center;">
                Este enlace expira en <strong style="color:#a1a1a6;">1 hora</strong>.<br>
                Si no solicitaste este cambio, puedes ignorar este email.
              </p>
            </td>
          </tr>
          <!-- Footer divider -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 1px; background-color: #2c2c2e;"></div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 24px 40px 32px 40px;">
              <p style="color: #48484a; font-size: 12px; line-height: 1.5; margin: 0;">
                CerebroComercial AI by iadebarrio.com<br>
                Este es un email automático, no respondas a este mensaje.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
  const { action } = req.body || {};

  try {
    // ── ACTION: send-reset ──────────────────────────────────────────────
    if (action === 'send-reset') {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Falta el email' });
      }

      // Find user by email
      const { data: user, error: userError } = await supabase
        .from('dashboard_users')
        .select('id, username, email')
        .eq('email', email.toLowerCase().trim())
        .eq('is_active', true)
        .maybeSingle();

      if (userError) {
        console.error('Error finding user:', userError);
        return res.status(500).json({ error: userError.message });
      }

      // Always return success to prevent email enumeration
      if (!user) {
        return res.status(200).json({ success: true, message: 'Si el email existe, recibirás un enlace de restablecimiento' });
      }

      // Generate token
      const token = crypto.randomUUID();
      const expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

      // Delete any existing tokens for this user
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('user_id', user.id);

      // Store token
      const { error: tokenError } = await supabase
        .from('password_reset_tokens')
        .insert({
          user_id: user.id,
          token,
          expires_at
        });

      if (tokenError) {
        console.error('Error storing reset token:', tokenError);
        return res.status(500).json({ error: tokenError.message });
      }

      // Build reset link — use Referer/Origin or fallback to production URL
      const origin = req.headers.origin || req.headers.referer?.replace(/\/[^/]*$/, '') || 'https://cerebro-comercial-ai.vercel.app';
      const resetLink = `${origin}/reset-password.html?token=${token}`;

      // Send email via Resend
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Cerebro Comercial <no-reply@iadebarrio.com>',
          to: [user.email],
          subject: 'Restablece tu contraseña — CerebroComercial AI',
          html: buildResetEmailHtml(resetLink, user.username)
        })
      });

      if (!emailRes.ok) {
        const errText = await emailRes.text();
        console.error('Error sending reset email via Resend:', errText);
        return res.status(500).json({ error: `Error al enviar email: ${errText}` });
      }

      return res.status(200).json({ success: true, message: 'Si el email existe, recibirás un enlace de restablecimiento' });
    }

    // ── ACTION: reset ───────────────────────────────────────────────────
    if (action === 'reset') {
      const { token, new_password } = req.body;

      if (!token || !new_password) {
        return res.status(400).json({ error: 'Faltan campos obligatorios: token, new_password' });
      }

      if (new_password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }

      // Find and validate token
      const { data: tokenData, error: tokenError } = await supabase
        .from('password_reset_tokens')
        .select('id, user_id, expires_at')
        .eq('token', token)
        .maybeSingle();

      if (tokenError) {
        console.error('Error validating token:', tokenError);
        return res.status(500).json({ error: tokenError.message });
      }

      if (!tokenData) {
        return res.status(400).json({ error: 'Token inválido o ya utilizado' });
      }

      // Check expiration
      if (new Date(tokenData.expires_at) < new Date()) {
        // Clean up expired token
        await supabase.from('password_reset_tokens').delete().eq('id', tokenData.id);
        return res.status(400).json({ error: 'El token ha expirado. Solicita un nuevo enlace.' });
      }

      // Update password
      const password_hash = crypto.createHash('sha256').update(new_password).digest('hex');

      const { error: updateError } = await supabase
        .from('dashboard_users')
        .update({ password_hash })
        .eq('id', tokenData.user_id);

      if (updateError) {
        console.error('Error updating password:', updateError);
        return res.status(500).json({ error: updateError.message });
      }

      // Delete used token
      await supabase.from('password_reset_tokens').delete().eq('id', tokenData.id);

      return res.status(200).json({ success: true, message: 'Contraseña actualizada correctamente' });
    }

    return res.status(400).json({ error: 'Acción no válida. Usa "send-reset" o "reset"' });
  } catch (error) {
    console.error('Error in reset-password handler:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
};
