// /api/storage.js
// Vercel serverless function: Lists files from Supabase Storage + DB documents (contratos, propuestas)

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lmozoetpehmdxxremtqn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  if (req.method === 'DELETE') {
    const { source, bucket, path, id } = req.body || {};
    try {
      if (source === 'storage') {
        const { data, error } = await supabase.storage.from(bucket).remove([path]);
        if (error) throw error;
        return res.status(200).json({ success: true });
      } else if (source === 'db_contratos') {
        const { error } = await supabase.from('contratos').delete().eq('id', id);
        if (error) throw error;
        return res.status(200).json({ success: true });
      } else if (source === 'db_propuestas') {
        const { error } = await supabase.from('propuestas_enviadas').delete().eq('id', id);
        if (error) throw error;
        return res.status(200).json({ success: true });
      } else {
        return res.status(400).json({ error: 'Source no válido' });
      }
    } catch(e) {
      console.error('DELETE error:', e);
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const allFiles = [];
    let totalSize = 0;
    const categories = {
      contratos: { count: 0, size: 0, icon: '📝' },
      propuestas: { count: 0, size: 0, icon: '📨' },
      imagenes: { count: 0, size: 0, icon: '🖼️' },
      documentos: { count: 0, size: 0, icon: '📄' },
      otros: { count: 0, size: 0, icon: '📦' }
    };

    // ── 1. Real Supabase Storage files (recursive) ──────────────────
    let bucketsList = [];
    try {
      const { data: buckets, error: bucketsErr } = await supabase.storage.listBuckets();
      if (!bucketsErr && buckets) {
        bucketsList = buckets;

        // Recursive file lister
        async function listAllFiles(bucketName, path = '', depth = 0) {
          if (depth > 3) return [];
          const { data: items, error } = await supabase.storage
            .from(bucketName)
            .list(path, { limit: 500, sortBy: { column: 'created_at', order: 'desc' } });

          if (error || !items) return [];
          const results = [];
          for (const item of items) {
            if (item.name === '.emptyFolderPlaceholder') continue;
            const fullPath = path ? `${path}/${item.name}` : item.name;
            if (item.id === null || (!item.metadata && !item.id)) {
              const subFiles = await listAllFiles(bucketName, fullPath, depth + 1);
              results.push(...subFiles);
            } else {
              results.push({ ...item, _fullPath: fullPath });
            }
          }
          return results;
        }

        for (const bucket of buckets) {
          const files = await listAllFiles(bucket.name);
          for (const file of files) {
            const ext = (file.name.split('.').pop() || '').toLowerCase();
            const fileSize = file.metadata?.size || 0;
            totalSize += fileSize;

            let category = 'otros';
            if (bucket.name === 'contratos' || (ext === 'pdf' && file._fullPath.toLowerCase().includes('contrato'))) {
              category = 'contratos';
            } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico'].includes(ext)) {
              category = 'imagenes';
            } else if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt'].includes(ext)) {
              category = 'documentos';
            }

            categories[category].count++;
            categories[category].size += fileSize;

            const { data: urlData } = supabase.storage.from(bucket.name).getPublicUrl(file._fullPath);

            allFiles.push({
              name: file.name,
              path: file._fullPath,
              bucket: bucket.name,
              source: 'storage',
              size: fileSize,
              created_at: file.created_at || file.updated_at || null,
              mime: file.metadata?.mimetype || null,
              category,
              url: urlData?.publicUrl || null
            });
          }
        }
      }
    } catch (storageErr) {
      console.warn('Storage listing failed (non-critical):', storageErr.message);
    }

    // ── 2. Contratos from DB table ──────────────────────────────────
    try {
      const { data: contratos, error: contratosErr } = await supabase
        .from('contratos')
        .select('id, codigo_contrato, cliente_nombre, cliente_email, estado, firma_cliente, firmado_at, created_at, updated_at, servicios, precio_total')
        .order('created_at', { ascending: false });

      if (contratosErr) {
        console.warn('Contratos query error:', contratosErr.message);
      } else if (contratos && contratos.length > 0) {
        for (const c of contratos) {
          const estimatedSize = JSON.stringify(c).length * 2;
          totalSize += estimatedSize;
          categories.contratos.count++;
          categories.contratos.size += estimatedSize;

          const estadoBadge = c.estado === 'firmado' ? '✅ Firmado' : c.firma_cliente ? '✍️ Pendiente firma prestador' : '📋 Borrador';

          allFiles.push({
            name: `${c.codigo_contrato || 'Contrato'} — ${c.cliente_nombre || 'Sin cliente'}`,
            path: `contratos/${c.id}`,
            bucket: 'base_datos',
            source: 'db_contratos',
            size: estimatedSize,
            created_at: c.created_at,
            mime: 'text/html',
            category: 'contratos',
            url: null,
            meta: {
              estado: c.estado,
              estado_label: estadoBadge,
              cliente: c.cliente_nombre,
              codigo: c.codigo_contrato,
              precio: c.precio_total,
              firmado_at: c.firmado_at
            }
          });
        }
      }
    } catch (dbErr) {
      console.warn('Contratos DB listing failed:', dbErr.message);
    }

    // ── 3. Propuestas enviadas from DB ──────────────────────────────
    try {
      const { data: propuestas } = await supabase
        .from('propuestas_enviadas')
        .select('id, titulo, lead_nombre, lead_email, estado, enviado_at, created_at')
        .order('created_at', { ascending: false });

      if (propuestas && propuestas.length > 0) {
        for (const p of propuestas) {
          const estimatedSize = JSON.stringify(p).length * 2;
          totalSize += estimatedSize;
          categories.propuestas.count++;
          categories.propuestas.size += estimatedSize;

          const estadoBadge = p.estado === 'aceptada' ? '✅ Aceptada' : p.estado === 'rechazada' ? '❌ Rechazada' : '📨 Enviada';

          allFiles.push({
            name: `Propuesta: ${p.titulo || 'Sin título'} → ${p.lead_nombre || p.lead_email || 'lead'}`,
            path: `propuestas/${p.id}`,
            bucket: 'base_datos',
            source: 'db_propuestas',
            size: estimatedSize,
            created_at: p.enviado_at || p.created_at,
            mime: 'text/html',
            category: 'propuestas',
            url: null,
            meta: {
              estado: p.estado,
              estado_label: estadoBadge,
              lead: p.lead_nombre,
              email: p.lead_email
            }
          });
        }
      }
    } catch (dbErr) {
      console.warn('Propuestas DB listing failed:', dbErr.message);
    }

    // Sort all by date descending
    allFiles.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return res.status(200).json({
      success: true,
      buckets: bucketsList.map(b => ({ name: b.name, public: b.public, created_at: b.created_at })),
      files: allFiles,
      stats: {
        total_files: allFiles.length,
        total_size: totalSize,
        categories
      }
    });

  } catch (e) {
    console.error('Storage API error:', e);
    return res.status(200).json({ success: false, error: e.message, buckets: [], files: [], stats: {} });
  }
};
