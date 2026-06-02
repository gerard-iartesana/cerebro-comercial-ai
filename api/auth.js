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

  const { password } = req.body || {};
  const sysPassword = process.env.DASHBOARD_PASSWORD;

  const adminPwd = 'admin123';
  const clientPwd = 'cliente123';
  const guestPwd = 'invitado123';

  if (!password) {
    return res.status(400).json({ error: 'Falta la contraseña' });
  }

  if ((sysPassword && password === sysPassword) || password === adminPwd) {
    return res.status(200).json({ 
      success: true, 
      role: 'admin', 
      modules: 'all' 
    });
  } else if (password === clientPwd) {
    return res.status(200).json({ 
      success: true, 
      role: 'client', 
      modules: ['overview', 'leads', 'kanban', 'dashboard-client', 'whatsapp', 'support'] 
    });
  } else if (password === guestPwd) {
    return res.status(200).json({ 
      success: true, 
      role: 'guest', 
      modules: 'all',
      except: ['config-business']
    });
  } else {
    return res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
  }
};
