// /api/scrape-enrich.js
// Vercel serverless function: scrapes a lead's website and uses Gemini 3.5 Flash to generate a personalized icebreaker

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uidilhuybmtuokunutgz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpZGlsaHV5Ym10dW9rdW51dGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDU0NTAsImV4cCI6MjA5MTQyMTQ1MH0.ir9FnuHhW_1i4OslE_SNbOCIgLUEWakScP71WYqnfJM';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDy3zdb67ICMuhrU0qmaAMnztDPFT09Z24';

function extractText(html) {
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
}

function extractSocials(html) {
  const linkedinRegex = /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9-_\.\/\?=&]+/gi;
  const twitterRegex = /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9-_]+/gi;

  const linkedinMatch = html.match(linkedinRegex);
  const twitterMatch = html.match(twitterRegex);

  return {
    linkedin: linkedinMatch ? linkedinMatch[0] : null,
    twitter: twitterMatch ? twitterMatch[0] : null
  };
}

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

  const { lead_id } = req.body || {};
  if (!lead_id) {
    return res.status(400).json({ error: 'Falta el lead_id' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // 1. Obtener lead
    const { data: lead, error: getErr } = await supabase
      .from('outreach_leads')
      .select('*')
      .eq('id', lead_id)
      .single();

    if (getErr || !lead) {
      throw new Error(`Lead no encontrado: ${getErr ? getErr.message : ''}`);
    }

    if (!lead.website) {
      throw new Error('El lead no tiene un sitio web configurado');
    }

    // Actualizar estado a 'enriching'
    await supabase.from('outreach_leads').update({ status: 'enriching' }).eq('id', lead.id);

    // 2. Raspar la web
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

    // 3. Consultar a Gemini 3.5 Flash
    let icebreaker = `Hola ${lead.first_name || 'allí'},\n\nEstuve revisando vuestra web de ${lead.company_name} y veo que hacéis un trabajo excelente.`;
    let geminiAnalysis = {};

    if (scrapedText) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      
      const prompt = `Analiza los siguientes datos extraídos del sitio web de la empresa "${lead.company_name}":
---
${scrapedText}
---

Tu objetivo es redactar un "icebreaker" (rompehielos) comercial en ESPAÑOL que sea ultra-personalizado, directo y cercano (tuteando). Debe sonar natural, escrito por un humano real, sin rodeos formales ni frases cliché (nada de "Espero que te encuentres bien" o "Me pongo en contacto contigo"). 

Debe enlazar directamente lo que hace su empresa con un dolor o mejora en Captación de Clientes, Productividad o Automatización gracias a la Inteligencia Artificial + nosotros.

Genera una respuesta en formato JSON estrictamente válido con los siguientes campos:
{
  "icebreaker": "Una sola frase directa y cercana conectando con su web (ej: Veo que en {empresa} ayudáis a {su cliente} con {servicio}, y estaba pensando que...",
  "company_value_prop": "Breve resumen de la propuesta de valor detectada en su web.",
  "pain_points": "Dolores o áreas de automatización e IA recomendadas para su tipo de negocio."
}`;

      const geminiRes = await fetch(geminiUrl, {
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

    // 4. Guardar datos en Supabase
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

    const { error: updateErr } = await supabase
      .from('outreach_leads')
      .update(updateData)
      .eq('id', lead.id);

    if (updateErr) throw updateErr;

    return res.status(200).json({
      success: true,
      lead_id: lead.id,
      icebreaker,
      linkedin: socialLinks.linkedin,
      company_value_prop: geminiAnalysis.company_value_prop || 'No detectada'
    });

  } catch (error) {
    console.error('Enrichment error:', error);
    if (lead_id) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      await supabase.from('outreach_leads').update({ status: 'lead' }).eq('id', lead_id).catch(() => {});
    }
    return res.status(500).json({ error: error.message || 'Error interno' });
  }
};
