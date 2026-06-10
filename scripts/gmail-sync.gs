// ======================================
// 📬 CRM Gmail Sync — Google Apps Script
// ======================================

const SUPABASE_URL = 'https://lmozoetpehmdxxremtqn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtb3pvZXRwZWhtZHh4cmVtdHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTA2NDUsImV4cCI6MjA5NTgyNjY0NX0.1xkCCw7q9CDvVbqGswCeFwXpgYfMtb0wcl7lHWlKQ8U';

const MY_EMAILS = [
  'gerard@iartesana.es',
  'hola@gerardfanals.online',
];

const LABEL_SYNCED = 'CRM_Synced';
const MAX_THREADS = 50;

function syncGmailReplies() {
  console.log('Iniciando sincronizacion...');
  
  var sentToEmails = fetchSentEmailRecipients();
  if (sentToEmails.length === 0) {
    console.log('No hay emails enviados desde la app.');
    return;
  }
  console.log(sentToEmails.length + ' destinatarios unicos encontrados en la app');
  
  var sentEmailSet = {};
  for (var i = 0; i < sentToEmails.length; i++) {
    sentEmailSet[sentToEmails[i].toLowerCase()] = true;
  }
  
  var label = getOrCreateLabel(LABEL_SYNCED);
  var query = 'is:inbox newer_than:2d -label:' + LABEL_SYNCED + ' -from:me';
  var threads = GmailApp.search(query, 0, MAX_THREADS);
  
  console.log('Encontrados ' + threads.length + ' hilos nuevos en Gmail');
  
  var synced = 0;
  var skipped = 0;
  var errors = 0;
  
  for (var t = 0; t < threads.length; t++) {
    try {
      var messages = threads[t].getMessages();
      var threadHasReply = false;
      
      for (var m = 0; m < messages.length; m++) {
        var msg = messages[m];
        var fromEmail = extractEmail(msg.getFrom());
        var fromLower = fromEmail.toLowerCase();
        
        if (isMyEmail(fromLower)) continue;
        
        if (!sentEmailSet[fromLower]) continue;
        
        threadHasReply = true;
        
        var payload = {
          from_email: fromEmail,
          from_name: extractName(msg.getFrom()),
          to_email: extractEmail(msg.getTo()),
          subject: msg.getSubject(),
          body: msg.getPlainBody().substring(0, 50000),
          body_html: msg.getBody().substring(0, 100000),
          received_at: msg.getDate().toISOString(),
          gmail_message_id: msg.getId(),
          gmail_thread_id: threads[t].getId(),
          is_read: !msg.isUnread(),
          lead_id: null
        };
        
        if (upsertToSupabase('email_replies', payload)) {
          synced++;
        } else {
          errors++;
        }
      }
      
      if (!threadHasReply) skipped++;
      threads[t].addLabel(label);
      
    } catch (err) {
      console.error('Error: ' + err.message);
      errors++;
    }
  }
  
  console.log('Completado: ' + synced + ' respuestas, ' + skipped + ' ignorados, ' + errors + ' errores');
}

function fetchSentEmailRecipients() {
  try {
    var response = UrlFetchApp.fetch(
      SUPABASE_URL + '/rest/v1/outreach_leads?select=email',
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY
        },
        muteHttpExceptions: true
      }
    );
    if (response.getResponseCode() === 200) {
      var results = JSON.parse(response.getContentText());
      var unique = {};
      for (var i = 0; i < results.length; i++) {
        if (results[i].email && results[i].email.trim()) {
          unique[results[i].email.toLowerCase()] = true;
        }
      }
      return Object.keys(unique);
    }
  } catch (e) {
    console.error('Error cargando destinatarios: ' + e.message);
  }
  return [];
}

function isMyEmail(email) {
  for (var i = 0; i < MY_EMAILS.length; i++) {
    if (email === MY_EMAILS[i].toLowerCase()) return true;
  }
  return false;
}

function upsertToSupabase(table, data) {
  try {
    var response = UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1/' + table, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      payload: JSON.stringify(data),
      muteHttpExceptions: true
    });
    var code = response.getResponseCode();
    if (code >= 200 && code < 300) return true;
    if (code === 409) return true;
    console.error('Supabase error ' + code + ': ' + response.getContentText());
    return false;
  } catch (e) {
    console.error('Error Supabase: ' + e.message);
    return false;
  }
}

function extractEmail(fromStr) {
  var match = fromStr.match(/<(.+?)>/);
  return match ? match[1].trim() : fromStr.trim();
}

function extractName(fromStr) {
  var match = fromStr.match(/^"?([^"<]+)"?\s*</);
  return match ? match[1].trim() : '';
}

function getOrCreateLabel(name) {
  var label = GmailApp.getUserLabelByName(name);
  if (!label) {
    label = GmailApp.createLabel(name);
    console.log('Etiqueta "' + name + '" creada');
  }
  return label;
}

function testConnection() {
  try {
    var response = UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1/email_replies?select=count&limit=1', {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'count=exact'
      },
      muteHttpExceptions: true
    });
    if (response.getResponseCode() === 200) {
      console.log('Conexion a Supabase OK');
      console.log('Respuesta: ' + response.getContentText());
    } else {
      console.error('Error ' + response.getResponseCode() + ': ' + response.getContentText());
    }
  } catch (e) {
    console.error('Error: ' + e.message);
  }
}

function resetSyncLabel() {
  var label = GmailApp.getUserLabelByName(LABEL_SYNCED);
  if (!label) { console.log('No hay etiqueta'); return; }
  var threads = label.getThreads();
  console.log('Quitando etiqueta de ' + threads.length + ' hilos...');
  for (var i = 0; i < threads.length; i++) {
    threads[i].removeLabel(label);
  }
  console.log('Reset completado');
}
