// /api/google-callback.js
// Handles OAuth2 callback: exchanges code for tokens and displays the refresh token

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const { code, error } = req.query || {};

  if (error) {
    return res.status(400).send(`
      <html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f5f5f7;margin:0">
        <div style="background:white;padding:40px;border-radius:20px;box-shadow:0 10px 40px rgba(0,0,0,0.1);max-width:500px;text-align:center">
          <div style="font-size:3rem;margin-bottom:16px">❌</div>
          <h1 style="font-size:1.2rem;color:#1d1d1f;margin:0 0 8px">Error de autorización</h1>
          <p style="color:#86868b;font-size:0.9rem">${error}</p>
        </div>
      </body></html>
    `);
  }

  if (!code) {
    return res.status(400).send(`
      <html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f5f5f7;margin:0">
        <div style="background:white;padding:40px;border-radius:20px;box-shadow:0 10px 40px rgba(0,0,0,0.1);max-width:500px;text-align:center">
          <div style="font-size:3rem;margin-bottom:16px">⚠️</div>
          <h1 style="font-size:1.2rem;color:#1d1d1f;margin:0 0 8px">No se recibió código de autorización</h1>
          <p style="color:#86868b;font-size:0.9rem">Inténtalo de nuevo desde el dashboard.</p>
        </div>
      </body></html>
    `);
  }

  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://cerebro-comercial-ai.vercel.app/api/google-callback';

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      }).toString()
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.refresh_token) {
      return res.status(400).send(`
        <html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f5f5f7;margin:0">
          <div style="background:white;padding:40px;border-radius:20px;box-shadow:0 10px 40px rgba(0,0,0,0.1);max-width:600px;text-align:center">
            <div style="font-size:3rem;margin-bottom:16px">⚠️</div>
            <h1 style="font-size:1.2rem;color:#1d1d1f;margin:0 0 8px">No se obtuvo refresh token</h1>
            <p style="color:#86868b;font-size:0.9rem">Es posible que ya hayas autorizado antes. Revoca el acceso en <a href="https://myaccount.google.com/permissions" target="_blank">tu cuenta Google</a> y vuelve a intentarlo.</p>
            <pre style="background:#f0f0f0;padding:12px;border-radius:8px;text-align:left;font-size:0.75rem;overflow:auto;margin-top:16px">${JSON.stringify(tokenData, null, 2)}</pre>
          </div>
        </body></html>
      `);
    }

    // Get calendar list to find the primary calendar ID
    const calRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=5', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    const calData = await calRes.json();
    const primaryCal = (calData.items || []).find(c => c.primary) || calData.items?.[0];
    const calendarId = primaryCal?.id || 'No encontrado';

    return res.status(200).send(`
      <html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f5f5f7;margin:0">
        <div style="background:white;padding:40px;border-radius:20px;box-shadow:0 10px 40px rgba(0,0,0,0.1);max-width:650px">
          <div style="text-align:center;margin-bottom:24px">
            <div style="font-size:3rem;margin-bottom:12px">✅</div>
            <h1 style="font-size:1.3rem;color:#1d1d1f;margin:0 0 8px">¡Google Calendar conectado!</h1>
            <p style="color:#86868b;font-size:0.9rem;margin:0">Ahora copia estos valores y pégalos en Vercel → Settings → Environment Variables</p>
          </div>
          
          <div style="background:#f0f0f0;padding:16px;border-radius:12px;margin-bottom:16px">
            <label style="font-size:0.72rem;font-weight:700;color:#86868b;text-transform:uppercase;letter-spacing:0.05em">GOOGLE_REFRESH_TOKEN</label>
            <div style="margin-top:6px;padding:10px 14px;background:white;border-radius:8px;border:1px solid #e0e0e0;font-family:monospace;font-size:0.8rem;word-break:break-all;user-select:all;cursor:text;color:#1d1d1f">${tokenData.refresh_token}</div>
          </div>

          <div style="background:#f0f0f0;padding:16px;border-radius:12px;margin-bottom:16px">
            <label style="font-size:0.72rem;font-weight:700;color:#86868b;text-transform:uppercase;letter-spacing:0.05em">GOOGLE_CALENDAR_ID</label>
            <div style="margin-top:6px;padding:10px 14px;background:white;border-radius:8px;border:1px solid #e0e0e0;font-family:monospace;font-size:0.8rem;word-break:break-all;user-select:all;cursor:text;color:#1d1d1f">${calendarId}</div>
          </div>

          <div style="background:#e8f5e9;padding:16px;border-radius:12px;margin-bottom:20px">
            <p style="margin:0;font-size:0.82rem;color:#2e7d32"><strong>📋 Variables para Vercel:</strong></p>
            <ol style="margin:8px 0 0;padding-left:20px;font-size:0.8rem;color:#333;line-height:1.8">
              <li><code>GOOGLE_CLIENT_ID</code> = <small>${CLIENT_ID.substring(0, 20)}...</small></li>
              <li><code>GOOGLE_CLIENT_SECRET</code> = <small>${CLIENT_SECRET.substring(0, 10)}...</small></li>
              <li><code>GOOGLE_REFRESH_TOKEN</code> = <small>El valor de arriba ↑</small></li>
              <li><code>GOOGLE_CALENDAR_ID</code> = <small>${calendarId}</small></li>
            </ol>
          </div>

          <div style="text-align:center">
            <a href="/" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#007AFF,#5856d6);color:white;text-decoration:none;border-radius:12px;font-weight:600;font-size:0.9rem">← Volver al Dashboard</a>
          </div>
        </div>
      </body></html>
    `);

  } catch (e) {
    return res.status(500).send(`
      <html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f5f5f7;margin:0">
        <div style="background:white;padding:40px;border-radius:20px;box-shadow:0 10px 40px rgba(0,0,0,0.1);max-width:500px;text-align:center">
          <div style="font-size:3rem;margin-bottom:16px">❌</div>
          <h1 style="font-size:1.2rem;color:#1d1d1f;margin:0 0 8px">Error</h1>
          <p style="color:#86868b;font-size:0.9rem">${e.message}</p>
        </div>
      </body></html>
    `);
  }
};
