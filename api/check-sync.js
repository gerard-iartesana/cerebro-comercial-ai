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

  // 5. Google Calendar — check if calendar ID is set
  try {
    const calId = process.env.GOOGLE_CALENDAR_ID;
    const saKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!calId || !saKey) {
      results.google_calendar = { ok: false, error: 'Pendiente configurar', pending: true };
    } else {
      results.google_calendar = { ok: true, calendar_id: calId };
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
