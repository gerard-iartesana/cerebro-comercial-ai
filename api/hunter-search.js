// /api/hunter-search.js
// Vercel serverless function: searches for leads via Hunter.io and imports them into Supabase

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lmozoetpehmdxxremtqn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtb3pvZXRwZWhtZHh4cmVtdHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTA2NDUsImV4cCI6MjA5NTgyNjY0NX0.1xkCCw7q9CDvVbqGswCeFwXpgYfMtb0wcl7lHWlKQ8U';
const HUNTER_API_KEY = process.env.HUNTER_API_KEY;

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

  const { domain } = req.body || {};
  if (!domain) {
    return res.status(400).json({ error: 'Falta el parámetro domain' });
  }

  if (!HUNTER_API_KEY) {
    return res.status(500).json({ error: 'HUNTER_API_KEY no está configurada' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // 1. Llamar a Hunter.io API
    const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${HUNTER_API_KEY}`;
    const response = await fetch(hunterUrl);
    
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Hunter.io API error: ${response.status} - ${errText}`);
    }

    const json = await response.json();
    const hunterData = json.data;

    if (!hunterData || !hunterData.emails || hunterData.emails.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No se encontraron correos para el dominio ${domain}`,
        insertedCount: 0
      });
    }

    // 2. Filter: only personal emails from decision-makers
    const personalEmails = hunterData.emails.filter(e => {
      if (e.type === 'generic') return false;
      if (!e.first_name || e.first_name.trim() === '') return false;
      const genericPatterns = /^(info|admin|contact|hello|hola|ventas|sales|support|soporte|comunicacion|rrhh|marketing|facturacion|subvenciones|contabilidad|recepcion|prensa)@/i;
      if (genericPatterns.test(e.value)) return false;
      return true;
    });

    // Prioritize decision-makers
    const decisionMakerKeywords = /\b(ceo|cto|cfo|coo|cmo|founder|fundador|director|directora|gerente|responsable|socio|socia|partner|owner|propietario|propietaria|manager|jefe|jefa|presidente|presidenta|consejero|consejera)\b/i;
    
    const scored = personalEmails.map(e => ({
      ...e,
      isDecisionMaker: decisionMakerKeywords.test(e.position || ''),
      score: (decisionMakerKeywords.test(e.position || '') ? 100 : 0) + (e.confidence || 0)
    }));
    scored.sort((a, b) => b.score - a.score);

    // Take only the best lead per domain
    const bestLead = scored[0];

    if (!bestLead) {
      return res.status(200).json({
        success: true,
        message: `Se encontraron ${hunterData.emails.length} emails en ${domain} pero ninguno personal de un decisor`,
        insertedCount: 0
      });
    }

    const leadToInsert = {
      email: bestLead.value,
      first_name: bestLead.first_name || '',
      company_name: hunterData.organization || domain.split('.')[0],
      website: `https://${domain}`,
      linkedin_url: bestLead.linkedin || '',
      status: 'lead',
      sequence_step: 0,
      scraped_data: {
        position: bestLead.position || '',
        confidence: bestLead.confidence || 0,
        is_decision_maker: bestLead.isDecisionMaker,
        source: 'hunter.io',
        last_name: bestLead.last_name || ''
      }
    };

    const { error } = await supabase
      .from('outreach_leads')
      .upsert(leadToInsert, { onConflict: 'email', ignoreDuplicates: true });

    return res.status(200).json({
      success: true,
      message: `Mejor lead de ${domain}: ${bestLead.first_name} ${bestLead.last_name || ''} (${bestLead.position || 'sin cargo'})`,
      totalFound: hunterData.emails.length,
      personalFound: personalEmails.length,
      insertedCount: error ? 0 : 1,
      bestLead: { name: `${bestLead.first_name} ${bestLead.last_name || ''}`, email: bestLead.value, position: bestLead.position || '' }
    });

  } catch (error) {
    console.error('Hunter search error:', error);
    return res.status(500).json({ error: error.message || 'Error interno' });
  }
};
