// /api/proposal-ai.js
// Vercel serverless function: Generates JSON proposals and texts directly.

export default async function handler(req, res) {
  // Configuración de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, systemInstruction } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: 'Falta el mensaje' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDy3zdb67ICMuhrU0qmaAMnztDPFT09Z24';


  try {
    const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY;

    const payload = {
      contents: [{
        role: 'user',
        parts: [{ text: message }]
      }]
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error(`Error en el API de Gemini: ${geminiRes.status} - ${errText}`);
    }

    const geminiJson = await geminiRes.json();
    const candidate = geminiJson.candidates && geminiJson.candidates[0];
    
    if (!candidate || !candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error('Respuesta vacía de Gemini');
    }

    const textOutput = candidate.content.parts[0].text;

    return res.status(200).json({ reply: textOutput, text: textOutput });

  } catch (error) {
    console.error('Error in proposal-ai:', error);
    return res.status(500).json({ error: error.message });
  }
}
