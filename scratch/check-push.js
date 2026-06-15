const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://lmozoetpehmdxxremtqn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtb3pvZXRwZWhtZHh4cmVtdHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTA2NDUsImV4cCI6MjA5NTgyNjY0NX0.1xkCCw7q9CDvVbqGswCeFwXpgYfMtb0wcl7lHWlKQ8U';
const sb = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: rooms, error: err1 } = await sb.from('chat_rooms').select('id, lead_name');
  if (err1) {
    console.error("Error fetching rooms:", err1);
    return;
  }
  
  const { data: subs, error: err2 } = await sb.from('push_subscriptions').select('*');
  if (err2) {
    console.error("Error fetching subscriptions:", err2);
    return;
  }
  
  console.log("Subscriptions count:", subs.length);
  subs.forEach(s => {
    const room = rooms.find(r => r.id === s.room_id);
    console.log(`- Sub ID: ${s.id}, Room: ${room ? room.lead_name : 'unknown'} (${s.room_id}), Endpoint: ${s.endpoint.substring(0, 50)}...`);
  });
}
run();
