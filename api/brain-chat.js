// /api/brain-chat.js
// Vercel serverless function: Orchestrator Central Agent ('El Cerebro') using Gemini with function calling
// Pure orchestrator – delegates heavy operations to existing API endpoints

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lmozoetpehmdxxremtqn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtb3pvZXRwZWhtZHh4cmVtdHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTA2NDUsImV4cCI6MjA5NTgyNjY0NX0.1xkCCw7q9CDvVbqGswCeFwXpgYfMtb0wcl7lHWlKQ8U';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDy3zdb67ICMuhrU0qmaAMnztDPFT09Z24';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Base URL for internal API calls (self-referencing)
const baseUrl = process.env.VERCEL_URL
  ? 'https://' + process.env.VERCEL_URL
  : 'http://localhost:3000';

// Map tool names → agent identifiers for the frontend
const agentMap = {
  searchLeads: 'searcher',
  enrichLead: 'enricher',
  sendSequence: 'emailer',
  getOutboxStats: 'analytics',
  listLeads: 'analytics'
};

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
        name: "sendSequence",
        description: "Envía la secuencia de emails de prospección a un lead específico.",
        parameters: {
          type: "OBJECT",
          properties: {
            lead_id: { type: "STRING", description: "El ID del lead al que enviar la secuencia de email" }
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

// Tool implementations — lightweight queries inline, heavy ops delegated via fetch()
const implementations = {
  // ── Lightweight (inline Supabase) ──────────────────────────────────────

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

  async listLeads({ status }) {
    let query = supabase.from('outreach_leads').select('id, email, first_name, company_name, status, created_at').order('created_at', { ascending: false }).limit(10);
    if (status) {
      query = query.eq('status', status);
    }
    const { data, error } = await query;
    if (error) return { error: error.message };
    return data;
  },

  // ── Heavy ops (delegated to API endpoints) ─────────────────────────────

  async searchLeads({ domain }) {
    const res = await fetch(baseUrl + '/api/hunter-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain })
    });
    return res.json();
  },

  async enrichLead({ lead_id }) {
    const res = await fetch(baseUrl + '/api/scrape-enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id })
    });
    return res.json();
  },

  async sendSequence({ lead_id }) {
    const res = await fetch(baseUrl + '/api/send-sequence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id, mode: 'single' })
    });
    return res.json();
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

    const systemPrompt = `Actúas como "El Cerebro", el orquestador cognitivo principal de CerebroComercial AI (marca iadebarrio.com). 
Tienes acceso a un equipo de agentes especializados: 🔍 Buscador (Hunter.io), 🕷️ Enriquecedor (Scraping+IA), 📧 Email (Resend), 📊 Analítico (Supabase). Cuando necesites ejecutar una acción, delegas al agente correspondiente.
Tu tono de voz es cercano, directo, amigable (tuteando, ej: "¡Hola! Claro, ahora mismo busco leads...") y extremadamente resolutivo. Evita formalidades y rodeos cliché.

REGLAS CRÍTICAS PARA BÚSQUEDA DE LEADS:
- La herramienta searchLeads busca en Hunter.io por DOMINIO WEB concreto (ej: stripe.com, gestoriaperez.com).
- Si el usuario te pide leads de una INDUSTRIA o SECTOR (ej: "gestorías", "asesores fiscales", "abogados", "dentistas"), TÚ DEBES usar tu conocimiento para identificar 2-3 dominios web REALES de empresas de ese sector en España y llamar a searchLeads con cada dominio. 
- Ejemplo: si piden "gestorías" → llama a searchLeads con dominios como "aselec.es", "aycelaborytax.com", "asepyme.com", etc.
- NUNCA digas "necesito un dominio concreto". SIEMPRE identifica dominios reales tú mismo y ejecuta la búsqueda directamente.
- Si no estás seguro de los dominios exactos, inventa combinaciones plausibles tipo "{nombre}asesores.com" o "{nombre}gestoria.es".

OTRAS HERRAMIENTAS:
- Si te piden enriquecer un lead, usa enrichLead.
- Si te piden enviar un email o secuencia, usa sendSequence.
- Si te piden estadísticas, usa getOutboxStats.
- Si te piden listar leads, usa listLeads.`;

    contents.push({
      role: 'user',
      parts: [{ text: `${systemPrompt}\n\nPetición del usuario: ${message}` }]
    });

    // First call to Gemini – may trigger a function call
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

    // If Gemini decided to call a tool, execute it and feed the result back
    if (functionCalls) {
      const { name, args } = functionCalls;
      console.log(`El Cerebro delegó al agente [${agentMap[name]}] → ${name}`, args);

      const implementation = implementations[name];
      if (!implementation) {
        throw new Error(`La función ${name} no está implementada.`);
      }

      const toolResult = await implementation(args);

      // Send tool result back to Gemini for the final natural-language response
      contents.push(candidate.content);
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
        agentUsed: agentMap[name] || null,
        toolResult
      });
    }

    // No function call – return the conversational response directly
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
