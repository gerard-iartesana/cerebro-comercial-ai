// /api/process-scheduled-requests.js
// Vercel serverless function: Processes and publishes scheduled document requests
const { createClient } = require('@supabase/supabase-js');
const webpush = require('web-push');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lmozoetpehmdxxremtqn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

const VAPID_PUBLIC_KEY = 'BAfWR9i2l5IKCTMpV5cjjjTt4dkSQuvGMUAO5aSVIVMEvXWElSTIrf3S92HhmqveaiWhcdXXw5WUaaYL7AxI1Fg';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'B6ADY2VbTZUAv1PYWduu400gyX7N3GNcJH0pK1mfOJU';

webpush.setVapidDetails(
  'mailto:info@iadebarrio.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const nowStr = new Date().toISOString();

  try {
    // 1. Fetch document requests that are scheduled, not yet sent, and whose scheduled time has passed
    const { data: scheduledDocs, error: fetchErr } = await supabase
      .from('client_document_requests')
      .select('*, chat_rooms(lead_name, lead_company)')
      .eq('is_sent', false)
      .lte('scheduled_at', nowStr);

    if (fetchErr) throw fetchErr;

    if (!scheduledDocs || scheduledDocs.length === 0) {
      return res.status(200).json({ success: true, processedCount: 0, message: 'No pending scheduled document requests.' });
    }

    const processed = [];

    for (const doc of scheduledDocs) {
      // a. Mark as sent immediately to prevent double processing in case of concurrent executions
      const { error: updateErr } = await supabase
        .from('client_document_requests')
        .update({ is_sent: true })
        .eq('id', doc.id);

      if (updateErr) {
        console.error(`[Process Scheduled] Error marking request ${doc.id} as sent:`, updateErr);
        continue;
      }

      // b. Insert automated chat message to notify the client in the chat room
      const limitStr = doc.due_date ? new Date(doc.due_date).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha límite';
      const chatMsg = `🔔 Documento solicitado: **${doc.document_name}**\n📅 Fecha límite: ${limitStr}\n${doc.notes ? `📝 Notas: ${doc.notes}` : ''}`;
      
      const { error: msgErr } = await supabase.from('chat_messages').insert({
        room_id: doc.room_id,
        sender_type: 'admin',
        sender_name: 'Gerard',
        content: chatMsg
      });

      if (msgErr) console.error(`[Process Scheduled] Error inserting chat message for room ${doc.room_id}:`, msgErr);

      // c. Insert chat activity
      const leadName = doc.chat_rooms?.lead_name || 'Lead';
      const { error: actErr } = await supabase.from('chat_activities').insert({
        room_id: doc.room_id,
        lead_name: leadName,
        action: 'send_message',
        desc: `Gerard (admin) solicitó un documento (programado): "${doc.document_name}"`,
        sender_type: 'admin'
      });

      if (actErr) console.error(`[Process Scheduled] Error inserting activity for room ${doc.room_id}:`, actErr);

      // d. Update room last_message_at
      await supabase.from('chat_rooms')
        .update({ last_message_at: nowStr })
        .eq('id', doc.room_id)
        .catch(e => console.error(`[Process Scheduled] Error updating room ${doc.room_id}:`, e));

      // e. Send web push notification to client subscriptions
      try {
        const { data: subs, error: subsErr } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('room_id', doc.room_id);

        if (!subsErr && subs && subs.length > 0) {
          const payload = JSON.stringify({
            title: 'Nuevo documento solicitado 📄',
            body: `Gerard te ha solicitado: ${doc.document_name}`,
            icon: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
            badge: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
            data: { room_id: doc.room_id }
          });

          const goneEndpoints = [];
          for (const sub of subs) {
            const pushSub = {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth }
            };
            try {
              await webpush.sendNotification(pushSub, payload);
            } catch (err) {
              if (err.statusCode === 410 || err.statusCode === 404) {
                goneEndpoints.push(sub.id);
              }
            }
          }

          if (goneEndpoints.length > 0) {
            await supabase.from('push_subscriptions').delete().in('id', goneEndpoints).catch(() => {});
          }
        }
      } catch (pushErr) {
        console.error('[Process Scheduled] Web Push failed:', pushErr);
      }

      processed.push({
        id: doc.id,
        room_id: doc.room_id,
        document_name: doc.document_name,
        client: leadName
      });
    }

    return res.status(200).json({
      success: true,
      processedCount: processed.length,
      processed
    });

  } catch (err) {
    console.error('[Process Scheduled] Handler error:', err);
    return res.status(500).json({ error: err.message });
  }
};
