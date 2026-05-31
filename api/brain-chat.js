// /api/brain-chat.js
// Vercel serverless function: Orchestrator Central Agent ('El Cerebro') using Gemini 3/3.1 Experimental with function calling

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uidilhuybmtuokunutgz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpZGlsaHV5Ym10dW9rdW51dGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDU0NTAsImV4cCI6MjA5MTQyMTQ1MH0.ir9FnuHhW_1i4OslE_SNbOCIgLUEWakScP71WYqnfJM';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDy3zdb67ICMuhrU0qmaAMnztDPFT09Z24';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Define tools available for Gemini
const geminiTools = [
  {
    functionDeclarations: [
      {
        name: "getOutboxStats",
        description: "Obtiene las estadísticas de prospección comercial en tiempo real (leads totales, enriquecidos, contestados, reuniones).",
        parameters: { type: "OBJECT", properties: {} }
      },
      {
        name: "searchLeads",
        description: "Busca emails y contactos de leads profesionales para un dominio web usando Hunter.io.",
        parameters: {
          type: "OBJECT",
          properties: {
            domain: { type: "STRING", description: "El dominio corporativo a buscar, ej: stripe.com o iartesana.es" }
          },
          required: ["domain"]
        }
      },
      {
        name: "enrichLead",
        description: "Activa el scraping e inteligencia artificial (Gemini) para un lead específico por su UUID.",
        parameters: {
          type: "OBJECT",
          properties: {
            lead_id: { type: "STRING", description: "El ID UUID único del lead" }
          },
          required: ["lead_id"]
        }
      },
      {
        name: "listLeads",
        description: "Obtiene una lista de leads filtrada opcionalmente por estado.",
        parameters: {
          type: "OBJECT",
          properties: {
            status: { type: "STRING", description: "Filtro opcional. Ej: 'replied', 'booked', 'lead', 'enriched'." }
          }
        }
      }
    ]
  }
];

// Helper tools implementation
const implementations = {
  async getOutboxStats() {
    const { count: total } = await supabase.from('outreach_leads').select('*', { count: 'exact', head: true });
    const { count: enriched } = await supabase.from('outreach_leads').select('*', { count: 'exact', head: true }).eq('status', 'enriched');
    const { count: replied } = await supabase.from('outreach_leads').select('*', { count: 'exact', head: true }).eq('status', 'replied');
    const { count: booked } = await supabase.from('outreach_leads').select('*', { count: 'exact', head: true }).eq('status', 'booked');
    
    return {
      leads_totales: total || 0,
      leads_enriquecidos: enriched || 0,
      contestados_replied: replied || 0,
      citas_agendadas: booked || 0
    };
  },

  async searchLeads({ domain }) {
    // Llamada local al endpoint interno
    const port = process.env.PORT || '3000';
    const host = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${port}`;
    try {
      const res = await fetch(`${host}/api/hunter-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
      });
      return await res.json();
    } catch (e) {
      return { error: `Error interno de conexión: ${e.message}` };
    }
  },

  async enrichLead({ lead_id }) {
    const port = process.env.PORT || '3000';
    const host = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${port}`;
    try {
      const res = await fetch(`${host}/api/scrape-enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id })
      });
      return await res.json();
    } catch (e) {
      return { error: `Error interno de conexión: ${e.message}` };
    }
  },

  async listLeads({ status }) {
    let query = supabase.from('outreach_leads').select('id, email, first_name, company_name, status, created_at').order('created_at', { ascending: false }).limit(10);
    if (status) {
      query = query.eq('status', status);
    }
    const { data, error } = await query;
    if (error) return { error: error.message };
    return data;
  }
};

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

  const { message, history } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: 'Falta el mensaje' });
  }

  try {
    const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=' + GEMINI_API_KEY;

    const contents = [];
    if (history && history.length > 0) {
      history.forEach(h => {
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        });
      });
    }

    // Agregar el mensaje actual del usuario con las instrucciones de sistema en el primer turno o integradas
    const systemPrompt = `Actúas como "El Cerebro", el orquestador cognitivo principal de CerebroComercial AI (marca iadebarrio.com). 
Tienes acceso a herramientas automáticas (tools) para buscar leads, enriquecerlos y consultar métricas. 
Tu tono de voz es cercano, directo, amigable (tuteando, ej: "¡Hola! Claro, ahora mismo busco leads...") y extremadamente resolutivo. Evita formalidades y rodeos cliché.

Responde de forma natural e interactúa con el usuario. Si te piden buscar leads de un dominio, usa la herramienta searchLeads. Si te piden enriquecer un lead, usa enrichLead. Si te piden estadísticas, usa getOutboxStats.`;

    contents.push({
      role: 'user',
      parts: [{ text: `${systemPrompt}\n\nPetición del usuario: ${message}` }]
    });

    // 2. Hacer la primera llamada a Gemini para ver si decide llamar a una herramienta
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        tools: geminiTools
      })
    });

    if (!geminiRes.ok) {
      throw new Error(`Error en el API de Gemini: ${geminiRes.status} - ${await geminiRes.text()}`);
    }

    const geminiJson = await geminiRes.json();
    const candidate = geminiJson.candidates && geminiJson.candidates[0];
    const functionCalls = candidate && candidate.content && candidate.content.parts[0] && candidate.content.parts[0].functionCall;

    // 3. Si decide llamar a una función, la ejecutamos y le damos el resultado de vuelta
    if (functionCalls) {
      const { name, args } = functionCalls;
      console.log(`El Cerebro decidió llamar a la función: ${name} con argumentos:`, args);

      const implementation = implementations[name];
      if (!implementation) {
        throw new Error(`La función ${name} no está implementada.`);
      }

      // Ejecutar la acción
      const toolResult = await implementation(args);

      // Enviar el resultado de vuelta a Gemini para que construya la respuesta final para el usuario
      contents.push(candidate.content); // Añadimos la llamada del modelo
      contents.push({
        role: 'user',
        parts: [{
          functionResponse: {
            name,
            response: { result: toolResult }
          }
        }]
      });

      const geminiFinalRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      });

      if (!geminiFinalRes.ok) {
        throw new Error(`Error final en el API de Gemini: ${geminiFinalRes.status} - ${await geminiFinalRes.text()}`);
      }

      const finalJson = await geminiFinalRes.json();
      const finalResponseText = finalJson.candidates[0].content.parts[0].text;

      return res.status(200).json({
        role: 'model',
        text: finalResponseText,
        actionExecuted: name,
        toolResult
      });
    }

    // 4. Si no llamó a ninguna función, devolvemos la respuesta conversacional directa
    const directResponseText = candidate.content.parts[0].text;
    return res.status(200).json({
      role: 'model',
      text: directResponseText
    });

  } catch (error) {
    console.error('Brain chat error:', error);
    return res.status(500).json({ error: error.message || 'Error interno del cerebro' });
  }
};
