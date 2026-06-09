// /api/public/form.js
// Vercel serverless function: Serves a public form page (GET) and handles form submissions (POST)

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lmozoetpehmdxxremtqn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

// ─── HTML Template ───────────────────────────────────────────────────────────

function renderFormPage(form) {
  const config = form.config || {};
  const campos = config.campos || form.campos || [];
  const sections = config.sections || [];
  const primaryColor = config.color_primary || '#6366f1';
  const title = form.titulo || form.nombre || 'Formulario';
  const description = form.descripcion || '';

  // Group campos by section
  const sectionMap = {};
  const unsectioned = [];

  if (sections.length > 0) {
    sections.forEach(s => { sectionMap[s.id || s.nombre] = { ...s, campos: [] }; });
    campos.forEach(c => {
      const secId = c.section || c.seccion;
      if (secId && sectionMap[secId]) {
        sectionMap[secId].campos.push(c);
      } else {
        unsectioned.push(c);
      }
    });
  } else {
    unsectioned.push(...campos);
  }

  function renderInput(campo) {
    const name = campo.nombre || campo.name || campo.id;
    const label = campo.label || campo.etiqueta || name;
    const type = campo.tipo || campo.type || 'text';
    const required = campo.required || campo.obligatorio || false;
    const placeholder = campo.placeholder || '';
    const options = campo.opciones || campo.options || [];
    const helpText = campo.ayuda || campo.help || '';
    const reqAttr = required ? 'required' : '';
    const reqStar = required ? '<span class="req">*</span>' : '';

    let inputHtml = '';

    switch (type) {
      case 'textarea':
        inputHtml = `<textarea id="f_${name}" name="${name}" placeholder="${placeholder}" rows="4" ${reqAttr}></textarea>`;
        break;
      case 'select':
        inputHtml = `<select id="f_${name}" name="${name}" ${reqAttr}>
          <option value="" disabled selected>${placeholder || 'Selecciona...'}</option>
          ${options.map(o => {
            const val = typeof o === 'object' ? (o.value || o.valor) : o;
            const lbl = typeof o === 'object' ? (o.label || o.etiqueta || val) : o;
            return `<option value="${val}">${lbl}</option>`;
          }).join('')}
        </select>`;
        break;
      case 'checkbox':
        inputHtml = `<label class="checkbox-wrap">
          <input type="checkbox" id="f_${name}" name="${name}" ${reqAttr}>
          <span class="checkbox-label">${label}</span>
        </label>`;
        return `<div class="field checkbox-field">${inputHtml}${helpText ? `<p class="help">${helpText}</p>` : ''}</div>`;
      case 'radio':
        inputHtml = `<div class="radio-group" id="f_${name}">
          ${options.map((o, i) => {
            const val = typeof o === 'object' ? (o.value || o.valor) : o;
            const lbl = typeof o === 'object' ? (o.label || o.etiqueta || val) : o;
            return `<label class="radio-wrap">
              <input type="radio" name="${name}" value="${val}" ${i === 0 && required ? 'required' : ''}>
              <span>${lbl}</span>
            </label>`;
          }).join('')}
        </div>`;
        break;
      case 'number':
        inputHtml = `<input type="number" id="f_${name}" name="${name}" placeholder="${placeholder}" ${reqAttr} ${campo.min !== undefined ? `min="${campo.min}"` : ''} ${campo.max !== undefined ? `max="${campo.max}"` : ''}>`;
        break;
      case 'email':
        inputHtml = `<input type="email" id="f_${name}" name="${name}" placeholder="${placeholder}" ${reqAttr}>`;
        break;
      case 'tel':
      case 'telefono':
        inputHtml = `<input type="tel" id="f_${name}" name="${name}" placeholder="${placeholder}" ${reqAttr}>`;
        break;
      case 'url':
        inputHtml = `<input type="url" id="f_${name}" name="${name}" placeholder="${placeholder}" ${reqAttr}>`;
        break;
      case 'date':
      case 'fecha':
        inputHtml = `<input type="date" id="f_${name}" name="${name}" ${reqAttr}>`;
        break;
      case 'file':
      case 'archivo':
        inputHtml = `<input type="file" id="f_${name}" name="${name}" ${reqAttr} ${campo.accept ? `accept="${campo.accept}"` : ''}>`;
        break;
      case 'hidden':
        return `<input type="hidden" id="f_${name}" name="${name}" value="${campo.value || campo.valor || ''}">`;
      default:
        inputHtml = `<input type="text" id="f_${name}" name="${name}" placeholder="${placeholder}" ${reqAttr} ${campo.maxlength ? `maxlength="${campo.maxlength}"` : ''}>`;
    }

    return `<div class="field">
      <label for="f_${name}">${label}${reqStar}</label>
      ${inputHtml}
      ${helpText ? `<p class="help">${helpText}</p>` : ''}
    </div>`;
  }

  function renderSection(section) {
    if (!section.campos || section.campos.length === 0) return '';
    const secTitle = section.titulo || section.nombre || section.label || '';
    const secDesc = section.descripcion || '';
    return `
      <fieldset class="section">
        ${secTitle ? `<legend>${secTitle}</legend>` : ''}
        ${secDesc ? `<p class="section-desc">${secDesc}</p>` : ''}
        ${section.campos.map(renderInput).join('')}
      </fieldset>
    `;
  }

  const sectionsHtml = Object.values(sectionMap).map(renderSection).join('');
  const unsectionedHtml = unsectioned.map(renderInput).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${description.replace(/"/g, '&quot;').substring(0, 160)}">
  <meta name="robots" content="noindex, nofollow">
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --primary: ${primaryColor};
      --primary-light: ${primaryColor}22;
      --primary-glow: ${primaryColor}44;
      --bg: #ffffff;
      --bg-card: #ffffff;
      --bg-input: #f8f9fc;
      --text: #1a1a2e;
      --text-secondary: #64748b;
      --border: #e2e8f0;
      --border-focus: var(--primary);
      --shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
      --shadow-lg: 0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04);
      --radius: 12px;
      --radius-sm: 8px;
      --success: #10b981;
      --error: #ef4444;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0f1117;
        --bg-card: #1a1d27;
        --bg-input: #252836;
        --text: #e8eaed;
        --text-secondary: #9ca3af;
        --border: #2d3244;
        --shadow: 0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.15);
        --shadow-lg: 0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2);
      }
    }

    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px 48px;
      -webkit-font-smoothing: antialiased;
    }

    .hero {
      text-align: center;
      padding: 48px 24px 32px;
      max-width: 640px;
      width: 100%;
    }

    .hero-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, var(--primary), ${primaryColor}cc);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      box-shadow: 0 4px 20px var(--primary-glow);
    }

    .hero-icon svg { width: 28px; height: 28px; fill: #fff; }

    .hero h1 {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
      background: linear-gradient(135deg, var(--text), var(--text-secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero p {
      font-size: 15px;
      color: var(--text-secondary);
      max-width: 480px;
      margin: 0 auto;
    }

    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      max-width: 640px;
      width: 100%;
      padding: 32px;
      animation: fadeUp 0.5s ease;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .section {
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 24px 20px 16px;
      margin-bottom: 24px;
      background: transparent;
    }

    .section legend {
      font-size: 15px;
      font-weight: 600;
      color: var(--primary);
      padding: 0 8px;
    }

    .section-desc {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 16px;
    }

    .field {
      margin-bottom: 20px;
    }

    .field label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: var(--text);
      margin-bottom: 6px;
    }

    .req { color: var(--error); margin-left: 2px; }

    input[type="text"],
    input[type="email"],
    input[type="tel"],
    input[type="url"],
    input[type="number"],
    input[type="date"],
    input[type="file"],
    textarea,
    select {
      width: 100%;
      padding: 10px 14px;
      font-size: 15px;
      font-family: inherit;
      color: var(--text);
      background: var(--bg-input);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-sm);
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      appearance: none;
      -webkit-appearance: none;
    }

    select {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2364748b' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      padding-right: 36px;
    }

    textarea { resize: vertical; min-height: 80px; }

    input:focus, textarea:focus, select:focus {
      border-color: var(--border-focus);
      box-shadow: 0 0 0 3px var(--primary-light);
    }

    input:invalid:not(:placeholder-shown),
    textarea:invalid:not(:placeholder-shown) {
      border-color: var(--error);
    }

    .help {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    .checkbox-field { margin-bottom: 20px; }

    .checkbox-wrap, .radio-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 14px;
      color: var(--text);
    }

    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .checkbox-wrap input, .radio-wrap input {
      width: 18px;
      height: 18px;
      accent-color: var(--primary);
      cursor: pointer;
      flex-shrink: 0;
    }

    .btn {
      width: 100%;
      padding: 14px 24px;
      font-size: 16px;
      font-weight: 600;
      font-family: inherit;
      color: #fff;
      background: linear-gradient(135deg, var(--primary), ${primaryColor}dd);
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.2s, opacity 0.2s;
      box-shadow: 0 2px 12px var(--primary-glow);
      margin-top: 8px;
      position: relative;
      overflow: hidden;
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 20px var(--primary-glow);
    }

    .btn:active:not(:disabled) { transform: translateY(0); }

    .btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .btn .spinner {
      display: none;
      width: 20px;
      height: 20px;
      border: 2.5px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      margin: 0 auto;
    }

    .btn.loading .btn-text { display: none; }
    .btn.loading .spinner { display: block; }

    @keyframes spin { to { transform: rotate(360deg); } }

    .success-msg {
      display: none;
      text-align: center;
      padding: 48px 24px;
      animation: fadeUp 0.4s ease;
    }

    .success-msg.visible { display: block; }

    .success-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--success), #059669);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      box-shadow: 0 4px 20px rgba(16,185,129,0.3);
    }

    .success-icon svg { width: 32px; height: 32px; fill: #fff; }

    .success-msg h2 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .success-msg p {
      color: var(--text-secondary);
      font-size: 15px;
    }

    .error-banner {
      display: none;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: var(--radius-sm);
      color: #991b1b;
      padding: 12px 16px;
      font-size: 14px;
      margin-bottom: 20px;
      animation: fadeUp 0.3s ease;
    }

    @media (prefers-color-scheme: dark) {
      .error-banner {
        background: #451a1a;
        border-color: #7f1d1d;
        color: #fca5a5;
      }
    }

    .footer {
      text-align: center;
      margin-top: 32px;
      font-size: 12px;
      color: var(--text-secondary);
      opacity: 0.7;
    }

    .footer a {
      color: var(--primary);
      text-decoration: none;
    }

    @media (max-width: 480px) {
      body { padding: 16px 12px 32px; }
      .card { padding: 24px 18px; }
      .hero { padding: 32px 16px 24px; }
      .hero h1 { font-size: 24px; }
      .section { padding: 18px 14px 12px; }
    }
  </style>
</head>
<body>

  <div class="hero">
    <div class="hero-icon">
      <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/><path d="M8 12h8v2H8zm0 4h5v2H8z"/></svg>
    </div>
    <h1>${title}</h1>
    ${description ? `<p>${description}</p>` : ''}
  </div>

  <div class="card" id="formCard">
    <div class="error-banner" id="errorBanner"></div>
    <form id="mainForm" novalidate>
      ${sectionsHtml}
      ${unsectionedHtml}
      <button type="submit" class="btn" id="submitBtn">
        <span class="btn-text">Enviar</span>
        <div class="spinner"></div>
      </button>
    </form>
  </div>

  <div class="success-msg" id="successMsg">
    <div class="success-icon">
      <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
    </div>
    <h2>¡Enviado con éxito!</h2>
    <p>Hemos recibido tu información correctamente. Gracias por completar el formulario.</p>
  </div>

  <div class="footer">
    Powered by <a href="https://cerebrocomercial-ai.iadebarrio.com" target="_blank" rel="noopener">CerebroComercial AI</a>
  </div>

  <script>
  (function() {
    var form = document.getElementById('mainForm');
    var card = document.getElementById('formCard');
    var btn = document.getElementById('submitBtn');
    var errBanner = document.getElementById('errorBanner');
    var successMsg = document.getElementById('successMsg');
    var formId = '${form.id}';

    function collectData() {
      var datos = {};
      var elements = form.elements;
      for (var i = 0; i < elements.length; i++) {
        var el = elements[i];
        if (!el.name || el.name === '' || el.type === 'submit') continue;
        if (el.type === 'checkbox') {
          datos[el.name] = el.checked;
        } else if (el.type === 'radio') {
          if (el.checked) datos[el.name] = el.value;
        } else if (el.type === 'file') {
          // Skip file inputs for now
          continue;
        } else {
          datos[el.name] = el.value;
        }
      }
      return datos;
    }

    function showError(msg) {
      errBanner.textContent = msg;
      errBanner.style.display = 'block';
      setTimeout(function() { errBanner.style.display = 'none'; }, 6000);
    }

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      errBanner.style.display = 'none';

      // Native validation
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      btn.classList.add('loading');
      btn.disabled = true;

      var datos = collectData();

      fetch(window.location.pathname, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formulario_id: formId, datos: datos })
      })
      .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
      .then(function(result) {
        if (result.ok && result.data.success) {
          card.style.display = 'none';
          successMsg.classList.add('visible');
        } else {
          showError(result.data.error || 'Error al enviar el formulario. Inténtalo de nuevo.');
          btn.classList.remove('loading');
          btn.disabled = false;
        }
      })
      .catch(function() {
        showError('Error de conexión. Comprueba tu conexión a internet e inténtalo de nuevo.');
        btn.classList.remove('loading');
        btn.disabled = false;
      });
    });
  })();
  </script>
</body>
</html>`;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // ── GET: Render form page ──────────────────────────────────────────────

  if (req.method === 'GET') {
    const formId = req.query.id;

    if (!formId) {
      return res.status(400).json({ error: 'Falta el parámetro id del formulario' });
    }

    try {
      const { data: form, error } = await supabase
        .from('formularios')
        .select('*')
        .eq('id', formId)
        .single();

      if (error || !form) {
        return res.status(404).send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>No encontrado</title></head><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;color:#666"><p>Formulario no encontrado.</p></body></html>`);
      }

      if (form.activo === false || form.estado === 'inactivo') {
        return res.status(410).send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Formulario cerrado</title></head><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;color:#666"><p>Este formulario ya no está disponible.</p></body></html>`);
      }

      const html = renderFormPage(form);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.status(200).send(html);

    } catch (err) {
      console.error('Error rendering form:', err);
      return res.status(500).json({ error: 'Error interno al cargar el formulario' });
    }
  }

  // ── POST: Handle form submission ───────────────────────────────────────

  if (req.method === 'POST') {
    try {
      const { formulario_id, datos } = req.body || {};

      if (!formulario_id || !datos) {
        return res.status(400).json({ error: 'Faltan formulario_id o datos' });
      }

      // Validate form exists and is active
      const { data: form, error: formErr } = await supabase
        .from('formularios')
        .select('*')
        .eq('id', formulario_id)
        .single();

      if (formErr || !form) {
        return res.status(404).json({ error: 'Formulario no encontrado' });
      }

      if (form.activo === false || form.estado === 'inactivo') {
        return res.status(410).json({ error: 'Este formulario ya no acepta respuestas' });
      }

      // Extract metadata from request
      const ip = (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress || '').split(',')[0].trim();
      const userAgent = req.headers['user-agent'] || '';

      // Save response
      const { data: respuesta, error: insertErr } = await supabase
        .from('formularios_respuestas')
        .insert({
          formulario_id: formulario_id,
          datos: datos,
          ip: ip,
          user_agent: userAgent
        })
        .select('id')
        .single();

      if (insertErr) {
        console.error('Error saving form response:', insertErr);
        return res.status(500).json({ error: 'Error al guardar la respuesta' });
      }

      // If form type is 'ficha_cliente', upsert to outreach_leads
      const formTipo = form.tipo || form.config?.tipo || '';

      if (formTipo === 'ficha_cliente') {
        try {
          const email = datos.email || datos.correo || datos.email_contacto || '';

          if (email) {
            const leadData = {
              email: email.trim().toLowerCase(),
              first_name: datos.nombre || datos.first_name || datos.name || '',
              last_name: datos.apellidos || datos.last_name || '',
              phone: datos.telefono || datos.phone || datos.tel || '',
              company_name: datos.empresa || datos.company || datos.negocio || '',
              status: 'lead_inbound'
            };

            // Try to find existing lead by email
            const { data: existing } = await supabase
              .from('outreach_leads')
              .select('id')
              .eq('email', leadData.email)
              .limit(1);

            if (existing && existing.length > 0) {
              // Update existing lead (don't overwrite status if already advanced)
              const updatePayload = { ...leadData };
              delete updatePayload.email; // don't update the match key
              delete updatePayload.status; // don't regress status

              await supabase
                .from('outreach_leads')
                .update(updatePayload)
                .eq('id', existing[0].id);
            } else {
              // Insert new lead
              await supabase
                .from('outreach_leads')
                .insert([leadData]);
            }
          }
        } catch (leadErr) {
          // Non-fatal: log but don't fail the submission
          console.error('Error upserting lead (non-fatal):', leadErr);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Respuesta guardada correctamente',
        respuesta_id: respuesta?.id || null
      });

    } catch (err) {
      console.error('Form submission error:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // ── Unsupported method ─────────────────────────────────────────────────
  return res.status(405).json({ error: 'Method not allowed' });
};
