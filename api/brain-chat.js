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

    let hunter_credits_used = 0;
    let hunter_credits_limit = 50;
    if (HUNTER_API_KEY) {
      try {
        const hRes = await fetch(`https://api.hunter.io/v2/account?api_key=${HUNTER_API_KEY}`);
        if (hRes.ok) {
          const hJson = await hRes.json();
          if (hJson.data && hJson.data.requests) {
            hunter_credits_used = hJson.data.requests.searches.used;
            hunter_credits_limit = hJson.data.requests.searches.limit;
          }
        }
      } catch (err) {
        console.error('Error fetching Hunter account credits:', err);
      }
    }

    return {
      leads_totales: total || 0,
      leads_enriquecidos: enriched || 0,
      contestados_replied: replied || 0,
      citas_agendadas: booked || 0,
      hunter_credits_used,
      hunter_credits_limit
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
    if (!domain) {
      return { error: 'No se especificó un dominio para buscar' };
    }
    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].trim().toLowerCase();

    // 1. Check in Supabase first to avoid duplicate searches and save credits
    try {
      const { data: existingLeads, error: dbError } = await supabase
        .from('outreach_leads')
        .select('*')
        .ilike('website', `%${cleanDomain}%`);

      if (!dbError && existingLeads && existingLeads.length > 0) {
        console.log(`[Cache Hit] Encontrados ${existingLeads.length} leads en la DB para el dominio ${cleanDomain}`);
        const formattedLeads = existingLeads.map(l => ({
          name: `${l.first_name} ${l.scraped_data?.last_name || ''}`.trim(),
          email: l.email,
          position: l.scraped_data?.position || '',
          isDecisionMaker: l.scraped_data?.is_decision_maker || false
        }));

        return {
          success: true,
          message: `💡 Recuperados ${existingLeads.length} leads de la base de datos para ${cleanDomain} (sin consumir créditos de Hunter.io).`,
          totalFound: existingLeads.length,
          personalFound: existingLeads.length,
          insertedCount: 0,
          leads: formattedLeads
        };
      }
    } catch (cacheErr) {
      console.error('Error consultando caché en Supabase:', cacheErr);
    }

    if (!HUNTER_API_KEY) {
      return { error: 'HUNTER_API_KEY no está configurada en las variables de entorno de Vercel' };
    }
    const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(cleanDomain)}&api_key=${HUNTER_API_KEY}`;
    const response = await fetch(hunterUrl);

    if (!response.ok) {
      const errText = await response.text();
      return { error: `Hunter.io API error: ${response.status} - ${errText}` };
    }

    const json = await response.json();
    const hunterData = json.data;

    if (!hunterData || !hunterData.emails || hunterData.emails.length === 0) {
      return { success: true, message: `No se encontraron correos para ${cleanDomain}`, insertedCount: 0 };
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

    // Take up to 2 best personal leads (decision-makers first) to maximize Hunter.io credit value and prevent credit drain
    const topLeads = scored.slice(0, 2);

    if (topLeads.length === 0) {
      return { success: true, message: `Se encontraron ${hunterData.emails.length} emails en ${cleanDomain} pero ninguno personal de un decisor`, insertedCount: 0 };
    }

    let insertedCount = 0;
    const insertedLeads = [];

    for (const lead of topLeads) {
      // Check if email already exists in Supabase to determine true novelty
      try {
        const { data: alreadyExists, error: emailCheckError } = await supabase
          .from('outreach_leads')
          .select('id')
          .eq('email', lead.value)
          .maybeSingle();

        if (!emailCheckError && alreadyExists) {
          console.log(`[Duplicate Lead] Lead email ${lead.value} ya existe en Supabase. Omitiendo de nuevos registros.`);
          continue; // Skip counting this as a new insert
        }
      } catch (checkErr) {
        console.error('Error verificando email duplicado:', checkErr);
      }

      const leadToInsert = {
        email: lead.value,
        first_name: lead.first_name || '',
        company_name: hunterData.organization || cleanDomain.split('.')[0],
        website: `https://${cleanDomain}`,
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
      ? `✅ Se encontraron e insertaron ${insertedCount} leads en ${cleanDomain} (ej: ${firstLead.name || ''} - ${firstLead.email || ''})`
      : `⚠️ Se encontraron leads en ${cleanDomain} pero ya existían en la base de datos (0 nuevos registrados).`;

    let hunter_credits_used = 0;
    let hunter_credits_limit = 50;
    if (HUNTER_API_KEY) {
      try {
        const hRes = await fetch(`https://api.hunter.io/v2/account?api_key=${HUNTER_API_KEY}`);
        if (hRes.ok) {
          const hJson = await hRes.json();
          if (hJson.data && hJson.data.requests) {
            hunter_credits_used = hJson.data.requests.searches.used;
            hunter_credits_limit = hJson.data.requests.searches.limit;
          }
        }
      } catch (err) {
        console.error('Error fetching Hunter account credits:', err);
      }
    }

    return {
      success: true,
      message,
      totalFound: hunterData.emails.length,
      personalFound: personalEmails.length,
      insertedCount,
      leads: insertedLeads,
      hunter_credits_used,
      hunter_credits_limit
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
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
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

  const { message, history, action, mode } = req.body || {};
  if (action === 'get_credits') {
    let hunter_credits_used = 0;
    let hunter_credits_limit = 50;
    if (HUNTER_API_KEY) {
      try {
        const hRes = await fetch(`https://api.hunter.io/v2/account?api_key=${HUNTER_API_KEY}`);
        if (hRes.ok) {
          const hJson = await hRes.json();
          if (hJson.data && hJson.data.requests) {
            hunter_credits_used = hJson.data.requests.searches.used;
            hunter_credits_limit = hJson.data.requests.searches.limit;
          }
        }
      } catch (err) {
        console.error('Error fetching Hunter account credits:', err);
      }
    }
    return res.status(200).json({
      hunter_credits_used,
      hunter_credits_limit
    });
  }

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
Tu tono de voz es cercano, directo, amigable (tuteando, ej: "¡Hola! Claro, ahora mismo busco leads...") y extremadamente resolutivo. Evita formalidades and rodeos cliché.

REGLAS CRÍTICAS PARA BÚSQUEDA DE LEADS:
- **FILTRO GEOGRÁFICO OBLIGATORIO**: Si el usuario te pide buscar leads de un sector, industria o deporte en España pero NO indica la ubicación geográfica (provincia, región o Comunidad Autónoma), DEBES responder primero preguntando amablemente en qué zona o región desea buscar (ej: "¿En qué provincia o Comunidad Autónoma te gustaría realizar la búsqueda?") y DETENER la ejecución sin llamar a ninguna herramienta. NUNCA asumas una región por defecto (como Baleares o Cataluña) si no ha sido explícitamente especificada por el usuario.
- La herramienta searchLeads busca en Hunter.io por DOMINIO WEB concreto (ej: stripe.com, gestoriaperez.com).
- Si el usuario te pide leads de una INDUSTRIA, SECTOR, TIPO DE NEGOCIO o DEPORTE (ej: "gestorías", "baloncesto", "fútbol", "abogados", etc.):
  - Tu objetivo absoluto es encontrar, registrar y acumular un total de **10 NUEVOS leads** en la base de datos (es decir, leads cuyo 'insertedCount' en la respuesta de la herramienta 'searchLeads' sea mayor que 0).
  - Los leads recuperados que ya existían o que eran duplicados devuelven 'insertedCount: 0' en la herramienta. **Estos leads con insertedCount de 0 NO cuentan para tu cuota de 10 nuevos leads.**
  - Para garantizar que completas la cuota de 10 leads nuevos en una sola interacción y previenes el consumo excesivo de créditos de la API (extrayendo un máximo de 2 leads por dominio), **debes identificar y buscar en hasta 5 dominios diferentes en paralelo desde tu primera llamada a herramientas** (2 leads × 5 dominios = 10 leads).
  - Si se trata de un DEPORTE (ej: "baloncesto", "fútbol", "balonmano", "voleibol", "hockey", etc.) en una región, provincia o comunidad autónoma de España:
    * Para asegurar que encuentras suficientes leads cualificados y aprovechas la densidad deportiva real de cada zona (como los 60+ clubes de baloncesto en Baleares), **debes seguir un orden jerárquico estricto de búsqueda de arriba a abajo (ACB -> Ligas FEB -> Regionales/Amateur)**.
    * Genera y busca en paralelo los dominios web correspondientes a estas categorías en orden de prioridad:
      * **Prioridad 1 (Élite / Profesional - Primera División):** Clubes de primera división (ej: ACB en baloncesto, LaLiga EA Sports en fútbol, ASOBAL en balonmano).
      * **Prioridad 2 (Plata - Segunda División):** Clubes de segunda división (ej: Primera FEB / LEB Oro en baloncesto, LaLiga Hypermotion en fútbol).
      * **Prioridad 3 (Bronce / Desarrollo - Tercera División):** Clubes de tercera división (ej: Segunda FEB / LEB Plata o Tercera FEB / EBA en baloncesto, Primera RFEF / Segunda RFEF en fútbol).
      * **Prioridad 4 (Amateur / Ligas Regionales / Cantera / Federaciones):** Clubes locales amateur, escuelas base o federaciones regionales de la zona (ej: federación autonómica de la región y clubes locales base como "basquetmanacor.com", "cbsantjosep.net", "cbbahia.com", "basquetciutadella.com", etc.).
    * Aplica esta misma estrategia jerárquica de niveles para **cualquier otro deporte** que te soliciten en España.
  - Para tu conveniencia, aquí tienes una lista de referencia de dominios de clubes profesionales y federaciones por Comunidad Autónoma:
    * **Cataluña / Catalunya:** "joventutbadalona.com", "basquetgirona.com", "basquetmanresa.com", "basquetcatala.cat", "barcabasket.cat" (o "fcbarcelona.cat")
    * **Galicia:** "obradoirocab.com", "cbbreogan.com", "leycoruna.com", "basquetcoruna.com", "celtabaloncesto.com"
    * **Madrid / Comunidad de Madrid:** "movistarestudiantes.com", "baloncestofuenlabrada.com", "realmadrid.com", "clubestudiantes.com", "fbm.es"
    * **Andalucía:** "unicajabaloncesto.com", "cbgranada.com", "realbetisbaloncesto.com", "cdcoviran.es", "andaluzabaloncesto.org"
    * **País Vasco / Euskadi:** "baskonia.com", "bilbaobasket.biz", "gipuzkoabasket.com", "iraurgisb.com"
    * **Comunidad Valenciana:** "valenciabasket.com", "lucentumalicante.es", "taucastello.com", "fbcv.es"
    * **Canarias:** "cbgrancanaria.net", "cbcanarias.net", "rcnautico.es"
    * **Aragón:** "casademontzaragoza.es", "cbpenas.com"
    * **Islas Baleares / Illes Balears:** "bahiasanagustin.es", "basquetmenorca.com", "palmacompeticion.com", "fbib.es", "basquetcalvia.com", "cbsantjosep.net", "basquetmanacor.com"
  - Si te piden un sector genérico no deportivo (ej: "gestorías" o "abogados") y especifican una comunidad, usa dominios reales locales de ese sector en esa región, o bien busca colegios profesionales oficiales de ese sector en esa comunidad (ej: "colegioabogadosmadrid.com", "gestoresmadrid.org", "colegiodigestores.com", "icab.cat", etc.).
  - Si tras recibir las respuestas de las herramientas ves que la suma total de 'insertedCount' de todas las búsquedas es menor que 10, **tú debes seleccionar de forma automática nuevos dominios alternativos adicionales de las categorías inferiores (Prioridades 3 y 4, clubes locales/regionales) y ejecutar más búsquedas en paralelo inmediatamente sin parar ni preguntar al usuario**, repitiendo este ciclo hasta registrar los 10 nuevos leads exitosamente.
  - **REGLA DE AGOTAMIENTO Y REGIONES PEQUEÑAS**: Si has agotado todos los dominios de todas las prioridades (incluyendo clubes de base/regionales y la propia federación) y no es posible alcanzar los 10 nuevos leads debido a la limitación extrema del mercado, **NO te quedes en un bucle ni sigas buscando infinitamente**. En ese caso, detente, presenta los leads que hayas logrado registrar y **explícales al usuario con orgullo y cercanía que la región tiene un mercado deportivo reducido en esa disciplina, proponiéndole de forma proactiva continuar la búsqueda en comunidades autónomas vecinas o con mayor volumen (ej: "¡Hola! En esta provincia/comunidad he agotado las opciones y he registrado X leads nuevos. ¿Quieres que busque en otra comunidad autónoma con mayor volumen para completar los 10 decisores?")**.
  - NUNCA hagas preguntas al usuario ni sugieras acciones intermedias (como "¿quieres que siga buscando?" o "¿quieres enriquecer?") hasta que no hayas completado exitosamente la cuota de 10 nuevos leads ('sum(insertedCount) >= 10') o hayas activado la REGLAS DE AGOTAMIENTO Y REGIONES PEQUEÑAS. Solo en esos dos casos darás tu respuesta final.
  - NUNCA digas "necesito un dominio concreto". SIEMPRE identifica dominios reales tú mismo y ejecuta la búsqueda directamente.

OTRAS HERRAMIENTAS:
- Si te piden enriquecer un lead, usa enrichLead.
- Si te piden enviar un email o secuencia, usa sendSequence.
- Si te piden estadísticas, usa getOutboxStats.
- Si te piden listar leads, usa listLeads.

REGLA DE ADVERTENCIA DE CRÉDITOS:
- Siempre que el usuario te pida buscar leads o consultar estadísticas, revisa los datos de créditos retornados por las herramientas ('hunter_credits_used' y 'hunter_credits_limit').
- Si los créditos consumidos superan el 80% del límite total (es decir, si quedan menos de 10 créditos libres de los 50 mensuales), DEBES inyectar una advertencia proactiva y visible al final de tu respuesta (ej: "⚠️ **Aviso del Sistema**: Nos estamos acercando al límite mensual de créditos de Hunter.io (X/50 usados). Por favor, tenlo en cuenta para no agotar la cuota de prospección.").` }]
    };

    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    let loopCount = 0;
    const maxLoops = 5;
    let lastActionExecuted = null;
    let lastAgentUsed = null;
    let finalOutputText = null;

    while (loopCount < maxLoops) {
      console.log(`[Loop ${loopCount}] Enviando petición a Gemini...`);
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
      console.log(`[Loop ${loopCount}] Respuesta de Gemini recibida. Claves:`, Object.keys(geminiJson));

      const candidate = geminiJson.candidates && geminiJson.candidates[0];
      if (!candidate || !candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        console.error(`[Loop ${loopCount}] Gemini devolvió un candidato vacío o inválido:`, JSON.stringify(geminiJson).substring(0, 500));
        finalOutputText = '⚠️ El Cerebro no pudo procesar la respuesta de Gemini. Intenta reformular tu petición.';
        break;
      }

      const allParts = candidate.content.parts;
      const functionCalls = allParts.filter(p => p.functionCall).map(p => p.functionCall);

      // If there are no function calls, extract text and break out of the loop
      if (functionCalls.length === 0) {
        for (const part of allParts) {
          if (part.text && !part.thought) {
            finalOutputText = part.text;
          }
        }
        if (!finalOutputText) {
          finalOutputText = '🤔 El Cerebro procesó tu mensaje pero no generó respuesta de texto. Intenta reformularlo.';
        }
        console.log(`[Loop ${loopCount}] Respuesta final de texto obtenida. Saliendo del bucle.`);
        break;
      }

      // We have one or more function calls to execute
      console.log(`[Loop ${loopCount}] El Cerebro detectó ${functionCalls.length} llamadas paralelas.`);
      
      const firstCall = functionCalls[0];
      lastActionExecuted = firstCall.name;
      lastAgentUsed = agentMap[firstCall.name] || null;

      const functionResponseParts = await Promise.all(functionCalls.map(async (fCall) => {
        const { name, args } = fCall;
        console.log(`[Loop ${loopCount}] Delegando al agente [${agentMap[name] || 'unknown'}] → ${name}`, args);
        
        const implementation = implementations[name];
        let toolResult;
        if (!implementation) {
          toolResult = { error: `La función "${name}" no está implementada.` };
        } else {
          try {
            toolResult = await implementation(args || {});
          } catch (implErr) {
            console.error(`[Loop ${loopCount}] Error ejecutando ${name}:`, implErr);
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

      // Append model call and tool responses to the conversation context
      contents.push(candidate.content);
      contents.push({
        role: 'user',
        parts: functionResponseParts
      });

      loopCount++;
    }

    if (loopCount >= maxLoops && !finalOutputText) {
      finalOutputText = `⚠️ Se ha alcanzado el límite máximo de iteraciones (${maxLoops}) sin obtener una respuesta final de texto. Por favor, intenta de nuevo o simplifica la consulta.`;
    }

    return res.status(200).json({
      role: 'model',
      text: finalOutputText,
      actionExecuted: lastActionExecuted,
      agentUsed: lastAgentUsed
    });

  } catch (error) {
    console.error('Brain chat error:', error);
    return res.status(500).json({ error: error.message || 'Error interno del cerebro' });
  }
};
