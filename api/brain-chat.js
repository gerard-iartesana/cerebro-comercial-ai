// /api/brain-chat.js
// Vercel serverless function: Orchestrator Central Agent ('El Cerebro') using Gemini with function calling
// Pure orchestrator – delegates heavy operations to existing API endpoints

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lmozoetpehmdxxremtqn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtb3pvZXRwZWhtZHh4cmVtdHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTA2NDUsImV4cCI6MjA5NTgyNjY0NX0.1xkCCw7q9CDvVbqGswCeFwXpgYfMtb0wcl7lHWlKQ8U';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDy3zdb67ICMuhrU0qmaAMnztDPFT09Z24';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const HUNTER_API_KEY = process.env.HUNTER_API_KEY;

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

// Tool implementations — all inline to avoid self-referencing HTTP issues on Vercel
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

  async listLeads({ status }) {
    let query = supabase.from('outreach_leads').select('id, email, first_name, company_name, status, created_at').order('created_at', { ascending: false }).limit(10);
    if (status) {
      query = query.eq('status', status);
    }
    const { data, error } = await query;
    if (error) return { error: error.message };
    return data;
  },

  async searchLeads({ domain }) {
    if (!HUNTER_API_KEY) {
      return { error: 'HUNTER_API_KEY no está configurada en las variables de entorno de Vercel' };
    }
    const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${HUNTER_API_KEY}`;
    const response = await fetch(hunterUrl);

    if (!response.ok) {
      const errText = await response.text();
      return { error: `Hunter.io API error: ${response.status} - ${errText}` };
    }

    const json = await response.json();
    const hunterData = json.data;

    if (!hunterData || !hunterData.emails || hunterData.emails.length === 0) {
      return { success: true, message: `No se encontraron correos para ${domain}`, insertedCount: 0 };
    }

    // Filter: only personal emails (not generic like info@, admin@, comunicacion@)
    const personalEmails = hunterData.emails.filter(e => {
      // Must be a personal email type (Hunter.io returns "personal" or "generic")
      if (e.type === 'generic') return false;
      // Must have a first name (real person)
      if (!e.first_name || e.first_name.trim() === '') return false;
      // Extra safety: reject common generic patterns
      const genericPatterns = /^(info|admin|contact|hello|hola|ventas|sales|support|soporte|comunicacion|rrhh|marketing|facturacion|subvenciones|contabilidad|recepcion|prensa)@/i;
      if (genericPatterns.test(e.value)) return false;
      return true;
    });

    // Prioritize decision-makers by title/position
    const decisionMakerKeywords = /\b(ceo|cto|cfo|coo|cmo|founder|fundador|director|directora|gerente|responsable|socio|socia|partner|owner|propietario|propietaria|manager|jefe|jefa|presidente|presidenta|consejero|consejera)\b/i;
    
    const scored = personalEmails.map(e => ({
      ...e,
      isDecisionMaker: decisionMakerKeywords.test(e.position || ''),
      score: (decisionMakerKeywords.test(e.position || '') ? 100 : 0) + (e.confidence || 0)
    }));

    // Sort by score (decision-makers first, then by confidence)
    scored.sort((a, b) => b.score - a.score);

    // Take up to 3 best personal leads (decision-makers first)
    const topLeads = scored.slice(0, 3);

    if (topLeads.length === 0) {
      return { success: true, message: `Se encontraron ${hunterData.emails.length} emails en ${domain} pero ninguno personal de un decisor`, insertedCount: 0 };
    }

    let insertedCount = 0;
    const insertedLeads = [];

    for (const lead of topLeads) {
      const leadToInsert = {
        email: lead.value,
        first_name: lead.first_name || '',
        company_name: hunterData.organization || domain.split('.')[0],
        website: `https://${domain}`,
        linkedin_url: lead.linkedin || '',
        status: 'lead',
        sequence_step: 0,
        scraped_data: {
          position: lead.position || '',
          confidence: lead.confidence || 0,
          is_decision_maker: lead.isDecisionMaker,
          source: 'hunter.io',
          last_name: lead.last_name || ''
        }
      };

      const { error } = await supabase.from('outreach_leads').upsert(leadToInsert, { onConflict: 'email', ignoreDuplicates: true });
      if (!error) {
        insertedCount++;
        insertedLeads.push({
          name: `${lead.first_name} ${lead.last_name || ''}`,
          email: lead.value,
          position: lead.position || '',
          isDecisionMaker: lead.isDecisionMaker
        });
      }
    }

    const firstLead = insertedLeads[0] || {};
    const message = insertedCount > 0
      ? `✅ Se encontraron e insertaron ${insertedCount} leads en ${domain} (ej: ${firstLead.name || ''} - ${firstLead.email || ''})`
      : `⚠️ Se encontraron ${topLeads.length} leads en ${domain} pero ya existían en la base de datos.`;

    return {
      success: true,
      message,
      totalFound: hunterData.emails.length,
      personalFound: personalEmails.length,
      insertedCount,
      leads: insertedLeads
    };
  },

  async enrichLead({ lead_id }) {
    const { data: lead, error: getErr } = await supabase.from('outreach_leads').select('*').eq('id', lead_id).single();
    if (getErr || !lead) return { error: `Lead no encontrado: ${getErr ? getErr.message : 'ID inválido'}` };
    if (!lead.website) return { error: 'El lead no tiene un sitio web configurado' };

    await supabase.from('outreach_leads').update({ status: 'enriching' }).eq('id', lead.id);

    let scrapedText = '';
    try {
      const fetchRes = await fetch(lead.website, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(8000)
      });
      if (fetchRes.ok) {
        const html = await fetchRes.text();
        scrapedText = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 8000);
      }
    } catch (e) { /* scraping failed, continue with default icebreaker */ }

    let icebreaker = `Hola ${lead.first_name || 'allí'}, estuve revisando vuestra web de ${lead.company_name} y veo que hacéis un trabajo excelente.`;

    if (scrapedText) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const prompt = `Analiza el contenido del sitio web de "${lead.company_name}":\n---\n${scrapedText}\n---\nRedacta un icebreaker comercial en ESPAÑOL, ultra-personalizado, directo y cercano (tuteando). Responde en JSON: {"icebreaker": "...", "company_value_prop": "...", "pain_points": "..."}`;
      try {
        const gRes = await fetch(geminiUrl, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } })
        });
        if (gRes.ok) {
          const gJson = await gRes.json();
          const parsed = JSON.parse(gJson.candidates[0].content.parts[0].text);
          if (parsed.icebreaker) icebreaker = parsed.icebreaker;
        }
      } catch (e) { /* Gemini failed, use default */ }
    }

    await supabase.from('outreach_leads').update({ status: 'enriched', custom_icebreaker: icebreaker }).eq('id', lead.id);
    return { success: true, lead_id: lead.id, icebreaker };
  },

  async sendSequence({ lead_id }) {
    const { data: lead, error: getErr } = await supabase.from('outreach_leads').select('*').eq('id', lead_id).single();
    if (getErr || !lead) return { error: `Lead no encontrado` };
    if (lead.status !== 'enriched') return { error: `El lead debe estar en estado 'enriched' para enviar. Estado actual: ${lead.status}` };
    return { success: true, message: `Secuencia preparada para ${lead.email}. Ejecuta /api/send-sequence para procesar el envío.` };
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
    const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY;

    const contents = [];
    if (history && history.length > 0) {
      history.forEach(h => {
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        });
      });
    }

    const systemInstruction = {
      parts: [{ text: `Actúas como "El Cerebro", el orquestador cognitivo principal de CerebroComercial AI (marca iadebarrio.com). 
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
- Si te piden listar leads, usa listLeads.` }]
    };

    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // First call to Gemini – may trigger a function call
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction,
        contents,
        tools: geminiTools
      })
    });

    if (!geminiRes.ok) {
      throw new Error(`Error en el API de Gemini: ${geminiRes.status} - ${await geminiRes.text()}`);
    }

    const geminiJson = await geminiRes.json();
    console.log('Gemini raw response keys:', Object.keys(geminiJson));

    const candidate = geminiJson.candidates && geminiJson.candidates[0];
    if (!candidate || !candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      console.error('Gemini returned empty/invalid candidate:', JSON.stringify(geminiJson).substring(0, 500));
      return res.status(200).json({
        role: 'model',
        text: '⚠️ El Cerebro no pudo procesar la respuesta de Gemini. Intenta reformular tu petición.'
      });
    }

    // Search ALL parts for function calls (Gemini 2.5 returns thinking + text + functionCall in separate parts)
    const allParts = candidate.content.parts;
    const functionCalls = allParts.filter(p => p.functionCall).map(p => p.functionCall);
    let textPart = null;

    for (const part of allParts) {
      if (part.text && !part.thought) {
        textPart = part.text;
      }
    }

    console.log('Parts found:', allParts.length, '| functionCalls:', functionCalls.length, '| textPart:', !!textPart);

    // If Gemini decided to call one or more tools, execute them in parallel and feed the results back
    if (functionCalls.length > 0) {
      console.log(`El Cerebro detectó ${functionCalls.length} llamadas paralelas.`);
      
      const functionResponseParts = await Promise.all(functionCalls.map(async (fCall) => {
        const { name, args } = fCall;
        console.log(`Delegando al agente [${agentMap[name] || 'unknown'}] → ${name}`, args);
        
        const implementation = implementations[name];
        let toolResult;
        if (!implementation) {
          toolResult = { error: `La función "${name}" no está implementada.` };
        } else {
          try {
            toolResult = await implementation(args || {});
          } catch (implErr) {
            console.error(`Error ejecutando ${name}:`, implErr);
            toolResult = { error: implErr.message };
          }
        }
        
        return {
          functionResponse: {
            name,
            response: { result: toolResult }
          }
        };
      }));

      // Send all tool results back to Gemini for the final natural-language response
      contents.push(candidate.content);
      contents.push({
        role: 'user',
        parts: functionResponseParts
      });

      const geminiFinalRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemInstruction, contents, tools: geminiTools })
      });

      const firstCall = functionCalls[0];
      const primaryAgent = agentMap[firstCall.name] || null;

      if (!geminiFinalRes.ok) {
        const errText = await geminiFinalRes.text();
        console.error('Gemini final parallel call failed:', geminiFinalRes.status, errText.substring(0, 300));
        return res.status(200).json({
          role: 'model',
          text: `✅ Ejecutadas ${functionCalls.length} acciones correctamente.`,
          actionExecuted: firstCall.name,
          agentUsed: primaryAgent
        });
      }

      const finalJson = await geminiFinalRes.json();
      const finalCandidate = finalJson.candidates && finalJson.candidates[0];

      // Search all parts for text (skip thinking parts)
      let finalText = null;
      if (finalCandidate && finalCandidate.content && finalCandidate.content.parts) {
        for (const p of finalCandidate.content.parts) {
          if (p.text && !p.thought) {
            finalText = p.text;
          }
        }
      }
      if (!finalText) {
        finalText = `✅ Se ejecutaron ${functionCalls.length} acciones correctamente.`;
      }

      return res.status(200).json({
        role: 'model',
        text: finalText,
        actionExecuted: firstCall.name,
        agentUsed: primaryAgent
      });
    }

    // No function call – return the conversational response directly
    const directText = textPart || '🤔 El Cerebro procesó tu mensaje pero no generó respuesta de texto. Intenta reformularlo.';
    return res.status(200).json({
      role: 'model',
      text: directText
    });

  } catch (error) {
    console.error('Brain chat error:', error);
    return res.status(500).json({ error: error.message || 'Error interno del cerebro' });
  }
};
