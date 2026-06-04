// /api/google-auth.js
// Redirects the user to Google OAuth2 consent screen for Calendar access

module.exports = async function handler(req, res) {
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://cerebro-comercial-ai.vercel.app/api/google-callback';

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar',
    access_type: 'offline',
    prompt: 'consent'
  });

  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString();
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`
    <html>
      <head><meta http-equiv="refresh" content="0;url=${authUrl}"></head>
      <body style="font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f5f5f7">
        <div style="text-align:center">
          <div style="font-size:3rem;margin-bottom:16px">🔄</div>
          <p style="color:#86868b">Redirigiendo a Google...</p>
        </div>
        <script>window.location.href="${authUrl}";</script>
      </body>
    </html>
  `);
};
