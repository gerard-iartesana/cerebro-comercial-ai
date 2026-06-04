// /api/storage.js
// Vercel serverless function: Lists files from Supabase Storage buckets and returns usage stats

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lmozoetpehmdxxremtqn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // 1. List all buckets
    const { data: buckets, error: bucketsErr } = await supabase.storage.listBuckets();
    
    if (bucketsErr) {
      return res.status(200).json({ success: false, error: bucketsErr.message, buckets: [], files: [], stats: {} });
    }

    const allFiles = [];
    let totalSize = 0;
    const categories = {
      contratos: { count: 0, size: 0, icon: '📝' },
      imagenes: { count: 0, size: 0, icon: '🖼️' },
      adjuntos: { count: 0, size: 0, icon: '📎' },
      documentos: { count: 0, size: 0, icon: '📄' },
      otros: { count: 0, size: 0, icon: '📦' }
    };

    // 2. For each bucket, list files
    for (const bucket of (buckets || [])) {
      const { data: files, error: filesErr } = await supabase.storage
        .from(bucket.name)
        .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

      if (filesErr || !files) continue;

      for (const file of files) {
        // Skip .emptyFolderPlaceholder
        if (file.name === '.emptyFolderPlaceholder') continue;
        
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        const fileSize = file.metadata?.size || 0;
        totalSize += fileSize;

        // Categorize
        let category = 'otros';
        if (bucket.name === 'contratos' || ext === 'pdf' && file.name.toLowerCase().includes('contrato')) {
          category = 'contratos';
        } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico'].includes(ext)) {
          category = 'imagenes';
        } else if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt'].includes(ext)) {
          category = 'documentos';
        } else if (['zip', 'rar', 'eml'].includes(ext)) {
          category = 'adjuntos';
        }

        categories[category].count++;
        categories[category].size += fileSize;

        // Generate public URL
        const { data: urlData } = supabase.storage.from(bucket.name).getPublicUrl(file.name);

        allFiles.push({
          name: file.name,
          bucket: bucket.name,
          size: fileSize,
          created_at: file.created_at || file.updated_at || null,
          mime: file.metadata?.mimetype || null,
          category,
          url: urlData?.publicUrl || null
        });
      }
    }

    return res.status(200).json({
      success: true,
      buckets: (buckets || []).map(b => ({ name: b.name, public: b.public, created_at: b.created_at })),
      files: allFiles,
      stats: {
        total_files: allFiles.length,
        total_size: totalSize,
        categories
      }
    });

  } catch (e) {
    return res.status(200).json({ success: false, error: e.message, buckets: [], files: [], stats: {} });
  }
};
