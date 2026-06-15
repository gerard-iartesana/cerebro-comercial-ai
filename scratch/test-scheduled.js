const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://lmozoetpehmdxxremtqn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtb3pvZXRwZWhtZHh4cmVtdHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTA2NDUsImV4cCI6MjA5NTgyNjY0NX0.1xkCCw7q9CDvVbqGswCeFwXpgYfMtb0wcl7lHWlKQ8U';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('chat_scheduled_messages').select('*').limit(5);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Data:", JSON.stringify(data, null, 2));
  }
}
test();
