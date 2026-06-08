const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://lmozoetpehmdxxremtqn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtb3pvZXRwZWhtZHh4cmVtdHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTA2NDUsImV4cCI6MjA5NTgyNjY0NX0.1xkCCw7q9CDvVbqGswCeFwXpgYfMtb0wcl7lHWlKQ8U';
const supabase = createClient(supabaseUrl, supabaseKey);
async function test() {
  const { data, error } = await supabase.from('contratos').select('*').limit(1);
  if (error) console.error(error);
  else {
    const row = data[0] || {};
    console.log("Types:");
    console.log("datos_cliente:", typeof row.datos_cliente);
    console.log("formas_pago:", typeof row.formas_pago);
    console.log("pago_config:", typeof row.pago_config);
  }
}
test();
