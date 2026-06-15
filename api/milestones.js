// /api/milestones.js
// Handles creating a client milestone in Supabase and syncing it to Google Calendar on the backend

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lmozoetpehmdxxremtqn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // ==========================================
  // DELETE METHOD: DELETE MILESTONE & GCAL EVENT
  // ==========================================
  if (req.method === 'DELETE') {
    const { id } = req.query || {};
    if (!id) {
      return res.status(400).json({ error: 'El ID del hito es obligatorio.' });
    }

    try {
      // 1. Fetch the milestone to get the gcal_event_id
      const { data: milestone, error: fetchErr } = await supabase
        .from('client_milestones')
        .select('gcal_event_id, room_id')
        .eq('id', id)
        .single();

      if (fetchErr || !milestone) {
        return res.status(404).json({ error: 'Hito no encontrado.' });
      }

      // 2. If it has a Google Calendar Event ID, delete it
      if (milestone.gcal_event_id) {
        const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

        if (refreshToken && clientId && clientSecret) {
          try {
            // Get access token
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
              const deleteRes = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${milestone.gcal_event_id}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Authorization': 'Bearer ' + tokenData.access_token
                  }
                }
              );

              if (deleteRes.ok) {
                console.log('[GCal Milestone Sync] Event deleted successfully:', milestone.gcal_event_id);
              } else {
                const deleteErrText = await deleteRes.text();
                console.warn('[GCal Milestone Sync] Failed to delete event:', deleteRes.status, deleteErrText);
              }
            }
          } catch (gcalErr) {
            console.error('[GCal Milestone Sync] Error deleting Google Calendar event:', gcalErr);
          }
        }
      }

      // 3. Delete from Supabase
      const { error: deleteErr } = await supabase
        .from('client_milestones')
        .delete()
        .eq('id', id);

      if (deleteErr) throw deleteErr;

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('[DB Delete Error] Failed to delete milestone:', err);
      return res.status(500).json({
        success: false,
        error: 'Error de base de datos: ' + err.message
      });
    }
  }

  // ==========================================
  // POST METHOD: CREATE MILESTONE & GCAL EVENT
  // ==========================================
  if (req.method === 'POST') {
    const {
      room_id,
      title,
      date,
      status
    } = req.body || {};

    if (!room_id || !title || !date) {
      return res.status(400).json({ error: 'Sala, título y fecha son obligatorios.' });
    }

    let gcalEventId = null;

    // Fetch Lead Name from chat_rooms
    let leadName = 'Cliente';
    try {
      const { data: roomData, error: roomErr } = await supabase
        .from('chat_rooms')
        .select('lead_name')
        .eq('id', room_id)
        .single();
      if (!roomErr && roomData) {
        leadName = roomData.lead_name || 'Cliente';
      }
    } catch (err) {
      console.error('[GCal Milestone Sync] Error fetching room details:', err);
    }

    // Sync to Google Calendar if credentials exist
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    if (refreshToken && clientId && clientSecret) {
      try {
        // Get access token
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
          const start = new Date(date);
          const end = new Date(start.getTime() + 30 * 60000); // Milestones default to 30 mins

          const event = {
            summary: `🚩 Hito: ${leadName} - ${title}`,
            description: `Hito / Fecha de interés programada para el cliente ${leadName} desde el panel.`,
            start: { dateTime: start.toISOString(), timeZone: 'Europe/Madrid' },
            end: { dateTime: end.toISOString(), timeZone: 'Europe/Madrid' }
          };

          // Create event in Google Calendar
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
            console.log('[GCal Milestone Sync] Event created successfully:', gcalEventId);
          } else {
            const gcalErrorText = await gcalRes.text();
            console.error('[GCal Milestone Sync] Failed to create event in Google Calendar:', gcalRes.status, gcalErrorText);
          }
        } else {
          console.error('[GCal Milestone Sync] Failed to get access token from refresh token:', tokenData);
        }
      } catch (gcalErr) {
        console.error('[GCal Milestone Sync] Error during Google Calendar integration:', gcalErr);
      }
    } else {
      console.log('[GCal Milestone Sync] Credentials missing on backend, skipping Google Calendar sync');
    }

    // Insert milestone into Supabase
    try {
      const insertData = {
        room_id,
        title,
        date,
        status: status || 'pending'
      };
      if (gcalEventId) {
        insertData.gcal_event_id = gcalEventId;
      }

      const { data, error } = await supabase
        .from('client_milestones')
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
      console.error('[DB Insert Error] Failed to insert milestone in Supabase:', dbErr);
      return res.status(500).json({
        success: false,
        error: 'Error de base de datos: ' + dbErr.message
      });
    }
  }

  // ==========================================
  // PATCH METHOD: UPDATE MILESTONE STATUS & GCAL SUMMARY
  // ==========================================
  if (req.method === 'PATCH') {
    const { id, status } = req.body || {};
    if (!id || !status) {
      return res.status(400).json({ error: 'El ID y el estado son obligatorios.' });
    }

    try {
      // 1. Fetch milestone
      const { data: milestone, error: fetchErr } = await supabase
        .from('client_milestones')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchErr || !milestone) {
        return res.status(404).json({ error: 'Hito no encontrado.' });
      }

      // Fetch room details for lead name
      let leadName = 'Cliente';
      try {
        const { data: roomData, error: roomErr } = await supabase
          .from('chat_rooms')
          .select('lead_name')
          .eq('id', milestone.room_id)
          .single();
        if (!roomErr && roomData) {
          leadName = roomData.lead_name || 'Cliente';
        }
      } catch (e) {
        console.error('[PATCH GCal Milestone] Error fetching room details:', e);
      }

      // 2. If it has a Google Calendar Event ID, update it
      if (milestone.gcal_event_id) {
        const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

        if (refreshToken && clientId && clientSecret) {
          try {
            // Get access token
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
              let icon = '🚩';
              let statusText = '';
              if (status === 'accepted') { icon = '🤝'; statusText = '(Confirmado)'; }
              else if (status === 'rejected') { icon = '❌'; statusText = '(Rechazado)'; }
              else if (status === 'completed') { icon = '✅'; statusText = '(Completado)'; }

              const summary = `${icon} Hito ${statusText}: ${leadName} - ${milestone.title}`;

              const patchRes = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${milestone.gcal_event_id}`,
                {
                  method: 'PATCH',
                  headers: {
                    'Authorization': 'Bearer ' + tokenData.access_token,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    summary: summary
                  })
                }
              );

              if (patchRes.ok) {
                console.log('[GCal Milestone Sync] Event updated successfully:', milestone.gcal_event_id);
              } else {
                const patchErrText = await patchRes.text();
                console.warn('[GCal Milestone Sync] Failed to update event:', patchRes.status, patchErrText);
              }
            }
          } catch (gcalErr) {
            console.error('[GCal Milestone Sync] Error updating Google Calendar event:', gcalErr);
          }
        }
      }

      // 3. Update status in Supabase
      const { data: updatedMilestone, error: updateErr } = await supabase
        .from('client_milestones')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      return res.status(200).json({ success: true, data: updatedMilestone });
    } catch (err) {
      console.error('[PATCH Error] Failed to update milestone:', err);
      return res.status(500).json({
        success: false,
        error: 'Error de base de datos: ' + err.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
