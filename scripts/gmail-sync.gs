// ======================================
// 📬 CRM Gmail Sync — Google Apps Script
// ======================================
// Sincroniza respuestas de email de Gmail → Supabase
// Se ejecuta cada 5 minutos via trigger automático
//
// CONFIGURACIÓN:
// 1. Pon tu SUPABASE_URL y SUPABASE_KEY abajo
// 2. Ejecuta syncGmailReplies() manualmente la primera vez
// 3. Configura un trigger "cada 5 minutos"
// ======================================

// ── CONFIGURACIÓN ──────────────────────
const SUPABASE_URL = 'https://lmozoetpehmdxxremtqn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtb3pvZXRwZWhtZHh4cmVtdHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTA2NDUsImV4cCI6MjA5NTgyNjY0NX0.1xkCCw7q9CDvVbqGswCeFwXpgYfMtb0wcl7lHWlKQ8U';

// Emails que envías TÚ (para excluirlos de las "respuestas")
const MY_EMAILS = [
  'gerard@gerardfanals.com',
  'gerard@iadebarrio.com',
  // Añade otros emails que uses para enviar
];

// Etiqueta de Gmail para marcar emails ya sincronizados
const LABEL_SYNCED = 'CRM_Synced';

// Cuántos hilos revisar como máximo por ejecución
const MAX_THREADS = 50;

// ── FUNCIÓN PRINCIPAL ──────────────────

function syncGmailReplies() {
  console.log('🔄 Iniciando sincronización de Gmail...');
  
  // 1. Primero cargar TODOS los emails de leads conocidos desde Supabase
  const knownLeadEmails = fetchAllLeadEmails();
  if (knownLeadEmails.length === 0) {
    console.log('⚠️ No hay leads en la base de datos. Nada que sincronizar.');
    return;
  }
  console.log(`👥 ${knownLeadEmails.length} leads conocidos cargados`);
  
  const label = getOrCreateLabel(LABEL_SYNCED);
  
  // 2. Buscar emails recibidos en los últimos 2 días que NO tengan la etiqueta CRM_Synced
  const query = `is:inbox newer_than:2d -label:${LABEL_SYNCED} -from:me`;
  const threads = GmailApp.search(query, 0, MAX_THREADS);
  
  console.log(`📨 Encontrados ${threads.length} hilos nuevos`);
  
  let synced = 0;
  let skipped = 0;
  let errors = 0;
  
  // Crear un Set para búsqueda rápida
  const leadEmailSet = new Set(knownLeadEmails.map(e => e.email.toLowerCase()));
  const leadEmailToId = {};
  knownLeadEmails.forEach(e => { leadEmailToId[e.email.toLowerCase()] = e.id; });
  
  for (const thread of threads) {
    try {
      const messages = thread.getMessages();
      let threadHasLeadReply = false;
      
      for (const msg of messages) {
        const fromEmail = extractEmail(msg.getFrom());
        const fromLower = fromEmail.toLowerCase();
        
        // Saltar si es un email enviado por mí
        if (MY_EMAILS.some(e => fromLower === e.toLowerCase())) continue;
        
        // ✅ SOLO sincronizar si el remitente es un lead conocido
        if (!leadEmailSet.has(fromLower)) {
          continue; // No es un lead → ignorar
        }
        
        threadHasLeadReply = true;
        
        const payload = {
          from_email: fromEmail,
          from_name: extractName(msg.getFrom()),
          to_email: extractEmail(msg.getTo()),
          subject: msg.getSubject(),
          body: msg.getPlainBody().substring(0, 50000),
          body_html: msg.getBody().substring(0, 100000),
          received_at: msg.getDate().toISOString(),
          gmail_message_id: msg.getId(),
          gmail_thread_id: thread.getId(),
          is_read: !msg.isUnread(),
          lead_id: leadEmailToId[fromLower] || null
        };
        
        const success = upsertToSupabase('email_replies', payload);
        if (success) {
          synced++;
        } else {
          errors++;
        }
      }
      
      if (!threadHasLeadReply) skipped++;
      
      // Marcar el hilo como procesado (para no revisarlo de nuevo)
      thread.addLabel(label);
      
    } catch (e) {
      console.error(`❌ Error procesando hilo: ${e.message}`);
      errors++;
    }
  }
  
  console.log(`✅ Sincronización completada: ${synced} respuestas de leads, ${skipped} hilos ignorados (no son leads), ${errors} errores`);
}

// ── FUNCIONES AUXILIARES ──────────────────

function fetchAllLeadEmails() {
  try {
    const response = UrlFetchApp.fetch(
      `${SUPABASE_URL}/rest/v1/outreach_leads?select=id,email&email=not.is.null`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        muteHttpExceptions: true
      }
    );
    
    const code = response.getResponseCode();
    if (code === 200) {
      const results = JSON.parse(response.getContentText());
      return results.filter(r => r.email && r.email.trim());
    }
  } catch (e) {
    console.error(`❌ Error cargando leads: ${e.message}`);
  }
  return [];
}

function upsertToSupabase(table, data) {
  try {
    const response = UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      payload: JSON.stringify(data),
      muteHttpExceptions: true
    });
    
    const code = response.getResponseCode();
    if (code >= 200 && code < 300) {
      return true;
    } else if (code === 409) {
      // Duplicate — already synced
      console.log(`⏭️ Email ya sincronizado: ${data.gmail_message_id}`);
      return true;
    } else {
      console.error(`❌ Supabase error ${code}: ${response.getContentText()}`);
      return false;
    }
  } catch (e) {
    console.error(`❌ Error enviando a Supabase: ${e.message}`);
    return false;
  }
}

function findLeadByEmail(email) {
  try {
    const response = UrlFetchApp.fetch(
      `${SUPABASE_URL}/rest/v1/outreach_leads?email=eq.${encodeURIComponent(email)}&select=id&limit=1`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        muteHttpExceptions: true
      }
    );
    
    const code = response.getResponseCode();
    if (code === 200) {
      const results = JSON.parse(response.getContentText());
      if (results.length > 0) return results[0].id;
    }
  } catch (e) {
    // No pasa nada si no encontramos el lead
  }
  return null;
}

function extractEmail(fromStr) {
  const match = fromStr.match(/<(.+?)>/);
  return match ? match[1].trim() : fromStr.trim();
}

function extractName(fromStr) {
  const match = fromStr.match(/^"?([^"<]+)"?\s*</);
  return match ? match[1].trim() : '';
}

function getOrCreateLabel(name) {
  let label = GmailApp.getUserLabelByName(name);
  if (!label) {
    label = GmailApp.createLabel(name);
    console.log(`🏷️ Etiqueta "${name}" creada en Gmail`);
  }
  return label;
}

// ── TEST MANUAL ──────────────────

function testConnection() {
  // Ejecuta esta función para verificar que la conexión a Supabase funciona
  try {
    const response = UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/email_replies?select=count&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'count=exact'
      },
      muteHttpExceptions: true
    });
    
    const code = response.getResponseCode();
    if (code === 200) {
      console.log('✅ Conexión a Supabase OK');
      console.log('Respuesta:', response.getContentText());
    } else {
      console.error(`❌ Error ${code}: ${response.getContentText()}`);
    }
  } catch (e) {
    console.error(`❌ Error de conexión: ${e.message}`);
  }
}

// ── RESET (usar solo si hay problemas) ──

function resetSyncLabel() {
  // Quita la etiqueta CRM_Synced de todos los hilos para re-sincronizar
  const label = GmailApp.getUserLabelByName(LABEL_SYNCED);
  if (!label) { console.log('No hay etiqueta que borrar'); return; }
  
  const threads = label.getThreads();
  console.log(`Quitando etiqueta de ${threads.length} hilos...`);
  for (const t of threads) {
    t.removeLabel(label);
  }
  console.log('✅ Reset completado');
}
