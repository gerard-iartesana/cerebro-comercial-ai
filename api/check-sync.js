// /api/check-sync.js
// Vercel serverless function: Ping each external service to verify connectivity

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const results = {};

  // 1. Resend
  try {
    const RESEND_KEY = process.env.RESEND_API_KEY || 're_UVTNRfhh_EVoej22sdW9aCdhpKEFCKqkj';
    const r = await fetch('https://api.resend.com/domains', {
      headers: { 'Authorization': `Bearer ${RESEND_KEY}` }
    });
    results.resend = { ok: r.status === 200, status: r.status, latency: 0 };
  } catch (e) {
    results.resend = { ok: false, error: e.message };
  }

  // 2. Hunter.io
  try {
    const HUNTER_KEY = process.env.HUNTER_API_KEY;
    if (!HUNTER_KEY) {
      results.hunter = { ok: false, error: 'API key no configurada' };
    } else {
      const r = await fetch(`https://api.hunter.io/v2/account?api_key=${HUNTER_KEY}`);
      const data = await r.json();
      results.hunter = { 
        ok: r.status === 200, 
        status: r.status,
        requests_remaining: data?.data?.requests?.searches?.available || 0
      };
    }
  } catch (e) {
    results.hunter = { ok: false, error: e.message };
  }

  // 3. Gemini (Google AI Studio)
  try {
    const GEMINI_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDy3zdb67ICMuhrU0qmaAMnztDPFT09Z24';
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_KEY}`);
    results.gemini = { ok: r.status === 200, status: r.status };
  } catch (e) {
    results.gemini = { ok: false, error: e.message };
  }

  // 4. Supabase
  try {
    const SUPA_URL = process.env.SUPABASE_URL || 'https://lmozoetpehmdxxremtqn.supabase.co';
    const r = await fetch(`${SUPA_URL}/rest/v1/`, {
      headers: { 'apikey': process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY || '' }
    });
    results.supabase = { ok: r.status < 400, status: r.status };
  } catch (e) {
    results.supabase = { ok: false, error: e.message };
  }

  // 5. Google Calendar — real ping with Service Account
  try {
    const calId = process.env.GOOGLE_CALENDAR_ID;
    const saKeyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!calId || !saKeyRaw) {
      results.google_calendar = { ok: false, error: 'Pendiente configurar', pending: true };
    } else {
      // Parse service account key and generate JWT
      const crypto = require('crypto');
      const sa = JSON.parse(saKeyRaw);

      // Create JWT for Google OAuth2
      const now = Math.floor(Date.now() / 1000);
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/calendar.readonly',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600
      })).toString('base64url');

      const signable = header + '.' + payload;
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(signable);
      const signature = sign.sign(sa.private_key, 'base64url');
      const jwt = signable + '.' + signature;

      // Exchange JWT for access token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
      });
      const tokenData = await tokenRes.json();

      if (!tokenData.access_token) {
        results.google_calendar = { ok: false, error: 'Error de autenticación: ' + (tokenData.error_description || tokenData.error || 'desconocido') };
      } else {
        // Ping the calendar
        const calRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}`, {
          headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });
        if (calRes.status === 200) {
          const calData = await calRes.json();
          results.google_calendar = { ok: true, calendar_id: calId, summary: calData.summary || calId };
        } else {
          results.google_calendar = { ok: false, error: 'Calendario no accesible (HTTP ' + calRes.status + ')' };
        }
      }
    }
  } catch (e) {
    results.google_calendar = { ok: false, error: e.message };
  }

  // 6. Stripe — check if API key exists
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      results.stripe = { ok: false, error: 'API key no configurada', pending: true };
    } else {
      const r = await fetch('https://api.stripe.com/v1/balance', {
        headers: { 'Authorization': `Bearer ${stripeKey}` }
      });
      results.stripe = { ok: r.status === 200, status: r.status };
    }
  } catch (e) {
    results.stripe = { ok: false, error: e.message };
  }

  return res.status(200).json({ success: true, services: results, checked_at: new Date().toISOString() });
};
