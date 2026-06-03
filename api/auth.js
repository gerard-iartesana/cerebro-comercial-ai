// /api/auth.js
// Vercel serverless function: Authenticates users against Supabase dashboard_users table,
// with fallback to hardcoded users for backward compatibility

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lmozoetpehmdxxremtqn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtb3pvZXRwZWhtZHh4cmVtdHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTA2NDUsImV4cCI6MjA5NTgyNjY0NX0.1xkCCw7q9CDvVbqGswCeFwXpgYfMtb0wcl7lHWlKQ8U';

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

  const { username, password } = req.body || {};

  if (!username) {
    return res.status(400).json({ error: 'Falta el nombre de usuario' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Falta la contraseña' });
  }

  const u = username.toLowerCase().trim();

  // ── 1. Try Supabase dashboard_users table ─────────────────────────────
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const password_hash = crypto.createHash('sha256').update(password).digest('hex');

    const { data: dbUser, error } = await supabase
      .from('dashboard_users')
      .select('id, username, email, password_hash, role, modules, is_active')
      .or(`email.eq.${u},username.eq.${u}`)
      .eq('is_active', true)
      .maybeSingle();

    if (!error && dbUser && dbUser.password_hash === password_hash) {
      const response = {
        success: true,
        role: dbUser.role,
        modules: dbUser.modules || 'all',
        email: dbUser.email
      };

      // Grant superAdmin to admin-role users from DB if desired
      if (dbUser.role === 'superadmin') {
        response.isSuperAdmin = true;
      }

      return res.status(200).json(response);
    }
  } catch (dbError) {
    // Log but don't fail — fall through to hardcoded users
    console.error('Supabase auth lookup failed, falling back to hardcoded:', dbError.message);
  }

  // ── 2. Fallback: Hardcoded users (backward compatibility) ─────────────
  const sysPassword = process.env.DASHBOARD_PASSWORD;
  const adminPwd = 'admin123';
  const clientPwd = 'cliente123';
  const guestPwd = 'invitado123';

  if (u === 'gerard@iartesana.es' && password === 'G2r1rd@2026') {
    return res.status(200).json({ 
      success: true, 
      role: 'admin', 
      isSuperAdmin: true,
      modules: 'all',
      email: 'gerard@iartesana.es'
    });
  } else if (u === 'admin' && ((sysPassword && password === sysPassword) || password === adminPwd)) {
    return res.status(200).json({ 
      success: true, 
      role: 'admin', 
      modules: 'all',
      email: 'admin@iartesana.es'
    });
  } else if (u === 'cliente' && password === clientPwd) {
    return res.status(200).json({ 
      success: true, 
      role: 'client', 
      modules: ['overview', 'leads', 'kanban', 'dashboard-client', 'whatsapp', 'support'],
      email: 'cliente@iartesana.es'
    });
  } else if (u === 'invitado' && password === guestPwd) {
    return res.status(200).json({ 
      success: true, 
      role: 'guest', 
      modules: 'all',
      except: ['config-business'],
      email: 'invitado@iartesana.es'
    });
  } else {
    return res.status(401).json({ success: false, error: 'Usuario o contraseña incorrectos' });
  }
};
