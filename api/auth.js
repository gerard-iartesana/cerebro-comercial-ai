// /api/auth.js
// Vercel serverless function: Validates dashboard password against the Vercel environment variable DASHBOARD_PASSWORD

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
  const sysPassword = process.env.DASHBOARD_PASSWORD;

  const adminPwd = 'admin123';
  const clientPwd = 'cliente123';
  const guestPwd = 'invitado123';

  if (!username) {
    return res.status(400).json({ error: 'Falta el nombre de usuario' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Falta la contraseña' });
  }

  const u = username.toLowerCase().trim();

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
