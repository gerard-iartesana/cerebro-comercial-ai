// api/push.js — Vercel Serverless Function for Web Push Notifications
// Handles: subscribe, unsubscribe, send push, setup DB table

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lmozoetpehmdxxremtqn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtb3pvZXRwZWhtZHh4cmVtdHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTA2NDUsImV4cCI6MjA5NTgyNjY0NX0.1xkCCw7q9CDvVbqGswCeFwXpgYfMtb0wcl7lHWlKQ8U';

// VAPID Keys for Web Push
const VAPID_PUBLIC_KEY = 'BAfWR9i2l5IKCTMpV5cjjjTt4dkSQuvGMUAO5aSVIVMEvXWElSTIrf3S92HhmqveaiWhcdXXw5WUaaYL7AxI1Fg';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'B6ADY2VbTZUAv1PYWduu400gyX7N3GNcJH0pK1mfOJU';
const VAPID_SUBJECT = 'mailto:info@iadebarrio.com';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ─── Web Push Crypto (RFC 8291 / RFC 8188) ───────────────────────────────────
const crypto = require('crypto');
const https = require('https');
const http = require('http');
const url = require('url');

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64');
}

function base64UrlEncode(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Generate VAPID JWT
function generateVapidJwt(audience, subject, publicKey, privateKey, expSeconds = 86400) {
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + expSeconds, sub: subject };

  const headerB64 = base64UrlEncode(Buffer.from(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(Buffer.from(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const privKeyBuf = base64UrlDecode(privateKey);
  const privKeyDer = Buffer.concat([
    Buffer.from('30770201010420', 'hex'),
    privKeyBuf,
    Buffer.from('a00a06082a8648ce3d030107a14403420004', 'hex'),
    base64UrlDecode(publicKey),
  ]);

  const keyObj = crypto.createPrivateKey({
    key: privKeyDer,
    format: 'der',
    type: 'sec1',
  });

  const sign = crypto.createSign('SHA256');
  sign.update(unsignedToken);
  const derSig = sign.sign({ key: keyObj, dsaEncoding: 'ieee-p1363' });
  
  return `${unsignedToken}.${base64UrlEncode(derSig)}`;
}

// Encrypt payload using Web Push (RFC 8291 + aes128gcm)
function encryptPayload(p256dhKey, authSecret, payload) {
  const userPublicKey = base64UrlDecode(p256dhKey);
  const userAuth = base64UrlDecode(authSecret);
  const payloadBuf = Buffer.from(JSON.stringify(payload), 'utf8');

  // Generate ephemeral ECDH key pair
  const localKeys = crypto.createECDH('prime256v1');
  localKeys.generateKeys();
  const localPublicKey = localKeys.getPublicKey();

  // ECDH shared secret
  const sharedSecret = localKeys.computeSecret(userPublicKey);

  // HKDF for auth info
  const authInfo = Buffer.concat([
    Buffer.from('WebPush: info\0'),
    userPublicKey,
    localPublicKey,
  ]);
  const prk = crypto.createHmac('sha256', userAuth).update(sharedSecret).digest();
  const ikm = hkdfExpand(prk, authInfo, 32);

  // Salt
  const salt = crypto.randomBytes(16);

  // HKDF for content encryption key and nonce
  const prkCombined = crypto.createHmac('sha256', salt).update(ikm).digest();
  const cekInfo = Buffer.from('Content-Encoding: aes128gcm\0');
  const nonceInfo = Buffer.from('Content-Encoding: nonce\0');
  const cek = hkdfExpand(prkCombined, cekInfo, 16);
  const nonce = hkdfExpand(prkCombined, nonceInfo, 12);

  // Pad payload (add 2-byte padding length header + delimiter)
  const padding = Buffer.alloc(2, 0); // 0-length padding
  const paddedPayload = Buffer.concat([payloadBuf, Buffer.from([2]), padding.slice(0, 0)]);
  // Actually: record = payload + \x02 (delimiter)
  const record = Buffer.concat([payloadBuf, Buffer.from([2])]);

  // Encrypt
  const cipher = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const encrypted = Buffer.concat([cipher.update(record), cipher.final(), cipher.getAuthTag()]);

  // aes128gcm header: salt(16) + rs(4) + idlen(1) + keyid(65)
  const rs = Buffer.alloc(4);
  rs.writeUInt32BE(4096);
  const header = Buffer.concat([
    salt,
    rs,
    Buffer.from([localPublicKey.length]),
    localPublicKey,
  ]);

  return Buffer.concat([header, encrypted]);
}

function hkdfExpand(prk, info, length) {
  const infoHmac = crypto.createHmac('sha256', prk)
    .update(Buffer.concat([info, Buffer.from([1])]))
    .digest();
  return infoHmac.slice(0, length);
}

// Send push notification
async function sendPushNotification(subscription, payload) {
  const parsedUrl = url.parse(subscription.endpoint);
  const audience = `${parsedUrl.protocol}//${parsedUrl.host}`;
  
  const jwt = generateVapidJwt(audience, VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  const encryptedBody = encryptPayload(subscription.p256dh, subscription.auth, payload);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.path,
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'Content-Length': encryptedBody.length,
        'TTL': '86400',
        'Urgency': 'high',
      },
    };

    const transport = parsedUrl.protocol === 'https:' ? https : http;
    const req = transport.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, statusCode: res.statusCode });
        } else if (res.statusCode === 410 || res.statusCode === 404) {
          resolve({ success: false, gone: true, statusCode: res.statusCode });
        } else {
          resolve({ success: false, statusCode: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.write(encryptedBody);
    req.end();
  });
}

// ─── Handler ─────────────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { action } = req.query;

  try {
    // GET ?action=vapid-key → return public VAPID key
    if (req.method === 'GET' && action === 'vapid-key') {
      return res.status(200).json({ publicKey: VAPID_PUBLIC_KEY });
    }

    // GET ?action=setup → return SQL to create table
    if (req.method === 'GET' && action === 'setup') {
      return res.status(200).json({
        sql: `
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(room_id, endpoint)
);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to push_subscriptions" ON push_subscriptions FOR ALL USING (true) WITH CHECK (true);
        `.trim()
      });
    }

    // POST → subscribe or send
    if (req.method === 'POST') {
      const body = req.body || {};

      // Subscribe: save push subscription
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

      // Send: push notification to all subscribers of a room
      if (body.action === 'send') {
        const { room_id, title, message, icon } = body;
        if (!room_id || !message) {
          return res.status(400).json({ error: 'room_id and message required' });
        }

        // Get all subscriptions for this room
        const { data: subs, error: fetchErr } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('room_id', room_id);

        if (fetchErr || !subs?.length) {
          return res.status(200).json({ success: true, sent: 0, reason: 'no subscriptions' });
        }

        const payload = {
          title: title || 'Nuevo mensaje',
          body: message,
          icon: icon || 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
          badge: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
          data: { room_id },
        };

        let sent = 0;
        let failed = 0;
        const goneEndpoints = [];

        for (const sub of subs) {
          try {
            const result = await sendPushNotification(
              { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
              payload
            );
            if (result.success) {
              sent++;
            } else if (result.gone) {
              goneEndpoints.push(sub.id);
              failed++;
            } else {
              failed++;
              console.error('Push failed:', result.statusCode, result.body);
            }
          } catch (e) {
            failed++;
            console.error('Push error:', e.message);
          }
        }

        // Clean up gone subscriptions
        if (goneEndpoints.length > 0) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .in('id', goneEndpoints);
        }

        return res.status(200).json({ success: true, sent, failed, cleaned: goneEndpoints.length });
      }

      return res.status(400).json({ error: 'Unknown action' });
    }

    // DELETE → unsubscribe
    if (req.method === 'DELETE') {
      const { room_id, endpoint } = req.query;
      if (!room_id) {
        return res.status(400).json({ error: 'room_id required' });
      }

      const query = supabase.from('push_subscriptions').delete().eq('room_id', room_id);
      if (endpoint) query.eq('endpoint', endpoint);
      await query;

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[push] Error:', err);
    return res.status(500).json({ error: err.message });
  }
};
