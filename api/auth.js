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

  if (!sysPassword) {
    console.error('DASHBOARD_PASSWORD variable is not configured in Vercel');
    return res.status(500).json({ error: 'La variable DASHBOARD_PASSWORD no está configurada en el panel de Vercel' });
  }

  if (!password) {
    return res.status(400).json({ error: 'Falta la contraseña' });
  }

  if (password === sysPassword) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
  }
};
