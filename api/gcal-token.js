// /api/gcal-token.js
// Exposes the Google Calendar access token by refreshing it with GOOGLE_REFRESH_TOKEN on the backend

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    return res.status(200).json({ 
      success: false, 
      error: 'Google Calendar credentials are not configured on the backend.' 
    });
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      }).toString()
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.status(200).json({
        success: false,
        error: 'Failed to refresh access token: ' + (tokenData.error_description || tokenData.error || 'unknown')
      });
    }

    return res.status(200).json({
      success: true,
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in || 3600
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error: ' + e.message
    });
  }
};
