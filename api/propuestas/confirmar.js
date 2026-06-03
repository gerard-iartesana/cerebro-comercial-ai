// /api/propuestas/confirmar.js
// Vercel serverless function: Processes budget acceptance and stops email followups

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lmozoetpehmdxxremtqn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtb3pvZXRwZWhtZHh4cmVtdHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTA2NDUsImV4cCI6MjA5NTgyNjY0NX0.1xkCCw7q9CDvVbqGswCeFwXpgYfMtb0wcl7lHWlKQ8U';

module.exports = async function handler(req, res) {
  const { id } = req.query || {};

  if (!id) {
    return res.status(400).send('<h1>Error: Falta el ID del presupuesto</h1>');
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // 1. Update propuestas_enviadas status to 'aceptada'
    const { data: propData, error: propErr } = await supabase
      .from('propuestas_enviadas')
      .update({ estado: 'aceptada', updated_at: new Date().toISOString() })
      .eq('presupuesto_id', id)
      .select('*');

    if (propErr) throw propErr;

    // 2. Stop proposal followup sequence in propuesta_seguimiento
    await supabase
      .from('propuesta_seguimiento')
      .update({
        secuencia_activa: null,
        columna: 'stop',
        pausada: true,
        proximo_envio_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('presupuesto_id', id);

    const prop = (propData && propData[0]) || {};
    const leadName = prop.lead_nombre || 'Cliente';
    const propTitle = prop.titulo || 'Proyecto a medida';
    const propPrice = prop.precio_final ? `${Math.round(prop.precio_final).toLocaleString('es-ES')}€` : '—';

    // Renders premium glassmorphic response page
    const htmlResponse = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>¡Propuesta Aceptada! - CerebroComercial AI</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #000000;
      color: #ffffff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow: hidden;
      position: relative;
    }
    
    /* Sleek gradient background rings */
    body::before {
      content: '';
      position: absolute;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(52, 199, 89, 0.25) 0%, rgba(0,0,0,0) 70%);
      top: -100px;
      right: -100px;
      z-index: 1;
    }
    body::after {
      content: '';
      position: absolute;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(0, 113, 227, 0.2) 0%, rgba(0,0,0,0) 70%);
      bottom: -150px;
      left: -150px;
      z-index: 1;
    }

    .success-card {
      width: 100%;
      max-width: 480px;
      background: rgba(28, 28, 30, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(40px);
      border-radius: 24px;
      padding: 40px 32px;
      text-align: center;
      box-shadow: 0 30px 60px rgba(0,0,0,0.4);
      z-index: 10;
      animation: floatIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @keyframes floatIn {
      0% { opacity: 0; transform: translateY(20px) scale(0.98); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }

    .check-icon {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, #30d158, #15803d);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      margin: 0 auto 24px auto;
      box-shadow: 0 10px 25px rgba(48, 209, 88, 0.3);
      animation: pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s both;
    }

    @keyframes pop {
      0% { transform: scale(0); }
      100% { transform: scale(1); }
    }

    h1 {
      font-size: 1.6rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 12px;
      color: #ffffff;
    }
    p {
      font-size: 0.92rem;
      color: #a1a1a6;
      line-height: 1.5;
      margin-bottom: 24px;
    }

    .details-box {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 14px;
      padding: 18px;
      text-align: left;
      margin-bottom: 28px;
      font-size: 0.88rem;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .detail-row:last-child {
      margin-bottom: 0;
      padding-top: 8px;
      border-top: 1px dashed rgba(255,255,255,0.1);
    }
    .detail-label { color: #86868b; }
    .detail-value { font-weight: 600; color: #f5f5f7; }

    .btn-done {
      display: block;
      width: 100%;
      padding: 14px;
      background: #34c759;
      color: #ffffff;
      border: none;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.2s, transform 0.1s;
    }
    .btn-done:hover {
      background: #30d158;
    }
    .btn-done:active {
      transform: scale(0.99);
    }
  </style>
</head>
<body>

  <div class="success-card">
    <div class="check-icon">✓</div>
    <h1>¡Propuesta Aceptada!</h1>
    <p>Hola <strong>${leadName}</strong>, has confirmado la aceptación del presupuesto. Hemos registrado tu conformidad y detenido los correos de seguimiento automático.</p>
    
    <div class="details-box">
      <div class="detail-row">
        <span class="detail-label">Proyecto:</span>
        <span class="detail-value">${propTitle}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Estado:</span>
        <span class="detail-value" style="color: #30d158;">Aceptada (Firmada en línea)</span>
      </div>
      <div class="detail-row" style="margin-top: 8px;">
        <span class="detail-label">Inversión Final:</span>
        <span class="detail-value" style="font-size: 1.05rem; color:#fff;">${propPrice} <span style="font-size: 0.75rem; font-weight:400; color:#86868b;">+ IVA</span></span>
      </div>
    </div>
    
    <a href="javascript:window.close()" class="btn-done">Finalizar y Cerrar</a>
  </div>

</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(htmlResponse);
  } catch (error) {
    console.error('Error confirming budget:', error);
    return res.status(500).send(`<h1>Error al confirmar propuesta</h1><p>${error.message}</p>`);
  }
};
