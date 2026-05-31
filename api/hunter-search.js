// /api/hunter-search.js
// Vercel serverless function: searches for leads via Hunter.io and imports them into Supabase

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uidilhuybmtuokunutgz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpZGlsaHV5Ym10dW9rdW51dGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDU0NTAsImV4cCI6MjA5MTQyMTQ1MH0.ir9FnuHhW_1i4OslE_SNbOCIgLUEWakScP71WYqnfJM';
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

    // 2. Mapear leads e insertar
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
    const errors = [];

    for (const lead of leadsToInsert) {
      try {
        const { error } = await supabase
          .from('outreach_leads')
          .upsert(lead, { onConflict: 'email', ignoreDuplicates: true });

        if (error) {
          errors.push({ email: lead.email, error: error.message });
        } else {
          insertedCount++;
        }
      } catch (err) {
        errors.push({ email: lead.email, error: err.message });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Búsqueda completada para ${domain}`,
      foundCount: hunterData.emails.length,
      insertedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Hunter search error:', error);
    return res.status(500).json({ error: error.message || 'Error interno' });
  }
};
