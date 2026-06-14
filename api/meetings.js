// /api/meetings.js
// Handles creating a meeting in Supabase and syncing it to Google Calendar on the backend

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lmozoetpehmdxxremtqn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

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

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const {
    contact_name,
    contact_email,
    contact_phone,
    meeting_date,
    meeting_type,
    status,
    notes,
    source
  } = req.body || {};

  if (!contact_name || !meeting_date) {
    return res.status(400).json({ error: 'Nombre y fecha de reunión son obligatorios.' });
  }

  let gcalEventId = null;

  // Sync to Google Calendar if credentials exist
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  if (refreshToken && clientId && clientSecret) {
    try {
      // 1. Get access token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        }).toString()
      });
      const tokenData = await tokenRes.json();

      if (tokenData.access_token) {
        // 2. Format start and end date
        const start = new Date(meeting_date);
        const end = new Date(start.getTime() + 60 * 60000); // Default to 60 minutes duration

        const event = {
          summary: 'Reunión con ' + contact_name,
          description: notes || '',
          start: { dateTime: start.toISOString(), timeZone: 'Europe/Madrid' },
          end: { dateTime: end.toISOString(), timeZone: 'Europe/Madrid' }
        };
        if (contact_email) {
          event.attendees = [{ email: contact_email }];
        }

        // 3. Create event in Google Calendar
        const gcalRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + tokenData.access_token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        });

        if (gcalRes.ok) {
          const gcalData = await gcalRes.json();
          gcalEventId = gcalData.id;
          console.log('[GCal Backend Sync] Event created successfully:', gcalEventId);
        } else {
          const gcalErrorText = await gcalRes.text();
          console.error('[GCal Backend Sync] Failed to create event in Google Calendar:', gcalRes.status, gcalErrorText);
        }
      } else {
        console.error('[GCal Backend Sync] Failed to get access token from refresh token:', tokenData);
      }
    } catch (gcalErr) {
      console.error('[GCal Backend Sync] Error during Google Calendar integration:', gcalErr);
    }
  } else {
    console.log('[GCal Backend Sync] Credentials missing on backend, skipping Google Calendar sync');
  }

  // Insert meeting into Supabase
  try {
    const insertData = {
      contact_name,
      contact_email: contact_email || null,
      contact_phone: contact_phone || null,
      meeting_date,
      meeting_type: meeting_type || 'discovery',
      status: status || 'pending',
      notes: notes || null,
      source: source || 'manual'
    };
    if (gcalEventId) {
      insertData.gcal_event_id = gcalEventId;
    }

    const { data, error } = await supabase
      .from('meetings')
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data,
      gcal_synced: !!gcalEventId
    });
  } catch (dbErr) {
    console.error('[DB Insert Error] Failed to insert meeting in Supabase:', dbErr);
    return res.status(500).json({
      success: false,
      error: 'Error de base de datos: ' + dbErr.message
    });
  }
};
