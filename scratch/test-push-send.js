const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lmozoetpehmdxxremtqn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtb3pvZXRwZWhtZHh4cmVtdHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTA2NDUsImV4cCI6MjA5NTgyNjY0NX0.1xkCCw7q9CDvVbqGswCeFwXpgYfMtb0wcl7lHWlKQ8U';
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const VAPID_PUBLIC_KEY = 'BAfWR9i2l5IKCTMpV5cjjjTt4dkSQuvGMUAO5aSVIVMEvXWElSTIrf3S92HhmqveaiWhcdXXw5WUaaYL7AxI1Fg';
const VAPID_PRIVATE_KEY = 'B6ADY2VbTZUAv1PYWduu400gyX7N3GNcJH0pK1mfOJU';

webpush.setVapidDetails(
  'mailto:info@iadebarrio.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

const roomId = 'c80fdf1c-7b6d-4807-a31c-ffc223be7008'; // gerard fanals

async function run() {
  console.log("Fetching subscriptions for room:", roomId);
  const { data: subs, error } = await sb
    .from('push_subscriptions')
    .select('*')
    .eq('room_id', roomId);

  if (error) {
    console.error("Error fetching subscriptions:", error);
    return;
  }

  console.log(`Found ${subs.length} subscription(s). Sending test push...`);
  
  const payload = JSON.stringify({
    title: 'Test Push Notification',
    body: 'Este es un mensaje de prueba para verificar las notificaciones.',
    icon: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
    data: { room_id: roomId },
  });

  for (const sub of subs) {
    const pushSub = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth }
    };

    try {
      console.log(`Sending to endpoint: ${sub.endpoint.substring(0, 60)}...`);
      const res = await webpush.sendNotification(pushSub, payload);
      console.log(`Success! Status: ${res.statusCode}`);
    } catch (err) {
      console.error(`Error sending to subscription ${sub.id}:`, err.statusCode, err.body);
    }
  }
}
run();
