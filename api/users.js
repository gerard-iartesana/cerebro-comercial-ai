// /api/users.js
// Vercel serverless function: CRUD operations for dashboard_users table

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lmozoetpehmdxxremtqn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtb3pvZXRwZWhtZHh4cmVtdHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTA2NDUsImV4cCI6MjA5NTgyNjY0NX0.1xkCCw7q9CDvVbqGswCeFwXpgYfMtb0wcl7lHWlKQ8U';

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // ── GET: List all users ──────────────────────────────────────────────
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('dashboard_users')
        .select('id, username, email, role, modules, is_active, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true, users: data });
    }

    // ── POST: Create a new user ──────────────────────────────────────────
    if (req.method === 'POST') {
      const { username, email, password, role, modules, is_active } = req.body || {};

      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Faltan campos obligatorios: username, email, password' });
      }

      // Check if email already exists
      const { data: existing } = await supabase
        .from('dashboard_users')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (existing) {
        return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
      }

      const password_hash = crypto.createHash('sha256').update(password).digest('hex');

      const { data, error } = await supabase
        .from('dashboard_users')
        .insert({
          username: username.trim(),
          email: email.toLowerCase().trim(),
          password_hash,
          role: role || 'client',
          modules: modules || 'all',
          is_active: is_active !== undefined ? is_active : true,
          created_at: new Date().toISOString()
        })
        .select('id, username, email, role, modules, is_active, created_at')
        .single();

      if (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json({ success: true, user: data });
    }

    // ── PUT: Update an existing user ─────────────────────────────────────
    if (req.method === 'PUT') {
      const { id, username, email, role, modules, is_active, password } = req.body || {};

      if (!id) {
        return res.status(400).json({ error: 'Falta el id del usuario' });
      }

      const updates = {};
      if (username !== undefined) updates.username = username.trim();
      if (email !== undefined) updates.email = email.toLowerCase().trim();
      if (role !== undefined) updates.role = role;
      if (modules !== undefined) updates.modules = modules;
      if (is_active !== undefined) updates.is_active = is_active;
      if (password) {
        updates.password_hash = crypto.createHash('sha256').update(password).digest('hex');
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
      }

      const { data, error } = await supabase
        .from('dashboard_users')
        .update(updates)
        .eq('id', id)
        .select('id, username, email, role, modules, is_active, created_at')
        .single();

      if (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true, user: data });
    }

    // ── DELETE: Soft-deactivate a user ───────────────────────────────────
    if (req.method === 'DELETE') {
      const { id } = req.body || {};

      if (!id) {
        return res.status(400).json({ error: 'Falta el id del usuario' });
      }

      const { data, error } = await supabase
        .from('dashboard_users')
        .update({ is_active: false })
        .eq('id', id)
        .select('id, username, email, is_active')
        .single();

      if (error) {
        console.error('Error deactivating user:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true, message: 'Usuario desactivado', user: data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in users handler:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
};
