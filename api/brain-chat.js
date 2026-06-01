// /api/brain-chat.js
// Vercel serverless function: Orchestrator Central Agent ('El Cerebro') using Gemini 3/3.1 Experimental with function calling

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lmozoetpehmdxxremtqn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtb3pvZXRwZWhtZHh4cmVtdHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTA2NDUsImV4cCI6MjA5NTgyNjY0NX0.1xkCCw7q9CDvVbqGswCeFwXpgYfMtb0wcl7lHWlKQ8U';
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
    const HUNTER_API_KEY = process.env.HUNTER_API_KEY;
    if (!HUNTER_API_KEY) {
      return { error: 'HUNTER_API_KEY no está configurada' };
    }
    try {
      const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${HUNTER_API_KEY}`;
      const response = await fetch(hunterUrl);
      if (!response.ok) {
        const errText = await response.text();
        return { error: `Hunter.io API error: ${response.status} - ${errText}` };
      }
      const json = await response.json();
      const hunterData = json.data;
      if (!hunterData || !hunterData.emails || hunterData.emails.length === 0) {
        return { message: `No se encontraron correos para el dominio ${domain}`, insertedCount: 0 };
      }
      
      const leadsToInsert = hunterData.emails.map(emailObj => {
        const companyName = hunterData.organization || domain.split('.')[0];
        return {
          email: emailObj.value,
          first_name: emailObj.first_name || '',
          company_name: companyName,
          website: `https://${domain}`,
          linkedin_url: emailObj.linkedin || '',
          status: 'lead',
          sequence_step: 0,
          scraped_data: {
            position: emailObj.position || '',
            confidence: emailObj.confidence || 0,
            twitter: emailObj.twitter || '',
            source: 'hunter.io'
          }
        };
      });

      let insertedCount = 0;
      for (const lead of leadsToInsert) {
        await supabase
          .from('outreach_leads')
          .upsert(lead, { onConflict: 'email', ignoreDuplicates: true });
        insertedCount++;
      }

      return {
        success: true,
        message: `Búsqueda completada para ${domain}`,
        foundCount: hunterData.emails.length,
        insertedCount
      };
    } catch (e) {
      return { error: `Error en la búsqueda de leads: ${e.message}` };
    }
  },

  async enrichLead({ lead_id }) {
    try {
      const { data: lead, error: getErr } = await supabase
        .from('outreach_leads')
        .select('*')
        .eq('id', lead_id)
        .single();

      if (getErr || !lead) {
        return { error: `Lead no encontrado: ${getErr ? getErr.message : ''}` };
      }

      if (!lead.website) {
        return { error: 'El lead no tiene un sitio web configurado' };
      }

      await supabase.from('outreach_leads').update({ status: 'enriching' }).eq('id', lead.id);

      const extractText = (html) => {
        return html
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
          .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&nbsp;/g, ' ')
          .replace(/&#[0-9]+;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      };

      const extractSocials = (html) => {
        const linkedinRegex = /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9-_\.\/\?=&]+/gi;
        const twitterRegex = /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9-_]+/gi;
        const linkedinMatch = html.match(linkedinRegex);
        const twitterMatch = html.match(twitterRegex);
        return {
          linkedin: linkedinMatch ? linkedinMatch[0] : null,
          twitter: twitterMatch ? twitterMatch[0] : null
        };
      };

      let html = '';
      let scrapedText = '';
      let socialLinks = { linkedin: null, twitter: null };

      try {
        const fetchRes = await fetch(lead.website, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
          signal: AbortSignal.timeout(8000)
        });

        if (fetchRes.ok) {
          html = await fetchRes.text();
          scrapedText = extractText(html).substring(0, 8000);
          socialLinks = extractSocials(html);
        }
      } catch (scrapeErr) {
        console.warn(`Scraping falló para ${lead.website}:`, scrapeErr.message);
      }

      let icebreaker = `Hola ${lead.first_name || 'allí'},\n\nEstuve revisando vuestra web de ${lead.company_name} y veo que hacéis un trabajo excelente.`;
      let geminiAnalysis = {};

      if (scrapedText) {
        const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const prompt = `Analiza los siguientes datos extraídos del sitio web de la empresa "${lead.company_name}":
---
${scrapedText}
---

Tu objetivo es redactar un "icebreaker" (rompehielos) comercial en ESPAÑOL que sea ultra-personalizado, directo y cercano (tuteando). Debe sonar natural, escrito por un humano real, sin rodeos formales ni frases cliché. 

Debe enlazar directamente lo que hace su empresa con un dolor o mejora en Captación de Clientes, Productividad o Automatización gracias a la Inteligencia Artificial + nosotros.

Genera una respuesta en formato JSON estrictamente válido con los siguientes campos:
{
  "icebreaker": "Una sola frase directa y cercana conectando con su web (ej: Veo que en {empresa} ayudáis a {su cliente} con {servicio}, y estaba pensando que...",
  "company_value_prop": "Breve resumen de la propuesta de valor detectada en su web.",
  "pain_points": "Dolores o áreas de automatización e IA recomendadas para su tipo de negocio."
}`;

        const geminiRes = await fetch(gUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });

        if (geminiRes.ok) {
          const geminiJson = await geminiRes.json();
          const responseText = geminiJson.candidates[0].content.parts[0].text;
          try {
            geminiAnalysis = JSON.parse(responseText);
            if (geminiAnalysis.icebreaker) {
              icebreaker = geminiAnalysis.icebreaker;
            }
          } catch (jsonErr) {
            console.error('Error parseando JSON de Gemini:', responseText);
          }
        }
      }

      const updatedScrapedData = {
        ...lead.scraped_data,
        company_value_prop: geminiAnalysis.company_value_prop || '',
        pain_points: geminiAnalysis.pain_points || '',
        scraped_at: new Date().toISOString()
      };

      const updateData = {
        status: 'enriched',
        custom_icebreaker: icebreaker,
        scraped_data: updatedScrapedData
      };

      if (socialLinks.linkedin && !lead.linkedin_url) {
        updateData.linkedin_url = socialLinks.linkedin;
      }
      if (socialLinks.twitter) {
        updateData.scraped_data.twitter = socialLinks.twitter;
      }

      await supabase.from('outreach_leads').update(updateData).eq('id', lead.id);

      return {
        success: true,
        lead_id: lead.id,
        icebreaker,
        linkedin: socialLinks.linkedin,
        company_value_prop: geminiAnalysis.company_value_prop || 'No detectada'
      };

    } catch (e) {
      if (lead_id) {
        await supabase.from('outreach_leads').update({ status: 'lead' }).eq('id', lead_id).catch(() => {});
      }
      return { error: `Error en enriquecimiento: ${e.message}` };
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
