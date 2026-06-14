// api/push.js — Web Push Notifications via web-push library
const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lmozoetpehmdxxremtqn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtb3pvZXRwZWhtZHh4cmVtdHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTA2NDUsImV4cCI6MjA5NTgyNjY0NX0.1xkCCw7q9CDvVbqGswCeFwXpgYfMtb0wcl7lHWlKQ8U';

const VAPID_PUBLIC_KEY = 'BAfWR9i2l5IKCTMpV5cjjjTt4dkSQuvGMUAO5aSVIVMEvXWElSTIrf3S92HhmqveaiWhcdXXw5WUaaYL7AxI1Fg';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'B6ADY2VbTZUAv1PYWduu400gyX7N3GNcJH0pK1mfOJU';

webpush.setVapidDetails(
  'mailto:info@iadebarrio.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

module.exports = async (req, res) => {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { action } = req.query;

  try {
    // GET ?action=vapid-key
    if (req.method === 'GET' && action === 'vapid-key') {
      return res.status(200).json({ publicKey: VAPID_PUBLIC_KEY });
    }

    // POST
    if (req.method === 'POST') {
      const body = req.body || {};

      // Subscribe
      if (body.action === 'subscribe') {
        const { room_id, subscription } = body;
        if (!room_id || !subscription) {
          return res.status(400).json({ error: 'room_id and subscription required' });
        }

        const { error: upsertErr } = await supabase
          .from('push_subscriptions')
          .upsert({
            room_id,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          }, { onConflict: 'room_id,endpoint' });

        if (upsertErr) {
          return res.status(500).json({ error: upsertErr.message });
        }
        return res.status(200).json({ success: true });
      }

      // Send push
      if (body.action === 'send') {
        const { room_id, title, message, icon } = body;
        if (!room_id || !message) {
          return res.status(400).json({ error: 'room_id and message required' });
        }

        const { data: subs, error: fetchErr } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('room_id', room_id);

        if (fetchErr || !subs?.length) {
          return res.status(200).json({ success: true, sent: 0, reason: 'no subscriptions' });
        }

        const payload = JSON.stringify({
          title: title || 'Nuevo mensaje',
          body: message,
          icon: icon || 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
          badge: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
          data: { room_id },
        });

        let sent = 0;
        let failed = 0;
        const goneEndpoints = [];

        for (const sub of subs) {
          const pushSub = {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          };

          try {
            await webpush.sendNotification(pushSub, payload);
            sent++;
          } catch (err) {
            console.error('Push error:', err.statusCode, err.body);
            if (err.statusCode === 410 || err.statusCode === 404) {
              goneEndpoints.push(sub.id);
            }
            failed++;
          }
        }

        // Clean up expired subscriptions
        if (goneEndpoints.length > 0) {
          await supabase.from('push_subscriptions').delete().in('id', goneEndpoints);
        }

        return res.status(200).json({ success: true, sent, failed, cleaned: goneEndpoints.length });
      }

      return res.status(400).json({ error: 'Unknown action' });
    }

    // DELETE
    if (req.method === 'DELETE') {
      const { room_id, endpoint } = req.query;
      if (!room_id) return res.status(400).json({ error: 'room_id required' });
      const q = supabase.from('push_subscriptions').delete().eq('room_id', room_id);
      if (endpoint) q.eq('endpoint', endpoint);
      await q;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[push] Error:', err);
    return res.status(500).json({ error: err.message });
  }
};
