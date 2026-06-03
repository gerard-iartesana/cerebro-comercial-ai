// /api/download.js
// Vercel serverless function: Renders the budget/proposal invoice view in premium format for printing or confirming

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lmozoetpehmdxxremtqn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtb3pvZXRwZWhtZHh4cmVtdHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTA2NDUsImV4cCI6MjA5NTgyNjY0NX0.1xkCCw7q9CDvVbqGswCeFwXpgYfMtb0wcl7lHWlKQ8U';

module.exports = async function handler(req, res) {
  const { id } = req.query || {};

  if (!id) {
    return res.status(400).send('<h1>Error: Falta ID del presupuesto</h1>');
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const { data: p, error } = await supabase
      .from('presupuestos')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !p) {
      return res.status(404).send('<h1>Presupuesto no encontrado</h1>');
    }

    const formasPago = { sin_iva: 'Sin IVA', giro: 'Giro bancario', transferencia: 'Transferencia bancaria', stripe: 'Pago con Stripe', bizum: 'Bizum al 609 160 403', efectivo: 'Efectivo' };
    const isPers = p.lineas && p.lineas.length > 0;
    const lineasActivas = isPers ? (p.lineas || []).filter(l => l.activo !== false && !l.recomendado) : [];
    
    const totalBruto = isPers ? lineasActivas.reduce((s, l) => s + (l.precio || 0), 0) : p.precio_alta;
    const precioFinal = isPers ? lineasActivas.reduce((s, l) => s + (l.precio || 0) * (1 - (l.descuento || 0) / 100), 0) : (p.descuento_pct > 0 && p.precio_alta ? p.precio_alta * (1 - p.descuento_pct / 100) : (p.precio_alta || 0));
    const hasDsc = isPers ? totalBruto !== precioFinal : (p.descuento_pct > 0 && p.precio_alta);
    
    const fecha = p.fecha ? new Date(p.fecha).toLocaleDateString('es-ES',{day:'2-digit',month:'long',year:'numeric'}) : new Date().toLocaleDateString('es-ES',{day:'2-digit',month:'long',year:'numeric'});
    const catL = {consultoria:'Consultoría',agentes_ia:'Agentes de IA',apps_web:'Aplicación Web',automatizacion:'Automatización',personalizada:'Propuesta Personalizada'};

    let lineasH = '';
    if (isPers && lineasActivas.length > 0) {
        const totalMant = lineasActivas.reduce((s, l) => s + (l.mantenimiento && l.mantenimiento_precio ? l.mantenimiento_precio : 0), 0);
        
        const rows = lineasActivas.map(l => {
            const imp = l.precio * (1 - (l.descuento || 0) / 100);
            const subRows = (l.sublineas || []).filter(s => s.concepto).map(s => `<div style="padding-left:14px;font-size:9pt;color:#6e6e73;margin-top:3px;line-height:1.4">└ ${s.concepto}</div>`).join('');
            
            const metaLines = [];
            if (l.plazo) metaLines.push(`<div style="color:#6e6e73;font-size:8.5pt">⏱ Plazo: ${l.plazo}</div>`);
            if (l.mantenimiento && l.mantenimiento_precio) metaLines.push(`<div style="color:#0071e3;font-size:8.5pt;font-weight:600">🔄 Mantenimiento: ${l.mantenimiento_precio}€/mes</div><div style="color:#aeaeb2;font-size:7.5pt;font-style:italic">* Se activa una vez entregado y finalizado el trabajo</div>`);
            
            const metaHtml = metaLines.length ? `<div style="margin-top:5px;padding-top:4px;border-top:1px dashed #f0f0f2;display:flex;flex-direction:column;gap:2px">${metaLines.join('')}</div>` : '';
            return `<tr><td>${l.concepto || '—'}${subRows}${metaHtml}</td><td style="text-align:right;vertical-align:top">${(l.precio || 0).toLocaleString('es-ES')}€</td><td style="text-align:right;vertical-align:top">${l.descuento > 0 ? `-${l.descuento}%` : '—'}</td><td style="text-align:right;font-weight:600;vertical-align:top">${Math.round(imp).toLocaleString('es-ES')}€</td></tr>`;
        }).join('');

        const mantRow = totalMant > 0 ? `<div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;padding:4px 12px;color:#0071e3;font-size:9pt;font-weight:600">🔄 Mantenimiento mensual total: ${totalMant.toLocaleString('es-ES')}€/mes</div>` : '';
        const mantNote = totalMant > 0 ? '<div style="text-align:right;font-size:7.5pt;color:#aeaeb2;font-style:italic;padding:0 12px 4px">* El mantenimiento se activa una vez entregado y finalizado el trabajo</div>' : '';
        
        const summaryRows = `<div style="margin-top:2px;border-top:2px solid #e5e5ea">${hasDsc ? `<div style="display:flex;justify-content:flex-end;gap:40px;padding:7px 12px;font-size:8.5pt;color:#86868b"><span>Subtotal</span><span>${(totalBruto || 0).toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</span></div><div style="display:flex;justify-content:flex-end;gap:40px;padding:4px 12px;font-size:8.5pt;color:#34c759"><span>Descuentos</span><span>-${(totalBruto - precioFinal).toLocaleString('es-ES', { maximumFractionDigits: 0 })}€</span></div>` : ''}<div style="display:flex;justify-content:flex-end;gap:40px;padding:10px 12px;border-top:2px solid #1d1d1f;font-size:11pt;font-weight:800"><span>Total</span><span>${Math.round(precioFinal).toLocaleString('es-ES')}€</span></div>${mantRow}${mantNote}</div>`;
        lineasH = `<div class="sec"><div class="st">DESGLOSE DE SERVICIOS</div><table class="lt"><thead><tr><th style="text-align:left;width:50%">Concepto</th><th style="text-align:right">Precio</th><th style="text-align:right">Dto.</th><th style="text-align:right">Importe</th></tr></thead><tbody>${rows}</tbody></table>${summaryRows}</div>`;
    }

    // pago options HTML calculation
    let pagoOptionsHtml = '';
    if (isPers) {
      const pc = p.pago_config || { inv_min_pct: 15, num_cuotas: 24, descuento_b_pct: 4, descuento_c_pct: 8, show_a: true, show_b: true, show_c: true };
      const fE = (n) => Math.round(n || 0).toLocaleString('es-ES');
      const fD = (d) => d.toLocaleDateString('es-ES',{month:'long',year:'numeric'});
      const fb = p.fecha ? new Date(p.fecha) : new Date();
      
      const f2 = new Date(fb); f2.setMonth(f2.getMonth()+6);
      const f3 = new Date(fb); f3.setMonth(f3.getMonth()+12);
      
      const invMin = (precioFinal || 0) * pc.inv_min_pct/100;
      const cuota = ((precioFinal || 0) - invMin)/(pc.num_cuotas || 1);
      const totB = (precioFinal || 0) * (1-pc.descuento_b_pct/100);
      const p3 = totB/3;
      const totC = (precioFinal || 0) * (1-pc.descuento_c_pct/100);
      const hasAny = (pc.show_a !== false) || (pc.show_b !== false) || (pc.show_c !== false);
      
      const optA = pc.show_a !== false ? `<div style="border-left:3px solid #0071e3;padding:10px 14px;border-radius:0 8px 8px 0;background:#f5f7ff;margin-bottom:8px"><div style="font-size:8pt;font-weight:700;color:#0071e3;margin-bottom:4px">A) Financiación a plazos</div><div style="font-size:9pt;color:#3a3a3c;line-height:1.6">Inversión mínima ${fE(invMin)}€ + IVA al comienzo del proyecto (${fD(fb)})<br>Pago mensual x ${pc.num_cuotas} meses de <strong>${fE(cuota)}€ + IVA / mes</strong> (sin intereses)</div></div>` : '';
      const optB = pc.show_b !== false ? `<div style="border-left:3px solid #34c759;padding:10px 14px;border-radius:0 8px 8px 0;background:#f0fdf4;margin-bottom:8px"><div style="font-size:8pt;font-weight:700;color:#34c759;margin-bottom:4px">B) Pago parcial anticipado · ${pc.descuento_b_pct}% dto.</div><div style="font-size:9pt;color:#3a3a3c;line-height:1.6">Pago inicial ${fE(p3)}€ + IVA · ${fD(fb)}<br>Pago medio ${fE(p3)}€ + IVA · ${fD(f2)}<br>Pago final ${fE(p3)}€ + IVA · ${fD(f3)}<br><strong>Total: ${fE(totB)}€ + IVA</strong> <span style="text-decoration:line-through;color:#aeaeb2;font-size:8pt">${fE(precioFinal||0)}€</span></div></div>` : '';
      const optC = pc.show_c !== false ? `<div style="border-left:3px solid #ff9500;padding:10px 14px;border-radius:0 8px 8px 0;background:#fffbeb"><div style="font-size:8pt;font-weight:700;color:#ff9500;margin-bottom:4px">C) Pago total anticipado · ${pc.descuento_c_pct}% dto.</div><div style="font-size:9pt;color:#3a3a3c;line-height:1.6">Pago único al inicio del proyecto<br><strong>Total: ${fE(totC)}€ + IVA</strong> <span style="text-decoration:line-through;color:#aeaeb2;font-size:8pt">${fE(precioFinal||0)}€</span> · Ahorro de ${fE((precioFinal||0)-totC)}€</div></div>` : '';
      
      pagoOptionsHtml = `<div class="pb nb" style="margin-top:14px"><div style="font-size:7.5pt;color:#86868b;text-transform:uppercase;letter-spacing:0.08em">Total del proyecto</div><div style="font-size:22pt;font-weight:900;letter-spacing:-0.03em">${fE(precioFinal||0)}&#8364; <span style="font-size:9pt;color:#6e6e73;font-weight:400">${p.forma_pago==='sin_iva'?'':'+ IVA'}</span></div>${hasAny ? `<div style="margin-top:14px;padding-top:12px;border-top:1px solid #e5e5ea"><div style="font-size:7.5pt;color:#86868b;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px">Opciones de pago</div>${optA}${optB}${optC}</div>` : ''}</div>`;
    }

    // Recommended items
    let recommendedHtml = '';
    const recomendadas = isPers ? (p.lineas || []).filter(l => l.activo !== false && l.recomendado) : [];
    if (recomendadas.length > 0) {
      const fE2 = (n) => Math.round(n || 0).toLocaleString('es-ES');
      recommendedHtml = `<div class="nb" style="margin:14px 0;padding:20px;border-radius:12px;background:#fffbf0;border:1px solid #fed7aa;page-break-inside:avoid"><div style="display:flex;align-items:center;gap:8px;margin-bottom:12px"><div style="font-size:8pt;font-weight:800;color:#ea580c;text-transform:uppercase;letter-spacing:0.1em">⭐ SERVICIOS RECOMENDADOS</div><div style="display:inline-block;padding:2px 10px;border-radius:12px;background:#ff3b30;color:#fff;font-size:6.5pt;font-weight:700;letter-spacing:0.06em">NO INCLUIDOS EN ESTA PROPUESTA</div></div><div style="font-size:8.5pt;color:#9a3412;margin-bottom:12px;line-height:1.5">Los siguientes servicios complementarios están recomendados para maximizar los resultados del proyecto. Pueden contratarse de forma independiente.</div>${recomendadas.map(r => { const pf = r.precio * (1-(r.descuento||0)/100); const subs = (r.sublineas || []).filter((s) => s.concepto); return `<div style="padding:12px 14px;background:#fff;border-radius:8px;border:1px solid #fed7aa;margin-bottom:6px"><div style="display:flex;align-items:flex-start;gap:10px"><div style="flex:1"><div style="font-size:9.5pt;font-weight:700;color:#1d1d1f">${r.concepto || 'Servicio'}</div>${subs.length > 0 ? subs.map((s) => `<div style="font-size:8pt;color:#6e6e73;margin-top:2px;padding-left:10px">↳ ${s.concepto}</div>`).join('') : ''}${r.plazo ? `<div style="font-size:7.5pt;color:#9a3412;margin-top:3px">⏱ Plazo: ${r.plazo}</div>` : ''}${r.mantenimiento && r.mantenimiento_precio ? `<div style="font-size:7.5pt;color:#0071e3;font-weight:700;margin-top:3px">🔄 Mantenimiento: ${fE2(r.mantenimiento_precio)}€/mes</div><div style="font-size:6.5pt;color:#aeaeb2;font-style:italic">* Se activa una vez finalizado el trabajo</div>` : ''}</div><div style="text-align:right;min-width:80px"><div style="font-size:11pt;font-weight:800;color:#ea580c">${fE2(pf)}€</div>${r.descuento > 0 ? `<div style="font-size:7pt;color:#aeaeb2;text-decoration:line-through">${fE2(r.precio)}€</div><div style="font-size:6.5pt;color:#34c759;font-weight:600">-${r.descuento}%</div>` : ''}<div style="font-size:6.5pt;color:#6e6e73">${p.forma_pago==='sin_iva'?'':'+ IVA'}</div></div></div></div>`; }).join('')}</div>`;
    }

    const htmlOutput = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Propuesta Comercial - ${p.titulo}</title>
  <style>
    @page { size: A4; margin: 20mm 0 0 0 }
    * { margin: 0; padding: 0; box-sizing: border-box }
    body {
      font-family: 'Helvetica Neue', -apple-system, system-ui, sans-serif;
      color: #1d1d1f;
      background: #f5f5f7;
      padding-top: 80px;
      padding-bottom: 90px;
    }
    .page-container {
      width: 210mm;
      min-height: 297mm;
      background: #ffffff;
      margin: 0 auto;
      padding: 72px 52px 90px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
      border-radius: 12px;
      position: relative;
    }
    .hdr { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 14px; border-bottom: 3px solid #1d1d1f }
    .br { font-size: 22pt; font-weight: 800; letter-spacing: -0.03em }
    .br span { font-weight: 300 }
    .brsub { font-size: 7.5pt; color: #86868b; margin-top: 2px; letter-spacing: 0.04em }
    .mt { text-align: right; font-size: 8.5pt; color: #6e6e73; line-height: 1.6 }
    .mtn { font-weight: 700; color: #1d1d1f; font-size: 11pt }
    .mtl { font-size: 7pt; text-transform: uppercase; letter-spacing: 0.08em; color: #aeaeb2; margin-top: 5px }
    .cb { display: inline-block; padding: 3px 12px; border-radius: 6px; background: #f5f5f7; font-size: 7.5pt; font-weight: 700; color: #6e6e73; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px }
    .bdg { display: inline-block; padding: 3px 14px; border-radius: 20px; background: #0071e3; color: #fff; font-size: 7pt; font-weight: 700; letter-spacing: 0.08em; margin-left: 8px; vertical-align: middle }
    h1 { font-size: 19pt; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 4px; line-height: 1.2 }
    .sub { font-size: 10.5pt; color: #6e6e73; margin-bottom: 18px }
    .psub { font-size: 9pt; color: #6e6e73; margin-top: 6px }
    .st { font-size: 7.5pt; font-weight: 700; color: #6e6e73; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; padding-bottom: 5px; border-bottom: 1px solid #e5e5ea }
    .dsc2 { font-size: 9.5pt; line-height: 1.65; color: #3a3a3c }
    .lt { width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 4px }
    .lt thead th { font-size: 7pt; text-transform: uppercase; letter-spacing: 0.08em; color: #86868b; font-weight: 600; padding: 8px 12px; border-bottom: 2px solid #e5e5ea }
    .lt tbody td { padding: 10px 12px; border-bottom: 1px solid #f0f0f2; font-size: 9pt }
    .lt tbody tr { page-break-inside: avoid; break-inside: avoid }
    .lt tbody tr:last-child td { border-bottom: 2px solid #e5e5ea }
    .lt tfoot td { padding: 7px 12px; font-size: 9pt }
    .lt .sub td { color: #86868b; font-size: 8.5pt }
    .lt .tot td { font-weight: 800; font-size: 11pt; color: #1d1d1f; border-top: 2px solid #1d1d1f; padding-top: 10px }
    .ig { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 18px 0 }
    .ii { background: #f5f5f7; border-radius: 10px; padding: 12px 16px }
    .il { font-size: 7pt; color: #86868b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 3px }
    .iv { font-size: 9pt; font-weight: 600 }
    .nt { background: transparent; border-radius: 10px; padding: 14px 18px; margin: 14px 0; border-left: 3px solid #f59e0b }
    .ai { background: transparent; border-radius: 10px; padding: 14px 18px; margin: 14px 0; border-left: 3px solid #0055d4 }
    .ft { position: absolute; bottom: 40px; left: 52px; right: 52px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e5e5ea; padding-top: 14px }
    .fb { font-size: 9pt; font-weight: 700; color: #1d1d1f; letter-spacing: -0.02em }
    .fc { font-size: 7.5pt; color: #86868b; display: flex; gap: 14px }
    .fc a { color: #86868b; text-decoration: none }
    .fd { font-size: 7pt; color: #86868b }
    .nb { page-break-inside: avoid; break-inside: avoid }
    .pb { background: #f5f5f7; border-radius: 12px; padding: 18px 26px; margin: 18px 0 22px; page-break-inside: avoid; break-inside: avoid }
    .pr { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap }
    .p { font-size: 30pt; font-weight: 900; letter-spacing: -0.03em; line-height: 1 }
    .pl { font-size: 9pt; color: #6e6e73 }
    .dsc { color: #34c759; font-weight: 700; font-size: 10pt }
    .og { text-decoration: line-through; color: #aeaeb2; font-size: 14pt; font-weight: 500 }
    .sec { margin: 18px 0; page-break-inside: avoid; break-inside: avoid }
    
    /* Top helper bar */
    .top-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 64px;
      background: rgba(28, 28, 30, 0.95);
      backdrop-filter: blur(15px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      z-index: 9999;
      color: #ffffff;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    .top-bar-title { font-weight: 800; font-size: 1rem; letter-spacing: -0.01em; display: flex; align-items: center; gap: 8px; }
    .top-bar-actions { display: flex; gap: 12px; }
    .top-btn-secondary {
      padding: 8px 16px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 8px;
      color: #fff;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.82rem;
      transition: background 0.2s;
    }
    .top-btn-secondary:hover { background: rgba(255,255,255,0.15); }
    .top-btn-primary {
      padding: 8px 20px;
      background: #30d158;
      border: none;
      border-radius: 8px;
      color: #fff;
      font-weight: 700;
      cursor: pointer;
      font-size: 0.82rem;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      transition: background 0.2s;
    }
    .top-btn-primary:hover { background: #34c759; }

    @media print {
      .top-bar { display: none !important; }
      body { padding-top: 0 !important; background: #fff !important; }
      .page-container { width: 100%; box-shadow: none; border-radius: 0; padding: 0; }
      .ft { position: fixed; bottom: 0; left: 0; right: 0; }
    }
  </style>
</head>
<body>

  <!-- Floating interactive bar -->
  <div class="top-bar">
    <div class="top-bar-title">
      <span style="font-size: 1.25rem;">🧠</span>
      <span>CerebroComercial AI <span style="font-weight: 300; font-size: 0.85rem; color: #86868b; margin-left: 6px;">| Propuesta Oficial</span></span>
    </div>
    <div class="top-bar-actions">
      <button class="top-btn-secondary" onclick="window.print()">🖨️ Guardar PDF / Imprimir</button>
      <a class="top-btn-primary" href="/api/propuestas/confirmar?id=${p.id}">Aceptar Propuesta ✅</a>
    </div>
  </div>

  <!-- A4 Proposal Container -->
  <div class="page-container">
    <div class="hdr">
      <div>
        <div class="br">Gerard<span>Fanals</span></div>
        <div class="brsub">Senior Software IA Architect · Automatización B2B · Estratega de IA Generativa</div>
      </div>
      <div class="mt">
        ${p.lead_nombre ? `<div class="mtn">${p.lead_nombre}</div>` : ''}
        <div>${fecha}</div>
        ${p.numero ? `<div class="mtl">Ref: ${p.numero}</div>` : ''}
      </div>
    </div>
    
    <div class="cb">${catL[p.categoria] || p.categoria}</div>
    ${p.badge ? `<span class="bdg">${p.badge}</span>` : ''}
    
    <h1>${p.titulo}</h1>
    ${p.subtitulo ? `<div class="sub">${p.subtitulo}</div>` : ''}
    
    ${!isPers ? `
      <div class="pb nb">
        <div class="pr">
          ${hasDsc && p.precio_alta ? `<span class="og">${p.precio_alta.toLocaleString('es-ES')}€</span>` : ''}
          <span class="p">${precioFinal ? Math.round(precioFinal).toLocaleString('es-ES') : '—'}€</span>
          <span class="pl">${p.forma_pago==='sin_iva'?'':'+ IVA'}</span>
          ${p.descuento_pct>0?`<span class="dsc">-${p.descuento_pct}% dto.</span>`:''}
        </div>
        ${p.precio_mensual?`<div class="psub">Mantenimiento: ${p.precio_mensual}€/mes${p.forma_pago==='sin_iva'?'':' + IVA'}</div>`:''}
      </div>
    ` : ''}
    
    <div class="sec nb">
      <div class="st">DESCRIPCIÓN DEL SERVICIO</div>
      <div class="dsc2">${(p.descripcion||'').replace(/\n/g,'<br>')}</div>
    </div>
    
    ${lineasH}
    ${pagoOptionsHtml}
    
    ${p.bonus ? `
      <div class="nb" style="margin:14px 0; padding:16px 20px; border-radius:12px; background:linear-gradient(135deg,#f0fdf4,#ecfdf5); border:1px solid #bbf7d0">
        <div style="font-size:7.5pt; font-weight:700; color:#16a34a; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:6px">🎁 BONUS INCLUIDOS</div>
        <div style="font-size:9.5pt; line-height:1.65; color:#15803d; white-space:pre-line">${p.bonus}</div>
      </div>
    ` : ''}
    
    ${recommendedHtml}
    
    <div class="ig nb">
      ${(p.formas_pago_ofrecidas && p.formas_pago_ofrecidas.length > 0) ? `<div class="ii"><div class="il">Formas de pago</div><div class="iv">💳 ${p.formas_pago_ofrecidas.map((fp) => formasPago[fp] || fp).join(' · ')}</div></div>` : p.forma_pago?`<div class="ii"><div class="il">Forma de pago</div><div class="iv">💳 ${formasPago[p.forma_pago]||p.forma_pago}</div></div>`:''}
      ${p.link_pago?`<div class="ii"><div class="il">Enlace de pago</div><div class="iv"><a href="${p.link_pago}" style="color:#0071e3;font-size:8.5pt;word-break:break-all">${p.link_pago}</a></div></div>`:''}
      ${p.fecha_entrega?`<div class="ii"><div class="il">📅 Fecha de entrega</div><div class="iv">${new Date(p.fecha_entrega).toLocaleDateString('es-ES',{day:'2-digit',month:'long',year:'numeric'})}</div></div>`:''}
      <div class="ii"><div class="il">Validez</div><div class="iv">30 días desde la fecha de emisión</div></div>
      <div class="ii"><div class="il">Contacto</div><div class="iv">📱 629 494 167 · ✉️ gerard@iartesana.es</div></div>
    </div>
    
    ${p.notas_internas ? `<div class="nt nb"><div class="st">📝 NOTAS</div><div class="dsc2">${p.notas_internas.replace(/\n/g,'<br>')}</div></div>` : ''}
    ${p.contenido_ia ? `<div class="ai nb"><div class="st">📋 DETALLE</div><div class="dsc2">${p.contenido_ia.replace(/\n/g,'<br>')}</div></div>` : ''}
    
    <div class="ft">
      <div>
        <div class="fb">GerardFanals</div>
        <div class="fd">${fecha}</div>
      </div>
      <div class="fc">
        <span>📱 629 494 167</span>
        <a href="mailto:gerard@iartesana.es">✉️ gerard@iartesana.es</a>
        <span>🌐 gerardfanals.online</span>
      </div>
    </div>
  </div>

</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(htmlOutput);
  } catch (error) {
    console.error('Error rendering budget document:', error);
    return res.status(500).send(`<h1>Error interno</h1><p>${error.message}</p>`);
  }
};
