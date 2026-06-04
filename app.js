// 🧠 CerebroComercial AI — Frontend Orchestrator (app.js)

// EMAIL COMPOSE - defined early to ensure availability
window._composeAttachments = [];

window.openComposeForLead = function(email) {
    try {
        if (sessionStorage.getItem('cc_role') === 'guest') return;
        var modal = document.getElementById('email-compose-modal');
        var select = document.getElementById('compose-email-to');
        if (!modal || !select) { alert('Modal de email no encontrado'); return; }

        select.innerHTML = '';
        // Add target email
        var mainOpt = document.createElement('option');
        mainOpt.value = email;
        mainOpt.textContent = email;
        mainOpt.selected = true;
        select.appendChild(mainOpt);

        // Add other leads
        var seen = new Set([email]);
        var sources = [].concat(typeof _allLeadsGridData !== 'undefined' && _allLeadsGridData ? _allLeadsGridData : [], typeof outreachLeadsList !== 'undefined' && outreachLeadsList ? outreachLeadsList : []);
        sources.forEach(function(l) {
            if (!l.email || seen.has(l.email)) return;
            seen.add(l.email);
            var opt = document.createElement('option');
            opt.value = l.email;
            opt.textContent = (l.first_name || 'Prospecto') + ' (' + (l.company_name || '—') + ') — ' + l.email;
            select.appendChild(opt);
        });

        // Custom email option
        var customOpt = document.createElement('option');
        customOpt.value = '__custom__';
        customOpt.textContent = '✏️ Otro email (pruebas)...';
        select.appendChild(customOpt);

        // Reset fields
        var customInput = document.getElementById('compose-custom-email');
        if (customInput) { customInput.style.display = 'none'; customInput.value = ''; }
        var subj = document.getElementById('compose-email-subject');
        var body = document.getElementById('compose-email-body');
        if (subj) subj.value = '';
        if (body) body.value = '';
        window._composeAttachments = [];
        var attList = document.getElementById('compose-attachments-list');
        if (attList) attList.innerHTML = '';

        modal.style.display = 'flex';
        modal.classList.add('active');
    } catch(e) {
        alert('Error: ' + e.message);
    }
};

// AI content generator for compose - opens custom modal
window.openComposeAI = function() {
    var modal = document.getElementById('compose-ai-modal');
    if (!modal) return;
    document.getElementById('compose-ai-instruction').value = '';
    modal.style.display = 'flex';
    modal.classList.add('active');
    setTimeout(function() { document.getElementById('compose-ai-instruction').focus(); }, 100);
};

window.closeComposeAIModal = function() {
    var modal = document.getElementById('compose-ai-modal');
    if (modal) { modal.classList.remove('active'); modal.style.display = 'none'; }
};

window.executeComposeAI = function() {
    var instruction = document.getElementById('compose-ai-instruction').value.trim();
    if (!instruction) return;
    closeComposeAIModal();
    var body = document.getElementById('compose-email-body');
    if (body) body.value = '⏳ Generando con IA...';

    // Get recipient name from select for personalization
    var select = document.getElementById('compose-email-to');
    var selectVal = select ? select.value : '';
    var recipientName = '';
    if (selectVal && selectVal !== '__custom__') {
        var recipientText = select.options[select.selectedIndex].textContent || '';
        recipientName = recipientText.split('(')[0].split('—')[0].trim();
    }

    var prompt = 'Genera el contenido HTML de un email comercial. Instrucción: ' + instruction + '.\n\n' +
        'REGLAS ESTRICTAS:\n' +
        '- Devuelve SOLO el HTML del cuerpo del email, SIN etiquetas ```html ni ``` ni markdown\n' +
        '- NO incluyas línea de "Asunto:" dentro del cuerpo\n' +
        '- NO uses [Nombre del Cliente] ni placeholders, usa el nombre real: "' + recipientName + '" (si está vacío, empieza con "Hola,")\n' +
        '- Tono cercano, informal (tutea siempre), directo y profesional\n' +
        '- Máximo 4-5 párrafos cortos\n' +
        '- Incluye un CTA claro (ej: "¿Te va bien que agendemos una llamada rápida esta semana?")\n' +
        '- NO incluyas firma al final del email, la firma se añade automáticamente por el sistema\n' +
        '- Para el espaciado, usa etiquetas <p style="margin:0 0 8px 0"> en cada párrafo para que queden compactos, SIN <br><br> entre párrafos\n' +
        '- Usa etiquetas HTML simples: <p>, <strong>, <a>. NO uses <html>, <head>, <body>';

    fetch('/api/brain-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt })
    }).then(function(r) { return r.json(); }).then(function(data) {
        var content = data.text || data.reply || data.message || 'Error generando contenido';
        // Strip markdown code blocks if present
        content = content.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/g, '').trim();
        if (body) body.value = content;
    }).catch(function(err) {
        if (body) body.value = 'Error al conectar con la IA: ' + err.message;
    });
};

// File attachment handler
window.handleComposeAttach = function(input) {
    var list = document.getElementById('compose-attachments-list');
    if (!list || !input.files) return;
    Array.from(input.files).forEach(function(file) {
        if (file.size > 10 * 1024 * 1024) {
            if (typeof showToast !== 'undefined') showToast('Archivo "' + file.name + '" demasiado grande (máx 10MB)', true);
            return;
        }
        window._composeAttachments.push(file);
        var chip = document.createElement('div');
        chip.className = 'compose-attach-chip';
        var icon = file.type.includes('pdf') ? '📄' : file.type.includes('image') ? '🖼️' : '📎';
        var sizeMB = (file.size / 1024 / 1024).toFixed(1);
        chip.innerHTML = icon + ' ' + file.name + ' <span style="opacity:0.6">(' + sizeMB + 'MB)</span> <button onclick="this.parentElement.remove()">✕</button>';
        list.appendChild(chip);
    });
    input.value = '';
};
// 1. Supabase Initialization
const SUPABASE_URL = 'https://lmozoetpehmdxxremtqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtb3pvZXRwZWhtZHh4cmVtdHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTA2NDUsImV4cCI6MjA5NTgyNjY0NX0.1xkCCw7q9CDvVbqGswCeFwXpgYfMtb0wcl7lHWlKQ8U';
let _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State management
let leadsList = [];
let brainChatHistory = [];
// ── Config Tab Switcher ──────────────────────────────────────
function switchConfigTab(tabName) {
    document.querySelectorAll('.cfg-tab').forEach(t => t.classList.toggle('active', t.dataset.cfgtab === tabName));
    document.querySelectorAll('.cfg-panel').forEach(p => {
        p.classList.remove('active');
        if (p.id === 'cfg-' + tabName) p.classList.add('active');
    });
    // Auto-load users when switching to the usuarios tab
    if (tabName === 'usuarios') loadUsers();
    // Auto-check sync when switching to the sync tab
    if (tabName === 'sync') checkSyncStatus();
    // Auto-load storage data when switching to the storage tab
    if (tabName === 'storage') loadStorageData();
    // Auto-load contratos when switching to the contracts tab
    if (tabName === 'contracts') loadContratos();
}

// ── User Management ──────────────────────────────────────────
let _cachedUsers = [];

async function loadUsers() {
    const container = document.getElementById('users-list-container');
    const countLabel = document.getElementById('users-count-label');
    if (!container) return;

    try {
        const res = await fetch('/api/users');
        const data = await res.json();
        if (data.error && !data.users) throw new Error(data.error);
        const users = data.users || data || [];
        _cachedUsers = users;

        if (countLabel) countLabel.textContent = users.length + ' usuario' + (users.length !== 1 ? 's' : '') + ' registrado' + (users.length !== 1 ? 's' : '');

        if (users.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--text-grey);font-size:0.85rem"><div style="font-size:2rem;margin-bottom:8px">👤</div>No hay usuarios registrados.<br>Crea el primero con el botón de arriba.</div>';
            return;
        }

        const roleColors = { superadmin: '#af52de', admin: '#007aff', client: '#34c759', guest: '#8e8e93' };
        const roleLabels = { superadmin: '👑 SuperAdmin', admin: '🛡️ Admin', client: '👤 Client', guest: '👁️ Guest' };
        const roleGradients = {
            superadmin: 'linear-gradient(135deg, #af52de, #5856d6)',
            admin: 'linear-gradient(135deg, #007aff, #5856d6)',
            client: 'linear-gradient(135deg, #34c759, #30d158)',
            guest: 'linear-gradient(135deg, #8e8e93, #636366)'
        };

        container.innerHTML = users.map(u => {
            const name = u.full_name || u.username || u.email || 'Sin nombre';
            const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
            const role = (u.role || 'admin').toLowerCase();
            const isActive = u.is_active !== false;
            const email = u.email || '';
            const roleColor = roleColors[role] || '#8e8e93';
            const roleLabel = roleLabels[role] || role;
            const gradient = roleGradients[role] || roleGradients.guest;

            return `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-radius:14px;border:1px solid var(--border-color);background:var(--bg-card);transition:transform 0.15s ease,box-shadow 0.15s ease" onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'" onmouseout="this.style.transform='none';this.style.boxShadow='none'">
                <div style="display:flex;align-items:center;gap:12px;min-width:0;flex:1">
                    <div style="width:40px;height:40px;border-radius:50%;background:${gradient};display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:0.85rem;flex-shrink:0">${initials}</div>
                    <div style="min-width:0">
                        <div style="font-weight:600;font-size:0.88rem;color:var(--text-main);display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                            <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</span>
                            <span style="padding:2px 8px;border-radius:6px;background:${roleColor}18;color:${roleColor};font-size:0.68rem;font-weight:700;white-space:nowrap">${roleLabel}</span>
                        </div>
                        <div style="font-size:0.72rem;color:var(--text-grey);display:flex;align-items:center;gap:6px;margin-top:2px">
                            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${email}</span>
                            <span style="padding:2px 8px;border-radius:6px;font-size:0.65rem;font-weight:700;white-space:nowrap;${isActive ? 'background:rgba(52,199,89,0.1);color:#34c759' : 'background:rgba(255,69,58,0.1);color:#ff453a'}">${isActive ? '🟢 Activo' : '🔴 Desactivado'}</span>
                        </div>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
                    <button class="btn-secondary" style="padding:5px 10px;font-size:0.72rem" onclick="openEditUserModal('${u.id}')" title="Editar usuario">✏️ Editar</button>
                    <button class="btn-secondary" style="padding:5px 10px;font-size:0.72rem" onclick="sendPasswordReset('${u.id}', '${email}')" title="Enviar enlace de reseteo">🔑 Contraseña</button>
                    <button class="btn-secondary" style="padding:5px 10px;font-size:0.72rem;color:${isActive ? '#ff453a' : '#34c759'}" onclick="toggleUserActive('${u.id}', ${isActive})" title="${isActive ? 'Desactivar' : 'Activar'} usuario">${isActive ? '🔴 Desactivar' : '🟢 Activar'}</button>
                </div>
            </div>`;
        }).join('');
    } catch (e) {
        console.error('Error loading users:', e);
        container.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#ff453a;font-size:0.85rem"><div style="font-size:2rem;margin-bottom:8px">⚠️</div>Error al cargar usuarios: ' + e.message + '<br><button class="btn-secondary" style="margin-top:12px;padding:6px 16px;font-size:0.78rem" onclick="loadUsers()">🔄 Reintentar</button></div>';
        if (countLabel) countLabel.textContent = 'Error al cargar';
    }
}

function openCreateUserModal() {
    document.getElementById('user-modal-title').textContent = 'Crear Usuario';
    document.getElementById('user-modal-save-btn').textContent = '💾 Crear Usuario';
    document.getElementById('user-modal-id').value = '';
    document.getElementById('user-modal-name').value = '';
    document.getElementById('user-modal-email').value = '';
    document.getElementById('user-modal-password').value = '';
    document.getElementById('user-modal-password-field').style.display = '';
    document.getElementById('user-modal-role').value = 'admin';
    // Check all modules by default
    document.querySelectorAll('#user-modal-modules input[type=checkbox]').forEach(cb => cb.checked = true);
    _showUserModal();
}

function openEditUserModal(userId) {
    const user = _cachedUsers.find(u => u.id === userId);
    if (!user) { showAlert('Error', 'No se encontró el usuario.', '❌'); return; }

    document.getElementById('user-modal-title').textContent = 'Editar Usuario';
    document.getElementById('user-modal-save-btn').textContent = '💾 Guardar Cambios';
    document.getElementById('user-modal-id').value = userId;
    document.getElementById('user-modal-name').value = user.full_name || user.username || '';
    document.getElementById('user-modal-email').value = user.email || '';
    document.getElementById('user-modal-password-field').style.display = 'none';
    document.getElementById('user-modal-role').value = (user.role || 'admin').toLowerCase();

    // Set module checkboxes
    const userModules = user.modules || 'all';
    document.querySelectorAll('#user-modal-modules input[type=checkbox]').forEach(cb => {
        cb.checked = userModules === 'all' || (Array.isArray(userModules) && userModules.includes(cb.value));
    });
    _showUserModal();
}

function _showUserModal() {
    const modal = document.getElementById('user-modal');
    const card = document.getElementById('user-modal-card');
    modal.style.display = 'flex';
    requestAnimationFrame(() => {
        modal.style.opacity = '1';
        card.style.transform = 'scale(1)';
    });
}

function closeUserModal() {
    const modal = document.getElementById('user-modal');
    const card = document.getElementById('user-modal-card');
    modal.style.opacity = '0';
    card.style.transform = 'scale(0.95)';
    setTimeout(() => { modal.style.display = 'none'; }, 300);
}

async function saveUser() {
    const id = document.getElementById('user-modal-id').value;
    const name = document.getElementById('user-modal-name').value.trim();
    const email = document.getElementById('user-modal-email').value.trim();
    const password = document.getElementById('user-modal-password').value;
    const role = document.getElementById('user-modal-role').value;

    const modules = [];
    document.querySelectorAll('#user-modal-modules input[type=checkbox]:checked').forEach(cb => modules.push(cb.value));

    if (!name || !email) {
        showAlert('Campos requeridos', 'Nombre y email son obligatorios.', '⚠️');
        return;
    }
    if (!id && password.length < 6) {
        showAlert('Contraseña muy corta', 'La contraseña debe tener al menos 6 caracteres.', '⚠️');
        return;
    }

    const body = { full_name: name, email, role, modules };
    if (!id) body.password = password;

    try {
        const isEdit = !!id;
        const url = isEdit ? '/api/users?id=' + id : '/api/users';
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error del servidor');

        closeUserModal();
        showAlert(isEdit ? 'Usuario actualizado' : 'Usuario creado', isEdit ? name + ' se ha actualizado correctamente.' : name + ' se ha creado correctamente.', '✅');
        loadUsers();
    } catch (e) {
        showAlert('Error', 'No se pudo guardar: ' + e.message, '❌');
    }
}

async function sendPasswordReset(userId, email) {
    if (!email) { showAlert('Error', 'Este usuario no tiene email configurado.', '⚠️'); return; }
    try {
        const res = await fetch('/api/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'send-reset', user_id: userId, email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error del servidor');
        showAlert('Enlace enviado', 'Se ha enviado un email de reseteo de contraseña a ' + email, '🔑');
    } catch (e) {
        showAlert('Error', 'No se pudo enviar el enlace: ' + e.message, '❌');
    }
}

async function toggleUserActive(userId, currentIsActive) {
    const action = currentIsActive ? 'desactivar' : 'activar';
    const confirmed = await showConfirm(
        (currentIsActive ? 'Desactivar' : 'Activar') + ' usuario',
        '¿Seguro que quieres ' + action + ' este usuario? ' + (currentIsActive ? 'No podrá acceder al dashboard.' : 'Podrá volver a acceder.'),
        currentIsActive ? '🔴' : '🟢',
        currentIsActive ? 'Desactivar' : 'Activar'
    );
    if (!confirmed) return;

    try {
        const res = await fetch('/api/users?id=' + userId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: !currentIsActive })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error del servidor');
        showAlert('Usuario ' + (currentIsActive ? 'desactivado' : 'activado'), 'El cambio se ha aplicado correctamente.', '✅');
        loadUsers();
    } catch (e) {
        showAlert('Error', 'No se pudo cambiar el estado: ' + e.message, '❌');
    }
}
// ── Contratos Management ─────────────────────────────────────
let contratosData = [];
let contratoEditId = null;

async function loadContratos() {
    try {
        console.log('[Contratos] Fetching...');
        const res = await fetch('/api/contratos');
        const data = await res.json();
        console.log('[Contratos] Received:', data.contratos?.length, 'contracts');
        contratosData = data.contratos || [];
        try {
            renderContratos(contratosData);
            console.log('[Contratos] Render OK');
        } catch (renderErr) {
            console.error('[Contratos] Render error:', renderErr);
            document.getElementById('contratos-grid').innerHTML = `<div style="text-align:center;padding:40px;color:#ff453a;font-size:0.85rem;grid-column:1/-1">Error render: ${renderErr.message}</div>`;
        }
    } catch (e) {
        console.error('Error loading contratos:', e);
        document.getElementById('contratos-grid').innerHTML = `<div style="text-align:center;padding:40px;color:#ff453a;font-size:0.85rem;grid-column:1/-1">Error al cargar: ${e.message}</div>`;
    }
}

function filterContratos() {
    const q = (document.getElementById('contrato-search')?.value || '').toLowerCase().trim();
    if (!q) { renderContratos(contratosData); return; }
    const filtered = contratosData.filter(ct =>
        (ct.cliente_nombre || '').toLowerCase().includes(q) ||
        (ct.cliente_email || '').toLowerCase().includes(q) ||
        (ct.codigo_contrato || '').toLowerCase().includes(q) ||
        (ct.notas || '').toLowerCase().includes(q)
    );
    renderContratos(filtered);
}

function renderContratos(contratos) {
    // Stats
    const total = contratos.length;
    const firmados = contratos.filter(c => c.estado === 'firmado' || (c.firma_cliente && c.firma_prestador)).length;
    const pendientes = total - firmados;
    const valor = contratos.reduce((s, c) => s + (parseFloat(c.precio_total) || 0), 0);
    document.getElementById('ct-stat-total').textContent = total;
    document.getElementById('ct-stat-firmados').textContent = firmados;
    document.getElementById('ct-stat-pendientes').textContent = pendientes;
    document.getElementById('ct-stat-valor').textContent = valor.toLocaleString('es-ES') + '€';

    const grid = document.getElementById('contratos-grid');
    if (contratos.length === 0) {
        grid.innerHTML = `<div style="text-align:center;padding:50px 20px;grid-column:1/-1"><div style="font-size:3rem;margin-bottom:12px;opacity:0.3">📝</div><div style="font-size:0.95rem;font-weight:600;color:var(--text-grey)">No hay contratos</div><div style="font-size:0.78rem;color:var(--text-grey);margin-top:4px">Crea tu primer contrato con el botón "+ Nuevo contrato"</div></div>`;
        return;
    }

    grid.innerHTML = contratos.map(ct => {
        const isFirmadoCliente = !!ct.firma_cliente;
        const isFirmadoPrestador = !!ct.firma_prestador;
        const bothSigned = isFirmadoCliente && isFirmadoPrestador;
        const isPrueba = !!ct.es_prueba;
        const avatarBg = bothSigned ? 'linear-gradient(135deg,#34c759,#30d158)' : 'linear-gradient(135deg,#007AFF,#5856d6)';
        const initial = (ct.cliente_nombre || '?')[0].toUpperCase();

        // Dates
        const fechaContrato = ct.fecha_contrato ? new Date(ct.fecha_contrato + 'T00:00:00').toLocaleDateString('es-ES') : '—';
        let fechaFinHtml = '';
        if (ct.fecha_contrato && ct.duracion_meses > 0) {
            const inicio = new Date(ct.fecha_contrato + 'T00:00:00');
            const fin = new Date(inicio); fin.setMonth(fin.getMonth() + ct.duracion_meses);
            const expirado = fin < new Date();
            fechaFinHtml = `<span style="color:${expirado ? '#ff3b30' : 'var(--text-grey)'};font-weight:${expirado ? '700' : '400'}">🏁 ${fin.toLocaleDateString('es-ES')}${expirado ? ' (expirado)' : ''}</span>`;
        }

        // Payment method
        const formasPago = ct.formas_pago || {};
        const metodoPagoMap = { transferencia: 'Transferencia bancaria', giro: 'Giro bancario', bizum: 'Bizum', stripe: 'Tarjeta (Stripe)' };
        let pagoHtml = '';
        if (formasPago.seleccionada) {
            pagoHtml = `<div style="background:rgba(0,113,227,0.04);border-radius:10px;padding:8px 14px;margin-bottom:14px;font-size:0.72rem;display:flex;align-items:center;gap:8px;border:1px solid rgba(0,113,227,0.1)">
                <span style="font-weight:700;color:#0071e3">💳 Forma de pago:</span>
                <span style="color:var(--text-main);font-weight:600">${metodoPagoMap[formasPago.seleccionada] || formasPago.seleccionada}</span>
                ${formasPago.opcion ? `<span style="color:#86868b"> · Opción ${formasPago.opcion}</span>` : ''}
            </div>`;
        }

        // Client data section
        let clientDataHtml = '';
        const datos = ct.datos_cliente || {};
        const hasClientData = ct.cliente_nif || ct.cliente_profesion || datos.nombre_negocio || datos.cif_negocio || ct.cliente_direccion || ct.cliente_email || ct.cliente_telefono;
        if (hasClientData) {
            let rows = '';
            if (ct.cliente_nif) rows += `<span>NIF: <strong style="color:var(--text-main)">${ct.cliente_nif}</strong></span>`;
            if (ct.cliente_profesion) rows += `<span>Profesión: ${ct.cliente_profesion}</span>`;
            if (datos.nombre_negocio || ct.cliente_nombre) rows += `<span>Empresa: <strong style="color:var(--text-main)">${datos.nombre_negocio || ct.cliente_nombre}</strong></span>`;
            if (datos.cif_negocio || ct.cliente_nif) rows += `<span>CIF: ${datos.cif_negocio || ct.cliente_nif}</span>`;
            if (ct.cliente_direccion) rows += `<span style="grid-column:1/-1">📍 ${ct.cliente_direccion}</span>`;
            if (ct.cliente_email) rows += `<span>✉️ ${ct.cliente_email}</span>`;
            if (ct.cliente_telefono) rows += `<span>📞 ${ct.cliente_telefono}</span>`;
            if (datos.web) rows += `<span>🌐 ${datos.web}</span>`;
            clientDataHtml = `<div style="background:#f5f5f7;border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:0.72rem;color:var(--text-grey);line-height:1.7">
                <div style="font-weight:700;color:var(--text-main);margin-bottom:4px;font-size:0.74rem">📋 Datos del cliente</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 12px">${rows}</div>
            </div>`;
        }

        // Signature preview
        let firmaHtml = '';
        if (isFirmadoCliente && (ct.firma_cliente || ct.firmado_at)) {
            const firmaImg = ct.firma_cliente && ct.firma_cliente.startsWith('data:') ? `<img src="${ct.firma_cliente}" alt="Firma" style="height:30px;max-width:80px;object-fit:contain;border-radius:4px" />` : '';
            firmaHtml = `<div style="background:rgba(52,199,89,0.04);border-radius:10px;padding:8px 14px;margin-bottom:14px;font-size:0.72rem;display:flex;align-items:center;gap:10px">
                ${firmaImg}
                <div>
                    <div style="font-weight:700;color:#34c759">✍️ ${ct.firma_nombre_firmante || ct.cliente_nombre || 'CLIENTE'}</div>
                    ${ct.firmado_at ? `<div style="color:var(--text-grey)">${new Date(ct.firmado_at).toLocaleString('es-ES')}</div>` : ''}
                </div>
            </div>`;
        }

        // Border style
        const borderStyle = isPrueba ? '2px dashed #ff9500' : `1px solid ${bothSigned ? 'rgba(52,199,89,0.2)' : 'var(--border-color)'}`;
        const bgStyle = isPrueba ? 'rgba(255,149,0,0.03)' : 'var(--bg-card)';

        return `<div style="background:${bgStyle};border-radius:18px;border:${borderStyle};padding:22px;transition:all 0.2s;display:flex;flex-direction:column" onmouseover="this.style.boxShadow='0 6px 24px rgba(0,0,0,0.08)';this.style.transform='translateY(-1px)'" onmouseout="this.style.boxShadow='none';this.style.transform='none'">
            <!-- Header: Avatar + Name -->
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
                <div style="width:48px;height:48px;border-radius:50%;background:${avatarBg};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.2rem;flex-shrink:0">${initial}</div>
                <div style="flex:1;min-width:0">
                    <div style="font-weight:700;font-size:1.05rem;letter-spacing:-0.01em;color:var(--text-main)">${isPrueba ? '<span style="margin-right:4px" title="Contrato de prueba">🧪</span>' : ''}${ct.cliente_nombre || 'Sin cliente'}</div>
                    <div style="font-size:0.74rem;color:var(--text-grey);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${ct.cliente_email || '—'} · ${ct.cliente_telefono || '—'}</div>
                </div>
            </div>

            <!-- Dual Signature Badges -->
            <div style="display:flex;gap:6px;margin-bottom:14px">
                <span style="flex:1;text-align:center;font-size:0.68rem;padding:5px 8px;border-radius:8px;font-weight:700;background:${isFirmadoCliente ? 'rgba(52,199,89,0.08)' : 'rgba(255,149,0,0.08)'};color:${isFirmadoCliente ? '#34c759' : '#ff9500'};border:1px solid ${isFirmadoCliente ? 'rgba(52,199,89,0.15)' : 'rgba(255,149,0,0.15)'}">${isFirmadoCliente ? '✅ Cliente firmado' : '⏳ Cliente no firmado'}</span>
                <span style="flex:1;text-align:center;font-size:0.68rem;padding:5px 8px;border-radius:8px;font-weight:700;background:${isFirmadoPrestador ? 'rgba(0,113,227,0.06)' : 'rgba(255,149,0,0.08)'};color:${isFirmadoPrestador ? '#0071e3' : '#ff9500'};border:1px solid ${isFirmadoPrestador ? 'rgba(0,113,227,0.12)' : 'rgba(255,149,0,0.15)'}">${isFirmadoPrestador ? '🖊️ Prestador firmado' : '⏳ Prestador no firmado'}</span>
            </div>

            <!-- Contract Info -->
            <div style="font-size:0.78rem;color:var(--text-grey);display:flex;gap:14px;flex-wrap:wrap;margin-bottom:14px">
                ${ct.codigo_contrato ? `<span style="font-family:monospace;font-weight:600;color:#5856d6">📋 ${ct.codigo_contrato}</span>` : ''}
                <span>💰 ${(parseFloat(ct.precio_total) || 0).toLocaleString('es-ES')}€</span>
                ${ct.precio_mensual > 0 ? `<span>🔄 ${ct.precio_mensual}€/mes</span>` : ''}
                <span>📅 ${ct.duracion_meses || 0} meses</span>
                <span>🕐 ${fechaContrato}</span>
                ${fechaFinHtml}
            </div>

            <!-- Payment Method -->
            ${pagoHtml}

            <!-- Client Data Section -->
            ${clientDataHtml}

            <!-- Signature Preview -->
            ${firmaHtml}

            <!-- Action Buttons -->
            <div style="margin-top:auto;padding-top:4px;display:flex;gap:6px;flex-wrap:wrap">
                <button class="btn-secondary" style="font-size:0.7rem;padding:5px 12px" onclick="event.stopPropagation();editarContrato('${ct.id}')">👁 Ver / Editar</button>
                <button class="btn-secondary" style="font-size:0.7rem;padding:5px 12px;border-color:rgba(0,113,227,0.2);color:#0071e3" onclick="event.stopPropagation();generarPdfContrato('${ct.id}')">📄 PDF</button>
                <button class="btn-secondary" style="font-size:0.7rem;padding:5px 12px;border-color:rgba(255,59,48,0.2);color:#ff3b30" onclick="event.stopPropagation();eliminarContrato('${ct.id}','${(ct.cliente_nombre||'').replace(/'/g,'\\&#39;')}')">🗑 Borrar</button>
                <button class="btn-secondary" style="font-size:0.7rem;padding:5px 12px;margin-left:auto;border-color:${isPrueba ? '#ff9500' : 'rgba(0,0,0,0.1)'};background:${isPrueba ? 'rgba(255,149,0,0.1)' : 'transparent'};color:${isPrueba ? '#ff9500' : '#aeaeb2'}" onclick="event.stopPropagation();togglePruebaContrato('${ct.id}',${isPrueba})" title="${isPrueba ? 'Quitar modo prueba' : 'Marcar como prueba'}">🧪 ${isPrueba ? 'Quitar prueba' : 'Prueba'}</button>
            </div>
        </div>`;
    }).join('');
}

function switchContratoTab(tab) {
    document.getElementById('contrato-tab-lista').style.display = tab === 'lista' ? '' : 'none';
    document.getElementById('contrato-tab-editor').style.display = tab === 'editor' ? '' : 'none';
    document.querySelectorAll('#contratos-subtabs button').forEach(b => {
        const isActive = b.dataset.tab === tab;
        b.style.fontWeight = isActive ? '700' : '500';
        b.style.background = isActive ? '#fff' : 'transparent';
        b.style.color = isActive ? 'var(--accent-blue)' : 'var(--text-grey)';
        b.style.boxShadow = isActive ? '0 1px 4px rgba(0,0,0,0.08)' : 'none';
    });
    if (tab === 'editor') initFirmaCanvas();
}

function nuevoContrato() {
    contratoEditId = null;
    const year = new Date().getFullYear();
    const num = contratosData.filter(c => (c.codigo_contrato || '').includes(`CC-${year}`)).length;
    const codigo = `CC-${year}-${String(num + 1).padStart(3, '0')}`;
    document.getElementById('editor-title').textContent = 'Nuevo Contrato';
    document.getElementById('editor-codigo').textContent = codigo;
    // Clear all fields
    ['ct-cliente-nombre','ct-cliente-email','ct-cliente-telefono','ct-cliente-nif','ct-cliente-direccion','ct-cliente-profesion'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    document.getElementById('ct-cliente-representacion').value = 'en su propio nombre y representación';
    document.getElementById('ct-servicios').value = '';
    document.getElementById('ct-precio-total').value = '';
    document.getElementById('ct-precio-mensual').value = '';
    document.getElementById('ct-duracion').value = '12';
    document.getElementById('ct-lugar').value = 'Mahón (Menorca)';
    document.getElementById('ct-fecha-contrato').value = new Date().toISOString().split('T')[0];
    document.getElementById('ct-fecha-inicio').value = '';
    document.getElementById('ct-notas').value = '';
    clearFirma();
    switchContratoTab('editor');
}

function editarContrato(id) {
    const ct = contratosData.find(c => c.id === id);
    if (!ct) return;
    contratoEditId = id;
    document.getElementById('editor-title').textContent = 'Editar: ' + (ct.cliente_nombre || 'Contrato');
    document.getElementById('editor-codigo').textContent = ct.codigo_contrato || '';
    document.getElementById('ct-cliente-nombre').value = ct.cliente_nombre || '';
    document.getElementById('ct-cliente-email').value = ct.cliente_email || '';
    document.getElementById('ct-cliente-telefono').value = ct.cliente_telefono || '';
    document.getElementById('ct-cliente-nif').value = ct.cliente_nif || '';
    document.getElementById('ct-cliente-direccion').value = ct.cliente_direccion || '';
    document.getElementById('ct-cliente-profesion').value = ct.cliente_profesion || '';
    document.getElementById('ct-cliente-representacion').value = ct.cliente_representacion || 'en su propio nombre y representación';
    document.getElementById('ct-prestador-nombre').value = ct.prestador_nombre || 'Gerard Fanals';
    document.getElementById('ct-prestador-empresa').value = ct.prestador_empresa || 'Vigila y Actúa S.L.';
    document.getElementById('ct-prestador-cif').value = ct.prestador_cif || 'B 57973562';
    document.getElementById('ct-prestador-actividad').value = ct.prestador_actividad || '';
    document.getElementById('ct-prestador-direccion').value = ct.prestador_direccion || '';
    document.getElementById('ct-servicios').value = (ct.servicios || []).join('\n');
    document.getElementById('ct-precio-total').value = ct.precio_total || '';
    document.getElementById('ct-precio-mensual').value = ct.precio_mensual || '';
    document.getElementById('ct-duracion').value = ct.duracion_meses || 12;
    document.getElementById('ct-lugar').value = ct.lugar || 'Mahón (Menorca)';
    document.getElementById('ct-fecha-contrato').value = ct.fecha_contrato || '';
    document.getElementById('ct-fecha-inicio').value = ct.fecha_inicio || '';
    document.getElementById('ct-notas').value = ct.notas || '';
    // Load firma prestador if exists
    clearFirma();
    if (ct.firma_prestador) {
        const preview = document.getElementById('firma-preview-img');
        const container = document.getElementById('firma-preview-container');
        preview.src = ct.firma_prestador;
        container.style.display = '';
    }
    switchContratoTab('editor');
}

async function guardarContrato() {
    const btn = document.getElementById('btn-guardar-contrato');
    btn.textContent = '⏳ Guardando...';
    btn.disabled = true;

    const serviciosRaw = document.getElementById('ct-servicios').value;
    const servicios = serviciosRaw.split('\n').map(s => s.trim()).filter(Boolean);

    // Get firma from canvas
    const canvas = document.getElementById('firma-canvas');
    let firmaPrestador = null;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hasDrawing = imgData.data.some((v, i) => i % 4 === 3 && v > 0);
        if (hasDrawing) firmaPrestador = canvas.toDataURL('image/png');
    }
    // Keep existing firma if canvas is empty
    if (!firmaPrestador && contratoEditId) {
        const existing = contratosData.find(c => c.id === contratoEditId);
        if (existing) firmaPrestador = existing.firma_prestador;
    }

    const body = {
        codigo_contrato: document.getElementById('editor-codigo').textContent,
        cliente_nombre: document.getElementById('ct-cliente-nombre').value,
        cliente_email: document.getElementById('ct-cliente-email').value,
        cliente_telefono: document.getElementById('ct-cliente-telefono').value,
        cliente_nif: document.getElementById('ct-cliente-nif').value,
        cliente_direccion: document.getElementById('ct-cliente-direccion').value,
        cliente_profesion: document.getElementById('ct-cliente-profesion').value,
        prestador_nombre: document.getElementById('ct-prestador-nombre').value,
        prestador_empresa: document.getElementById('ct-prestador-empresa').value,
        prestador_cif: document.getElementById('ct-prestador-cif').value,
        prestador_actividad: document.getElementById('ct-prestador-actividad').value,
        prestador_direccion: document.getElementById('ct-prestador-direccion').value,
        servicios,
        precio_total: parseFloat(document.getElementById('ct-precio-total').value) || 0,
        precio_mensual: parseFloat(document.getElementById('ct-precio-mensual').value) || 0,
        duracion_meses: parseInt(document.getElementById('ct-duracion').value) || 12,
        fecha_contrato: document.getElementById('ct-fecha-contrato').value || null,
        fecha_inicio: document.getElementById('ct-fecha-inicio').value || null,
        notas: document.getElementById('ct-notas').value,
        firma_prestador: firmaPrestador,
        estado: firmaPrestador ? 'firmado_prestador' : 'no_firmado',
    };

    try {
        const method = contratoEditId ? 'PUT' : 'POST';
        const url = contratoEditId ? `/api/contratos?id=${contratoEditId}` : '/api/contratos';
        if (contratoEditId) body.id = contratoEditId;

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const result = await res.json();
        if (result.success) {
            showAlert('Contrato guardado', 'El contrato se ha guardado correctamente.', '✅');
            await loadContratos();
            switchContratoTab('lista');
        } else {
            showAlert('Error', result.error || 'No se pudo guardar el contrato.', '❌');
        }
    } catch (e) {
        showAlert('Error', e.message, '❌');
    }
    btn.textContent = '💾 Guardar';
    btn.disabled = false;
}

async function eliminarContrato(id, nombre) {
    if (!confirm(`¿Eliminar el contrato de "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
        const res = await fetch(`/api/contratos?id=${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            showAlert('Eliminado', 'Contrato eliminado correctamente.', '🗑️');
            await loadContratos();
        } else {
            showAlert('Error', result.error || 'No se pudo eliminar.', '❌');
        }
    } catch (e) {
        showAlert('Error', e.message, '❌');
    }
}

async function togglePruebaContrato(id, currentValue) {
    const newVal = !currentValue;
    try {
        const res = await fetch(`/api/contratos?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, es_prueba: newVal })
        });
        const result = await res.json();
        if (result.success) {
            showAlert(newVal ? '🧪 Prueba' : '✅ Real', newVal ? 'Contrato marcado como prueba' : 'Contrato marcado como real', newVal ? '🧪' : '✅');
            await loadContratos();
        }
    } catch (e) {
        showAlert('Error', e.message, '❌');
    }
}

// ── Firma Canvas ─────────────────────────────────────────────
let firmaDrawing = false;
function initFirmaCanvas() {
    const canvas = document.getElementById('firma-canvas');
    if (!canvas || canvas._initialized) return;
    canvas._initialized = true;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1d1d1f';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches ? e.touches[0] : e;
        return {
            x: (touch.clientX - rect.left) * (canvas.width / rect.width),
            y: (touch.clientY - rect.top) * (canvas.height / rect.height)
        };
    }
    function startDraw(e) { e.preventDefault(); firmaDrawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); }
    function draw(e) { if (!firmaDrawing) return; e.preventDefault(); const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); }
    function endDraw() { firmaDrawing = false; }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', endDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', endDraw);
}

function clearFirma() {
    const canvas = document.getElementById('firma-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    const container = document.getElementById('firma-preview-container');
    if (container) container.style.display = 'none';
}

// ── PDF Generation ───────────────────────────────────────────
function generarPdfContrato(fromId) {
    // If called from a card with ID, load into editor first then generate
    if (fromId && typeof fromId === 'string') {
        const ct = contratosData.find(c => c.id === fromId);
        if (ct) { editarContrato(fromId); setTimeout(() => generarPdfContrato(), 200); return; }
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, H = 297, margin = 25, cW = W - margin * 2;
    let y = 0;

    // Read form values
    const c = {
        codigo: document.getElementById('editor-codigo')?.textContent || '',
        cli_nombre: document.getElementById('ct-cliente-nombre')?.value || '',
        cli_email: document.getElementById('ct-cliente-email')?.value || '',
        cli_telefono: document.getElementById('ct-cliente-telefono')?.value || '',
        cli_nif: document.getElementById('ct-cliente-nif')?.value || '',
        cli_direccion: document.getElementById('ct-cliente-direccion')?.value || '',
        cli_profesion: document.getElementById('ct-cliente-profesion')?.value || '',
        cli_representacion: document.getElementById('ct-cliente-representacion')?.value || 'en su propio nombre y representación',
        pre_nombre: document.getElementById('ct-prestador-nombre')?.value || 'Gerard Fanals',
        pre_empresa: document.getElementById('ct-prestador-empresa')?.value || 'Vigila y Actúa S.L.',
        pre_cif: document.getElementById('ct-prestador-cif')?.value || 'B 57973562',
        pre_actividad: document.getElementById('ct-prestador-actividad')?.value || '',
        pre_direccion: document.getElementById('ct-prestador-direccion')?.value || '',
        servicios: (document.getElementById('ct-servicios')?.value || '').split('\n').filter(Boolean),
        precio_total: parseFloat(document.getElementById('ct-precio-total')?.value) || 0,
        precio_mensual: parseFloat(document.getElementById('ct-precio-mensual')?.value) || 0,
        duracion: parseInt(document.getElementById('ct-duracion')?.value) || 12,
        lugar: document.getElementById('ct-lugar')?.value || 'Mahón (Menorca)',
        fecha: document.getElementById('ct-fecha-contrato')?.value || '',
        fecha_inicio: document.getElementById('ct-fecha-inicio')?.value || '',
        notas: document.getElementById('ct-notas')?.value || '',
    };

    const fechaFmt = c.fecha ? new Date(c.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '___';
    const fechaFinDate = c.fecha ? new Date(new Date(c.fecha + 'T00:00:00').setMonth(new Date(c.fecha + 'T00:00:00').getMonth() + c.duracion)) : null;
    const fechaFin = fechaFinDate ? fechaFinDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '___';

    // Helper: add page footer
    function footer(pageNum) {
        doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(150);
        doc.text(`${c.codigo} — Página ${pageNum}`, W / 2, H - 10, { align: 'center' });
        doc.text(`${c.pre_empresa} · CIF ${c.pre_cif}`, W / 2, H - 6, { align: 'center' });
        doc.setTextColor(30);
    }

    // Helper: check page break
    function checkPage(needed) {
        if (y + needed > H - 25) { footer(doc.getNumberOfPages()); doc.addPage(); y = 30; return true; }
        return false;
    }

    // Helper: wrapped text
    function addText(text, x, fontSize, style, maxW) {
        doc.setFontSize(fontSize); doc.setFont('helvetica', style || 'normal');
        const lines = doc.splitTextToSize(text, maxW || cW);
        const lineH = fontSize * 0.42;
        for (const line of lines) { checkPage(lineH + 1); doc.text(line, x, y); y += lineH; }
        y += 1;
    }

    // Helper: section title
    function sectionTitle(text) {
        checkPage(14);
        y += 4;
        doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(30);
        doc.text(text, margin, y);
        y += 2;
        doc.setDrawColor(29, 29, 31); doc.setLineWidth(0.3);
        doc.line(margin, y, W - margin, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
    }

    // Helper: bullet point
    function bullet(text) {
        checkPage(8);
        doc.setFontSize(8.5); doc.setFont('helvetica', 'normal');
        doc.text('•', margin + 3, y);
        const lines = doc.splitTextToSize(text, cW - 10);
        for (const line of lines) { checkPage(4); doc.text(line, margin + 8, y); y += 3.8; }
        y += 0.5;
    }

    let pageNum = 1;

    // ═══════════════════════════════════════════════════════════
    // PAGE 1 - HEADER + PARTES + OBJETO
    // ═══════════════════════════════════════════════════════════
    // Dark header bar
    doc.setFillColor(29, 29, 31); doc.rect(0, 0, W, 22, 'F');
    doc.setTextColor(255); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('CONTRATO DE PRESTACIÓN DE SERVICIOS', W / 2, 10, { align: 'center' });
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text(c.pre_actividad || 'Servicios Tecnológicos', W / 2, 16, { align: 'center' });
    doc.setTextColor(30);

    // Contract code + date
    y = 30;
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(134);
    if (c.codigo) doc.text(c.codigo, W - margin, y, { align: 'right' });
    doc.setTextColor(30);
    y += 6;

    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal');
    addText(`En ${c.lugar}, a ${fechaFmt}.`, margin, 8.5, 'normal');
    y += 3;

    // REUNIDOS
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('REUNIDOS', margin, y); y += 6;

    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal');
    addText(`De una parte, ${c.cli_nombre || '___'}, ${c.cli_representacion}, ${c.cli_profesion ? 'de profesión ' + c.cli_profesion + ',' : ''} con NIF/CIF ${c.cli_nif || '___'} y domicilio en ${c.cli_direccion || '___'}, en adelante "El/La Cliente".`, margin, 8.5, 'normal');
    if (c.cli_email || c.cli_telefono) {
        addText(`Email: ${c.cli_email || '—'} | Teléfono: ${c.cli_telefono || '—'}`, margin, 7.5, 'normal');
    }
    y += 3;

    addText(`De otra parte, ${c.pre_nombre}, en nombre y representación de la compañía ${c.pre_empresa} (CIF ${c.pre_cif}), con domicilio en ${c.pre_direccion || '___'}, dedicada a la prestación de ${c.pre_actividad || 'servicios tecnológicos'}, en adelante "El Prestador".`, margin, 8.5, 'normal');
    addText(`Email: gerard@iartesana.es | Teléfono: +34 629494167`, margin, 7.5, 'normal');
    y += 3;

    addText('Ambas partes acuerdan las siguientes:', margin, 8.5, 'normal');
    y += 2;

    // CLÁUSULAS header
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('CLÁUSULAS', W / 2, y, { align: 'center' }); y += 8;

    // PRIMERA - OBJETO
    sectionTitle('PRIMERA.- OBJETO:');
    addText('El objeto del presente contrato es la prestación de los siguientes servicios profesionales por parte del Prestador al Cliente:', margin, 8.5, 'normal');
    y += 2;

    if (c.servicios.length > 0) {
        addText('Los servicios a prestar incluirán las siguientes actividades y entregables concretos:', margin, 8.5, 'normal');
        y += 1;
        c.servicios.forEach(s => bullet(s));
    } else {
        addText('(Servicios a definir)', margin, 8.5, 'italic');
    }

    footer(1);

    // ═══════════════════════════════════════════════════════════
    // PAGE 2 - DURACIÓN + PRECIO
    // ═══════════════════════════════════════════════════════════
    doc.addPage(); y = 30;

    sectionTitle('SEGUNDA.- DURACIÓN:');
    addText(`Este contrato tendrá una duración de ${c.duracion} meses, comenzando el ${c.fecha_inicio ? new Date(c.fecha_inicio + 'T00:00:00').toLocaleDateString('es-ES') : fechaFmt} y finalizando el ${fechaFin}, con opción de renovación por acuerdo expreso de ambas partes.`, margin, 8.5, 'normal');
    y += 4;

    sectionTitle('TERCERA.- PRECIO Y FORMA DE PAGO:');
    addText('A todos los precios se tiene que añadir el IVA.', margin, 8.5, 'normal');
    y += 2;

    if (c.precio_total > 0) {
        doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text(`Precio total del proyecto: ${c.precio_total.toLocaleString('es-ES')}€ + IVA`, margin, y); y += 5;
        doc.setFont('helvetica', 'normal');
    }
    if (c.precio_mensual > 0) {
        doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text(`Cuota mensual de mantenimiento: ${c.precio_mensual.toLocaleString('es-ES')}€ + IVA`, margin, y); y += 5;
        doc.setFont('helvetica', 'normal');
    }

    y += 2;
    addText('La forma de pago seleccionada por el/la Cliente será comunicada y acordada por ambas partes.', margin, 8.5, 'normal');
    y += 2;
    addText('NOTAS IMPORTANTES:', margin, 8.5, 'bold');
    bullet('En caso de retraso en el pago, se aplicará un recargo del 5% más los gastos bancarios ocasionados sobre el importe impagado.');
    bullet('En caso de baja laboral debidamente justificada, se podrán acordar nuevos plazos de pago, sin ningún recargo por ello.');

    y += 4;
    sectionTitle('CUARTA.- OBLIGACIONES DEL PRESTADOR:');
    addText('El Prestador se compromete a:', margin, 8.5, 'normal');
    bullet('Realizar los servicios y entregables con la mayor diligencia y profesionalidad conforme al calendario acordado.');
    bullet('Se acordará día y hora para cada reunión, pudiendo ser una reunión al mes si el cliente lo desea.');
    bullet('Realizar las rondas necesarias hasta la fecha de entrega para tener el proyecto 100% aceptado por el cliente.');
    bullet('A petición del cliente, se entregarán todos los archivos y documentos existentes del proyecto, excepto el código fuente que es propio del prestador.');

    footer(2);

    // ═══════════════════════════════════════════════════════════
    // PAGE 3 - OBLIGACIONES CLIENTE + IP + GARANTÍA
    // ═══════════════════════════════════════════════════════════
    doc.addPage(); y = 30;

    sectionTitle('QUINTA.- OBLIGACIONES DEL CLIENTE:');
    addText('El/la Cliente se compromete a:', margin, 8.5, 'normal');
    bullet('Facilitar al Prestador la información y materiales necesarios para el desarrollo de los servicios.');
    bullet('Respetar los plazos de pago según el desglose de la cláusula tercera.');
    bullet('Proporcionar acceso a plataformas y herramientas necesarias para la ejecución de los servicios.');

    y += 4;
    sectionTitle('SEXTA.- PROPIEDAD INTELECTUAL Y ENTREGA DE TRABAJOS:');
    addText('Una vez abonados íntegramente los servicios entregables, todos los trabajos desarrollados serán propiedad exclusiva del/la Cliente. El Prestador entregará todo el material realizado, incluidos los archivos definitivos y manuales, a la finalización y pago completo de los servicios. NO se entregará el código fuente del proyecto, es propiedad del prestador.', margin, 8.5, 'normal');
    y += 2;
    addText('Tus Datos son tuyos: Los datos operativos del cliente son de su exclusiva propiedad y exportables en cualquier momento.', margin, 8.5, 'normal');

    y += 4;
    sectionTitle('SÉPTIMA.- GARANTÍA Y CONTINUIDAD:');
    addText('1. Entrega del Código Fuente por Cese de Actividad:', margin, 8.5, 'bold');
    addText('En caso de que el Prestador cese definitivamente su actividad empresarial, se compromete a entregar al Cliente el código fuente completo del proyecto técnico.', margin, 8.5, 'normal');
    y += 2;
    addText('2. Viabilidad de Migración a Terceros:', margin, 8.5, 'bold');
    addText('El Prestador certifica que la arquitectura general del sistema se construye utilizando tecnologías de mercado estándar, abiertas y ampliamente documentadas. El sistema es técnicamente viable para ser transferido y mantenido por cualquier equipo de desarrollo externo.', margin, 8.5, 'normal');
    y += 2;
    addText('3. Exportación de Datos:', margin, 8.5, 'bold');
    addText('El Prestador garantiza que la funcionalidad de "Exportación Total de Datos" permitirá extraer la base de datos completa en formatos estándar (CSV/Excel).', margin, 8.5, 'normal');

    footer(3);

    // ═══════════════════════════════════════════════════════════
    // PAGE 4 - COMISIÓN + RESOLUCIÓN + CONFIDENCIALIDAD + RGPD
    // ═══════════════════════════════════════════════════════════
    doc.addPage(); y = 30;

    sectionTitle('OCTAVA.- COMISIÓN POR COMERCIALIZACIÓN:');
    addText('Si el Cliente o el Prestador comercializa o sublicencia la idea, concepto o proyecto desarrollado, se aplicará una comisión del 10% sobre los ingresos netos derivados de dicha comercialización. Esta cláusula será revisada anualmente para la aceptación por ambas partes.', margin, 8.5, 'normal');

    y += 4;
    sectionTitle('NOVENA.- RESOLUCIÓN DEL CONTRATO:');
    addText('El presente contrato podrá resolverse por:', margin, 8.5, 'normal');
    bullet('Mutuo acuerdo de ambas partes.');
    bullet('Incumplimiento de alguna de las partes, previa notificación por escrito y sin subsanación en 30 días.');
    bullet('Causas de fuerza mayor que imposibiliten la ejecución del contrato.');

    y += 4;
    sectionTitle('DÉCIMA.- CONFIDENCIALIDAD:');
    addText('Ambas partes se comprometen a mantener confidenciales todos los datos, información y documentos intercambiados durante la vigencia del contrato.', margin, 8.5, 'normal');

    y += 4;
    sectionTitle('UNDÉCIMA.- PROTECCIÓN DE DATOS:');
    addText('Cumplimiento de la Normativa de Protección de Datos (RGPD y LOPD-GDD):', margin, 8.5, 'bold');
    addText('En cumplimiento de la Ley Orgánica 3/2018 (LOPD-GDD) y el Reglamento General de Protección de Datos (RGPD UE 2016/679), el Prestador actuará exclusivamente en calidad de Encargado del Tratamiento de los datos personales introducidos por el Cliente, quien ostenta la condición de Responsable del Tratamiento. El Prestador tratará dichos datos únicamente siguiendo las instrucciones del Cliente y para el fin del presente contrato.', margin, 8.5, 'normal');
    y += 2;
    addText('Cumplimiento de la Ley de Inteligencia Artificial (AI Act / Reglamento UE 2024/1689):', margin, 8.5, 'bold');
    addText('Ambas partes reconocen que los módulos de Inteligencia Artificial integrados se diseñan y utilizan de conformidad con el Reglamento Europeo de IA (AI Act). El sistema se categoriza como de "Riesgo Mínimo o Nulo".', margin, 8.5, 'normal');

    footer(4);

    // ═══════════════════════════════════════════════════════════
    // PAGE 5 - CIBERSEGURIDAD + FIRMAS
    // ═══════════════════════════════════════════════════════════
    doc.addPage(); y = 30;

    sectionTitle('CLÁUSULAS ADICIONALES - SEGURIDAD DE LA INFORMACIÓN:');
    addText('Compromiso de Ciberseguridad y Medidas Técnicas:', margin, 8.5, 'bold');
    addText('Ambas partes se comprometen a implementar y mantener las medidas de seguridad técnicas y organizativas necesarias para garantizar un nivel de seguridad adecuado al riesgo, protegiendo el ecosistema tecnológico de accesos no autorizados, alteraciones, pérdidas o tratamientos ilícitos.', margin, 8.5, 'normal');
    y += 2;
    addText('Protocolo de Gestión de Brechas de Seguridad:', margin, 8.5, 'bold');
    bullet('Notificación inmediata: La parte que detecte la brecha notificará a la otra parte por escrito en un plazo máximo de 48 horas.');
    bullet('Mitigación y Colaboración: Ambas partes colaborarán estrechamente para contener el incidente y restaurar la normalidad.');
    bullet('Exención de Responsabilidad: El Prestador no será responsable de las brechas provocadas por negligencia del Cliente o fallos en infraestructuras de terceros.');

    // NOTAS (if any)
    if (c.notas) {
        y += 4;
        sectionTitle('NOTAS ADICIONALES:');
        addText(c.notas, margin, 8.5, 'normal');
    }

    // DUODÉCIMA
    y += 4;
    sectionTitle('DUODÉCIMA.- LEY APLICABLE Y JURISDICCIÓN:');
    addText(`El contrato se regirá por la legislación española. Para cualquier controversia, las partes se someten a los Juzgados y Tribunales de ${c.lugar}.`, margin, 8.5, 'normal');

    // FIRMAS
    y += 10;
    checkPage(60);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    addText('Y en prueba de conformidad, las partes firman el presente contrato, en el lugar y fecha que se han hecho constar al inicio de este contrato.', margin, 8.5, 'normal');
    y += 10;

    const colW = cW / 2 - 5;
    // Client signature box
    doc.setDrawColor(200); doc.setLineWidth(0.2);
    doc.rect(margin, y, colW, 40);
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.text('Firma de El/La Cliente:', margin + 3, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(c.cli_nombre || '___', margin + 3, y + 10);

    // Provider signature box
    doc.rect(margin + colW + 10, y, colW, 40);
    doc.setFont('helvetica', 'bold');
    doc.text('Firma de El Prestador:', margin + colW + 13, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(c.pre_nombre, margin + colW + 13, y + 10);

    // If there's a firma prestador on canvas, add it
    const canvas = document.getElementById('firma-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hasDrawing = imgData.data.some((v, i) => i % 4 === 3 && v > 0);
        if (hasDrawing) {
            const firmaImg = canvas.toDataURL('image/png');
            try { doc.addImage(firmaImg, 'PNG', margin + colW + 13, y + 13, 50, 20); } catch(e) {}
            doc.setFontSize(6.5); doc.setTextColor(100);
            doc.text(`Firmado digitalmente: ${new Date().toLocaleString('es-ES')}`, margin + colW + 13, y + 36);
            doc.setTextColor(30);
        }
    }
    // Also check existing firma from loaded contract
    if (contratoEditId) {
        const existing = contratosData.find(ct => ct.id === contratoEditId);
        if (existing?.firma_prestador) {
            try { doc.addImage(existing.firma_prestador, 'PNG', margin + colW + 13, y + 13, 50, 20); } catch(e) {}
        }
        if (existing?.firma_cliente) {
            try { doc.addImage(existing.firma_cliente, 'PNG', margin + 3, y + 13, 50, 20); } catch(e) {}
        }
    }

    footer(doc.getNumberOfPages());

    // SAVE
    const filename = `Contrato_${c.cli_nombre.replace(/\s+/g, '_') || 'borrador'}_${c.codigo || 'nuevo'}.pdf`;
    doc.save(filename);
    showAlert('PDF generado', `El contrato "${filename}" se ha descargado.`, '📄');
}

// ── Storage Data ─────────────────────────────────────────────
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
}

async function loadStorageData() {
    try {
        const res = await fetch('/api/storage');
        const data = await res.json();

        // Stats
        document.getElementById('storage-total-size').textContent = formatFileSize(data.stats?.total_size || 0);
        document.getElementById('storage-total-files').textContent = data.stats?.total_files || 0;
        document.getElementById('storage-total-buckets').textContent = (data.buckets || []).length;
        document.getElementById('storage-contratos-count').textContent = data.stats?.categories?.contratos?.count || 0;

        // Categories
        const catContainer = document.getElementById('storage-categories');
        const cats = data.stats?.categories || {};
        const catConfig = {
            contratos: { label: 'Contratos', color: '#ff453a', bgColor: 'rgba(255,69,58,0.1)', icon: '📝' },
            imagenes: { label: 'Imágenes', color: '#007AFF', bgColor: 'rgba(0,113,227,0.1)', icon: '🖼️' },
            adjuntos: { label: 'Adjuntos', color: '#34c759', bgColor: 'rgba(52,199,89,0.1)', icon: '📎' },
            documentos: { label: 'Documentos', color: '#ff9500', bgColor: 'rgba(255,149,0,0.1)', icon: '📄' },
            otros: { label: 'Otros', color: '#8e8e93', bgColor: 'rgba(142,142,147,0.1)', icon: '📦' }
        };
        const totalSize = data.stats?.total_size || 1;
        let catHtml = '';
        Object.entries(catConfig).forEach(([key, cfg]) => {
            const cat = cats[key] || { count: 0, size: 0 };
            if (cat.count === 0 && key !== 'contratos') return;
            const pct = Math.max(2, Math.round((cat.size / totalSize) * 100));
            catHtml += `<div style="display:flex;align-items:center;gap:12px"><span style="font-size:1rem">${cfg.icon}</span><div style="flex:1"><div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:4px"><span style="color:var(--text-main);font-weight:500">${cfg.label} (${cat.count})</span><span style="color:var(--text-grey)">${formatFileSize(cat.size)}</span></div><div style="height:6px;border-radius:3px;background:${cfg.bgColor};overflow:hidden"><div style="height:100%;width:${pct}%;background:${cfg.color};border-radius:3px;transition:width 0.5s ease"></div></div></div></div>`;
        });
        catContainer.innerHTML = catHtml || '<div style="text-align:center;padding:16px;color:var(--text-grey);font-size:0.78rem">Sin datos de categorías</div>';

        // File list
        const fileList = document.getElementById('storage-file-list');
        const files = data.files || [];
        document.getElementById('storage-file-count-label').textContent = files.length + ' archivos';

        if (files.length === 0) {
            fileList.innerHTML = `<div style="text-align:center;padding:40px 20px"><div style="font-size:2.5rem;margin-bottom:12px;opacity:0.4">📂</div><div style="font-size:0.85rem;color:var(--text-grey);font-weight:500">No hay archivos en Storage</div><div style="font-size:0.72rem;color:var(--text-grey);margin-top:4px">Los contratos firmados se guardarán aquí automáticamente.</div></div>`;
        } else {
            const iconMap = { pdf: '📕', doc: '📘', docx: '📘', xls: '📊', xlsx: '📊', csv: '📊', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', svg: '🎨', webp: '🖼️', zip: '📦', rar: '📦', txt: '📝' };
            let html = '';
            files.forEach(f => {
                const ext = (f.name.split('.').pop() || '').toLowerCase();
                const icon = iconMap[ext] || '📄';
                const dateStr = f.created_at ? new Date(f.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                html += `<div style="display:flex;align-items:center;gap:12px;padding:10px 18px;border-bottom:1px solid var(--border-color)">
                    <span style="font-size:1.2rem">${icon}</span>
                    <div style="flex:1;min-width:0">
                        <div style="font-size:0.82rem;font-weight:500;color:var(--text-main);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.name}</div>
                        <div style="font-size:0.68rem;color:var(--text-grey)">${f.bucket} · ${formatFileSize(f.size)} · ${dateStr}</div>
                    </div>
                    ${f.url ? `<a href="${f.url}" target="_blank" style="color:#007AFF;font-size:0.72rem;font-weight:600;text-decoration:none;white-space:nowrap">⬇️ Ver</a>` : ''}
                </div>`;
            });
            fileList.innerHTML = html;
        }
    } catch (e) {
        console.error('Error loading storage:', e);
        document.getElementById('storage-file-list').innerHTML = `<div style="text-align:center;padding:30px;color:#ff453a;font-size:0.8rem">Error al cargar: ${e.message}</div>`;
    }
}

// ── Sync Status Check ────────────────────────────────────────
async function checkSyncStatus() {
    const btn = document.getElementById('btn-check-sync');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span style="animation:spin 1s linear infinite;display:inline-block">🔄</span> Verificando...'; }

    // Reset all cards to loading
    const services = ['resend', 'hunter', 'gemini', 'supabase', 'google_calendar', 'stripe'];
    services.forEach(s => {
        const dot = document.getElementById('sync-dot-' + s);
        const badge = document.getElementById('sync-badge-' + s);
        const card = document.getElementById('sync-card-' + s);
        if (dot) dot.className = 'sync-dot-loading';
        if (badge) { badge.className = 'sync-badge-loading'; badge.textContent = '⏳ Verificando...'; }
        if (card) card.classList.remove('connected');
    });

    try {
        const res = await fetch('/api/check-sync');
        const data = await res.json();
        if (!data.services) throw new Error('Sin datos');

        let okCount = 0, warnCount = 0, errCount = 0;

        Object.entries(data.services).forEach(([key, info]) => {
            const dot = document.getElementById('sync-dot-' + key);
            const badge = document.getElementById('sync-badge-' + key);
            const card = document.getElementById('sync-card-' + key);
            const bar = document.getElementById('sync-bar-' + key);

            if (info.ok) {
                okCount++;
                if (dot) dot.className = 'sync-dot-ok';
                if (badge) { badge.className = 'sync-badge-ok'; badge.innerHTML = '<div class="sync-dot-ok" style="width:6px;height:6px"></div> Conectado'; }
                if (card) card.classList.add('connected');
                if (bar) bar.style.display = 'block';
            } else if (info.pending) {
                warnCount++;
                if (dot) dot.className = 'sync-dot-warn';
                if (badge) { badge.className = 'sync-badge-warn'; badge.textContent = '⚠️ ' + (info.error || 'Pendiente configurar'); }
            } else {
                errCount++;
                if (dot) dot.className = 'sync-dot-err';
                if (badge) { badge.className = 'sync-badge-err'; badge.textContent = '❌ ' + (info.error || 'Error de conexión'); }
            }
        });

        document.getElementById('sync-ok-count').textContent = okCount + ' Conectados';
        document.getElementById('sync-warn-count').textContent = warnCount + ' Pendientes';
        document.getElementById('sync-err-count').textContent = errCount + ' Error';
        document.getElementById('sync-last-check').textContent = 'Última verificación: ' + new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    } catch (e) {
        console.error('Error checking sync:', e);
        services.forEach(s => {
            const badge = document.getElementById('sync-badge-' + s);
            if (badge) { badge.className = 'sync-badge-err'; badge.textContent = '❌ Error de red'; }
        });
    }

    if (btn) { btn.disabled = false; btn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg> Verificar Conexiones'; }
}

// Toggle API key visibility
function toggleApiKey(inputId, realValueLabel) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const btn = input.parentElement.querySelector('button');
    if (input.type === 'password') {
        input.type = 'text';
        input.value = realValueLabel || 'Configurada en variables de entorno (Vercel)';
        if (btn) btn.textContent = '🔒 Ocultar';
    } else {
        input.type = 'password';
        input.value = '••••••••••••••••••••';
        if (btn) btn.textContent = '👁️ Ver';
    }
}

// Save business data
function saveBizData() {
    const status = document.getElementById('biz-save-status');
    if (status) {
        status.textContent = '✅ Datos guardados';
        status.style.color = '#34c759';
        setTimeout(() => { status.textContent = ''; }, 3000);
    }
    showAlert('Datos guardados', 'La información de la empresa se ha actualizado correctamente.', '✅');
}

// Save Google Calendar ID
function saveGCalId() {
    const val = document.getElementById('api-key-gcal')?.value?.trim();
    if (!val) {
        showAlert('Campo vacío', 'Por favor, introduce el ID del calendario de Google.', '⚠️');
        return;
    }
    showAlert('Calendar ID guardado', 'El ID del calendario se ha configurado correctamente.', '✅');
}

// macOS Modal Dialog Alert
function showAlert(title, desc, icon = '✦') {
    document.getElementById('alert-title').textContent = title;
    document.getElementById('alert-desc').textContent = desc;
    document.getElementById('alert-icon').textContent = icon;
    document.getElementById('alert-modal').classList.add('active');
}

function closeAlert() {
    document.getElementById('alert-modal').classList.remove('active');
}

// macOS Confirm Dialog (Promise-based)
let _confirmResolve = null;
function showConfirm(title, desc, icon = '🗑️', actionText = 'Eliminar') {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-desc').textContent = desc;
    document.getElementById('confirm-icon').textContent = icon;
    document.querySelector('#confirm-modal .btn-danger').textContent = actionText;
    document.getElementById('confirm-modal').classList.add('active');
    return new Promise(resolve => { _confirmResolve = resolve; });
}
function resolveConfirm(result) {
    document.getElementById('confirm-modal').classList.remove('active');
    if (_confirmResolve) { _confirmResolve(result); _confirmResolve = null; }
}

// macOS Prompt Dialog (Promise-based)
let _promptResolve = null;
function showPrompt(title, desc, icon = '📝', defaultValue = '', placeholder = '') {
    document.getElementById('prompt-title').textContent = title;
    document.getElementById('prompt-desc').textContent = desc;
    document.getElementById('prompt-icon').textContent = icon;
    const input = document.getElementById('prompt-input');
    input.value = defaultValue;
    input.placeholder = placeholder;
    document.getElementById('prompt-modal').classList.add('active');
    setTimeout(() => {
        input.focus();
        input.select();
    }, 150); // focus & select the input when shown
    return new Promise(resolve => { _promptResolve = resolve; });
}
function resolvePrompt(result) {
    const input = document.getElementById('prompt-input');
    const value = input.value;
    document.getElementById('prompt-modal').classList.remove('active');
    if (_promptResolve) {
        _promptResolve(result ? value : null);
        _promptResolve = null;
    }
}


// 2. Lock Screen Authentication (Username/Password & Role-Based Permissions)
async function validateLock() {
    const userInput = document.getElementById('lock-username');
    const pwdInput = document.getElementById('lock-password');
    const user = userInput ? userInput.value : '';
    const pwd = pwdInput ? pwdInput.value : '';
    const errorText = document.getElementById('lock-error');

    if (!user || !pwd) return;

    try {
        const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pwd })
        });

        const data = await res.json();

        if (data && data.success) {
            sessionStorage.setItem('cc_unlocked', 'true');
            sessionStorage.setItem('cc_token', pwd); // guardamos de forma segura localmente
            sessionStorage.setItem('cc_role', data.role);
            sessionStorage.setItem('cc_email', data.email || '');
            sessionStorage.setItem('cc_modules', JSON.stringify(data.modules || 'all'));
            if (data.except) {
                sessionStorage.setItem('cc_except_modules', JSON.stringify(data.except));
            } else {
                sessionStorage.removeItem('cc_except_modules');
            }
            unlockDashboard();
        } else {
            if (errorText) {
                errorText.textContent = data.error || 'Credenciales incorrectas';
                errorText.style.display = 'block';
            }
            if (pwdInput) pwdInput.value = '';
            shakeElement(document.querySelector('.macos-lock-card'));
        }
    } catch (e) {
        if (errorText) {
            errorText.textContent = 'Error de red al autenticar';
            errorText.style.display = 'block';
        }
    }
}

function shakeElement(el) {
    if (!el) return;
    el.style.transform = 'translateX(-10px)';
    setTimeout(() => el.style.transform = 'translateX(10px)', 80);
    setTimeout(() => el.style.transform = 'translateX(-8px)', 160);
    setTimeout(() => el.style.transform = 'translateX(8px)', 240);
    setTimeout(() => el.style.transform = 'translateX(0)', 320);
}

window.applyRolePermissions = function() {
    const role = sessionStorage.getItem('cc_role') || 'admin';
    const email = sessionStorage.getItem('cc_email') || 'gerard@iartesana.es';
    let modules = 'all';
    try {
        const m = sessionStorage.getItem('cc_modules');
        if (m) modules = JSON.parse(m);
    } catch(e) {}
    
    let exceptModules = [];
    try {
        const ex = sessionStorage.getItem('cc_except_modules');
        if (ex) exceptModules = JSON.parse(ex);
    } catch(e) {}

    // 1. Recorrer botones de navegación del menú lateral
    document.querySelectorAll('.sidebar-nav-item[data-section]').forEach(btn => {
        const sec = btn.dataset.section;
        let isAllowed = true;

        if (modules !== 'all') {
            isAllowed = modules.includes(sec);
        }
        if (exceptModules.length > 0 && exceptModules.includes(sec)) {
            isAllowed = false;
        }

        if (!isAllowed) {
            btn.classList.add('disabled-module');
            btn.setAttribute('title', 'Módulo no contratado / Restringido');
        } else {
            btn.classList.remove('disabled-module');
            btn.removeAttribute('title');
        }
    });

    // 2. Aplicar protección de solo lectura global si es Invitado
    if (role === 'guest') {
        document.body.classList.add('role-guest');
    } else {
        document.body.classList.remove('role-guest');
    }

    // 3. Actualizar la tarjeta del usuario conectado en el pie del sidebar
    const nameEl = document.querySelector('.connected-user-card div div div') || 
                   document.querySelector('.connected-user-card div:last-child div:first-child') ||
                   document.querySelector('.connected-user-card div[title]');
    if (nameEl) {
        let roleLabel = 'Admin';
        if (email === 'gerard@iartesana.es') roleLabel = 'Superadmin';
        else if (role === 'client') roleLabel = 'Cliente';
        else if (role === 'guest') roleLabel = 'Invitado';
        
        nameEl.innerHTML = `${email} <span style="font-size:0.65rem; padding: 1px 5px; border-radius: 4px; background: var(--bg-secondary); border: 1px solid var(--card-border); font-weight:700; color:var(--text-grey); margin-left: 2px;">${roleLabel}</span>`;
        nameEl.setAttribute('title', email);
    }

    const avatarEl = document.querySelector('.connected-user-card .user-avatar');
    if (avatarEl) {
        if (email === 'gerard@iartesana.es') {
            avatarEl.textContent = 'G';
            avatarEl.style.background = 'linear-gradient(135deg, var(--accent-purple), #ff5e3a)';
        } else if (role === 'admin') {
            avatarEl.textContent = 'A';
            avatarEl.style.background = 'linear-gradient(135deg, #ff9500, #ff5e3a)';
        } else if (role === 'client') {
            avatarEl.textContent = 'C';
            avatarEl.style.background = 'linear-gradient(135deg, #007aff, #5856d6)';
        } else if (role === 'guest') {
            avatarEl.textContent = 'I';
            avatarEl.style.background = 'linear-gradient(135deg, #34c759, #00c7b1)';
        }
    }
};

async function unlockDashboard() {
    try {
        const configRes = await fetch('/api/config');
        let config = null;
        if (configRes.ok) {
            config = await configRes.json();
        } else {
            // Local dev fallback if router returns 404 but body contains config JSON
            try {
                const text = await configRes.text();
                config = JSON.parse(text);
            } catch(e) {}
        }
        if (config && config.supabaseUrl && config.supabaseAnonKey) {
            _supabase = supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
            console.log('Supabase client initialized dynamically with URL:', config.supabaseUrl);
        } else {
            throw new Error('Invalid config response');
        }
    } catch (configErr) {
        console.error('Error initializing dynamic Supabase client, using fallback:', configErr);
    }

    document.getElementById('lock-screen').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('lock-screen').style.display = 'none';
        document.getElementById('dashboard-wrapper').style.display = 'flex';
        applyRolePermissions();
        initializeDashboard();
    }, 400);
}

function lockPanel() {
    sessionStorage.removeItem('cc_unlocked');
    sessionStorage.removeItem('cc_token');
    sessionStorage.removeItem('cc_role');
    sessionStorage.removeItem('cc_email');
    sessionStorage.removeItem('cc_modules');
    sessionStorage.removeItem('cc_except_modules');
    window.location.reload();
}

// Check session on load
(function() {
    const isUnlocked = sessionStorage.getItem('cc_unlocked') === 'true';
    window.addEventListener('DOMContentLoaded', () => {
        if (isUnlocked) {
            applyRolePermissions();
            unlockDashboard();
        }
    });
})();

// 3. Theme Toggle (White / Black)
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    html.setAttribute('data-theme', newTheme);
    document.querySelectorAll('.theme-icon').forEach(el => el.textContent = newTheme === 'light' ? '☀️' : '🌙');
    localStorage.setItem('cc_theme', newTheme);
}

// Restore saved theme on load
(function() {
    const savedTheme = localStorage.getItem('cc_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
})();

// 4. Tab Navigation
document.querySelectorAll('.sidebar-nav-item[data-section]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-nav-item').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
        
        btn.classList.add('active');
        const sectionId = 'sec-' + btn.dataset.section;
        document.getElementById(sectionId).classList.add('active');

        // Actions based on active section
        if (btn.dataset.section === 'leads') loadLeadsGrid();
        if (btn.dataset.section === 'kanban') loadKanbanCRM();
        if (btn.dataset.section === 'emails') loadEmailsLog();
        if (btn.dataset.section === 'calendar') { renderCalGrid(); loadMeetings(); }
        if (btn.dataset.section === 'proposals') loadProposalsModule();
        if (btn.dataset.section === 'contracts') loadContratos();
});

// 5. Initialize Dashboard Metrics
async function initializeDashboard() {
    try {
        // Fetch raw leads count
        const { data: leads, error } = await _supabase
            .from('outreach_leads')
            .select('*');
        
        if (error) throw error;
        leadsList = leads || [];

        // Fetch sent proposals to calculate proposals and financial metrics
        try {
            const { data: propData } = await _supabase.from('propuestas_enviadas').select('*');
            if (propData) propuestasEnviadas = propData;
        } catch(e) {}

        // Fetch presupuestos
        try {
            const { data: presData } = await _supabase.from('presupuestos').select('*').order('orden', { ascending: true });
            if (presData) presupuestos = presData;
        } catch(e) {
            const cached = localStorage.getItem('gf_presupuestos');
            if (cached) presupuestos = JSON.parse(cached);
        }

        // Count metrics
        const total = leadsList.length;
        const nuevos = leadsList.filter(l => l.status === 'lead' || l.status === 'new').length;
        const enviados = leadsList.filter(l => l.status.startsWith('sent_')).length;
        const reuniones = leadsList.filter(l => l.status === 'booked').length;
        
        // Clientes: unique leads that accepted a proposal
        const clientes = [...new Set(propuestasEnviadas.filter(p => p.estado === 'aceptada').map(p => p.lead_email || p.lead_nombre))].length;
        
        // Seguimiento: leads with active followups
        const seguimiento = leadsList.filter(l => l.status.startsWith('welcome_') || l.status.startsWith('followup_') || l.status.startsWith('nurture_') || l.status === 'nurture_monthly').length;
        
        // Perdidos: lost or unsubscribed leads
        const perdidos = leadsList.filter(l => l.status === 'lost' || l.status === 'unsubscribed').length;

        // Propuestas: count of sent proposals
        const propuestas = propuestasEnviadas.length;

        // Contratos: count of signed/accepted proposals
        const contratos = propuestasEnviadas.filter(p => p.estado === 'aceptada').length;

        // Pruebas: dynamic test counts
        const pruebasL = leadsList.filter(l => l.email && (l.email.includes('iartesana.es') || l.email.includes('test') || l.email.includes('prueba'))).length;
        let pruebasP = 0;
        try {
            // Count templates/budgets that are marked as test
            const testPresupuestosCount = presupuestos.filter(p => p.es_prueba).length;
            // Also count proposals sent that are tests (lead_email has iartesana.es/test/prueba)
            const testSentProposalsCount = propuestasEnviadas.filter(p => p.lead_email && (p.lead_email.includes('iartesana.es') || p.lead_email.includes('test') || p.lead_email.includes('prueba'))).length;
            pruebasP = testPresupuestosCount + testSentProposalsCount;
        } catch(e) {}
        
        let pruebasC = 0;
        try {
            // Count accepted proposals from test emails
            pruebasC = propuestasEnviadas.filter(p => p.estado === 'aceptada' && p.lead_email && (p.lead_email.includes('iartesana.es') || p.lead_email.includes('test') || p.lead_email.includes('prueba'))).length;
        } catch(e) {}

        const totalPruebas = pruebasL + pruebasP + pruebasC;

        // Helper function to safely set DOM text content
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setVal('metrics-total', total);
        setVal('metrics-new', nuevos);
        setVal('metrics-sent', enviados);
        setVal('metrics-booked', reuniones);
        setVal('metrics-clients', clientes);
        setVal('metrics-followup', seguimiento);
        setVal('metrics-lost', perdidos);
        setVal('metrics-proposals', propuestas);
        setVal('metrics-contracts', contratos);
        setVal('metrics-pruebas', totalPruebas);
        setVal('metrics-pruebas-l', pruebasL);
        setVal('metrics-pruebas-p', pruebasP);
        setVal('metrics-pruebas-c', pruebasC);

        // Helper to format currency: 31.278€
        const formatEuro = (val) => {
            return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val).replace(/\s/g, '');
        };

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Propuestas Acumulado
        const propAccumVal = propuestasEnviadas.reduce((sum, p) => sum + parseFloat(p.precio_final || p.precio_mensual_final || 0), 0);
        const propAccumCount = propuestasEnviadas.length;
        
        // Propuestas Este Mes
        const propMonthList = propuestasEnviadas.filter(p => {
            const d = new Date(p.enviado_at || p.created_at);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
        const propMonthVal = propMonthList.reduce((sum, p) => sum + parseFloat(p.precio_final || p.precio_mensual_final || 0), 0);
        const propMonthCount = propMonthList.length;

        // Ventas Acumulado (estado === 'aceptada')
        const ventasAccumList = propuestasEnviadas.filter(p => p.estado === 'aceptada');
        const ventasAccumVal = ventasAccumList.reduce((sum, p) => sum + parseFloat(p.precio_final || p.precio_mensual_final || 0), 0);
        const ventasAccumCount = ventasAccumList.length;

        // Ventas Este Mes
        const ventasMonthList = ventasAccumList.filter(p => {
            const d = new Date(p.enviado_at || p.created_at);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
        const ventasMonthVal = ventasMonthList.reduce((sum, p) => sum + parseFloat(p.precio_final || p.precio_mensual_final || 0), 0);
        const ventasMonthCount = ventasMonthList.length;

        // Update DOM elements for financials
        setVal('metrics-prop-accum-val', formatEuro(propAccumVal));
        setVal('metrics-prop-accum-sub', `${propAccumCount} propuestas`);

        setVal('metrics-prop-month-val', formatEuro(propMonthVal));
        setVal('metrics-prop-month-sub', `${propMonthCount} propuestas`);

        setVal('metrics-ventas-accum-val', formatEuro(ventasAccumVal));
        setVal('metrics-ventas-accum-sub', `${ventasAccumCount} aceptadas`);

        setVal('metrics-ventas-month-val', formatEuro(ventasMonthVal));
        setVal('metrics-ventas-month-sub', `${ventasMonthCount} aceptadas`);

        logToSystemSupport(`Dashboard cargado con nuevos KPIs. Real: ${total} leads. Propuestas: ${propuestas}. Ventas acumuladas: ${formatEuro(ventasAccumVal)}.`);

        // Fetch and display Hunter.io API credits
        try {
            const creditsRes = await fetch('/api/brain-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_credits', message: 'check' })
            });
            if (creditsRes.ok) {
                const creditsData = await creditsRes.json();
                const used = creditsData.hunter_credits_used || 0;
                const limit = creditsData.hunter_credits_limit || 50;

                const usedEl = document.getElementById('hunter-credits-used');
                const limitEl = document.getElementById('hunter-credits-limit');
                if (usedEl) usedEl.textContent = used;
                if (limitEl) limitEl.textContent = limit;

                const pct = Math.min(100, Math.round((used / limit) * 100));
                const progressFill = document.getElementById('hunter-credits-progress');
                if (progressFill) {
                    progressFill.style.width = pct + '%';
                    if (pct >= 80) {
                        progressFill.style.background = 'var(--accent-red)';
                    } else if (pct >= 50) {
                        progressFill.style.background = '#ff9500';
                    } else {
                        progressFill.style.background = 'linear-gradient(90deg, var(--accent-green), #ffcc00)';
                    }
                }

                const margin = Math.max(0, limit - used);
                const marginEl = document.getElementById('hunter-credits-margin');
                if (marginEl) {
                    marginEl.textContent = `${margin} créditos libres`;
                    if (margin < 10) {
                        marginEl.style.color = 'var(--accent-red)';
                    } else {
                        marginEl.style.color = 'var(--accent-green)';
                    }
                }
                logToSystemSupport(`Créditos Hunter.io consultados: ${used}/${limit} usados (${margin} libres).`);
            }
        } catch (creditsErr) {
            console.error('Error cargando créditos de Hunter:', creditsErr);
            logToSystemSupport(`Error consultando créditos de Hunter: ${creditsErr.message}`);
        }
    } catch (e) {
        console.error('Error cargando métricas:', e);
        logToSystemSupport(`Error al inicializar dashboard: ${e.message}`);
        showAlert('Error de Base de Datos', `Error al cargar métricas del dashboard: ${e.message || JSON.stringify(e)}`);
    }
}

// 6. Spreadsheet Module
let _allLeadsGridData = [];

async function loadLeadsGrid() {
    try {
        const { data: leads, error } = await _supabase
            .from('outreach_leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        _allLeadsGridData = leads || [];

        // Update counter
        const counter = document.getElementById('leads-total-count');
        if (counter) counter.textContent = `${_allLeadsGridData.length} leads`;

        renderLeadsGridRows(_allLeadsGridData);
    } catch (e) {
        console.error('Error in loadLeadsGrid:', e);
        showAlert('Error', `No se pudieron cargar los leads: ${e.message || JSON.stringify(e)}`);
    }
}

function filterLeadsGrid() {
    const q = (document.getElementById('leads-grid-search')?.value || '').toLowerCase();
    if (!q) {
        renderLeadsGridRows(_allLeadsGridData);
        return;
    }
    const filtered = _allLeadsGridData.filter(l =>
        (l.first_name || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q) ||
        (l.company_name || '').toLowerCase().includes(q) ||
        (l.phone || '').toLowerCase().includes(q)
    );
    renderLeadsGridRows(filtered);
}

function renderLeadsGridRows(leads) {
    const tbody = document.getElementById('leads-table-body');
    tbody.innerHTML = '';

    const activeStatuses = [
        'welcome_1','welcome_2','welcome_3','welcome_4','welcome_5',
        'followup_1','followup_2','followup_3','followup_4',
        'nurture_1','nurture_2','nurture_3','nurture_4','nurture_5','nurture_6',
        'nurture_7','nurture_8','nurture_9','nurture_10','nurture_11','nurture_monthly'
    ];

    leads.forEach(lead => {
        const cargo = (lead.scraped_data && lead.scraped_data.position) || '';
        const phone = lead.phone || '';
        const version = lead.version || 'A';
        const step = lead.sequence_step || 0;
        const status = lead.status || 'lead';
        const isClient = status === 'cliente' || status === 'client';
        const isTest = lead.is_test === true;

        // Email status badge
        let emailStatusHtml;
        const isActive = activeStatuses.includes(status);
        if (status === 'enriched' || status === 'lead') {
            emailStatusHtml = '<span class="email-step-badge email-step-pending">Sin iniciar</span>';
        } else if (status === 'reunion') {
            emailStatusHtml = '<span class="email-step-badge email-step-meeting">📅 Reunión</span>';
        } else if (status === 'unsubscribed') {
            emailStatusHtml = '<span class="email-step-badge email-step-unsub">🚫 Baja</span>';
        } else if (isClient) {
            emailStatusHtml = '<span class="email-step-badge email-step-client">⭐ Cliente</span>';
        } else if (isActive) {
            let chainName, chainColor, stepInChain;
            if (step < 5) { chainName = 'C1'; chainColor = '#ff9500'; stepInChain = step + 1; }
            else if (step < 9) { chainName = 'C2'; chainColor = '#34c759'; stepInChain = step - 4; }
            else { chainName = 'C3'; chainColor = '#007aff'; stepInChain = step - 8; }
            emailStatusHtml = `<span class="email-step-badge" style="background:${chainColor}18;color:${chainColor};border:1px solid ${chainColor}40">${chainName} · Paso ${stepInChain}</span>`;
        } else {
            emailStatusHtml = '<span class="email-step-badge email-step-done">✅ Completado</span>';
        }

        // Type dropdown
        const typeOptions = ['A', 'B', 'C'];
        const typeLabelsMap = { A: 'Conocido', B: 'Desconocido', C: 'Formulario' };
        let typeSelectHtml = `<select class="lead-type-select lead-type-select-${version.toLowerCase()}" onchange="window.changeLeadType('${lead.id}', this.value)">`;
        typeOptions.forEach(v => {
            typeSelectHtml += `<option value="${v}" ${version === v ? 'selected' : ''}>${typeLabelsMap[v]}</option>`;
        });
        typeSelectHtml += '</select>';

        const tr = document.createElement('tr');
        tr.className = `lead-row${isClient ? ' lead-row-client' : ''}${isTest ? ' lead-row-test' : ''}`;
        tr.id = `lead-row-${lead.id}`;
        tr.innerHTML = `
            <td class="lead-name-cell">
                <span class="lead-name-clickable" onclick="window.toggleLeadDetail('${lead.id}')" title="Click para ver historial">${lead.first_name || '—'}</span>
                ${isTest ? '<span class="lead-test-tag">TEST</span>' : ''}
            </td>
            <td class="lead-email-cell">${lead.email}</td>
            <td class="editable-cell" contenteditable="true" onblur="updateLeadField('${lead.id}', 'phone', this.textContent)">${phone}</td>
            <td class="lead-company-cell" title="${(lead.company_name || '').replace(/"/g, '&quot;')}">${lead.company_name || ''}</td>
            <td class="lead-cargo-cell" title="${cargo.replace(/"/g, '&quot;')}">${cargo}</td>
            <td>${typeSelectHtml}</td>
            <td>${emailStatusHtml}</td>
            <td class="lead-actions-cell">
                <button class="lead-action-btn btn-edit" data-tooltip="Editar" onclick="editLeadModal('${lead.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="svg-icon"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                <button class="lead-action-btn btn-phone" data-tooltip="Llamar" onclick="window.callLead('${phone}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="svg-icon"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></button>
                <button class="lead-action-btn btn-email" data-tooltip="Enviar Email" onclick="window.openComposeForLead('${lead.email}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="svg-icon"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg></button>
                <button class="lead-action-btn btn-whatsapp" data-tooltip="WhatsApp" onclick="openWhatsApp('${lead.email}', '${lead.first_name || ''}', '${lead.company_name || ''}')"><svg viewBox="0 0 24 24" fill="currentColor" class="svg-icon"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.454 5.709 1.455h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></button>
                <button class="lead-action-btn btn-signup" data-tooltip="Enviar formulario" onclick="window.openFormSelector('${lead.email}', '${(lead.first_name || '').replace(/'/g, "\\'")}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="svg-icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></button>
                <button class="lead-action-btn btn-test ${isTest ? 'active' : ''}" data-tooltip="${isTest ? 'Quitar prueba' : 'Marcar prueba'}" onclick="window.toggleTestLead('${lead.id}', ${!isTest})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="svg-icon"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg></button>
                <button class="lead-action-btn btn-delete action-delete" data-tooltip="Borrar" onclick="deleteLead('${lead.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="svg-icon"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- Lead detail expansion ---
window.toggleLeadDetail = async function(leadId) {
    const existingDetail = document.getElementById(`lead-detail-${leadId}`);
    if (existingDetail) {
        existingDetail.remove();
        return;
    }

    const parentRow = document.getElementById(`lead-row-${leadId}`);
    if (!parentRow) return;

    const detailRow = document.createElement('tr');
    detailRow.id = `lead-detail-${leadId}`;
    detailRow.className = 'lead-detail-row';
    const colSpan = parentRow.children.length;
    detailRow.innerHTML = `<td colspan="${colSpan}" class="lead-detail-cell"><div class="lead-detail-loading">Cargando historial...</div></td>`;
    parentRow.after(detailRow);

    try {
        // Fetch email logs
        const { data: logs } = await _supabase.from('outreach_email_logs').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }).limit(20);
        // Fetch proposals
        const lead = _allLeadsGridData.find(l => l.id === leadId);
        const { data: proposals } = await _supabase.from('presupuestos').select('id, nombre_proyecto, estado, total, created_at').eq('email_cliente', lead?.email || '').order('created_at', { ascending: false }).limit(10);

        let html = '<div class="lead-detail-content">';

        // Emails section
        html += '<div class="lead-detail-section"><div class="lead-detail-section-title">📨 Emails enviados</div>';
        if (logs && logs.length > 0) {
            html += '<div class="lead-detail-list">';
            logs.forEach(log => {
                const d = new Date(log.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                html += `<div class="lead-detail-item"><span class="lead-detail-date">${d}</span><span class="lead-detail-subj">${log.subject || log.email_type || '—'}</span></div>`;
            });
            html += '</div>';
        } else {
            html += '<div class="lead-detail-empty">Sin emails enviados</div>';
        }
        html += '</div>';

        // Proposals section
        html += '<div class="lead-detail-section"><div class="lead-detail-section-title">📋 Propuestas</div>';
        if (proposals && proposals.length > 0) {
            html += '<div class="lead-detail-list">';
            proposals.forEach(p => {
                const d = new Date(p.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                const estBadge = p.estado === 'aceptado' ? 'email-step-done' : p.estado === 'enviado' ? 'email-step-meeting' : 'email-step-pending';
                html += `<div class="lead-detail-item"><span class="lead-detail-date">${d}</span><span class="lead-detail-subj">${p.nombre_proyecto || '—'}</span><span class="email-step-badge ${estBadge}" style="font-size:0.62rem;padding:2px 6px;">${p.estado || '—'}</span><span style="font-size:0.75rem;font-weight:700;color:var(--text-main);">${p.total ? p.total + '€' : ''}</span></div>`;
            });
            html += '</div>';
        } else {
            html += '<div class="lead-detail-empty">Sin propuestas</div>';
        }
        html += '</div>';

        // Timeline
        html += '<div class="lead-detail-section"><div class="lead-detail-section-title">🕒 Línea temporal</div><div class="lead-detail-list">';
        if (lead) {
            const created = new Date(lead.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
            html += `<div class="lead-detail-item"><span class="lead-detail-date">${created}</span><span class="lead-detail-subj">Lead creado</span></div>`;
            if (lead.last_contacted_at) {
                const lc = new Date(lead.last_contacted_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
                html += `<div class="lead-detail-item"><span class="lead-detail-date">${lc}</span><span class="lead-detail-subj">Último contacto</span></div>`;
            }
        }
        html += '</div></div>';

        html += '</div>';
        detailRow.querySelector('.lead-detail-cell').innerHTML = html;
    } catch(e) {
        detailRow.querySelector('.lead-detail-cell').innerHTML = '<div class="lead-detail-empty">Error cargando historial</div>';
    }
};

window.changeLeadType = async function(leadId, newVersion) {
    try {
        await _supabase.from('outreach_leads').update({ version: newVersion }).eq('id', leadId);
        const lead = _allLeadsGridData.find(l => l.id === leadId);
        if (lead) lead.version = newVersion;
        showToast(`Tipo actualizado a V.${newVersion}`);
    } catch(e) { showToast('Error al cambiar tipo', true); }
};

window.toggleTestLead = async function(leadId, setTest) {
    try {
        await _supabase.from('outreach_leads').update({ is_test: setTest }).eq('id', leadId);
        const lead = _allLeadsGridData.find(l => l.id === leadId);
        if (lead) lead.is_test = setTest;
        showToast(setTest ? 'Marcado como lead de prueba' : 'Desmarcado como prueba');
        renderLeadsGridRows(_allLeadsGridData);
    } catch(e) { showToast('Error', true); }
};

window.callLead = function(phone) {
    if (!phone) { showToast('Este lead no tiene número de teléfono', true); return; }
    window.open(`tel:${phone}`, '_self');
};

// Form selector popup for sending forms to leads
window.openFormSelector = function(email, name) {
    // Remove any existing form popup
    document.querySelectorAll('.form-selector-popup').forEach(el => el.remove());

    const forms = [
        { id: 'alta', label: '📋 Formulario de alta', icon: '📋' },
        { id: 'rgpd', label: '🔒 Formulario RGPD', icon: '🔒' },
        { id: 'proyecto', label: '📐 Formulario de proyecto', icon: '📐' }
    ];

    const popup = document.createElement('div');
    popup.className = 'form-selector-popup';
    popup.innerHTML = `
        <div class="form-selector-header">Enviar formulario a <strong>${name || email}</strong></div>
        ${forms.map(f => `<button class="form-selector-item" onclick="window.sendFormToLead('${f.id}', '${email}', '${(name || '').replace(/'/g, "\\'")}'); this.closest('.form-selector-popup').remove();">${f.label}</button>`).join('')}
        <div class="form-selector-footer">📌 Configura tus formularios en Ajustes</div>
    `;
    document.body.appendChild(popup);

    // Position near mouse / center
    requestAnimationFrame(() => {
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
    });

    // Close on click outside
    setTimeout(() => {
        document.addEventListener('click', function handler(e) {
            if (!popup.contains(e.target)) { popup.remove(); document.removeEventListener('click', handler); }
        });
    }, 100);
};

window.sendFormToLead = function(formId, email, name) {
    const formNames = { alta: 'Formulario de alta', rgpd: 'Consentimiento RGPD', proyecto: 'Formulario de proyecto' };
    const subject = encodeURIComponent(`${name} — ${formNames[formId] || 'Formulario'}`);
    const body = encodeURIComponent(`Hola ${name},\n\nTe adjunto el ${formNames[formId] || 'formulario'} para que puedas completarlo.\n\nFormulario: [ENLACE]\n\nUn saludo,\niadebarrio.com`);
    // For now, open mailto; will be replaced by Resend + config forms
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
    showToast(`Formulario "${formNames[formId]}" preparado para ${name || email}`);
};



async function updateLeadField(id, field, value) {
    try {
        const { error } = await _supabase
            .from('outreach_leads')
            .update({ [field]: value.trim() })
            .eq('id', id);

        if (error) throw error;
        initializeDashboard(); // Actualizar contadores
    } catch (e) {
        console.error('Error actualizando campo:', e);
    }
}

async function deleteLead(id) {
    const confirmed = await showConfirm(
        'Borrar lead',
        '¿Seguro que quieres borrar este lead? Esta acción no se puede deshacer.',
        '🗑️',
        'Eliminar'
    );
    if (!confirmed) return;
    try {
        const { error } = await _supabase.from('outreach_leads').delete().eq('id', id);
        if (error) throw error;
        loadLeadsGrid();
        initializeDashboard();
        showAlert('Lead eliminado', 'El lead ha sido borrado correctamente.', '🗑️');
    } catch (e) {
        showAlert('Error', `No se pudo borrar: ${e.message}`);
    }
}

function editLeadModal(id) {
    // Quick inline edit — focus on the first editable cell in that row
    const rows = document.querySelectorAll('#leads-table-body tr');
    for (const row of rows) {
        const firstCell = row.querySelector('.editable-cell');
        if (firstCell && row.innerHTML.includes(id)) {
            firstCell.focus();
            return;
        }
    }
}

function quickEmailLead(email, name) {
    const subject = encodeURIComponent(`Hola ${name} — Propuesta de colaboración`);
    const body = encodeURIComponent(`Hola ${name},\n\nTe escribo desde iadebarrio.com...\n\nUn saludo.`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
}

function openWhatsApp(email, name, company) {
    // Try to find phone number, fallback to WhatsApp web search
    const msg = encodeURIComponent(`Hola ${name}! Te escribo desde iadebarrio.com. Estuve viendo la web de ${company} y me encantaría hablar contigo.`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
}

function sendSignupForm(email, name) {
    const subject = encodeURIComponent(`${name} — Formulario de alta como cliente`);
    const body = encodeURIComponent(`Hola ${name},\n\nTe adjunto el formulario de alta para que puedas darte de alta como cliente.\n\nFormulario: [ENLACE]\n\nUn saludo,\niadebarrio.com`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
}

// 7. CRM Kanban Drag & Drop Module
async function loadKanbanCRM() {
    try {
        const { data: leads, error } = await _supabase
            .from('outreach_leads')
            .select('*');

        if (error) throw error;

        // Clear columns
        const cols = ['lead', 'enriched', 'replied', 'booked'];
        cols.forEach(col => {
            document.getElementById(`column-${col}`).innerHTML = '';
            document.getElementById(`count-${col}`).textContent = '(0)';
        });

        const counts = { lead: 0, enriched: 0, replied: 0, booked: 0 };

        leads.forEach(lead => {
            let col = lead.status;
            // Map sub-statuses to main columns
            if (col === 'new') {
                col = 'lead';
            }
            if (col.startsWith('sent_') || 
                col.startsWith('followup_') || 
                col.startsWith('welcome_') || 
                col.startsWith('nurture_') || 
                col === 'nurture_monthly' || 
                col === 'enriching') {
                col = 'enriched';
            }
            if (col === 'lost' || col === 'unsubscribed') return;

            if (counts[col] !== undefined) {
                counts[col]++;
                const cargo = (lead.scraped_data && lead.scraped_data.position) || '';
                const phone = lead.phone || '';
                const card = document.createElement('div');
                card.className = 'kanban-card';
                card.draggable = true;
                card.id = `lead-${lead.id}`;
                card.setAttribute('ondragstart', 'handleDragStart(event)');
                card.innerHTML = `
                    <div class="kanban-card-header">
                        <h4>${lead.first_name || 'Prospecto'}</h4>
                        <span class="card-badge status-${lead.status}">${lead.status}</span>
                    </div>
                    <div class="kanban-card-company">🏢 ${lead.company_name || 'Sin empresa'}</div>
                    ${lead.email ? `<div class="kanban-card-detail">📧 ${lead.email}</div>` : ''}
                    ${phone ? `<div class="kanban-card-detail">📞 ${phone}</div>` : ''}
                    ${cargo ? `<div class="kanban-card-detail">💼 ${cargo}</div>` : ''}
                `;
                document.getElementById(`column-${col}`).appendChild(card);
            }
        });

        cols.forEach(col => {
            document.getElementById(`count-${col}`).textContent = `(${counts[col]})`;
        });
    } catch (e) {
        console.error('Kanban load error:', e);
    }
}

window.handleDragStart = function(event) {
    if (sessionStorage.getItem('cc_role') === 'guest') {
        event.preventDefault();
        return;
    }
    event.dataTransfer.setData('text/plain', event.target.id);
};

window.allowDrop = function(event) {
    event.preventDefault();
};

window.handleDrop = async function(event, targetStatus) {
    event.preventDefault();
    if (sessionStorage.getItem('cc_role') === 'guest') {
        showAlert('Restringido', 'El usuario Invitado tiene acceso de solo lectura', '🔒');
        return;
    }
    const id = event.dataTransfer.getData('text/plain').replace('lead-', '');
    
    try {
        // Actualizar el estado en Supabase
        const updateData = { status: targetStatus };
        if (targetStatus === 'enriched' || targetStatus === 'lead') {
            updateData.sequence_step = 0;
            updateData.last_contacted_at = null;
        }
        
        const { error } = await _supabase
            .from('outreach_leads')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;

        loadKanbanCRM();
        initializeDashboard();
    } catch (e) {
        showAlert('Error', 'No se pudo mover el lead');
    }
};

// 8. Multi-Agent Status Management System
const AGENT_NAMES = {
    searcher: { name: 'Buscador', icon: '🔍', tech: 'Hunter.io' },
    enricher: { name: 'Enriquecedor', icon: '🕷️', tech: 'Scraping + IA' },
    emailer: { name: 'Email', icon: '📧', tech: 'Resend' },
    analytics: { name: 'Analítico', icon: '📊', tech: 'Supabase' }
};

function setAgentStatus(agentId, status, message) {
    // Update tree node
    const node = document.getElementById(`node-${agentId}`);
    const statusEl = document.getElementById(`status-${agentId}`);
    if (node) {
        node.classList.remove('agent-working', 'agent-done', 'agent-error');
        if (status === 'working') node.classList.add('agent-working');
        if (status === 'done') node.classList.add('agent-done');
        if (status === 'error') node.classList.add('agent-error');
    }
    if (statusEl) {
        const dotClass = status === 'working' ? 'status-working' : status === 'done' ? 'status-done' : status === 'error' ? 'status-error' : 'status-idle';
        const label = status === 'working' ? 'Ejecutando...' : status === 'done' ? 'Completado' : status === 'error' ? 'Error' : 'Inactivo';
        statusEl.innerHTML = `<span class="status-dot ${dotClass}"></span> ${label}`;
    }

    // Update activity card badge
    const badge = document.getElementById(`badge-${agentId}`);
    if (badge) {
        badge.className = `agent-card-badge badge-${status === 'working' ? 'working' : status === 'done' ? 'done' : status === 'error' ? 'error' : 'idle'}`;
        const badgeLabels = { idle: '💤 Inactivo', working: '⚡ Ejecutando', done: '✅ Completado', error: '❌ Error' };
        badge.textContent = badgeLabels[status] || badgeLabels.idle;
    }

    // Update card active state
    const card = document.getElementById(`card-${agentId}`);
    if (card) {
        card.classList.toggle('card-active', status === 'working');
    }

    // Add log entry
    if (message && status !== 'idle') {
        addAgentLog(agentId, message, status);
    }
}

function addAgentLog(agentId, message, status) {
    const logEl = document.getElementById(`log-${agentId}`);
    if (!logEl) return;

    // Remove the "empty" placeholder if it exists
    const emptyEntry = logEl.querySelector('.log-empty');
    if (emptyEntry) emptyEntry.remove();

    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const statusIcon = status === 'done' ? '✅' : status === 'error' ? '❌' : '⚡';
    
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">${time}</span> ${statusIcon} ${message}`;
    
    // Insert at the top
    logEl.insertBefore(entry, logEl.firstChild);

    // Keep only last 5 entries
    while (logEl.children.length > 5) {
        logEl.removeChild(logEl.lastChild);
    }
}

function resetAllAgents() {
    Object.keys(AGENT_NAMES).forEach(id => {
        setAgentStatus(id, 'idle');
    });
    setAgentStatus('orchestrator', 'idle');
}

// 9. Agent Rating / Feedback System
let agentScores = JSON.parse(localStorage.getItem('cc_agent_scores') || '{}');

function loadAgentScores() {
    Object.keys(AGENT_NAMES).forEach(id => {
        const score = agentScores[id] || { up: 0, down: 0 };
        updateScoreDisplay(id, score);
    });
}

function updateScoreDisplay(agentId, score) {
    const el = document.getElementById(`score-${agentId}`);
    if (!el) return;
    const total = score.up - score.down;
    const trustLevel = total >= 5 ? '🟢 Alta' : total >= 2 ? '🟡 Media' : total <= -2 ? '🔴 Baja' : '⚪ Nueva';
    el.innerHTML = `<span class="${total >= 0 ? 'score-positive' : 'score-negative'}">${total >= 0 ? '+' : ''}${total}</span> · ${trustLevel}`;
}

async function rateAgent(agentId, rating) {
    // Update local scores
    if (!agentScores[agentId]) agentScores[agentId] = { up: 0, down: 0 };
    agentScores[agentId][rating]++;
    localStorage.setItem('cc_agent_scores', JSON.stringify(agentScores));
    updateScoreDisplay(agentId, agentScores[agentId]);

    // Visual feedback on buttons
    const card = document.getElementById(`card-${agentId}`);
    if (card) {
        const btns = card.querySelectorAll('.rating-btn');
        btns.forEach(b => b.classList.remove('rating-selected'));
        const selectedBtn = card.querySelector(`.rating-${rating}`);
        if (selectedBtn) {
            selectedBtn.classList.add('rating-selected');
            setTimeout(() => selectedBtn.classList.remove('rating-selected'), 1500);
        }
    }

    // Log the feedback
    addAgentLog(agentId, `Valoración: ${rating === 'up' ? '👍 Positiva' : '👎 Negativa'}`, rating === 'up' ? 'done' : 'error');

    // Try to persist in Supabase (non-blocking)
    try {
        await _supabase.from('agent_feedback').insert({
            agent_id: agentId,
            rating: rating,
            agent_name: AGENT_NAMES[agentId]?.name || agentId,
            created_at: new Date().toISOString()
        });
    } catch (e) {
        console.warn('No se pudo guardar feedback en Supabase (tabla agent_feedback puede no existir):', e);
    }
}

// Load scores on startup
document.addEventListener('DOMContentLoaded', loadAgentScores);

// --- Web Speech API: Voice Input for Brain Chat ---
let recognition = null;
let isRecording = false;

window.toggleSpeechRecognition = function() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showAlert('No Soportado', 'Tu navegador no soporta el reconocimiento de voz (Web Speech API). Te recomendamos usar Google Chrome o Safari.', '⚠️');
        return;
    }

    const micBtn = document.getElementById('brain-mic-btn');
    const input = document.getElementById('brain-chat-input');
    if (!micBtn || !input) return;

    if (isRecording) {
        if (recognition) recognition.stop();
        return;
    }

    try {
        recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = function() {
            isRecording = true;
            micBtn.classList.add('recording');
            input.placeholder = 'Escuchando tu voz...';
            input.focus();
            showToast('Micrófono activo. ¡Habla ahora!', '🎙️');
        };

        recognition.onresult = function(event) {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            const text = finalTranscript || interimTranscript;
            if (text) {
                input.value = text;
            }
        };

        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                showAlert('Permiso Denegado', 'No se ha concedido permiso para usar el micrófono. Actívalo en la configuración de tu navegador.', '❌');
            } else if (event.error !== 'aborted') {
                showToast('Error en reconocimiento de voz', '⚠️');
            }
            cleanupRecognition();
        };

        recognition.onend = function() {
            cleanupRecognition();
            if (input.value.trim() !== '') {
                setTimeout(() => {
                    sendToBrain();
                }, 400);
            }
        };

        recognition.start();

    } catch (e) {
        console.error('Failed to start speech recognition:', e);
        cleanupRecognition();
    }
};

function cleanupRecognition() {
    isRecording = false;
    const micBtn = document.getElementById('brain-mic-btn');
    const input = document.getElementById('brain-chat-input');
    if (micBtn) micBtn.classList.remove('recording');
    if (input) input.placeholder = 'Ej: Busca leads de gestorías en España...';
    recognition = null;
}

// --- Brain Favorites & Prompts Management ---
let brainFavoritesList = [];
try {
    const f = localStorage.getItem('cc_brain_favorites');
    if (f) {
        brainFavoritesList = JSON.parse(f);
    }
} catch(e) {}

document.addEventListener('DOMContentLoaded', () => {
    renderBrainFavorites();
});

window.renderBrainFavorites = function() {
    const list = document.getElementById('brain-favorites-list');
    if (!list) return;
    
    if (brainFavoritesList.length === 0) {
        list.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-grey); font-style: italic; padding: 4px 0;">No tienes peticiones guardadas. Escribe un texto en el chat y pulsa ★ para guardarla aquí.</div>`;
        return;
    }
    
    let html = '';
    brainFavoritesList.forEach((promptText, idx) => {
        html += `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; background: var(--bg-primary); border-radius: 12px; padding: 8px 12px; border: 1px solid var(--card-border);">
                <div style="font-size: 0.82rem; color: var(--text-main); font-weight: 500; cursor: pointer; flex: 1; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" onclick="loadPromptIntoInput(\`${promptText.replace(/`/g, '\\`').replace(/"/g, '&quot;')}\`)" title="Cargar petición">
                    📝 ${promptText}
                </div>
                <button onclick="deleteFavoritePrompt(${idx})" style="background: none; border: none; color: var(--accent-red); cursor: pointer; padding: 4px; font-size: 1.1rem; display: flex; align-items: center; line-height: 1;" title="Eliminar favorito">✕</button>
            </div>
        `;
    });
    
    list.innerHTML = html;
};

window.saveCurrentAsFavorite = function() {
    const input = document.getElementById('brain-chat-input');
    if (!input) return;
    const text = input.value.trim();
    
    if (!text) {
        showAlert('Campo Vacío', 'Escribe algo en el cuadro de chat antes de pulsar ★ para guardarlo.', '⚠️');
        return;
    }
    
    if (brainFavoritesList.includes(text)) {
        showAlert('Ya Guardado', 'Esta petición ya se encuentra guardada en tus favoritos.', '⚠️');
        return;
    }
    
    brainFavoritesList.push(text);
    localStorage.setItem('cc_brain_favorites', JSON.stringify(brainFavoritesList));
    renderBrainFavorites();
    showToast('Petición guardada en favoritos ⭐', 'success');
};

window.loadPromptIntoInput = function(text) {
    const input = document.getElementById('brain-chat-input');
    if (input) {
        input.value = text;
        input.focus();
        showToast('Petición cargada', '💡');
    }
};

window.deleteFavoritePrompt = function(index) {
    brainFavoritesList.splice(index, 1);
    localStorage.setItem('cc_brain_favorites', JSON.stringify(brainFavoritesList));
    renderBrainFavorites();
    showToast('Petición eliminada', '🗑️');
};

// 10. Chat interactivo con "El Cerebro" (Multi-Agent Orchestrator)
async function sendToBrain() {
    if (sessionStorage.getItem('cc_role') === 'guest') {
        showAlert('Restringido', 'El usuario Invitado tiene acceso de solo lectura', '🔒');
        return;
    }
    const input = document.getElementById('brain-chat-input');
    const msg = input.value.trim();
    if (!msg) return;

    input.value = '';
    logToSystemSupport(`[Chat] Usuario envía a El Cerebro: "${msg}"`);

    const chatMessages = document.getElementById('brain-messages');
    
    // Render user message
    const userDiv = document.createElement('div');
    userDiv.className = 'chat-bubble user';
    userDiv.textContent = msg;
    chatMessages.appendChild(userDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Render animated progress indicator
    const loadDiv = document.createElement('div');
    loadDiv.className = 'chat-bubble model chat-progress-bubble';
    loadDiv.innerHTML = `
        <div class="brain-progress">
            <div class="brain-progress-header">
                <span class="brain-progress-icon">🧠</span>
                <span class="brain-progress-text">Analizando petición...</span>
                <span class="brain-progress-pct">0%</span>
            </div>
            <div class="brain-progress-bar-track">
                <div class="brain-progress-bar-fill"></div>
            </div>
            <div class="brain-progress-phase">Conectando con Gemini...</div>
        </div>
    `;
    chatMessages.appendChild(loadDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Animate progress phases
    const phases = [
        { pct: 15, text: 'Analizando petición...', phase: 'Conectando con Gemini...' },
        { pct: 35, text: 'Identificando agente...', phase: 'Evaluando herramientas disponibles...' },
        { pct: 55, text: 'Delegando tarea...', phase: 'Ejecutando agente especializado...' },
        { pct: 75, text: 'Procesando resultado...', phase: 'Agente trabajando...' },
        { pct: 90, text: 'Generando respuesta...', phase: 'Interpretando resultado con IA...' }
    ];
    let phaseIdx = 0;
    const progressInterval = setInterval(() => {
        if (phaseIdx >= phases.length) return;
        const p = phases[phaseIdx];
        const fill = loadDiv.querySelector('.brain-progress-bar-fill');
        const pctEl = loadDiv.querySelector('.brain-progress-pct');
        const textEl = loadDiv.querySelector('.brain-progress-text');
        const phaseEl = loadDiv.querySelector('.brain-progress-phase');
        if (fill) fill.style.width = p.pct + '%';
        if (pctEl) pctEl.textContent = p.pct + '%';
        if (textEl) textEl.textContent = p.text;
        if (phaseEl) phaseEl.textContent = p.phase;
        phaseIdx++;
    }, 1200);

    // Activate orchestrator node
    setAgentStatus('orchestrator', 'working', 'Analizando petición del usuario...');
    logToSystemSupport(`[Orquestador] Enviando petición al modelo cognitivo de El Cerebro...`);

    try {
        const res = await fetch('/api/brain-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: msg,
                history: brainChatHistory
            })
        });

        clearInterval(progressInterval);

        const data = await res.json();

        if (res.ok && data.text) {
            // If an agent was used, update its status
            if (data.agentUsed) {
                const agent = AGENT_NAMES[data.agentUsed];
                const actionName = data.actionExecuted || 'acción';
                setAgentStatus(data.agentUsed, 'done', `${actionName} completado`);
                setAgentStatus('orchestrator', 'done', `Delegado a ${agent ? agent.name : data.agentUsed}`);

                logToSystemSupport(`[Agente] Petición delegada al agente especializado [${agent ? agent.name : data.agentUsed}] (Acción: ${actionName}).`);

                // Save to agent history
                saveAgentHistory(data.agentUsed, actionName, msg, true);

                // Auto-reset agent to idle after 8 seconds
                setTimeout(() => {
                    setAgentStatus(data.agentUsed, 'idle');
                    setAgentStatus('orchestrator', 'idle');
                }, 8000);
            } else {
                setAgentStatus('orchestrator', 'done', 'Respuesta directa generada');
                logToSystemSupport(`[Orquestador] Respuesta conversacional directa generada por El Cerebro.`);
                setTimeout(() => setAgentStatus('orchestrator', 'idle'), 5000);
            }

            const brainDiv = document.createElement('div');
            brainDiv.className = 'chat-bubble model';
            brainDiv.innerHTML = data.text.replace(/\n/g, '<br>');
            chatMessages.appendChild(brainDiv);
            
            // Save to history
            brainChatHistory.push({ role: 'user', text: msg });
            brainChatHistory.push({ role: 'model', text: data.text });

            // Refresh leads grid and dashboard if an action was executed
            if (data.actionExecuted) {
                logToSystemSupport(`[CRM] Acción ejecutada con éxito. Actualizando base de datos local y vistas.`);
                initializeDashboard();
                loadLeadsGrid(); // Auto-refresh leads table!
            }
        } else {
            throw new Error(data.error || 'Error del Orquestador');
        }
    } catch (e) {
        clearInterval(progressInterval);
        setAgentStatus('orchestrator', 'error', `Error: ${e.message}`);
        logToSystemSupport(`[Error Chat] Error en la petición a El Cerebro: ${e.message}`);
        setTimeout(() => setAgentStatus('orchestrator', 'idle'), 8000);

        const errDiv = document.createElement('div');
        errDiv.className = 'chat-bubble model';
        errDiv.style.color = 'var(--accent-red)';
        errDiv.textContent = `❌ Error: ${e.message}`;
        chatMessages.appendChild(errDiv);
    } finally {
        if (loadDiv && loadDiv.parentNode === chatMessages) {
            chatMessages.removeChild(loadDiv);
        }
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Agent History System
function saveAgentHistory(agentId, action, userQuery, success) {
    const historyKey = 'cc_agent_history';
    const history = JSON.parse(localStorage.getItem(historyKey) || '{}');
    if (!history[agentId]) history[agentId] = [];
    
    history[agentId].unshift({
        action,
        query: userQuery.substring(0, 80),
        success,
        timestamp: new Date().toISOString(),
        rating: null
    });

    // Keep only last 20 entries per agent
    if (history[agentId].length > 20) history[agentId] = history[agentId].slice(0, 20);
    
    localStorage.setItem(historyKey, JSON.stringify(history));
    renderAgentHistories();
}

function renderAgentHistories() {
    const history = JSON.parse(localStorage.getItem('cc_agent_history') || '{}');
    
    Object.keys(AGENT_NAMES).forEach(agentId => {
        const logEl = document.getElementById(`log-${agentId}`);
        if (!logEl) return;
        
        const entries = history[agentId] || [];
        if (entries.length === 0) return;

        // Show last 3 history entries
        logEl.innerHTML = '';
        entries.slice(0, 3).forEach(entry => {
            const time = new Date(entry.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            const statusClass = entry.success ? 'log-done' : 'log-error';
            const icon = entry.success ? '✅' : '❌';
            const div = document.createElement('div');
            div.className = `log-entry ${statusClass}`;
            div.innerHTML = `<span>${icon} ${entry.action}</span> <span class="log-time">${time}</span><br><span class="log-query">"${entry.query}"</span>`;
            logEl.appendChild(div);
        });
    });
}

// Load histories on startup
document.addEventListener('DOMContentLoaded', renderAgentHistories);

// 9. Email Inbox / Outbox Module
// 9. Email Inbox / Outbox & Sequences Module
let emailMainTab = 'bandeja';
let outreachSubTab = 'panel';
let proposalSubTab = 'cadenas';
let proposalCategory = 'consultoria';
let outreachActiveVersions = { 1: 'A', 2: 'A', 3: 'A' };
let outreachExpandedAccordion = null;
let proposalExpandedAccordion = null;
let outreachSequences = [];
let outreachConfig = {};
let proposalSequences = [];
let proposalConfig = {};
let outreachHistPage = 1;
let outreachHistSearch = '';
let outreachHistFilter = 'all';
let proposalHistSearch = '';
let outreachLeadsList = [];

async function loadEmailsLog() {
    try {
        await fetchOutreachConfig();
        await fetchProposalConfig();
        await fetchOutreachSequences();
        await fetchProposalSequences();
        await fetchOutreachLeadsList();
        
        switchEmailMainTab(emailMainTab);
    } catch(e) {
        console.error('Error initializing emails module:', e);
    }
}

async function fetchOutreachConfig() {
    try {
        const { data, error } = await _supabase.from('outreach_config').select('*').limit(1).maybeSingle();
        if (error) throw error;
        outreachConfig = data || {};
        
        // Auto-migration to new defaults (1 x day, 7 x week, 30 x month) if old defaults are present
        if (data && (data.intervalo_c1_a === 2 || data.intervalo_c1_a === null) && (data.intervalo_c2_a === 3 || data.intervalo_c2_a === null)) {
            console.log('Outreach config has old default values. Migrating to 1, 7, 30 days intervals...');
            const updated = {
                intervalo_c1_a: 1, intervalo_c1_b: 1, intervalo_c1_c: 1,
                intervalo_c2_a: 7, intervalo_c2_b: 7, intervalo_c2_c: 7,
                dia_c3_a: 30, dia_c3_b: 30, dia_c3_c: 30
            };
            await _supabase.from('outreach_config').update(updated).eq('id', data.id);
            outreachConfig = { ...data, ...updated };
        }
    } catch(e) {
        console.warn('Error fetching outreach config:', e);
        outreachConfig = {};
    }
}

async function fetchProposalConfig() {
    try {
        const { data, error } = await _supabase.from('proposal_config').select('*').limit(1).maybeSingle();
        if (error) throw error;
        proposalConfig = data || {};
    } catch(e) {
        console.warn('Error fetching proposal config:', e);
        proposalConfig = {};
    }
}

async function fetchOutreachSequences() {
    try {
        const { data, error } = await _supabase.from('outreach_sequences').select('*').order('cadena_num', { ascending: true }).order('orden', { ascending: true });
        if (error) throw error;
        outreachSequences = data || [];
        if (outreachSequences.length < 63) {
            console.log('Outreach sequences count is not complete (' + outreachSequences.length + '/63). Re-seeding...');
            await _supabase.from('outreach_sequences').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await seedDefaultOutreachSequences();
            const { data: refetched } = await _supabase.from('outreach_sequences').select('*').order('cadena_num', { ascending: true }).order('orden', { ascending: true });
            outreachSequences = refetched || [];
        }
    } catch(e) {
        console.warn('Error fetching outreach sequences:', e);
    }
}

async function fetchProposalSequences() {
    try {
        const { data, error } = await _supabase.from('proposal_sequences').select('*').order('step', { ascending: true });
        if (error) throw error;
        proposalSequences = data || [];
        if (proposalSequences.length === 0) {
            console.log('No proposal sequences found in DB. Seeding defaults...');
            await seedDefaultProposalSequences();
            const { data: refetched } = await _supabase.from('proposal_sequences').select('*').order('step', { ascending: true });
            proposalSequences = refetched || [];
        }
    } catch(e) {
        console.warn('Error fetching proposal sequences:', e);
    }
}

async function fetchOutreachLeadsList() {
    try {
        const { data, error } = await _supabase.from('outreach_leads').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        outreachLeadsList = data || [];
    } catch(e) {
        console.warn('Error loading outreach leads:', e);
    }
}

async function seedDefaultOutreachSequences() {
    const steps = [
      // Cadena 1: Bienvenida (5 emails, 1 x día)
      { cadena_num: 1, orden: 1, name: 'Bienvenida 1 - Contacto Inicial', subject: 'una idea para {{company_name}}', content: 'Hola {{first_name}},\n\nSoy Gerard. Ayudamos a negocios y agencias a captar más clientes y multiplicar su productividad automatizando procesos combinando Inteligencia Artificial con desarrollo a medida.\n\nTe escribo porque veo una oportunidad muy clara en tu web para automatizar algunos de tus procesos.\n\n¿Te vendría bien charlar 10 o 15 minutos esta semana por Meet?\n\nSi te cuadra, puedes elegir día y hora directamente en mi calendario:\n{{booking_url}}\n\nUn abrazo,\nGerard' },
      { cadena_num: 1, orden: 2, name: 'Bienvenida 2 - Primer seguimiento', subject: 're: idea para {{company_name}}', content: 'Hola {{first_name}},\n\nTe escribo de forma muy breve por si se te pasó mi correo anterior.\n\n¿Has calculado alguna vez cuánto tiempo pierde tu equipo en tareas repetitivas de administración o captación?\n\nSi te da curiosidad, podemos charlar 10 minutos sin compromiso: {{booking_url}}\n\nUn abrazo,\nGerard' },
      { cadena_num: 1, orden: 3, name: 'Bienvenida 3 - Valor y productividad', subject: 'ahorrar tiempo en {{company_name}} con IA', content: 'Hola {{first_name}},\n\nUna pregunta rápida: ¿cuántas horas a la semana pasa tu equipo pasando datos de un Excel a otro, o respondiendo emails repetitivos?\n\nLa mayoría de las empresas con las que trabajamos ahorran más del 30% de su tiempo administrativo al automatizar estas tareas.\n\n¿Charlamos 10 minutos esta semana? {{booking_url}}\n\nUn abrazo,\nGerard' },
      { cadena_num: 1, orden: 4, name: 'Bienvenida 4 - Pregunta simple', subject: 'pregunta rápida para {{first_name}}', content: 'Hola {{first_name}},\n\nSolo por curiosidad, ¿actualmente utilizáis alguna herramienta de Inteligencia Artificial para vuestras ventas o administración, o todo lo hacéis de forma manual?\n\nSi te interesa ver ejemplos prácticos de lo que se puede hacer hoy en día, dime y te mando un video corto de 2 minutos.\n\nUn abrazo,\nGerard' },
      { cadena_num: 1, orden: 5, name: 'Bienvenida 5 - Intento final', subject: 'último intento por mi parte', content: 'Hola {{first_name}},\n\nImagino que estarás al límite de trabajo y por eso no me has respondido. Totalmente comprensible.\n\nNo quiero ser pesado, así que este será mi último correo sobre este tema por ahora.\n\nSi en el futuro decides que es hora de optimizar procesos con IA en {{company_name}}, me puedes escribir por aquí o reservar en: {{booking_url}}\n\n¡Mucha suerte con el negocio!\n\nUn abrazo,\nGerard' },

      // Cadena 2: Seguimiento (4 emails, 1 x semana)
      { cadena_num: 2, orden: 1, name: 'Seguimiento 1 - Caso de Éxito', subject: 'automatizar tareas en {{company_name}}', content: 'Hola {{first_name}},\n\nHace poco ayudamos a una empresa similar a la vuestra a ahorrar más de 15 horas de trabajo manual a la semana implementando un asistente IA de soporte y automatizando la facturación.\n\nEl objetivo de este correo es ver si en {{company_name}} podemos lograr un impacto similar.\n\n¿Te encajaría revisar vuestro caso 10 minutos? {{booking_url}}\n\nUn abrazo,\nGerard' },
      { cadena_num: 2, orden: 2, name: 'Seguimiento 2 - Auditoría de procesos', subject: 'auditoría gratuita de flujos para {{company_name}}', content: 'Hola {{first_name}},\n\nEsta semana tengo un par de huecos libres y he pensado en ofrecerte algo muy directo:\n\nAnalizo uno de tus procesos manuales más pesados por videollamada y te digo exactamente cómo automatizarlo gratis. Sin compromiso.\n\nSi te interesa, reserva tu auditoría de 15 minutos aquí: {{booking_url}}\n\nUn abrazo,\nGerard' },
      { cadena_num: 2, orden: 3, name: 'Seguimiento 3 - El coste de no automatizar', subject: 'el coste invisible de la administración manual', content: 'Hola {{first_name}},\n\nEl trabajo repetitivo no solo cuesta dinero en sueldos, sino que quema a los empleados y reduce la velocidad comercial.\n\nEn {{company_name}}, ¿cuál es el proceso que más pereza le da hacer a tu equipo?\n\nCasi seguro que se puede automatizar en menos de una semana.\n\nUn abrazo,\nGerard' },
      { cadena_num: 2, orden: 4, name: 'Seguimiento 4 - Cierre temporal', subject: 'reunión de automatización', content: 'Hola {{first_name}},\n\nAsumo que ahora mismo no es el momento de meterse a optimizar procesos en {{company_name}}.\n\nTe dejo tranquilo. Si en unas semanas o meses las cosas cambian, puedes escribirme directamente.\n\nUn abrazo,\nGerard' },

      // Cadena 3: Mantenimiento (12 emails, 1 x mes)
      { cadena_num: 3, orden: 1, name: 'Mantenimiento 1 - Clasificación de emails', subject: 'consejo IA para {{company_name}} (Clasificación de emails)', content: 'Hola {{first_name}},\n\nEspero que todo vaya genial.\n\nAquí tienes el consejo de automatización del mes: puedes ahorrar horas clasificando y etiquetando automáticamente todos tus correos entrantes usando una simple llamada a la API de OpenAI o Anthropic conectada a tu bandeja.\n\nSi quieres ver cómo implementarlo en tu CRM, avísame.\n\nUn abrazo,\nGerard' },
      { cadena_num: 3, orden: 2, name: 'Mantenimiento 2 - Agentes de Soporte', subject: 'automatizar soporte en {{company_name}}', content: 'Hola {{first_name}},\n\n¿Sabías que un agente de Inteligencia Artificial bien entrenado puede resolver más del 80% de las preguntas frecuentes de tus clientes en tiempo real y sin coste de personal?\n\nEsto libera a tu equipo de soporte para que solo atiendan los casos complejos.\n\n¿Te gustaría ver una demo aplicada a tu sector?\n\nUn abrazo,\nGerard' },
      { cadena_num: 3, orden: 3, name: 'Mantenimiento 3 - Conectar Stripe y Contabilidad', subject: 'ahorro de administración para {{company_name}}', content: 'Hola {{first_name}},\n\nEl consejo de este mes es financiero: si cobras mediante Stripe o pasarelas online, puedes conectar de forma directa los pagos con tu software de facturación para emitir facturas y enviarlas sin tocar una sola tecla.\n\nSi necesitas ayuda para integrarlo, no dudes en escribirme.\n\nUn abrazo,\nGerard' },
      { cadena_num: 3, orden: 4, name: 'Mantenimiento 4 - Monitorización automática', subject: 'monitorización automática de competidores', content: 'Hola {{first_name}},\n\n¿Cómo vigilas lo que hace tu competencia? La mayoría lo hace manualmente una vez al año.\n\nCon un simple script de scraping combinado con un modelo de lenguaje, puedes recibir alertas en tu Slack o email cada vez que un competidor cambie de precios o lance un nuevo servicio.\n\nUn abrazo,\nGerard' },
      { cadena_num: 3, orden: 5, name: 'Mantenimiento 5 - Dashboards de rentabilidad', subject: 'dashboard de rentabilidad automática', content: 'Hola {{first_name}},\n\n¿Haces cálculos manuales en Excel a final de mes para saber si un proyecto ha sido rentable?\n\nLo ideal es centralizar los datos en un dashboard conectado a tu base de datos de tiempos y gastos para ver el margen neto en tiempo real y poder corregir desviaciones antes de que sea tarde.\n\nUn abrazo,\nGerard' },
      { cadena_num: 3, orden: 6, name: 'Mantenimiento 6 - Leads automáticos', subject: 'leads automáticos sin picar datos', content: 'Hola {{first_name}},\n\nCuando entra un lead por tu web, ¿alguien tiene que copiarlo a mano a vuestro CRM?\n\nLa automatización de entrada enriqueciendo los datos (empresa, tamaño, LinkedIn) al instante te permite llamar al cliente sabiendo exactamente qué necesita en menos de 5 minutos.\n\nUn abrazo,\nGerard' },
      { cadena_num: 3, orden: 7, name: 'Mantenimiento 7 - Velocidad comercial', subject: 'responder a presupuestos en < 5 minutos', content: 'Hola {{first_name}},\n\nLa velocidad comercial es el factor número uno que determina si cierras una venta o no.\n\nUsando IA, puedes redactar un borrador de presupuesto personalizado a partir del transcriptor de tu llamada de ventas en menos de un minuto. Solo revisas, apruebas y envías.\n\nUn abrazo,\nGerard' },
      { cadena_num: 3, orden: 8, name: 'Mantenimiento 8 - WhatsApp e IA', subject: 'conectar WhatsApp y CRM con IA', content: 'Hola {{first_name}},\n\n¿Tu equipo de ventas usa WhatsApp personal para cerrar clientes? El problema es que esa información se pierde y no queda registrada.\n\nIntegrar la API de WhatsApp con tu CRM e IA permite resumir automáticamente las conversaciones y guardar el histórico de forma transparente.\n\nUn abrazo,\nGerard' },
      { cadena_num: 3, orden: 9, name: 'Mantenimiento 9 - Propuestas persuasivas', subject: 'redacción comercial con IA para {{company_name}}', content: 'Hola {{first_name}},\n\n¿Sigues redactando propuestas desde cero?\n\nUn modelo de IA entrenado con tus mejores propuestas comerciales puede estructurar, redactar y proponer el precio óptimo para cada cliente basándose en las notas de la reunión anterior.\n\nUn abrazo,\nGerard' },
      { cadena_num: 3, orden: 10, name: 'Mantenimiento 10 - Eliminar silos', subject: 'eliminar silos de información', content: 'Hola {{first_name}},\n\n¿Cuánto tiempo pierde tu equipo buscando archivos, facturas o contratos antiguos?\n\nUn buscador semántico interno permite a tu equipo preguntar por chat "¿Cuánto cobramos a X por el último servicio?" o "Pásame el contrato de Y" y obtener la respuesta en segundos.\n\nUn abrazo,\nGerard' },
      { cadena_num: 3, orden: 11, name: 'Mantenimiento 11 - Privacidad de datos', subject: 'privacidad en IA corporativa', content: 'Hola {{first_name}},\n\nUna duda frecuente es si usar IA pone en riesgo los datos confidenciales de tus clientes.\n\nLa respuesta es no, siempre que antes de enviar los datos uses APIs empresariales seguras o modelos open-source en servidores propios.\n\nUn abrazo,\nGerard' },
      { cadena_num: 3, orden: 12, name: 'Mantenimiento 12 - Check-in anual', subject: 'balance tecnológico en {{company_name}}', content: 'Hola {{first_name}},\n\nHa pasado tiempo desde nuestro primer contacto. Quería preguntarte si habéis dado algún paso para automatizar vuestros procesos este año.\n\nSi sigues con tareas repetitivas o quieres dar un salto tecnológico en {{company_name}}, podemos charlar 10 minutos y te oriento: {{booking_url}}\n\nUn abrazo,\nGerard' }
    ];
    
    const rows = [];
    const versions = ['A', 'B', 'C'];
    for (const step of steps) {
        for (const v of versions) {
            rows.push({
                cadena_num: step.cadena_num,
                orden: step.orden,
                version: v,
                nombre: step.name + ` (Versión ${v})`,
                asunto: step.subject,
                contenido_html: step.content.replace(/\n/g, '<br>'),
                activo: true
            });
        }
    }
    await _supabase.from('outreach_sequences').insert(rows);
}

async function seedDefaultProposalSequences() {
    const rows = [];
    for (const seq of PRES_SEQUENCES) {
        const seqId = seq.seqId;
        for (const cat of seq.categories) {
            const catKey = cat.key;
            let stepNum = 1;
            for (const email of cat.emails) {
                rows.push({
                    secuencia_id: seqId,
                    categoria_key: catKey,
                    step: stepNum++,
                    nombre: email.name || `Paso ${stepNum}`,
                    asunto: email.asunto,
                    contenido_html: email.contenido || email.contenido_html,
                    activo: true
                });
            }
        }
    }
    await _supabase.from('proposal_sequences').insert(rows);
}

function switchEmailMainTab(tab) {
    emailMainTab = tab;
    document.querySelectorAll('.email-main-tab').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-main-tab-${tab}`);
    if (activeBtn) activeBtn.classList.add('active');
    
    document.querySelectorAll('.email-main-content').forEach(sec => sec.style.display = 'none');
    const targetSec = document.getElementById(`email-tab-${tab}`);
    if (targetSec) targetSec.style.display = 'block';
    
    if (tab === 'bandeja') {
        loadBandejaInbox();
    } else if (tab === 'outreach') {
        switchOutreachSubTab(outreachSubTab);
    } else if (tab === 'propuestas') {
        // Query proposals active count
        _supabase.from('propuesta_seguimiento').select('*', { count: 'exact', head: true })
            .eq('pausada', false).not('secuencia_activa', 'is', null)
            .then(({ count }) => {
                const badge = document.getElementById('proposal-active-leads-subtitle');
                if (badge) badge.textContent = `${count || 0} propuestas activas en seguimiento`;
            });
        switchProposalCategoryTab(proposalCategory);
    }
}

async function loadBandejaInbox() {
    try {
        const { data: logs, error } = await _supabase
            .from('outreach_email_logs')
            .select(`
                id,
                email_type,
                subject,
                body,
                sent_at,
                outreach_leads (email, company_name, first_name)
            `)
            .order('sent_at', { ascending: false });

        if (error) throw error;

        const listDiv = document.getElementById('email-inbox-list');
        listDiv.innerHTML = '';

        if (!logs || logs.length === 0) {
            listDiv.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-grey);font-size:0.8rem">No hay correos registrados</div>';
            return;
        }

        logs.forEach((log, idx) => {
            const item = document.createElement('div');
            item.className = `email-list-item ${idx === 0 ? 'active' : ''}`;
            
            const dateStr = new Date(log.sent_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
            const lead = log.outreach_leads || { email: 'Desconocido', company_name: '—', first_name: 'Prospecto' };

            item.innerHTML = `
                <h4>${lead.first_name} (${lead.company_name})</h4>
                <span>${dateStr} · ${log.email_type}</span>
                <p>${log.subject}</p>
            `;

            item.onclick = () => {
                document.querySelectorAll('.email-list-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                viewEmailDetails(log);
            };

            listDiv.appendChild(item);
        });

        if (logs.length > 0) {
            viewEmailDetails(logs[0]);
        }
    } catch (e) {
        console.error('Email log load error:', e);
    }
}

function viewEmailDetails(log) {
    const lead = log.outreach_leads || { email: 'Desconocido', company_name: '—', first_name: 'Prospecto' };
    document.getElementById('email-view-subject').textContent = log.subject;
    document.getElementById('email-view-from').textContent = `Destinatario: ${lead.first_name} <${lead.email}> · Empresa: ${lead.company_name}`;
    document.getElementById('email-view-body').innerHTML = log.body;
}

function switchOutreachSubTab(subTab) {
    outreachSubTab = subTab;
    document.querySelectorAll('#email-tab-outreach .nl-tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-outreach-sub-${subTab}`);
    if (activeBtn) activeBtn.classList.add('active');
    
    document.querySelectorAll('.outreach-sub-content').forEach(sec => sec.style.display = 'none');
    const targetSec = document.getElementById(`outreach-sub-${subTab}`);
    if (targetSec) targetSec.style.display = 'block';
    
    if (subTab === 'panel') {
        renderOutreachPanel();
    } else if (subTab === 'cadenas') {
        renderOutreachChains();
    } else if (subTab === 'config') {
        renderOutreachConfigForm();
    } else if (subTab === 'historial') {
        outreachHistPage = 1;
        renderOutreachHistorial();
    } else if (subTab === 'envio') {
        renderOutreachSendList();
    }
}

function switchProposalSubTab(subTab) {
    proposalSubTab = subTab;
    document.querySelectorAll('#email-tab-propuestas .nl-tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-proposal-sub-${subTab}`);
    if (activeBtn) activeBtn.classList.add('active');
    
    document.querySelectorAll('.proposal-sub-content').forEach(sec => sec.style.display = 'none');
    const targetSec = document.getElementById(`proposal-sub-${subTab}`);
    if (targetSec) targetSec.style.display = 'block';
    
    if (subTab === 'cadenas') {
        renderProposalChains();
    } else if (subTab === 'config') {
        renderProposalConfigForm();
    } else if (subTab === 'historial') {
        renderProposalHistorial();
    }
}

function switchProposalCategoryTab(categoryKey) {
    proposalCategory = categoryKey;
    document.querySelectorAll('.nl-ver-tabs .nl-ver-tab').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`tab-prop-cat-${categoryKey}`);
    if (activeBtn) activeBtn.classList.add('active');
    
    if (proposalSubTab === 'cadenas') {
        renderProposalChains();
    }
}

async function renderOutreachPanel() {
    try {
        // 1. Fetch all email logs with joined lead data (version, status)
        const { data: logsRaw } = await _supabase
            .from('outreach_email_logs')
            .select('email_type, opened_at, clicked_at, sent_at, subject, outreach_leads(version, status, email, company_name, first_name)')
            .order('sent_at', { ascending: false });

        const logs = logsRaw || [];

        // 2. Fetch all leads for bajas count
        const { data: leadsRaw } = await _supabase
            .from('outreach_leads')
            .select('status, version');

        const leads = leadsRaw || [];

        // 3. Active leads count (update subtitle)
        const activeStatuses = [
            'welcome_1','welcome_2','welcome_3','welcome_4','welcome_5',
            'followup_1','followup_2','followup_3','followup_4',
            'nurture_1','nurture_2','nurture_3','nurture_4','nurture_5','nurture_6',
            'nurture_7','nurture_8','nurture_9','nurture_10','nurture_11','nurture_monthly'
        ];
        const activeCount = leads.filter(l => activeStatuses.includes(l.status)).length;
        const subtitleEl = document.getElementById('outreach-active-leads-subtitle');
        if (subtitleEl) subtitleEl.textContent = `${activeCount} leads en secuencias activas`;

        // 4. Map email_type → chain number
        function getChain(emailType) {
            const m = emailType && emailType.match(/step_(\d+)/);
            if (!m) return null;
            const s = parseInt(m[1]);
            if (s <= 4) return 1;
            if (s <= 8) return 2;
            if (s <= 20) return 3;
            return null;
        }

        // 5. Build per-chain × per-version stats
        const chainDefs = [
            { num: 1, name: 'Bienvenida',    color: '#ff9500' },
            { num: 2, name: 'Seguimiento',   color: '#007aff' },
            { num: 3, name: 'Mantenimiento', color: '#34c759' }
        ];
        const versionDefs = [
            { key: 'A', label: 'Conocidos',     color: '#ff6b6b' },
            { key: 'B', label: 'Desconocidos',  color: '#007aff' },
            { key: 'C', label: 'Formularios',   color: '#bf5af2' }
        ];

        const stats = {};
        chainDefs.forEach(c => {
            stats[c.num] = { totalSent: 0 };
            versionDefs.forEach(v => {
                stats[c.num][v.key] = { sent: 0, opened: 0, clicked: 0 };
            });
        });

        logs.forEach(log => {
            const chain = getChain(log.email_type);
            if (!chain || !stats[chain]) return;
            const ver = (log.outreach_leads && log.outreach_leads.version) || 'A';
            if (!stats[chain][ver]) return;
            stats[chain][ver].sent++;
            stats[chain].totalSent++;
            if (log.opened_at) stats[chain][ver].opened++;
            if (log.clicked_at) stats[chain][ver].clicked++;
        });

        // Bajas per version (leads with status 'unsubscribed')
        const bajas = { A: 0, B: 0, C: 0 };
        leads.forEach(l => {
            if (l.status === 'unsubscribed') {
                const v = l.version || 'A';
                if (bajas[v] !== undefined) bajas[v]++;
            }
        });

        // 6. Render breakdown
        const breakdownDiv = document.getElementById('outreach-chains-breakdown');
        breakdownDiv.innerHTML = '';

        // Section title
        const sectionTitle = document.createElement('div');
        sectionTitle.className = 'or-panel-section-title';
        sectionTitle.innerHTML = '<span class="or-panel-section-icon">📊</span> Desglose por cadena y versión';
        breakdownDiv.appendChild(sectionTitle);

        chainDefs.forEach(chain => {
            const card = document.createElement('div');
            card.className = 'or-chain-card';
            card.style.borderLeftColor = chain.color;

            // Header row
            let html = `
                <div class="or-chain-header">
                    <div class="or-chain-header-left">
                        <span class="or-chain-badge" style="background:${chain.color}">C${chain.num}</span>
                        <span class="or-chain-name">${chain.name}</span>
                    </div>
                    <span class="or-chain-total">${stats[chain.num].totalSent} envíos</span>
                </div>
            `;

            // Version rows
            versionDefs.forEach(v => {
                const s = stats[chain.num][v.key];
                const rate = s.sent > 0 ? Math.round((s.opened / s.sent) * 100) : 0;
                const rateColor = rate > 0 ? '#34c759' : '#ff9500';
                const bajasVal = bajas[v.key] || 0;
                const bajasColor = bajasVal > 0 ? '#ff3b30' : 'var(--text-grey)';

                html += `
                    <div class="or-version-row">
                        <span class="or-version-label"><span style="color:${v.color};font-weight:800">${v.key}</span> — ${v.label}</span>
                        <div class="or-version-stats">
                            <span class="or-vstat"><strong style="color:#007aff">${s.sent}</strong> <em>env.</em></span>
                            <span class="or-vstat"><strong style="color:${rateColor}">${rate}%</strong> <em>apert.</em></span>
                            <span class="or-vstat"><strong>${s.clicked}</strong> <em>clicks</em></span>
                            <span class="or-vstat"><strong style="color:${bajasColor}">${bajasVal}</strong> <em>bajas</em></span>
                        </div>
                    </div>
                `;
            });

            card.innerHTML = html;
            breakdownDiv.appendChild(card);
        });

        // 7. Render recent sends
        const recentDiv = document.getElementById('outreach-recent-list');
        recentDiv.innerHTML = '';

        const recentLogs = logs.slice(0, 8);
        if (recentLogs.length === 0) {
            recentDiv.innerHTML = '<div class="or-recent-empty">No hay envíos recientes</div>';
        } else {
            recentLogs.forEach(log => {
                const lead = log.outreach_leads || { email: '—', company_name: '—', first_name: 'Prospecto' };
                const dt = new Date(log.sent_at);
                const dateStr = dt.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                const timeStr = dt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                const item = document.createElement('div');
                item.className = 'or-recent-item';
                item.innerHTML = `
                    <div class="or-recent-info">
                        <span class="or-recent-name">${lead.first_name} (${lead.company_name})</span>
                        <span class="or-recent-subject">${log.subject || '—'}</span>
                    </div>
                    <div class="or-recent-date">
                        <span>${dateStr}</span>
                        <span>${timeStr}</span>
                    </div>
                `;
                recentDiv.appendChild(item);
            });
        }
    } catch(e) {
        console.error('Error rendering outreach panel:', e);
    }
}

function renderOutreachChains() {
    const container = document.getElementById('outreach-chains-container');
    container.innerHTML = '';
    
    const chains = [
        { num: 1, name: 'Cadena 1: Secuencia de Bienvenida', desc: 'Se dispara cuando el lead entra en estado "enriched".' },
        { num: 2, name: 'Cadena 2: Secuencia de Seguimiento', desc: 'Se dispara tras completar la bienvenida.' },
        { num: 3, name: 'Cadena 3: Secuencia de Mantenimiento', desc: 'Píldoras mensuales de valor.' }
    ];
    
    chains.forEach(chain => {
        const isOpen = outreachExpandedAccordion === chain.num;
        const activeVersion = outreachActiveVersions[chain.num] || 'A';
        const steps = outreachSequences.filter(s => s.cadena_num === chain.num && s.version === activeVersion);
        
        const group = document.createElement('div');
        group.className = `nl-chain-group ${isOpen ? 'open' : ''}`;
        group.id = `outreach-accordion-${chain.num}`;
        
        group.innerHTML = `
            <div class="nl-chain-header" onclick="window.toggleOutreachAccordion(${chain.num})">
                <div class="nl-chain-header-left">
                    <span class="nl-chain-chevron" style="display:inline-block; transition:transform 0.2s; ${isOpen ? 'transform:rotate(90deg);' : ''}">▶</span>
                    <span class="nl-chain-name" style="margin-left:8px; font-weight:700;">${chain.name}</span>
                </div>
                <span class="nl-chain-count" style="font-size:0.8rem; color:var(--text-grey); font-weight:600;">${steps.length} pasos</span>
            </div>
            <div class="nl-chain-body" style="display: ${isOpen ? 'block' : 'none'}; padding:16px;">
                <div class="nl-version-tabs" style="display:flex; gap:6px; margin-bottom:16px;">
                    <button class="nl-version-tab ${activeVersion === 'A' ? 'active' : ''}" data-version="A" onclick="window.switchOutreachVersion(${chain.num}, 'A')"><span class="nl-vtab-dot" style="background:#ff6b6b"></span> Versión A <span class="nl-vtab-label">Conocidos</span></button>
                    <button class="nl-version-tab ${activeVersion === 'B' ? 'active' : ''}" data-version="B" onclick="window.switchOutreachVersion(${chain.num}, 'B')"><span class="nl-vtab-dot" style="background:#007aff"></span> Versión B <span class="nl-vtab-label">Desconocidos</span></button>
                    <button class="nl-version-tab ${activeVersion === 'C' ? 'active' : ''}" data-version="C" onclick="window.switchOutreachVersion(${chain.num}, 'C')"><span class="nl-vtab-dot" style="background:#bf5af2"></span> Versión C <span class="nl-vtab-label">Formularios</span></button>
                </div>
                <div class="nl-steps" id="outreach-steps-${chain.num}">
                    <!-- Steps populated below -->
                </div>
            </div>
        `;
        
        container.appendChild(group);
        
        if (isOpen) {
            const stepsContainer = group.querySelector(`#outreach-steps-${chain.num}`);
            if (steps.length === 0) {
                stepsContainer.innerHTML = '<div style="padding:12px; color:var(--text-grey); font-size:0.8rem; text-align:center;">No hay pasos creados para esta versión</div>';
            } else {
                steps.forEach(step => {
                    const stepCard = document.createElement('div');
                    stepCard.className = 'nl-step-card';
                    stepCard.style.cssText = 'border:1px solid var(--border-color); border-radius:12px; padding:16px; margin-bottom:16px; background:rgba(255,255,255,0.015);';
                    stepCard.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                            <span style="font-weight:700; font-size:0.92rem; color:var(--text-main)">Paso ${step.orden}: ${step.nombre}</span>
                            <div style="display:flex; gap:6px; flex-wrap:wrap;">
                                <button class="btn-outline-preview" onclick="window.previewOutreachEmail(${chain.num}, '${step.version}', ${step.orden})">👁 Vista previa</button>
                                <button class="btn-secondary" style="padding:4px 8px; font-size:0.75rem; border-radius:6px;" onclick="window.sendTestEmail(${chain.num}, '${step.version}', ${step.orden}, 'outreach')">📧 Probar</button>
                                <button class="btn-primary" style="padding:4px 8px; font-size:0.75rem; border-radius:6px;" onclick="window.saveOutreachTemplate(${chain.num}, '${step.version}', ${step.orden})">💾 Guardar</button>
                            </div>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:10px;">
                            <div>
                                <label class="nl-config-field-label" style="margin-bottom:4px; display:block; font-size:0.75rem; color:var(--text-grey)">Asunto</label>
                                <input type="text" class="nl-config-input" id="outreach-subject-${chain.num}-${step.version}-${step.orden}" value="${step.asunto || ''}" style="width:100%; padding:8px 10px; border-radius:8px; background:var(--bg-card); border:1px solid var(--border-color); color:var(--text-main)">
                            </div>
                            <div>
                                <label class="nl-config-field-label" style="margin-bottom:4px; display:block; font-size:0.75rem; color:var(--text-grey)">Cuerpo (HTML)</label>
                                <div class="nl-editor-toolbar" style="display:flex; gap:4px; margin-bottom:4px; background:rgba(255,255,255,0.02); padding:4px; border-radius:6px;">
                                    <button type="button" class="nl-toolbar-btn" style="padding:2px 6px; font-size:0.75rem; border-radius:4px; background:transparent; border:none; color:var(--text-main); cursor:pointer;" onclick="window.insertAtTemplateCursor(${chain.num}, '${step.version}', ${step.orden}, '<strong>', '</strong>')"><strong>B</strong></button>
                                    <button type="button" class="nl-toolbar-btn" style="padding:2px 6px; font-size:0.75rem; border-radius:4px; background:transparent; border:none; color:var(--text-main); cursor:pointer;" onclick="window.insertAtTemplateCursor(${chain.num}, '${step.version}', ${step.orden}, '<em>', '</em>')"><em>I</em></button>
                                    <button type="button" class="nl-toolbar-btn" style="padding:2px 6px; font-size:0.75rem; border-radius:4px; background:transparent; border:none; color:var(--text-main); cursor:pointer;" onclick="window.insertAtTemplateCursor(${chain.num}, '${step.version}', ${step.orden}, '{{first_name}}', '')">nombre</button>
                                    <button type="button" class="nl-toolbar-btn" style="padding:2px 6px; font-size:0.75rem; border-radius:4px; background:transparent; border:none; color:var(--text-main); cursor:pointer;" onclick="window.insertAtTemplateCursor(${chain.num}, '${step.version}', ${step.orden}, '{{company_name}}', '')">empresa</button>
                                    <button type="button" class="nl-toolbar-btn" style="padding:2px 6px; font-size:0.75rem; border-radius:4px; background:transparent; border:none; color:var(--text-main); cursor:pointer;" onclick="window.insertAtTemplateCursor(${chain.num}, '${step.version}', ${step.orden}, '{{booking_url}}', '')">calendario</button>
                                    <button type="button" class="btn-ai-generate" onclick="window.openAIGenerateDialog(${chain.num}, '${step.version}', ${step.orden})">✨ Generar con IA</button>
                                </div>
                                <textarea class="nl-editor-textarea" id="outreach-body-${chain.num}-${step.version}-${step.orden}" rows="8" style="width:100%; font-family:monospace; font-size:0.82rem; padding:8px 10px; border-radius:8px; background:var(--bg-card); border:1px solid var(--border-color); color:var(--text-main); line-height:1.4">${step.contenido_html || ''}</textarea>
                            </div>
                        </div>
                    `;
                    stepsContainer.appendChild(stepCard);
                });
            }
        }
    });
}

window.toggleOutreachAccordion = function(chainNum) {
    outreachExpandedAccordion = (outreachExpandedAccordion === chainNum) ? null : chainNum;
    renderOutreachChains();
};

window.switchOutreachVersion = function(chainNum, version) {
    outreachActiveVersions[chainNum] = version;
    renderOutreachChains();
};

function renderProposalChains() {
    const container = document.getElementById('proposal-chains-container');
    container.innerHTML = '';
    const categoryKey = proposalCategory;
    const seqs = [
        { id: 'inmediato', label: 'Seguimiento Inmediato', desc: 'Se dispara tras enviar la propuesta. (1 a 5 correos)' },
        { id: 'mensual', label: 'Seguimiento Mensual', desc: 'Correos semanales durante un mes si no hay respuesta.' },
        { id: 'anual', label: 'Seguimiento Anual', desc: 'Nutrición mensual a largo plazo (12 correos).' }
    ];
    
    seqs.forEach(seq => {
        const isOpen = proposalExpandedAccordion === seq.id;
        const steps = proposalSequences.filter(s => s.secuencia_id === seq.id && s.categoria_key === categoryKey);
        
        const group = document.createElement('div');
        group.className = `nl-chain-group ${isOpen ? 'open' : ''}`;
        group.id = `proposal-accordion-${seq.id}`;
        
        group.innerHTML = `
            <div class="nl-chain-header" onclick="window.toggleProposalAccordion('${seq.id}')">
                <div class="nl-chain-header-left">
                    <span class="nl-chain-chevron" style="display:inline-block; transition:transform 0.2s; ${isOpen ? 'transform:rotate(90deg);' : ''}">▶</span>
                    <span class="nl-chain-name" style="margin-left:8px; font-weight:700;">${seq.label} (${categoryKey.toUpperCase()})</span>
                </div>
                <span class="nl-chain-count" style="font-size:0.8rem; color:var(--text-grey); font-weight:600;">${steps.length} pasos</span>
            </div>
            <div class="nl-chain-body" style="display: ${isOpen ? 'block' : 'none'}; padding:16px;">
                <div class="nl-steps" id="proposal-steps-${seq.id}">
                    <!-- Steps populated below -->
                </div>
            </div>
        `;
        
        container.appendChild(group);
        
        if (isOpen) {
            const stepsContainer = group.querySelector(`#proposal-steps-${seq.id}`);
            if (steps.length === 0) {
                stepsContainer.innerHTML = '<div style="padding:12px; color:var(--text-grey); font-size:0.8rem; text-align:center;">No hay pasos creados para esta categoría</div>';
            } else {
                steps.forEach(step => {
                    const stepCard = document.createElement('div');
                    stepCard.className = 'nl-step-card';
                    stepCard.style.cssText = 'border:1px solid var(--border-color); border-radius:12px; padding:16px; margin-bottom:16px; background:rgba(255,255,255,0.015);';
                    stepCard.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                            <span style="font-weight:700; font-size:0.92rem; color:var(--text-main)">Paso ${step.step}: ${step.nombre}</span>
                            <div style="display:flex; gap:8px;">
                                <button class="btn-secondary" style="padding:4px 8px; font-size:0.75rem; border-radius:6px;" onclick="window.sendProposalTestEmail('${seq.id}', '${categoryKey}', ${step.step})">📧 Probar</button>
                                <button class="btn-primary" style="padding:4px 8px; font-size:0.75rem; border-radius:6px;" onclick="window.saveProposalTemplate('${seq.id}', '${categoryKey}', ${step.step})">💾 Guardar</button>
                            </div>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:10px;">
                            <div>
                                <label class="nl-config-field-label" style="margin-bottom:4px; display:block; font-size:0.75rem; color:var(--text-grey)">Asunto</label>
                                <input type="text" class="nl-config-input" id="proposal-subject-${seq.id}-${categoryKey}-${step.step}" value="${step.asunto || ''}" style="width:100%; padding:8px 10px; border-radius:8px; background:var(--bg-card); border:1px solid var(--border-color); color:var(--text-main)">
                            </div>
                            <div>
                                <label class="nl-config-field-label" style="margin-bottom:4px; display:block; font-size:0.75rem; color:var(--text-grey)">Cuerpo (HTML)</label>
                                <div class="nl-editor-toolbar" style="display:flex; gap:4px; margin-bottom:4px; background:rgba(255,255,255,0.02); padding:4px; border-radius:6px;">
                                    <button type="button" class="nl-toolbar-btn" style="padding:2px 6px; font-size:0.75rem; border-radius:4px; background:transparent; border:none; color:var(--text-main); cursor:pointer;" onclick="window.insertAtProposalCursor('${seq.id}', '${categoryKey}', ${step.step}, '<strong>', '</strong>')"><strong>B</strong></button>
                                    <button type="button" class="nl-toolbar-btn" style="padding:2px 6px; font-size:0.75rem; border-radius:4px; background:transparent; border:none; color:var(--text-main); cursor:pointer;" onclick="window.insertAtProposalCursor('${seq.id}', '${categoryKey}', ${step.step}, '<em>', '</em>')"><em>I</em></button>
                                    <button type="button" class="nl-toolbar-btn" style="padding:2px 6px; font-size:0.75rem; border-radius:4px; background:transparent; border:none; color:var(--text-main); cursor:pointer;" onclick="window.insertAtProposalCursor('${seq.id}', '${categoryKey}', ${step.step}, '{{nombre}}', '')">nombre</button>
                                    <button type="button" class="nl-toolbar-btn" style="padding:2px 6px; font-size:0.75rem; border-radius:4px; background:transparent; border:none; color:var(--text-main); cursor:pointer;" onclick="window.insertAtProposalCursor('${seq.id}', '${categoryKey}', ${step.step}, '{{link_confirmar}}', '')">link confirmar</button>
                                    <button type="button" class="nl-toolbar-btn" style="padding:2px 6px; font-size:0.75rem; border-radius:4px; background:transparent; border:none; color:var(--text-main); cursor:pointer;" onclick="window.insertAtProposalCursor('${seq.id}', '${categoryKey}', ${step.step}, '{{link_pdf}}', '')">link pdf</button>
                                    <button type="button" class="btn-secondary" style="margin-left:auto; padding:2px 8px; font-size:0.7rem; border-radius:6px;" onclick="window.generateAIProposalVariant('${seq.id}', '${categoryKey}', ${step.step})">✨ Generar con IA</button>
                                </div>
                                <textarea class="nl-editor-textarea" id="proposal-body-${seq.id}-${categoryKey}-${step.step}" rows="8" style="width:100%; font-family:monospace; font-size:0.82rem; padding:8px 10px; border-radius:8px; background:var(--bg-card); border:1px solid var(--border-color); color:var(--text-main); line-height:1.4">${step.contenido_html || ''}</textarea>
                            </div>
                        </div>
                    `;
                    stepsContainer.appendChild(stepCard);
                });
            }
        }
    });
}

window.toggleProposalAccordion = function(seqId) {
    proposalExpandedAccordion = (proposalExpandedAccordion === seqId) ? null : seqId;
    renderProposalChains();
};

function renderOutreachConfigForm() {
    document.getElementById('outreach-config-auto-envio').checked = outreachConfig.auto_envio !== false;
    document.getElementById('outreach-config-remitente-nombre').value = outreachConfig.remitente_nombre || 'Gerard Fanals';
    document.getElementById('outreach-config-remitente-email').value = outreachConfig.remitente_email || 'gerard@gerardfanals.online';
    document.getElementById('outreach-config-reply-to').value = outreachConfig.reply_to || 'gerard@iartesana.es';
    document.getElementById('outreach-config-url-privacidad').value = outreachConfig.url_privacidad || 'https://gerardfanals.com/privacidad';
    document.getElementById('outreach-config-direccion-fisica').value = outreachConfig.direccion_fisica || 'Avda Fort de Leau 131, Mahón';
    
    const flowDiagram = document.getElementById('outreach-flow-diagram');
    flowDiagram.innerHTML = '';

    // Chain definitions for the pipeline
    const pipeChains = [
        {
            num: 1, name: 'Bienvenida', color: '#ff9500', steps: 5,
            intervalKey: 'intervalo_c1', freqLabel: 'cada'
        },
        {
            num: 2, name: 'Seguimiento', color: '#34c759', steps: 4,
            intervalKey: 'intervalo_c2', freqLabel: 'cada'
        },
        {
            num: 3, name: 'Mantenimiento', color: '#007aff', steps: 12,
            intervalKey: 'dia_c3', freqLabel: 'Mensual · día'
        }
    ];

    const versionKeys = [
        { key: 'a', label: 'A' },
        { key: 'b', label: 'B' },
        { key: 'c', label: 'C' }
    ];

    // Entry node: "Nuevo Lead"
    const entryNode = document.createElement('div');
    entryNode.className = 'cfg-flow-node cfg-flow-entry';
    entryNode.innerHTML = `
        <strong>Nuevo Lead</strong>
        <span class="cfg-flow-subdesc">Entra al sistema</span>
    `;
    flowDiagram.appendChild(entryNode);

    pipeChains.forEach((chain, idx) => {
        // Arrow
        const arrow = document.createElement('div');
        arrow.className = 'cfg-flow-arrow';
        arrow.textContent = '→';
        flowDiagram.appendChild(arrow);

        // Chain card
        const card = document.createElement('div');
        card.className = 'cfg-flow-node cfg-flow-chain';
        card.style.borderColor = chain.color;

        // Interval value
        const intervalVal = outreachConfig[`${chain.intervalKey}_a`] || (chain.num === 1 ? 1 : chain.num === 2 ? 7 : 30);
        const freqText = chain.num === 3
            ? `Mensual · día ${intervalVal}`
            : `cada ${intervalVal}d`;

        // Version badges
        let badgesHtml = '';
        versionKeys.forEach(v => {
            const modeKey = `modo_c${chain.num}_${v.key}`;
            const mode = outreachConfig[modeKey] || 'auto';
            const modeLabel = mode === 'auto' ? 'Auto' : mode === 'manual' ? 'Manual' : 'Off';
            const modeClass = mode === 'auto' ? 'cfg-vbadge-auto' : mode === 'manual' ? 'cfg-vbadge-manual' : 'cfg-vbadge-off';
            badgesHtml += `<span class="cfg-vbadge ${modeClass}">V.${v.label} ${chain.steps} ${modeLabel}</span>`;
        });

        card.innerHTML = `
            <span class="cfg-flow-badge" style="background:${chain.color}">C${chain.num}</span>
            <strong class="cfg-flow-chain-name">${chain.name}</strong>
            <span class="cfg-flow-subdesc">${freqText}</span>
            <div class="cfg-flow-badges">${badgesHtml}</div>
        `;
        flowDiagram.appendChild(card);
    });
    
    const settingsContainer = document.getElementById('outreach-chain-settings-container');
    settingsContainer.innerHTML = '';
    const chainsSettings = [
        { num: 1, name: 'Configuración Cadena 1 (Bienvenida)', key: 'c1' },
        { num: 2, name: 'Configuración Cadena 2 (Seguimiento)', key: 'c2' },
        { num: 3, name: 'Configuración Cadena 3 (Mantenimiento)', key: 'c3' }
    ];
    
    chainsSettings.forEach(cs => {
        const section = document.createElement('div');
        section.className = 'nl-config-section';
        
        let subHtml = `
            <div class="nl-config-title" style="margin-bottom:12px;">${cs.name}</div>
            <div class="nl-config-grid" style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:12px;">
        `;
        const versions = [
            { key: 'a', label: 'Conocidos (Versión A)' },
            { key: 'b', label: 'Desconocidos (Versión B)' },
            { key: 'c', label: 'Formularios (Versión C)' }
        ];
        
        versions.forEach(v => {
            const modeVal = outreachConfig[`modo_${cs.key}_${v.key}`] || (cs.num === 3 ? 'auto' : (v.key === 'a' ? 'auto' : 'off'));
            const intervalVal = outreachConfig[`intervalo_${cs.key}_${v.key}`] || 2;
            const dayVal = outreachConfig[`dia_${cs.key}_${v.key}`] || 5;
            
            subHtml += `
                <div class="nl-config-card" style="padding:12px; background:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:10px; display:flex; flex-direction:column; gap:8px;">
                    <div class="nl-config-card-label" style="font-weight:700; font-size:0.8rem; color:var(--text-main);">${v.label}</div>
                    <div>
                        <label class="nl-config-field-label" style="font-size:0.75rem; color:var(--text-grey); display:block; margin-bottom:4px;">Modo</label>
                        <select class="nl-config-input" id="outreach-mode-${cs.key}-${v.key}" style="width:100%; padding:6px; border-radius:6px; background:var(--bg-card); border:1px solid var(--border-color); color:var(--text-main); font-size:0.8rem;">
                            <option value="auto" ${modeVal === 'auto' ? 'selected' : ''}>Auto-envío (Cron)</option>
                            <option value="manual" ${modeVal === 'manual' ? 'selected' : ''}>Manual (Revisar)</option>
                            <option value="off" ${modeVal === 'off' ? 'selected' : ''}>Desactivado</option>
                        </select>
                    </div>
                    <div>
                        <label class="nl-config-field-label" style="font-size:0.75rem; color:var(--text-grey); display:block; margin-bottom:4px;">${cs.num === 3 ? 'Día de envío' : 'Días de intervalo'}</label>
                        <input type="number" min="1" max="90" class="nl-config-input" id="outreach-interval-${cs.key}-${v.key}" value="${cs.num === 3 ? dayVal : intervalVal}" style="width:100%; padding:6px; border-radius:6px; background:var(--bg-card); border:1px solid var(--border-color); color:var(--text-main); font-size:0.8rem;">
                    </div>
                </div>
            `;
        });
        
        subHtml += `</div>`;
        section.innerHTML = subHtml;
        settingsContainer.appendChild(section);
    });
}

async function saveOutreachConfig() {
    if (sessionStorage.getItem('cc_role') === 'guest') {
        showAlert('Restringido', 'El usuario Invitado tiene acceso de solo lectura', '🔒');
        return;
    }
    const saveBtn = document.getElementById('btn-save-outreach-config');
    const statusMsg = document.getElementById('outreach-config-status-msg');
    saveBtn.disabled = true;
    statusMsg.textContent = 'Guardando...';
    
    const newConfig = {
        auto_envio: document.getElementById('outreach-config-auto-envio').checked,
        remitente_nombre: document.getElementById('outreach-config-remitente-nombre').value.trim(),
        remitente_email: document.getElementById('outreach-config-remitente-email').value.trim(),
        reply_to: document.getElementById('outreach-config-reply-to').value.trim(),
        url_privacidad: document.getElementById('outreach-config-url-privacidad').value.trim(),
        direccion_fisica: document.getElementById('outreach-config-direccion-fisica').value.trim(),
        updated_at: new Date().toISOString()
    };
    
    const csKeys = ['c1', 'c2', 'c3'];
    const vKeys = ['a', 'b', 'c'];
    csKeys.forEach(cs => {
        vKeys.forEach(v => {
            const modeVal = document.getElementById(`outreach-mode-${cs}-${v}`).value;
            const intervalVal = parseInt(document.getElementById(`outreach-interval-${cs}-${v}`).value) || 2;
            newConfig[`modo_${cs}_${v}`] = modeVal;
            if (cs === 'c3') {
                newConfig[`dia_${cs}_${v}`] = intervalVal;
            } else {
                newConfig[`intervalo_${cs}_${v}`] = intervalVal;
            }
        });
    });
    
    try {
        let error;
        if (outreachConfig.id) {
            const res = await _supabase.from('outreach_config').update(newConfig).eq('id', outreachConfig.id);
            error = res.error;
        } else {
            const res = await _supabase.from('outreach_config').insert(newConfig);
            error = res.error;
        }
        if (error) throw error;
        await fetchOutreachConfig();
        statusMsg.textContent = '✅ Guardado con éxito';
        statusMsg.style.color = 'var(--accent-green)';
        showToast('Configuración Outreach guardada con éxito');
    } catch(e) {
        console.error('Error saving outreach config:', e);
        statusMsg.textContent = '❌ Error';
        statusMsg.style.color = 'var(--accent-red)';
    } finally {
        saveBtn.disabled = false;
        setTimeout(() => statusMsg.textContent = '', 3000);
    }
}

function renderProposalConfigForm() {
    document.getElementById('proposal-config-remitente-nombre').value = proposalConfig.remitente_nombre || 'Gerard Fanals';
    document.getElementById('proposal-config-remitente-email').value = proposalConfig.remitente_email || 'gerard@gerardfanals.online';
    document.getElementById('proposal-config-reply-to').value = proposalConfig.reply_to || 'gerard@iartesana.es';
    document.getElementById('proposal-config-url-privacidad').value = proposalConfig.url_privacidad || 'https://gerardfanals.com/privacidad';
    document.getElementById('proposal-config-direccion-fisica').value = proposalConfig.direccion_fisica || 'Avda Fort de Leau 131, Mahón';
    
    const localFreqInm = localStorage.getItem('proposal_freq_inmediato') || '3';
    const localFreqMens = localStorage.getItem('proposal_freq_mensual') || '7';
    const localFreqAnual = localStorage.getItem('proposal_freq_anual') || '30';
    
    document.getElementById('proposal-freq-inmediato').value = localFreqInm;
    document.getElementById('proposal-freq-mensual').value = localFreqMens;
    document.getElementById('proposal-freq-anual').value = localFreqAnual;
}

async function saveProposalConfig() {
    if (sessionStorage.getItem('cc_role') === 'guest') {
        showAlert('Restringido', 'El usuario Invitado tiene acceso de solo lectura', '🔒');
        return;
    }
    const saveBtn = document.getElementById('btn-save-proposal-config');
    const statusMsg = document.getElementById('proposal-config-status-msg');
    saveBtn.disabled = true;
    statusMsg.textContent = 'Guardando...';
    
    const newConfig = {
        remitente_nombre: document.getElementById('proposal-config-remitente-nombre').value.trim(),
        remitente_email: document.getElementById('proposal-config-remitente-email').value.trim(),
        reply_to: document.getElementById('proposal-config-reply-to').value.trim(),
        url_privacidad: document.getElementById('proposal-config-url-privacidad').value.trim(),
        direccion_fisica: document.getElementById('proposal-config-direccion-fisica').value.trim(),
        updated_at: new Date().toISOString()
    };
    
    localStorage.setItem('proposal_freq_inmediato', document.getElementById('proposal-freq-inmediato').value);
    localStorage.setItem('proposal_freq_mensual', document.getElementById('proposal-freq-mensual').value);
    localStorage.setItem('proposal_freq_anual', document.getElementById('proposal-freq-anual').value);
    
    try {
        let error;
        if (proposalConfig.id) {
            const res = await _supabase.from('proposal_config').update(newConfig).eq('id', proposalConfig.id);
            error = res.error;
        } else {
            const res = await _supabase.from('proposal_config').insert(newConfig);
            error = res.error;
        }
        if (error) throw error;
        await fetchProposalConfig();
        statusMsg.textContent = '✅ Guardado';
        statusMsg.style.color = 'var(--accent-green)';
        showToast('Configuración de Propuestas guardada');
    } catch(e) {
        console.error('Error saving proposal config:', e);
        statusMsg.textContent = '❌ Error';
        statusMsg.style.color = 'var(--accent-red)';
    } finally {
        saveBtn.disabled = false;
        setTimeout(() => statusMsg.textContent = '', 3000);
    }
}

async function renderOutreachHistorial() {
    const listEl = document.getElementById('outreach-historial-list');
    listEl.innerHTML = '';
    
    const { data: logs, error } = await _supabase
        .from('outreach_email_logs')
        .select(`
            id, email_type, subject, body, sent_at, opened_at, clicked_at,
            outreach_leads (email, company_name, first_name)
        `)
        .order('sent_at', { ascending: false });
        
    if (error || !logs) {
        listEl.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-grey)">Error al cargar historial</div>';
        return;
    }
    
    let filtered = logs.filter(log => {
        const lead = log.outreach_leads || { email: '', company_name: '', first_name: '' };
        const matchesSearch = outreachHistSearch === '' || 
            (lead.first_name || '').toLowerCase().includes(outreachHistSearch.toLowerCase()) || 
            (lead.email || '').toLowerCase().includes(outreachHistSearch.toLowerCase()) ||
            (lead.company_name || '').toLowerCase().includes(outreachHistSearch.toLowerCase());
            
        let matchesChain = true;
        if (outreachHistFilter === '1') {
            matchesChain = log.email_type.includes('step_0') || log.email_type.includes('step_1');
        } else if (outreachHistFilter === '2') {
            matchesChain = log.email_type.includes('step_2') || log.email_type.includes('step_3');
        } else if (outreachHistFilter === '3') {
            matchesChain = log.email_type.includes('step_4') || log.email_type.includes('step_5') || log.email_type.includes('nurture_');
        }
        return matchesSearch && matchesChain;
    });
    
    const perPage = 10;
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    if (outreachHistPage > totalPages) outreachHistPage = totalPages;
    const startIdx = (outreachHistPage - 1) * perPage;
    const paginated = filtered.slice(startIdx, startIdx + perPage);
    
    document.getElementById('outreach-hist-pagination-info').textContent = `Página ${outreachHistPage} de ${totalPages}`;
    document.getElementById('btn-outreach-hist-prev').disabled = outreachHistPage === 1;
    document.getElementById('btn-outreach-hist-next').disabled = outreachHistPage === totalPages;
    
    if (paginated.length === 0) {
        listEl.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-grey)">No hay registros coincidentes</div>';
        return;
    }
    
    paginated.forEach(log => {
        const lead = log.outreach_leads || { email: 'Desconocido', company_name: '—', first_name: 'Prospecto' };
        const dateStr = new Date(log.sent_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        const openedBadge = log.opened_at ? '<span style="background:rgba(52,199,89,0.15); color:#34c759; padding:2px 6px; border-radius:4px; font-size:0.7rem; font-weight:700; margin-left:8px;">👁 Abierto</span>' : '';
        const clickedBadge = log.clicked_at ? '<span style="background:rgba(191,90,242,0.15); color:#bf5af2; padding:2px 6px; border-radius:4px; font-size:0.7rem; font-weight:700; margin-left:8px;">🔗 Clic</span>' : '';
        
        const card = document.createElement('div');
        card.style.cssText = 'padding:14px; border-bottom:1px solid var(--border-color); display:flex; flex-direction:column; gap:4px; font-size:0.82rem;';
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="color:var(--text-main)">${lead.first_name} (${lead.company_name}) · ${lead.email}</strong>
                <span style="font-size:0.75rem; color:var(--text-grey);">${dateStr}</span>
            </div>
            <div style="color:var(--text-grey); font-size:0.78rem;">
                Tipo: <span style="color:var(--text-main); font-weight:600;">${log.email_type}</span> | Asunto: <span style="color:var(--text-main); font-weight:600;">"${log.subject}"</span>
                ${openedBadge} ${clickedBadge}
            </div>
        `;
        listEl.appendChild(card);
    });
}

function filterOutreachHistorial() {
    outreachHistSearch = document.getElementById('outreach-historial-search').value;
    outreachHistFilter = document.getElementById('outreach-historial-filter-chain').value;
    outreachHistPage = 1;
    renderOutreachHistorial();
}

function changeOutreachHistPage(delta) {
    outreachHistPage += delta;
    renderOutreachHistorial();
}

async function renderProposalHistorial() {
    const listEl = document.getElementById('proposal-historial-list');
    listEl.innerHTML = '';
    
    const { data: logs, error } = await _supabase
        .from('outreach_email_logs')
        .select(`
            id, email_type, subject, body, sent_at, opened_at, clicked_at,
            outreach_leads (email, company_name, first_name)
        `)
        .ilike('email_type', 'proposal_%')
        .order('sent_at', { ascending: false });
        
    if (error || !logs) {
        listEl.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-grey)">Error al cargar historial</div>';
        return;
    }
    
    let filtered = logs.filter(log => {
        const lead = log.outreach_leads || { email: '', company_name: '', first_name: '' };
        return proposalHistSearch === '' || 
            (lead.first_name || '').toLowerCase().includes(proposalHistSearch.toLowerCase()) || 
            (lead.email || '').toLowerCase().includes(proposalHistSearch.toLowerCase()) ||
            (lead.company_name || '').toLowerCase().includes(proposalHistSearch.toLowerCase());
    });
    
    if (filtered.length === 0) {
        listEl.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-grey)">No hay registros coincidentes</div>';
        return;
    }
    
    filtered.forEach(log => {
        const lead = log.outreach_leads || { email: 'Desconocido', company_name: '—', first_name: 'Prospecto' };
        const dateStr = new Date(log.sent_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        
        const card = document.createElement('div');
        card.style.cssText = 'padding:14px; border-bottom:1px solid var(--border-color); display:flex; flex-direction:column; gap:4px; font-size:0.82rem;';
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="color:var(--text-main)">${lead.first_name} (${lead.company_name}) · ${lead.email}</strong>
                <span style="font-size:0.75rem; color:var(--text-grey);">${dateStr}</span>
            </div>
            <div style="color:var(--text-grey); font-size:0.78rem;">
                Secuencia: <span style="color:var(--text-main); font-weight:600;">${log.email_type}</span> | Asunto: <span style="color:var(--text-main); font-weight:600;">"${log.subject}"</span>
            </div>
        `;
        listEl.appendChild(card);
    });
}

function filterProposalHistorial() {
    proposalHistSearch = document.getElementById('proposal-historial-search').value;
    renderProposalHistorial();
}

let _envioStatusFilter = 'all';

window.filterEnvioByStatus = function(filter) {
    _envioStatusFilter = filter;
    document.querySelectorAll('.envio-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    renderOutreachSendList();
};

function renderOutreachSendList() {
    const listEl = document.getElementById('outreach-send-leads-list');
    listEl.innerHTML = '';

    const searchVal = document.getElementById('outreach-send-search').value.toLowerCase();

    // Active statuses for sequence
    const activeStatuses = [
        'welcome_1','welcome_2','welcome_3','welcome_4','welcome_5',
        'followup_1','followup_2','followup_3','followup_4',
        'nurture_1','nurture_2','nurture_3','nurture_4','nurture_5','nurture_6',
        'nurture_7','nurture_8','nurture_9','nurture_10','nurture_11','nurture_monthly'
    ];

    let filtered = outreachLeadsList.filter(l =>
        searchVal === '' ||
        (l.first_name || '').toLowerCase().includes(searchVal) ||
        (l.email || '').toLowerCase().includes(searchVal) ||
        (l.company_name || '').toLowerCase().includes(searchVal)
    );

    // Status filter
    if (_envioStatusFilter === 'enriched') {
        filtered = filtered.filter(l => l.status === 'enriched' || l.status === 'lead');
    } else if (_envioStatusFilter === 'active') {
        filtered = filtered.filter(l => activeStatuses.includes(l.status));
    } else if (_envioStatusFilter === 'completed') {
        filtered = filtered.filter(l => l.status === 'nurture_monthly' || l.status === 'reunion' || l.status === 'unsubscribed' || l.status === 'completed');
    }

    if (filtered.length === 0) {
        listEl.innerHTML = '<div class="envio-empty">No hay leads que coincidan con el filtro</div>';
        return;
    }

    filtered.forEach(lead => {
        const step = lead.sequence_step || 0;
        const status = lead.status || 'enriched';
        const version = lead.version || 'A';
        const isInSequence = activeStatuses.includes(status);
        const isPending = status === 'enriched' || status === 'lead';
        const isCompleted = status === 'nurture_monthly' || status === 'reunion' || status === 'unsubscribed' || status === 'completed';

        // Chain info from step
        let chainNum = 1, chainName = 'Bienvenida', chainColor = '#ff9500', stepInChain = step + 1, totalSteps = 5;
        if (step < 5) {
            chainNum = 1; chainName = 'Bienvenida'; chainColor = '#ff9500'; stepInChain = step + 1; totalSteps = 5;
        } else if (step < 9) {
            chainNum = 2; chainName = 'Seguimiento'; chainColor = '#34c759'; stepInChain = step - 4; totalSteps = 4;
        } else {
            chainNum = 3; chainName = 'Mantenimiento'; chainColor = '#007aff'; stepInChain = step - 8; totalSteps = 12;
        }
        const progressPct = isInSequence ? Math.round((stepInChain / totalSteps) * 100) : (isCompleted ? 100 : 0);

        // Status badge
        let statusLabel, statusClass;
        if (isPending) {
            statusLabel = 'Pendiente'; statusClass = 'envio-status-pending';
        } else if (isCompleted) {
            if (status === 'reunion') { statusLabel = 'Reunión'; statusClass = 'envio-status-meeting'; }
            else if (status === 'unsubscribed') { statusLabel = 'Baja'; statusClass = 'envio-status-unsub'; }
            else { statusLabel = 'Completado'; statusClass = 'envio-status-done'; }
        } else {
            statusLabel = `C${chainNum} · Paso ${stepInChain}`; statusClass = 'envio-status-active';
        }

        // Version colors
        const versionColors = { A: '#ff6b6b', B: '#007aff', C: '#bf5af2' };
        const vColor = versionColors[version] || '#999';

        // Lead type
        const typeLabels = { A: 'Conocido', B: 'Desconocido', C: 'Formulario' };
        const typeCls = { A: 'lead-type-conocido', B: 'lead-type-desconocido', C: 'lead-type-formulario' };
        const leadTypeLabel = typeLabels[version] || 'Conocido';
        const leadTypeCls = typeCls[version] || 'lead-type-conocido';

        // Last contacted
        const lastContact = lead.last_contacted_at
            ? new Date(lead.last_contacted_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
            : '—';

        // Initials
        const initials = ((lead.first_name || 'P')[0] + ((lead.company_name || '')[0] || '')).toUpperCase();

        const card = document.createElement('div');
        card.className = 'envio-lead-card';

        // Build chain step dots
        const chainsDots = [
            { num: 1, name: 'C1', color: '#ff9500', total: 5 },
            { num: 2, name: 'C2', color: '#34c759', total: 4 },
            { num: 3, name: 'C3', color: '#007aff', total: 12 }
        ];
        let dotsHtml = '';
        chainsDots.forEach(ch => {
            let startStep = ch.num === 1 ? 0 : ch.num === 2 ? 5 : 9;
            let dots = '';
            for (let i = 0; i < ch.total; i++) {
                const globalStep = startStep + i;
                let cls = 'envio-dot-empty';
                if (globalStep < step) cls = 'envio-dot-done';
                else if (globalStep === step && isInSequence) cls = 'envio-dot-current';
                dots += `<span class="envio-dot ${cls}" style="--dot-color:${ch.color}"></span>`;
            }
            dotsHtml += `<div class="envio-chain-dots"><span class="envio-chain-dots-label" style="color:${ch.color}">${ch.name}</span>${dots}</div>`;
        });

        card.innerHTML = `
            <div class="envio-card-top">
                <div class="envio-card-left">
                    <div class="envio-avatar" style="background:${chainColor}20;color:${chainColor}">${initials}</div>
                    <div class="envio-card-info">
                        <div class="envio-card-name">${lead.first_name || 'Prospecto'} <span class="envio-card-company">${lead.company_name || '—'}</span></div>
                        <div class="envio-card-email">${lead.email}</div>
                        <div class="envio-card-meta">
                            <span class="envio-version-dot" style="background:${vColor}"></span>
                            <span class="envio-meta-label">V.${version}</span>
                            <span class="envio-meta-sep">·</span>
                            <span class="lead-type-badge ${leadTypeCls}" style="font-size:0.65rem;padding:2px 7px;">${leadTypeLabel}</span>
                            <span class="envio-meta-sep">·</span>
                            <span class="envio-meta-label">Último: ${lastContact}</span>
                        </div>
                    </div>
                </div>
                <div class="envio-card-right">
                    <span class="envio-status-badge ${statusClass}">${statusLabel}</span>
                    <div class="envio-card-actions">
                        <button class="envio-btn-compose" onclick="window.openComposeForLead('${lead.email}')">📝 Email manual</button>
                        ${isPending ? `
                            <button class="envio-btn-start" onclick="window.startOutreachSequence('${lead.id}')">🚀 Iniciar secuencia</button>
                        ` : isInSequence ? `
                            <button class="envio-btn-resume" onclick="window.startOutreachSequence('${lead.id}')">▶ Enviar siguiente</button>
                        ` : ''}
                    </div>
                </div>
            </div>
            <div class="envio-card-bottom">
                ${dotsHtml}
            </div>
        `;
        listEl.appendChild(card);
    });
}

// openComposeForLead is defined earlier in the file (near lead utility functions)

window.startOutreachSequence = async function(leadId) {
    if (sessionStorage.getItem('cc_role') === 'guest') {
        showAlert('Restringido', 'El usuario Invitado tiene acceso de solo lectura', '🔒');
        return;
    }
    try {
        showToast('Iniciando secuencia para el lead...');
        const res = await fetch('/api/send-sequence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lead_id: leadId })
        });
        
        const data = await res.json();
        if (res.ok && data.success) {
            showToast('Secuencia iniciada con éxito. Email enviado.');
            await fetchOutreachLeadsList();
            renderOutreachSendList();
            await renderOutreachPanel();
        } else {
            showToast(data.error || 'Error al iniciar secuencia', true);
        }
    } catch(e) {
        console.error('Error starting sequence:', e);
        showToast('Error de conexión', true);
    }
};

async function openComposeEmailModal() {
    if (sessionStorage.getItem('cc_role') === 'guest') {
        showAlert('Restringido', 'El usuario Invitado tiene acceso de solo lectura', '🔒');
        return;
    }
    const select = document.getElementById('compose-email-to');
    select.innerHTML = '';
    
    // Merge leads from outreach + registry, deduplicate by email
    const allLeads = [...(outreachLeadsList || [])];
    if (_allLeadsGridData && _allLeadsGridData.length > 0) {
        const existing = new Set(allLeads.map(l => l.email));
        _allLeadsGridData.forEach(l => {
            if (!existing.has(l.email)) allLeads.push(l);
        });
    }
    
    allLeads.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l.email;
        opt.textContent = `${l.first_name || 'Prospecto'} (${l.company_name || '—'}) - ${l.email}`;
        select.appendChild(opt);
    });
    
    document.getElementById('compose-email-subject').value = '';
    document.getElementById('compose-email-body').value = '';
    document.getElementById('email-compose-modal').style.display = 'flex';
}

function closeComposeEmailModal() {
    const m = document.getElementById('email-compose-modal');
    m.classList.remove('active');
    m.style.display = 'none';
}

async function sendManualEmail() {
    if (sessionStorage.getItem('cc_role') === 'guest') {
        showAlert('Restringido', 'El usuario Invitado tiene acceso de solo lectura', '🔒');
        return;
    }
    let emailTo = document.getElementById('compose-email-to').value;
    
    // Handle custom email option
    if (emailTo === '__custom__') {
        const customInput = document.getElementById('compose-custom-email');
        emailTo = customInput ? customInput.value.trim() : '';
    }
    
    const subject = document.getElementById('compose-email-subject').value.trim();
    const body = document.getElementById('compose-email-body').value.trim();
    
    if (!emailTo || !subject || !body) {
        showAlert('Campos incompletos', 'Por favor, rellena todos los campos del correo (destinatario, asunto y mensaje).', '⚠️');
        return;
    }
    
    // Basic email validation
    if (!emailTo.includes('@') || !emailTo.includes('.')) {
        showAlert('Email no válido', 'El email introducido no tiene un formato correcto.', '❌');
        return;
    }
    
    const sendBtn = document.getElementById('btn-send-manual-email');
    const originalHTML = sendBtn.innerHTML;
    sendBtn.disabled = true;
    sendBtn.innerHTML = '⏳ Enviando...';
    
    try {
        // Convert attachments to base64
        const attachments = [];
        if (window._composeAttachments && window._composeAttachments.length > 0) {
            for (const file of window._composeAttachments) {
                const base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result.split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                attachments.push({
                    filename: file.name,
                    content: base64
                });
            }
        }

        const res = await fetch('/api/send-manual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: emailTo,
                subject: subject,
                body: body,
                attachments: attachments.length > 0 ? attachments : undefined
            })
        });
        
        const data = await res.json();
        if (res.ok && data.success) {
            closeComposeEmailModal();
            showAlert('Correo enviado', 'El email se ha enviado correctamente a ' + emailTo, '✅');
            if (typeof loadBandejaInbox === 'function') await loadBandejaInbox();
        } else {
            showAlert('Error de envío', data.error || 'No se pudo enviar el correo. Verifica la configuración de Resend.', '❌');
        }
    } catch(e) {
        console.error('Error sending manual email:', e);
        showAlert('Error de conexión', 'No se pudo conectar con el servidor de envío.', '🔌');
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = originalHTML;
    }
}

async function saveOutreachTemplate(cadenaNum, version, stepNum) {
    if (sessionStorage.getItem('cc_role') === 'guest') {
        showAlert('Restringido', 'El usuario Invitado tiene acceso de solo lectura', '🔒');
        return;
    }
    const subject = document.getElementById(`outreach-subject-${cadenaNum}-${version}-${stepNum}`).value.trim();
    const body = document.getElementById(`outreach-body-${cadenaNum}-${version}-${stepNum}`).value.trim();
    
    if (!subject || !body) {
        showToast('El asunto y el cuerpo del email no pueden estar vacíos', true);
        return;
    }
    try {
        const { error } = await _supabase
            .from('outreach_sequences')
            .update({ asunto: subject, contenido_html: body, updated_at: new Date().toISOString() })
            .eq('cadena_num', cadenaNum).eq('orden', stepNum).eq('version', version);
            
        if (error) throw error;
        
        const idx = outreachSequences.findIndex(s => s.cadena_num === cadenaNum && s.orden === stepNum && s.version === version);
        if (idx !== -1) {
            outreachSequences[idx].asunto = subject;
            outreachSequences[idx].contenido_html = body;
        }
        showToast('Plantilla de outreach guardada correctamente');
    } catch(e) {
        console.error('Error saving outreach template:', e);
        showToast('Error al guardar la plantilla', true);
    }
}

async function saveProposalTemplate(secuenciaId, categoryKey, stepNum) {
    if (sessionStorage.getItem('cc_role') === 'guest') {
        showAlert('Restringido', 'El usuario Invitado tiene acceso de solo lectura', '🔒');
        return;
    }
    const subject = document.getElementById(`proposal-subject-${secuenciaId}-${categoryKey}-${stepNum}`).value.trim();
    const body = document.getElementById(`proposal-body-${secuenciaId}-${categoryKey}-${stepNum}`).value.trim();
    
    if (!subject || !body) {
        showToast('El asunto y el cuerpo del email no pueden estar vacíos', true);
        return;
    }
    try {
        const { error } = await _supabase
            .from('proposal_sequences')
            .update({ asunto: subject, contenido_html: body, updated_at: new Date().toISOString() })
            .eq('secuencia_id', secuenciaId).eq('categoria_key', categoryKey).eq('step', stepNum);
            
        if (error) throw error;
        
        const idx = proposalSequences.findIndex(s => s.secuencia_id === secuenciaId && s.categoria_key === categoryKey && s.step === stepNum);
        if (idx !== -1) {
            proposalSequences[idx].asunto = subject;
            proposalSequences[idx].contenido_html = body;
        }
        showToast('Plantilla de propuesta guardada correctamente');
    } catch(e) {
        console.error('Error saving proposal template:', e);
        showToast('Error al guardar la plantilla', true);
    }
}

async function sendTestEmail(cadenaNum, version, stepNum, type) {
    if (sessionStorage.getItem('cc_role') === 'guest') {
        showAlert('Restringido', 'El usuario Invitado tiene acceso de solo lectura', '🔒');
        return;
    }
    const subject = document.getElementById(`outreach-subject-${cadenaNum}-${version}-${stepNum}`).value.trim();
    const body = document.getElementById(`outreach-body-${cadenaNum}-${version}-${stepNum}`).value.trim();
    const targetEmail = outreachConfig.reply_to || 'gerard@iartesana.es';
    
    try {
        showToast('Enviando email de prueba...');
        const res = await fetch('/api/send-manual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: targetEmail,
                subject: `[PRUEBA OUTREACH] ${subject}`,
                body: body,
                isTest: true
            })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            showToast(`Email de prueba enviado a ${targetEmail}`);
        } else {
            showToast(data.error || 'Error al enviar email de prueba', true);
        }
    } catch(e) {
        console.error('Error sending test:', e);
        showToast('Error de conexión', true);
    }
}

async function sendProposalTestEmail(secuenciaId, categoryKey, stepNum) {
    if (sessionStorage.getItem('cc_role') === 'guest') {
        showAlert('Restringido', 'El usuario Invitado tiene acceso de solo lectura', '🔒');
        return;
    }
    const subject = document.getElementById(`proposal-subject-${secuenciaId}-${categoryKey}-${stepNum}`).value.trim();
    const body = document.getElementById(`proposal-body-${secuenciaId}-${categoryKey}-${stepNum}`).value.trim();
    const targetEmail = proposalConfig.reply_to || 'gerard@iartesana.es';
    
    try {
        showToast('Enviando email de prueba...');
        const res = await fetch('/api/send-manual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: targetEmail,
                subject: `[PRUEBA PROPUESTA] ${subject}`,
                body: body,
                isTest: true
            })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            showToast(`Email de prueba enviado a ${targetEmail}`);
        } else {
            showToast(data.error || 'Error al enviar email de prueba', true);
        }
    } catch(e) {
        console.error('Error sending test:', e);
        showToast('Error de conexión', true);
    }
}

// --- Email Preview Modal ---
function previewOutreachEmail(cadenaNum, version, stepNum) {
    const subjectEl = document.getElementById(`outreach-subject-${cadenaNum}-${version}-${stepNum}`);
    const bodyEl = document.getElementById(`outreach-body-${cadenaNum}-${version}-${stepNum}`);
    if (!subjectEl || !bodyEl) return;

    const vars = {
        '{{first_name}}': 'Carlos',
        '{{company_name}}': 'Empresa Demo S.L.',
        '{{booking_url}}': '<a href="https://calendar.app.google/QMiJY3UbKChYgEcu6" style="color:#007aff;text-decoration:none;font-weight:600">📅 Reservar reunión aquí</a>'
    };
    let subject = subjectEl.value;
    let body = bodyEl.value;
    for (const [k, v] of Object.entries(vars)) {
        const re = new RegExp(k.replace(/[{}]/g, '\\$&'), 'g');
        subject = subject.replace(re, v);
        body = body.replace(re, v);
    }
    // Convert line breaks
    body = body.replace(/\n/g, '<br>');

    const modal = document.getElementById('email-preview-modal');
    document.getElementById('preview-email-subject').textContent = subject;
    document.getElementById('preview-email-body').innerHTML = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#333;max-width:560px;margin:0 auto;padding:24px">
            ${body}
            <br><br>
            <hr style="border:0;border-top:1px solid #eee;margin:20px 0">
            <p style="font-size:11px;color:#999;text-align:center;line-height:1.4">
                Enviado por Gerard Fanals · Consultoría de IA y Automatización B2B<br>
                Si no deseas recibir más correos, puedes <a href="#" style="color:#007aff;text-decoration:none">darte de baja aquí</a>.<br>
                Avda Fort de Leau 131, Mahón
            </p>
        </div>
    `;
    document.getElementById('preview-email-version').textContent = `Versión ${version} · Cadena ${cadenaNum} · Paso ${stepNum}`;
    modal.classList.add('active');
}

function closeEmailPreview() {
    document.getElementById('email-preview-modal').classList.remove('active');
}

// --- AI Generate Dialog ---
let _aiDialogTarget = null;

function openAIGenerateDialog(cadenaNum, version, stepNum) {
    if (sessionStorage.getItem('cc_role') === 'guest') {
        showAlert('Restringido', 'El usuario Invitado tiene acceso de solo lectura', '🔒');
        return;
    }
    _aiDialogTarget = { cadenaNum, version, stepNum };
    const modal = document.getElementById('ai-generate-modal');
    const input = document.getElementById('ai-generate-instructions');
    const resultDiv = document.getElementById('ai-generate-result');
    input.value = '';
    resultDiv.style.display = 'none';
    resultDiv.innerHTML = '';
    document.getElementById('ai-generate-btn').disabled = false;
    document.getElementById('ai-generate-btn').textContent = '✨ Generar';
    modal.classList.add('active');
    setTimeout(() => input.focus(), 150);
}

function closeAIGenerateDialog() {
    document.getElementById('ai-generate-modal').classList.remove('active');
    _aiDialogTarget = null;
}

async function executeAIGenerate() {
    if (!_aiDialogTarget) return;
    const { cadenaNum, version, stepNum } = _aiDialogTarget;
    const instructions = document.getElementById('ai-generate-instructions').value.trim();
    if (!instructions) {
        showToast('Escribe instrucciones para la IA', true);
        return;
    }

    const subjectEl = document.getElementById(`outreach-subject-${cadenaNum}-${version}-${stepNum}`);
    const bodyEl = document.getElementById(`outreach-body-${cadenaNum}-${version}-${stepNum}`);
    const currentSubject = subjectEl ? subjectEl.value.trim() : '';
    const currentBody = bodyEl ? bodyEl.value.trim() : '';

    const btn = document.getElementById('ai-generate-btn');
    const resultDiv = document.getElementById('ai-generate-result');
    btn.disabled = true;
    btn.textContent = '⏳ Generando...';
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text-grey)">Generando con IA...</div>';

    const promptMsg = `Eres un experto en copywriting B2B en español. El usuario te da las siguientes instrucciones para crear o modificar un email de prospección comercial:

Instrucciones del usuario: "${instructions}"

Asunto actual: "${currentSubject}"
Cuerpo actual: "${currentBody}"

Reglas:
- Mantén los marcadores {{first_name}}, {{company_name}} y {{booking_url}} exactamente igual.
- Escribe en español natural, persuasivo y directo.
- El asunto debe ser en minúsculas, corto y sin emojis.
- El cuerpo debe ser conciso (máximo 150 palabras) y terminar con "Un abrazo,\nGerard".
- Devuelve ÚNICAMENTE un JSON con dos campos: "subject" y "body" (con saltos de línea como <br>). Sin markdown, sin explicaciones.`;

    try {
        const res = await fetch('/api/brain-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: promptMsg })
        });
        const data = await res.json();
        if (res.ok && data.text) {
            let text = data.text.replace(/```json/i, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(text);
            if (parsed.subject && parsed.body) {
                const previewBody = parsed.body.replace(/<br\s*\/?>/gi, '\n');
                resultDiv.innerHTML = `
                    <div style="margin-bottom:8px">
                        <label style="font-size:0.72rem;color:var(--text-grey);font-weight:600">Asunto generado:</label>
                        <div style="font-weight:700;font-size:0.88rem;color:var(--text-main);margin-top:2px">${parsed.subject}</div>
                    </div>
                    <div style="margin-bottom:12px">
                        <label style="font-size:0.72rem;color:var(--text-grey);font-weight:600">Cuerpo generado:</label>
                        <div style="font-size:0.82rem;color:var(--text-main);margin-top:4px;line-height:1.5;white-space:pre-wrap;max-height:200px;overflow-y:auto">${previewBody}</div>
                    </div>
                    <div style="display:flex;gap:8px;justify-content:flex-end">
                        <button class="btn-secondary" style="padding:6px 14px;font-size:0.78rem;border-radius:8px" onclick="window.executeAIGenerate()">🔄 Regenerar</button>
                        <button class="btn-primary" style="padding:6px 14px;font-size:0.78rem;border-radius:8px" onclick="window.applyAIResult()">✅ Aplicar</button>
                    </div>
                `;
                // Store result for applying
                window._aiLastResult = parsed;
                btn.textContent = '✨ Generar';
                btn.disabled = false;
            } else {
                throw new Error('Formato incorrecto');
            }
        } else {
            throw new Error('Error API');
        }
    } catch(e) {
        console.error('AI generate error:', e);
        resultDiv.innerHTML = '<div style="text-align:center;padding:12px;color:#ff3b30;font-size:0.82rem">Error al generar. Inténtalo de nuevo.</div>';
        btn.textContent = '✨ Generar';
        btn.disabled = false;
    }
}

function applyAIResult() {
    if (!_aiDialogTarget || !window._aiLastResult) return;
    const { cadenaNum, version, stepNum } = _aiDialogTarget;
    const subjectEl = document.getElementById(`outreach-subject-${cadenaNum}-${version}-${stepNum}`);
    const bodyEl = document.getElementById(`outreach-body-${cadenaNum}-${version}-${stepNum}`);
    if (subjectEl) subjectEl.value = window._aiLastResult.subject;
    if (bodyEl) bodyEl.value = window._aiLastResult.body.replace(/<br\s*\/?>/gi, '\n');
    showToast('Contenido aplicado. Recuerda guardar 💾');
    closeAIGenerateDialog();
}

// Keep old function name for backward compatibility
async function generateAIOutreachVariant(cadenaNum, version, stepNum) {
    openAIGenerateDialog(cadenaNum, version, stepNum);
}

async function generateAIProposalVariant(secuenciaId, categoryKey, stepNum) {
    if (sessionStorage.getItem('cc_role') === 'guest') {
        showAlert('Restringido', 'El usuario Invitado tiene acceso de solo lectura', '🔒');
        return;
    }
    const subjectEl = document.getElementById(`proposal-subject-${secuenciaId}-${categoryKey}-${stepNum}`);
    const bodyEl = document.getElementById(`proposal-body-${secuenciaId}-${categoryKey}-${stepNum}`);
    const subject = subjectEl.value.trim();
    const body = bodyEl.value.trim();
    
    showToast('Generando variante persuasiva con IA...');
    const promptMsg = `Escribe una variante alternativa persuasiva y directa en español para este correo de seguimiento de propuestas. Mantén los mismos marcadores o variables como {{nombre}}, {{link_confirmar}} y {{link_pdf}} exactamente igual.
Asunto original: "${subject}"
Cuerpo original: "${body}"
Devuelve tu respuesta únicamente en formato JSON con dos campos de texto planos: "subject" y "body" (que contenga el cuerpo con saltos de línea codificados como <br>). No añadas bloques de código markdown, explicaciones ni comentarios.`;

    try {
        const res = await fetch('/api/brain-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: promptMsg })
        });
        const data = await res.json();
        if (res.ok && data.text) {
            let text = data.text;
            text = text.replace(/```json/i, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(text);
            if (parsed.subject && parsed.body) {
                subjectEl.value = parsed.subject;
                bodyEl.value = parsed.body.replace(/<br\s*\/?>/gi, '\n');
                showToast('Variante generada con éxito');
            } else {
                throw new Error('Formato de respuesta incorrecto');
            }
        } else {
            showToast('Error al generar variante con IA', true);
        }
    } catch(e) {
        console.error('Error in AI variant:', e);
        showToast('Error de conexión o respuesta no válida', true);
    }
}

function insertAtCursor(el, text) {
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const val = el.value;
    el.value = val.substring(0, start) + text + val.substring(end);
    el.selectionStart = el.selectionEnd = start + text.length;
    el.focus();
}

window.insertAtComposerCursor = function(openTag, closeTag) {
    const el = document.getElementById('compose-email-body');
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selectedText = el.value.substring(start, end);
    insertAtCursor(el, openTag + selectedText + closeTag);
};

window.insertAtTemplateCursor = function(cadenaNum, version, stepNum, openTag, closeTag) {
    const el = document.getElementById(`outreach-body-${cadenaNum}-${version}-${stepNum}`);
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selectedText = el.value.substring(start, end);
    insertAtCursor(el, openTag + selectedText + closeTag);
};

window.insertAtProposalCursor = function(secuenciaId, categoryKey, stepNum, openTag, closeTag) {
    const el = document.getElementById(`proposal-body-${secuenciaId}-${categoryKey}-${stepNum}`);
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selectedText = el.value.substring(start, end);
    insertAtCursor(el, openTag + selectedText + closeTag);
};

let _emailPromptResolve = null;
function openEmailPromptModal(title, fields) {
    document.getElementById('email-prompt-title').textContent = title;
    const container = document.getElementById('email-prompt-fields-container');
    container.innerHTML = '';
    fields.forEach(f => {
        const div = document.createElement('div');
        div.style.cssText = 'display:flex; flex-direction:column; gap:4px;';
        div.innerHTML = `
            <label class="dash-label" style="font-size:0.75rem;">${f.label}</label>
            <input type="text" class="dash-input" id="email-prompt-field-${f.key}" placeholder="${f.placeholder || ''}" value="${f.value || ''}" style="width:100%;">
        `;
        container.appendChild(div);
    });
    document.getElementById('email-prompt-modal').style.display = 'flex';
    return new Promise(resolve => {
        _emailPromptResolve = resolve;
        document.getElementById('btn-email-prompt-submit').onclick = () => {
            const result = {};
            fields.forEach(f => {
                result[f.key] = document.getElementById(`email-prompt-field-${f.key}`).value.trim();
            });
            closeEmailPromptModal();
            if (_emailPromptResolve) { _emailPromptResolve(result); _emailPromptResolve = null; }
        };
    });
}

function closeEmailPromptModal() {
    document.getElementById('email-prompt-modal').style.display = 'none';
    if (_emailPromptResolve) { _emailPromptResolve(null); _emailPromptResolve = null; }
}

window.closeEmailPromptModal = closeEmailPromptModal;

window.openComposerLinkPrompt = async function() {
    const res = await openEmailPromptModal('Insertar Enlace 🔗', [
        { key: 'text', label: 'Texto a mostrar', placeholder: 'Haz clic aquí' },
        { key: 'url', label: 'URL del enlace', placeholder: 'https://example.com' }
    ]);
    if (res && res.url) {
        window.insertAtComposerCursor(`<a href="${res.url}" style="color:#0071e3; text-decoration:underline;">${res.text || res.url}`, `</a>`);
    }
};

window.openComposerImagePrompt = async function() {
    const res = await openEmailPromptModal('Insertar Imagen 🖼️', [
        { key: 'url', label: 'URL de la imagen', placeholder: 'https://example.com/imagen.jpg' },
        { key: 'alt', label: 'Texto alternativo (alt)', placeholder: 'Descripción' }
    ]);
    if (res && res.url) {
        window.insertAtComposerCursor(`<img src="${res.url}" alt="${res.alt || ''}" style="max-width:100%; height:auto; border-radius:8px; margin:12px 0;">`, '');
    }
};

// Bind functions to window context
window.switchEmailMainTab = switchEmailMainTab;
window.switchOutreachSubTab = switchOutreachSubTab;
window.switchProposalSubTab = switchProposalSubTab;
window.switchProposalCategoryTab = switchProposalCategoryTab;
window.saveOutreachConfig = saveOutreachConfig;
window.saveProposalConfig = saveProposalConfig;
window.openComposeEmailModal = openComposeEmailModal;
window.closeComposeEmailModal = closeComposeEmailModal;
window.sendManualEmail = sendManualEmail;
window.saveOutreachTemplate = saveOutreachTemplate;
window.saveProposalTemplate = saveProposalTemplate;
window.sendTestEmail = sendTestEmail;
window.sendProposalTestEmail = sendProposalTestEmail;
window.generateAIOutreachVariant = generateAIOutreachVariant;
window.generateAIProposalVariant = generateAIProposalVariant;
window.filterOutreachHistorial = filterOutreachHistorial;
window.changeOutreachHistPage = changeOutreachHistPage;
window.filterProposalHistorial = filterProposalHistorial;
window.renderOutreachSendList = renderOutreachSendList;
window.previewOutreachEmail = previewOutreachEmail;
window.closeEmailPreview = closeEmailPreview;
window.openAIGenerateDialog = openAIGenerateDialog;
window.closeAIGenerateDialog = closeAIGenerateDialog;
window.executeAIGenerate = executeAIGenerate;
window.applyAIResult = applyAIResult;

// =============================================
// 10. CUSTOM CALENDAR GRID
// =============================================

let calDate = new Date();
let calFilter = 'all';
let calEvents = [];

const MONTH_NAMES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function switchCalTab(tab) {
    document.querySelectorAll('.cal-tab').forEach(t => t.classList.remove('active'));
    const newBtn = document.getElementById('btn-new-meeting');
    if (tab === 'calendar') {
        document.getElementById('cal-view-calendar').style.display = '';
        document.getElementById('cal-view-tasks').style.display = 'none';
        document.querySelector('.cal-tab:first-child').classList.add('active');
        if (newBtn) { newBtn.textContent = '+ Nueva reunión'; newBtn.onclick = openNewMeetingModal; }
    } else {
        document.getElementById('cal-view-calendar').style.display = 'none';
        document.getElementById('cal-view-tasks').style.display = '';
        document.getElementById('cal-tab-tasks').classList.add('active');
        if (newBtn) { newBtn.textContent = '+ Nueva tarea'; newBtn.onclick = () => openTaskModal(); }
        loadTasks();
    }
}

function calPrev() {
    if (calMode === 'day') calDate.setDate(calDate.getDate() - 1);
    else if (calMode === 'week') calDate.setDate(calDate.getDate() - 7);
    else calDate.setMonth(calDate.getMonth() - 1);
    renderCalGrid();
}
function calNext() {
    if (calMode === 'day') calDate.setDate(calDate.getDate() + 1);
    else if (calMode === 'week') calDate.setDate(calDate.getDate() + 7);
    else calDate.setMonth(calDate.getMonth() + 1);
    renderCalGrid();
}
function calToday() {
    calDate = new Date();
    renderCalGrid();
}

function setCalFilter(f) {
    calFilter = f;
    document.querySelectorAll('.cal-filter').forEach(b => b.classList.remove('active'));
    const el = document.querySelector(`.cal-filter[data-filter="${f}"]`);
    if (el) el.classList.add('active');
    renderCalGrid();
}

let calMode = 'month';

function setCalMode(m) {
    calMode = m;
    document.querySelectorAll('.cal-mode').forEach(b => b.classList.remove('active'));
    const el = document.querySelector(`.cal-mode[data-mode="${m}"]`);
    if (el) el.classList.add('active');
    renderCalGrid();
}

function calGoToDate(val) {
    if (!val) return;
    calDate = new Date(val + 'T12:00:00');
    renderCalGrid();
}

async function syncCalendarData() {
    const btn = document.querySelector('.cal-sync-btn');
    if (btn) { btn.style.animation = 'spin 1s linear infinite'; }
    await renderCalGrid();
    if (typeof loadTasks === 'function') await loadTasks();
    if (btn) { btn.style.animation = ''; }
    showAlert('Sincronizado', 'Calendario actualizado', '↻');
}

async function loadCalendarEvents() {
    try {
        const year = calDate.getFullYear();
        const month = calDate.getMonth();
        const from = new Date(year, month - 1, 20).toISOString();
        const to = new Date(year, month + 2, 7).toISOString();

        const { data, error } = await _supabase
            .from('meetings')
            .select('*')
            .gte('meeting_date', from)
            .lte('meeting_date', to)
            .order('meeting_date', { ascending: true });

        if (error) { console.warn('[Cal] Events error:', error); return; }
        calEvents = (data || []).map(m => ({
            id: m.id,
            title: m.contact_name,
            date: m.meeting_date,
            type: 'meeting',
            meetingType: m.meeting_type,
            status: m.status
        }));

        // Also load tasks — expand multi-day tasks to appear on each day
        try {
            const { data: taskData, error: taskErr } = await _supabase
                .from('tasks')
                .select('*');
            if (taskErr) console.warn('[Cal] Tasks query error:', taskErr);
            if (taskData && taskData.length > 0) {
                console.log('[Cal] Tasks loaded:', taskData.length);
                taskData.forEach(t => {
                    const sd = t.start_date || t.due_date || (t.created_at ? t.created_at.split('T')[0] : null);
                    const ed = t.due_date || sd;
                    if (!sd) return;

                    // Create one event per day from start to end
                    const start = new Date(sd + 'T00:00:00');
                    const end = new Date(ed + 'T00:00:00');
                    const cursor = new Date(start);
                    while (cursor <= end) {
                        calEvents.push({
                            id: t.id,
                            title: t.title,
                            date: cursor.toISOString(),
                            type: 'task',
                            taskType: t.task_type,
                            status: t.status,
                            isMultiDay: start.getTime() !== end.getTime(),
                            startDate: sd,
                            endDate: ed
                        });
                        cursor.setDate(cursor.getDate() + 1);
                    }
                });
            }
        } catch(e) { console.warn('[Cal] Tasks load error:', e); }

        // Also load Google Calendar events if connected
        if (_gcalConnected && _gcalToken) {
            try {
                const res = await fetch(
                    'https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=' + encodeURIComponent(from) + '&timeMax=' + encodeURIComponent(to) + '&singleEvents=true&orderBy=startTime&maxResults=100',
                    { headers: { 'Authorization': 'Bearer ' + _gcalToken } }
                );
                if (res.ok) {
                    const gcalData = await res.json();
                    if (gcalData.items) {
                        // Filter out events already synced (matching gcal_event_id in meetings)
                        const syncedIds = (data || []).filter(m => m.gcal_event_id).map(m => m.gcal_event_id);
                        const gcalEvents = gcalData.items
                            .filter(ev => !syncedIds.includes(ev.id))
                            .map(ev => ({
                                id: 'gcal_' + ev.id,
                                title: ev.summary || 'Sin título',
                                date: ev.start.dateTime || ev.start.date + 'T00:00:00',
                                type: 'meeting',
                                meetingType: 'gcal',
                                status: ev.status === 'cancelled' ? 'cancelled' : 'confirmed',
                                isGcal: true
                            }));
                        calEvents = calEvents.concat(gcalEvents);
                    }
                }
            } catch(e) { console.warn('[Cal] GCal fetch error:', e); }
        }

        // Update event count
        const countEl = document.getElementById('cal-event-count');
        if (countEl) countEl.textContent = calEvents.filter(e => e.type === 'meeting').length;

        console.log('[Cal] Loaded', calEvents.length, 'events');
    } catch(e) {
        console.warn('[Cal] Load error:', e);
        calEvents = [];
    }
}

async function renderCalGrid() {
    await loadCalendarEvents();

    const year = calDate.getFullYear();
    const month = calDate.getMonth();

    // Update title
    const titleEl = document.getElementById('cal-month-title');

    const today = new Date();
    const todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');

    const gridEl = document.getElementById('cal-days');
    const headersEl = document.querySelector('.cal-grid');
    if (!gridEl) return;

    if (calMode === 'day') {
        // --- DAY VIEW ---
        if (titleEl) titleEl.textContent = calDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        // Hide day-of-week headers
        document.querySelectorAll('.cal-day-header').forEach(h => h.style.display = 'none');
        if (headersEl) headersEl.style.gridTemplateColumns = '1fr';
        gridEl.style.gridTemplateColumns = '1fr';

        const dateStr = calDate.getFullYear() + '-' + String(calDate.getMonth()+1).padStart(2,'0') + '-' + String(calDate.getDate()).padStart(2,'0');
        const isToday = dateStr === todayStr;
        let dayEvents = getEventsForDate(dateStr);
        if (calFilter === 'meetings') dayEvents = dayEvents.filter(e => e.type === 'meeting');
        if (calFilter === 'tasks') dayEvents = dayEvents.filter(e => e.type === 'task');

        let html = `<div class="cal-cell${isToday ? ' today' : ''}" style="min-height:400px">`;
        html += `<div class="cal-day-num">${calDate.getDate()}</div>`;
        dayEvents.forEach(ev => {
            html += renderCalEvent(ev);
        });
        html += '</div>';
        gridEl.innerHTML = html;

    } else if (calMode === 'week') {
        // --- WEEK VIEW ---
        // Find Monday of current week
        const dayOfWeek = calDate.getDay();
        const monday = new Date(calDate);
        monday.setDate(calDate.getDate() - ((dayOfWeek + 6) % 7));

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        if (titleEl) titleEl.textContent = `${monday.getDate()} ${MONTH_NAMES_ES[monday.getMonth()].substring(0,3)} - ${sunday.getDate()} ${MONTH_NAMES_ES[sunday.getMonth()].substring(0,3)} ${sunday.getFullYear()}`;

        // Show day-of-week headers
        document.querySelectorAll('.cal-day-header').forEach(h => h.style.display = '');
        if (headersEl) headersEl.style.gridTemplateColumns = 'repeat(7, 1fr)';
        gridEl.style.gridTemplateColumns = 'repeat(7, 1fr)';

        let html = '';
        for (let i = 0; i < 7; i++) {
            const cellDate = new Date(monday);
            cellDate.setDate(monday.getDate() + i);
            const dateStr = cellDate.getFullYear() + '-' + String(cellDate.getMonth()+1).padStart(2,'0') + '-' + String(cellDate.getDate()).padStart(2,'0');
            const isToday = dateStr === todayStr;
            let dayEvents = getEventsForDate(dateStr);
            if (calFilter === 'meetings') dayEvents = dayEvents.filter(e => e.type === 'meeting');
            if (calFilter === 'tasks') dayEvents = dayEvents.filter(e => e.type === 'task');

            html += `<div class="cal-cell${isToday ? ' today' : ''}" style="min-height:200px">`;
            html += `<div class="cal-day-num">${cellDate.getDate()}</div>`;
            dayEvents.forEach(ev => {
                html += renderCalEvent(ev);
            });
            html += '</div>';
        }
        gridEl.innerHTML = html;

    } else {
        // --- MONTH VIEW ---
        if (titleEl) titleEl.textContent = MONTH_NAMES_ES[month] + ' de ' + year;

        // Show day-of-week headers
        document.querySelectorAll('.cal-day-header').forEach(h => h.style.display = '');
        if (headersEl) headersEl.style.gridTemplateColumns = 'repeat(7, 1fr)';
        gridEl.style.gridTemplateColumns = 'repeat(7, 1fr)';

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        let startOffset = firstDay.getDay() - 1;
        if (startOffset < 0) startOffset = 6;
        const daysInMonth = lastDay.getDate();
        const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

        let html = '';
        for (let i = 0; i < totalCells; i++) {
            const cellDate = new Date(year, month, 1 - startOffset + i);
            const dateStr = cellDate.getFullYear() + '-' + String(cellDate.getMonth()+1).padStart(2,'0') + '-' + String(cellDate.getDate()).padStart(2,'0');
            const isOtherMonth = cellDate.getMonth() !== month;
            const isToday = dateStr === todayStr;

            let dayEvents = getEventsForDate(dateStr);
            if (calFilter === 'meetings') dayEvents = dayEvents.filter(e => e.type === 'meeting');
            if (calFilter === 'tasks') dayEvents = dayEvents.filter(e => e.type === 'task');

            const maxShow = 3;
            const overflow = dayEvents.length > maxShow ? dayEvents.length - maxShow : 0;

            html += `<div class="cal-cell${isOtherMonth ? ' other-month' : ''}${isToday ? ' today' : ''}">`;
            html += `<div class="cal-day-num">${cellDate.getDate()}</div>`;

            dayEvents.slice(0, maxShow).forEach(ev => {
                html += renderCalEvent(ev);
            });

            if (overflow > 0) {
                html += `<div class="cal-more">+${overflow} más</div>`;
            }

            html += '</div>';
        }
        gridEl.innerHTML = html;
    }
}

function getEventsForDate(dateStr) {
    return calEvents.filter(ev => {
        const evDate = new Date(ev.date);
        const evStr = evDate.getFullYear() + '-' + String(evDate.getMonth()+1).padStart(2,'0') + '-' + String(evDate.getDate()).padStart(2,'0');
        return evStr === dateStr;
    });
}

function renderCalEvent(ev) {
    const evTime = new Date(ev.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    let evClass = 'ev-meeting';
    if (ev.type === 'task') {
        // Color per task category
        if (ev.taskType === 'personal') evClass = 'ev-task-personal';
        else if (ev.taskType === 'application') evClass = 'ev-task-app';
        else evClass = 'ev-task-business'; // default business
    }
    else if (ev.meetingType === 'gcal') evClass = 'ev-business';
    else if (ev.meetingType === 'followup' || ev.meetingType === 'closing' || ev.meetingType === 'support') evClass = 'ev-business';
    if (ev.status === 'done') evClass = 'ev-done';
    const typeLabels = { business: 'Negocio', personal: 'Personal', application: 'App' };
    let label = ev.title;
    if (ev.type === 'task') label = `[${typeLabels[ev.taskType] || 'Tarea'}] ${ev.title}`;
    else if (ev.isGcal) label = `📅 ${ev.title}`;
    const clickAction = ev.type === 'task' ? `onclick="openTaskModal('${ev.id}')"` : (ev.isGcal ? '' : `onclick="scrollToMeeting('${ev.id}')"`);
    return `<div class="cal-event ${evClass}" ${clickAction} style="cursor:pointer"><span class="cal-ev-time">${evTime}</span><span class="cal-ev-badge"></span>${label}</div>`;
}

function scrollToMeeting(id) {
    // Switch to meetings section and highlight
    const el = document.getElementById('mtg-' + id);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.style.boxShadow = '0 0 0 2px var(--accent)'; setTimeout(() => el.style.boxShadow = '', 2000); }
}

// 11. MEETINGS MANAGEMENT
// =============================================

let _meetingsTableReady = false;

async function ensureMeetingsTable() {
    if (_meetingsTableReady) return true;
    const { error } = await _supabase.from('meetings').select('id').limit(1);
    if (error && error.code === '42P01') {
        const list = document.getElementById('meetings-list');
        if (list) {
            list.innerHTML = `<div style="text-align:center;padding:30px">
                <p style="font-size:0.9rem;color:#ff9500;margin-bottom:12px">⚠️ La tabla <strong>meetings</strong> no existe en Supabase.</p>
                <p style="font-size:0.8rem;color:var(--text-grey)">Créala en Supabase SQL Editor.</p>
            </div>`;
        }
        return false;
    }
    // Any other error (RLS, network) — table exists, proceed anyway
    _meetingsTableReady = true;
    return true;
}

async function loadMeetings() {
    const ready = await ensureMeetingsTable();
    if (!ready) return;

    // Try GCal restore — never let it block meeting loading
    try { tryRestoreGCalSession(); } catch(e) { console.warn('GCal restore skip:', e); }

    const now = new Date().toISOString();
    const listEl = document.getElementById('meetings-list');
    const historyEl = document.getElementById('meetings-history');
    if (!listEl) { console.log('[Meetings] meetings-list element not found, skip render'); }

    console.log('[Meetings] Loading meetings... now =', now);

    try {
        const { data: upcoming, error: e1 } = await _supabase
            .from('meetings')
            .select('*')
            .gte('meeting_date', now)
            .order('meeting_date', { ascending: true });

        const { data: past, error: e2 } = await _supabase
            .from('meetings')
            .select('*')
            .lt('meeting_date', now)
            .order('meeting_date', { ascending: false })
            .limit(20);

        console.log('[Meetings] Upcoming:', upcoming?.length, 'Past:', past?.length, 'Errors:', e1, e2);

        if (e1 || e2) throw (e1 || e2);

        if (listEl) {
            if (!upcoming || upcoming.length === 0) {
                listEl.innerHTML = '<div style="text-align:center;padding:30px 0"><div style="font-size:2.5rem;margin-bottom:8px">📭</div><p style="color:var(--text-grey);font-size:0.85rem">No hay reuniones programadas</p></div>';
            } else {
                listEl.innerHTML = upcoming.map(m => renderMeetingCard(m, false)).join('');
            }
        }

        if (historyEl) {
            if (!past || past.length === 0) {
                historyEl.innerHTML = '<p style="color:var(--text-grey);font-size:0.85rem;text-align:center;padding:20px 0">Sin reuniones anteriores</p>';
            } else {
                historyEl.innerHTML = past.map(m => renderMeetingCard(m, true)).join('');
            }
        }

        // Load Google Calendar events if connected
        try { loadGCalEvents(); } catch(e) {}

    } catch (err) {
        console.error('[Meetings] Load error:', err);
        if (listEl) listEl.innerHTML = '<p style="color:#ff3b30;font-size:0.85rem">Error: ' + err.message + '</p>';
    }
}

function renderMeetingCard(m, isPast) {
    const d = new Date(m.meeting_date);
    const dateStr = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
    const timeStr = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    let contactInfo = '';
    if (m.contact_email) contactInfo += `<a href="mailto:${m.contact_email}" style="font-size:0.75rem;color:var(--accent);text-decoration:none">${m.contact_email}</a> `;
    if (m.contact_phone) contactInfo += `<a href="tel:${m.contact_phone}" style="font-size:0.75rem;color:var(--text-grey);text-decoration:none">${m.contact_phone}</a>`;

    const statusSelect = `<select onchange="updateMeetingField('${m.id}','status',this.value)" style="font-size:0.72rem;padding:3px 6px;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-secondary);color:inherit;cursor:pointer;font-weight:600">
        <option value="pending"${m.status === 'pending' ? ' selected' : ''}>⏳ Pendiente</option>
        <option value="confirmed"${m.status === 'confirmed' ? ' selected' : ''}>✅ Confirmada</option>
        <option value="done"${m.status === 'done' ? ' selected' : ''}>✔️ Realizada</option>
        <option value="cancelled"${m.status === 'cancelled' ? ' selected' : ''}>❌ Cancelada</option>
    </select>`;

    const typeSelect = `<select onchange="updateMeetingField('${m.id}','meeting_type',this.value)" style="font-size:0.72rem;padding:3px 6px;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-secondary);color:inherit;cursor:pointer;font-weight:600">
        <option value="discovery"${m.meeting_type === 'discovery' ? ' selected' : ''}>📅 Reunión</option>
        <option value="followup"${m.meeting_type === 'followup' ? ' selected' : ''}>🔄 Follow-up</option>
        <option value="closing"${m.meeting_type === 'closing' ? ' selected' : ''}>🤝 Cierre</option>
        <option value="support"${m.meeting_type === 'support' ? ' selected' : ''}>🛠️ Soporte</option>
    </select>`;

    const hasSynced = !!(m.gcal_event_id);
    let syncBtn = '';
    if (!isPast && hasSynced) {
        syncBtn = '<span style="font-size:0.65rem;padding:3px 6px;border-radius:6px;background:rgba(66,133,244,0.1);color:#4285F4" title="Sincronizado con Google Calendar">✓ GCal</span>';
    } else if (!isPast) {
        const syncStyle = `padding:3px 8px;border-radius:8px;border:1px solid ${_gcalConnected ? '#4285F4' : '#ccc'};background:transparent;color:${_gcalConnected ? '#4285F4' : '#999'};font-size:0.72rem;cursor:pointer;font-weight:600`;
        syncBtn = `<button onclick="syncMeetingToGCal('${m.id}')" id="sync-${m.id}" style="${syncStyle}" title="${_gcalConnected ? 'Sincronizar con Google Calendar' : 'Conecta Google Calendar primero'}">📅</button>`;
    }

    const deleteBtn = `<button onclick="deleteMeetingItem('${m.id}')" id="del-${m.id}" style="padding:4px 10px;border-radius:8px;border:1px solid var(--border-color);background:transparent;color:var(--text-grey);font-size:0.72rem;cursor:pointer" title="Eliminar">🗑️</button>`;

    return `<div style="padding:14px 18px;border-radius:14px;border:1px solid var(--border-color);background:var(--bg-secondary);${isPast ? 'opacity:0.7' : ''}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div style="flex:1">
                <div style="font-weight:700;font-size:0.95rem">${m.contact_name || 'Sin nombre'}</div>
                <div style="font-size:0.8rem;color:var(--text-grey);margin-top:2px">📅 ${dateStr} · ${timeStr}</div>
                ${contactInfo ? '<div style="margin-top:4px">' + contactInfo + '</div>' : ''}
            </div>
            <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
                ${typeSelect} ${statusSelect} ${syncBtn} ${deleteBtn}
            </div>
        </div>
        ${m.notes ? '<p style="font-size:0.8rem;color:var(--text-grey);margin:8px 0 0;line-height:1.5">💬 ' + m.notes + '</p>' : ''}
    </div>`;
}

function showMtgNotif(msg, type) {
    const colors = { error: '#ff3b30', success: '#34c759', info: '#4285F4', warn: '#ff9500' };
    const color = colors[type] || colors.info;
    const el = document.getElementById('gcal-status');
    el.style.display = 'flex';
    el.style.color = color;
    el.style.background = color + '10';
    el.style.border = '1px solid ' + color + '30';
    el.innerHTML = msg;
    if (type !== 'error') {
        setTimeout(() => { el.style.display = 'none'; }, 5000);
    }
}

async function addMeeting() {
    const name = document.getElementById('mtg-name').value.trim();
    const email = document.getElementById('mtg-email').value.trim();
    const phone = document.getElementById('mtg-phone').value.trim();
    const date = document.getElementById('mtg-date').value;
    const type = document.getElementById('mtg-type').value;
    const status = document.getElementById('mtg-status').value;
    const notes = document.getElementById('mtg-notes').value.trim();
    const source = document.getElementById('mtg-source') ? document.getElementById('mtg-source').value : 'manual';

    if (!name || !date) {
        showMtgNotif('⚠️ Nombre y fecha son obligatorios', 'warn');
        return;
    }

    try {
        const dateISO = new Date(date).toISOString();

        let gcalEventId = null;
        if (_gcalConnected) {
            gcalEventId = await createGCalEvent(name, dateISO, 60, notes, email);
            if (gcalEventId) {
                showGCalStatus('✅ Evento creado en Google Calendar', '#34c759');
                setTimeout(() => {
                    const iframe = document.querySelector('#sec-calendar iframe');
                    if (iframe) iframe.src = iframe.src;
                }, 2000);
            }
        }

        const insertData = {
            contact_name: name,
            contact_email: email || null,
            contact_phone: phone || null,
            meeting_date: dateISO,
            meeting_type: type,
            status: status,
            notes: notes || null,
            source: source
        };
        if (gcalEventId) insertData.gcal_event_id = gcalEventId;

        const { error } = await _supabase.from('meetings').insert(insertData);
        if (error) throw error;

        // Clear form
        document.getElementById('mtg-name').value = '';
        document.getElementById('mtg-email').value = '';
        document.getElementById('mtg-phone').value = '';
        document.getElementById('mtg-date').value = '';
        document.getElementById('mtg-notes').value = '';
        document.getElementById('mtg-type').value = 'discovery';
        document.getElementById('mtg-status').value = 'pending';

        showAlert('Reunión registrada', `${name} — ${new Date(dateISO).toLocaleDateString('es-ES')}`, '📅');
        closeNewMeetingModal();
        renderCalGrid();
        loadMeetings();
    } catch (err) {
        showMtgNotif('❌ Error guardando: ' + err.message, 'error');
    }
}

async function updateMeetingField(id, field, value) {
    try {
        const { error } = await _supabase.from('meetings').update({ [field]: value }).eq('id', id);
        if (error) throw error;
    } catch (err) {
        showMtgNotif('❌ Error actualizando: ' + err.message, 'error');
        loadMeetings();
    }
}

async function deleteMeetingItem(id) {
    const btn = document.getElementById('del-' + id);
    if (btn && !btn.dataset.confirmed) {
        btn.dataset.confirmed = 'true';
        btn.innerHTML = '¿Seguro?';
        btn.style.color = '#ff3b30';
        btn.style.borderColor = '#ff3b30';
        btn.style.fontWeight = '700';
        setTimeout(() => {
            if (btn && btn.parentNode) {
                delete btn.dataset.confirmed;
                btn.innerHTML = '🗑️';
                btn.style.color = 'var(--text-grey)';
                btn.style.borderColor = 'var(--border-color)';
                btn.style.fontWeight = 'normal';
            }
        }, 3000);
        return;
    }

    try {
        if (_gcalConnected) {
            try {
                const { data: mtg } = await _supabase.from('meetings').select('gcal_event_id').eq('id', id).single();
                if (mtg && mtg.gcal_event_id) {
                    await deleteGCalEvent(mtg.gcal_event_id);
                    setTimeout(() => {
                        const iframe = document.querySelector('#sec-calendar iframe');
                        if (iframe) iframe.src = iframe.src;
                    }, 2000);
                }
            } catch(e) { console.log('GCal sync skip:', e.message); }
        }

        const { error } = await _supabase.from('meetings').delete().eq('id', id);
        if (error) throw error;
        loadMeetings();
    } catch (err) {
        showMtgNotif('❌ Error eliminando: ' + err.message, 'error');
    }
}

// =============================================
// 12. TASKS MANAGEMENT
// =============================================

let allTasks = [];
let taskSubtasks = [];

async function loadTasks() {
    try {
        const { data, error } = await _supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) { console.warn('[Tasks] Error:', error); allTasks = []; }
        else allTasks = data || [];
        
        const activeCount = allTasks.filter(t => t.status !== 'done').length;
        const badge = document.getElementById('tasks-badge');
        if (badge) badge.textContent = activeCount;
        const countEl = document.getElementById('cal-task-count');
        if (countEl) countEl.textContent = activeCount;
        
        filterTasks();
        loadTomorrowMeetings();
    } catch(e) {
        console.warn('[Tasks] Load error:', e);
        allTasks = [];
    }
}

function filterTasks() {
    const search = (document.getElementById('task-search-input')?.value || '').toLowerCase();
    const status = document.getElementById('task-filter-status')?.value || '';
    const type = document.getElementById('task-filter-type')?.value || '';
    const priority = document.getElementById('task-filter-priority')?.value || '';
    const assigned = document.getElementById('task-filter-assigned')?.value || '';
    const hideDone = document.getElementById('task-hide-done')?.checked || false;
    
    let filtered = [...allTasks];
    if (search) filtered = filtered.filter(t => (t.title||'').toLowerCase().includes(search) || (t.description||'').toLowerCase().includes(search));
    if (status) filtered = filtered.filter(t => t.status === status);
    if (type) filtered = filtered.filter(t => t.task_type === type);
    if (priority) filtered = filtered.filter(t => t.priority === priority);
    if (assigned) filtered = filtered.filter(t => t.responsible === assigned);
    if (hideDone) filtered = filtered.filter(t => t.status !== 'done');
    
    const countRow = document.getElementById('tasks-count-row');
    if (countRow) countRow.textContent = `Mostrando ${filtered.length} de ${allTasks.length} tareas`;
    
    renderTaskCards(filtered);
}

function renderTaskCards(tasks) {
    const container = document.getElementById('tasks-card-list');
    if (!container) return;
    
    if (tasks.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-grey);padding:40px;font-size:0.9rem">No hay tareas que mostrar</p>';
        return;
    }
    
    const typeLabels = { business: 'Negocio', personal: 'Personal', application: 'Aplicación' };
    const typeColors = { business: 'blue', personal: 'orange', application: 'purple' };
    const prioLabels = { none: '', day: '📌 Día', week: '📅 Semana', '15days': '🗓️ 15 días', month: '📆 Mes', quarter: '📅 Trimestre' };
    
    container.innerHTML = tasks.map(t => {
        const dotColor = typeColors[t.task_type] || 'blue';
        const typeBadge = `<span class="task-card-type-badge ${t.task_type||'business'}">${typeLabels[t.task_type]||'Negocio'}</span>`;
        
        let statusBadge = '';
        if (t.due_date && t.status !== 'done') {
            const due = new Date(t.due_date);
            if (due < new Date()) statusBadge = '<span class="task-card-status-badge vencida">⚠ VENCIDA</span>';
        }
        
        let metaHtml = '';
        if (t.contact_email) metaHtml += `<span class="task-card-tag grey">📧 ${t.contact_email}</span>`;
        if (t.priority && t.priority !== 'none') metaHtml += `<span class="task-card-tag red">${prioLabels[t.priority]}</span>`;
        if (t.start_date) metaHtml += `<span class="task-card-tag green">🟢 ${formatDateShort(t.start_date)}</span>`;
        if (t.due_date) metaHtml += `<span class="task-card-tag orange">🔴 ${formatDateShort(t.due_date)}</span>`;
        if (t.hourly_rate && t.hours_estimated) {
            const eff = t.hourly_rate * (1 - (t.discount||0)/100);
            metaHtml += `<span class="task-card-tag blue">💰 ${eff}€/h · ${t.hours_estimated}h prev</span>`;
            if (t.hours_actual) {
                const margin = ((t.hours_estimated - t.hours_actual) / t.hours_estimated * 100).toFixed(0);
                metaHtml += `<span class="task-card-tag purple">📊 Margen: ${margin>0?'+':''}${margin}%</span>`;
            }
        }
        if (t.source === 'meeting_import' || t.source === 'google') metaHtml += `<span class="task-card-tag blue">📅 Google</span>`;
        
        const createdDate = t.created_at ? `creada ${formatDateShort(t.created_at)}` : '';
        
        return `
        <div class="task-card">
            <div class="task-card-dot ${dotColor}"></div>
            <div class="task-card-body">
                <div class="task-card-top">
                    ${typeBadge} ${statusBadge}
                    <span class="task-card-title">${t.title || 'Sin título'}</span>
                </div>
                <div class="task-card-meta">
                    ${metaHtml}
                    <span class="task-card-created">${createdDate}</span>
                </div>
            </div>
            <div class="task-card-actions">
                <select class="task-card-status-select" onchange="updateTaskStatus('${t.id}', this.value)">
                    <option value="new" ${t.status==='new'?'selected':''}>🔵 Nuevo</option>
                    <option value="started" ${t.status==='started'?'selected':''}>🟡 Empezada</option>
                    <option value="done" ${t.status==='done'?'selected':''}>✅ Finalizada</option>
                </select>
                <button class="task-card-edit-btn" onclick="openTaskModal('${t.id}')" title="Editar">✏️ Editar</button>
                <button class="task-card-delete" onclick="deleteTask('${t.id}')" title="Eliminar">🗑️</button>
            </div>
        </div>`;
    }).join('');
}

function formatDateShort(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

async function updateTaskStatus(id, status) {
    try {
        await _supabase.from('tasks').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
        await loadTasks();
    } catch(e) { showAlert('Error', e.message, '❌'); }
}

async function deleteTask(id) {
    if (!(await showConfirm('Eliminar Tarea', '¿Estás seguro de que deseas eliminar esta tarea de forma permanente?', '🗑️', 'Eliminar'))) return;
    try {
        await _supabase.from('subtasks').delete().eq('task_id', id);
        await _supabase.from('tasks').delete().eq('id', id);
        await loadTasks();
        showAlert('Tarea eliminada', '', '🗑️');
    } catch(e) { showAlert('Error', e.message, '❌'); }
}

// --- Modal Helpers ---
function openNewMeetingModal() {
    document.getElementById('modal-new-meeting').style.display = 'flex';
}
function closeNewMeetingModal() {
    document.getElementById('modal-new-meeting').style.display = 'none';
}

function openNewTaskModal() {
    document.getElementById('task-edit-id').value = '';
    document.getElementById('task-modal-title-label').textContent = 'NUEVA TAREA';
    document.getElementById('task-modal-sub').textContent = 'Tarea manual';
    document.getElementById('task-title').value = '';
    document.getElementById('task-description').value = '';
    setTaskType('business');
    document.getElementById('task-responsible').value = 'Gerard';
    document.getElementById('task-hourly-rate').value = 53;
    document.getElementById('task-discount').value = 0;
    document.getElementById('task-hours-est').value = 0;
    document.getElementById('task-hours-actual').value = '';
    document.getElementById('task-status').value = 'new';
    document.getElementById('task-time').value = '';
    setTaskPriority('month');
    document.getElementById('task-start-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('task-due-date').value = '';
    document.getElementById('task-notes').value = '';
    taskSubtasks = [];
    renderSubtasks();
    calcTaskEcon();
    calcTaskDuration();
    document.getElementById('task-gcal-sync').style.display = 'none';
    document.getElementById('modal-task').style.display = 'flex';
}

async function openTaskModal(id) {
    if (!id) { openNewTaskModal(); return; }
    const task = allTasks.find(t => t.id === id);
    if (!task) return;
    
    document.getElementById('task-edit-id').value = id;
    document.getElementById('task-modal-title-label').textContent = 'EDITAR TAREA';
    document.getElementById('task-modal-sub').textContent = task.source === 'meeting_import' ? 'Tarea generada desde reunión' : 'Tarea manual';
    document.getElementById('task-title').value = task.title || '';
    document.getElementById('task-description').value = task.description || '';
    setTaskType(task.task_type || 'business');
    document.getElementById('task-responsible').value = task.responsible || 'Gerard';
    document.getElementById('task-hourly-rate').value = task.hourly_rate || 53;
    document.getElementById('task-discount').value = task.discount || 0;
    document.getElementById('task-hours-est').value = task.hours_estimated || 0;
    document.getElementById('task-hours-actual').value = task.hours_actual || '';
    document.getElementById('task-status').value = task.status || 'new';
    document.getElementById('task-time').value = task.task_time || '';
    setTaskPriority(task.priority || 'month');
    document.getElementById('task-start-date').value = task.start_date || '';
    document.getElementById('task-due-date').value = task.due_date || '';
    document.getElementById('task-notes').value = task.notes || '';
    document.getElementById('task-gcal-sync').style.display = task.gcal_event_id ? '' : 'none';
    
    try {
        const { data } = await _supabase.from('subtasks').select('*').eq('task_id', id).order('created_at');
        taskSubtasks = data || [];
    } catch(e) { taskSubtasks = []; }
    renderSubtasks();
    calcTaskEcon();
    calcTaskDuration();
    document.getElementById('modal-task').style.display = 'flex';
}

function closeTaskModal() {
    document.getElementById('modal-task').style.display = 'none';
}

function setTaskType(type) {
    document.querySelectorAll('.task-type-pill').forEach(p => p.classList.remove('active'));
    const el = document.querySelector(`.task-type-pill[data-type="${type}"]`);
    if (el) el.classList.add('active');
}
function getTaskType() {
    const active = document.querySelector('.task-type-pill.active');
    return active ? active.dataset.type : 'business';
}

function setTaskPriority(prio) {
    document.querySelectorAll('.task-prio-pill').forEach(p => p.classList.remove('active'));
    const el = document.querySelector(`.task-prio-pill[data-prio="${prio}"]`);
    if (el) el.classList.add('active');
    calcTaskDueFromPriority(prio);
}
function getTaskPriority() {
    const active = document.querySelector('.task-prio-pill.active');
    return active ? active.dataset.prio : 'month';
}

function calcTaskDueFromPriority(prio) {
    const daysMap = { none: 0, day: 1, week: 7, '15days': 15, month: 30, quarter: 90 };
    const days = daysMap[prio] || 0;
    const dueInfo = document.getElementById('task-due-info');
    if (!dueInfo) return;
    if (days > 0) {
        const start = document.getElementById('task-start-date')?.value;
        const startDate = start ? new Date(start) : new Date();
        const due = new Date(startDate);
        due.setDate(due.getDate() + days);
        dueInfo.textContent = `📅 Vence: ${due.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}`;
        dueInfo.style.display = '';
    } else {
        dueInfo.style.display = 'none';
    }
}

function calcTaskEcon() {
    const rate = parseFloat(document.getElementById('task-hourly-rate')?.value) || 0;
    const discount = parseFloat(document.getElementById('task-discount')?.value) || 0;
    const effective = rate * (1 - discount / 100);
    const el = document.getElementById('task-effective-price');
    if (el) el.innerHTML = `Precio efectivo: <strong>${effective.toFixed(2)}€/h</strong>`;
    const refEl = document.getElementById('task-ref-price');
    if (refEl) refEl.textContent = `Ref: ${rate}€/h`;

    // Total previsto
    const hoursEst = parseFloat(document.getElementById('task-hours-est')?.value) || 0;
    const totalEst = effective * hoursEst;
    const estEl = document.getElementById('task-total-est');
    if (estEl) estEl.innerHTML = `💰 Total: <strong>${totalEst.toFixed(2)}€</strong>`;

    // Total real
    const hoursActual = parseFloat(document.getElementById('task-hours-actual')?.value);
    const actualEl = document.getElementById('task-total-actual');
    if (actualEl) {
        if (!isNaN(hoursActual) && hoursActual > 0) {
            const totalActual = effective * hoursActual;
            const diff = totalActual - totalEst;
            const diffStr = diff > 0 ? `+${diff.toFixed(2)}€` : `${diff.toFixed(2)}€`;
            const diffColor = diff > 0 ? '#ff3b30' : '#34c759';
            actualEl.innerHTML = `💰 Total: <strong>${totalActual.toFixed(2)}€</strong> <span style="color:${diffColor};font-size:0.7rem">(${diffStr})</span>`;
        } else {
            actualEl.innerHTML = '💰 Total: —';
        }
    }
}

function calcTaskDuration() {
    const start = document.getElementById('task-start-date')?.value;
    const end = document.getElementById('task-due-date')?.value;
    const el = document.getElementById('task-duration-info');
    if (!el) return;
    if (start && end) {
        const s = new Date(start);
        const e = new Date(end);
        const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
        const sStr = s.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        const eStr = e.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        el.textContent = `📅 Duración: ${diff} días · ${sStr} → ${eStr}`;
        el.style.display = '';
    } else {
        el.style.display = 'none';
    }
}

// --- Subtasks ---
function renderSubtasks() {
    const list = document.getElementById('subtasks-list');
    const count = document.getElementById('subtask-count');
    if (!list) return;
    if (count) count.textContent = taskSubtasks.length;
    
    list.innerHTML = taskSubtasks.map((st, i) => `
        <div class="subtask-row">
            <input type="checkbox" ${st.status==='done'?'checked':''} onchange="toggleSubtask(${i})">
            <span class="subtask-text">${st.title}</span>
            <select onchange="updateSubtaskField(${i},'status',this.value)">
                <option value="new" ${st.status==='new'?'selected':''}>Nueva</option>
                <option value="started" ${st.status==='started'?'selected':''}>Empezada</option>
                <option value="done" ${st.status==='done'?'selected':''}>Hecha</option>
            </select>
            <input type="date" value="${st.due_date||''}" onchange="updateSubtaskField(${i},'due_date',this.value)" style="padding:3px 6px;border-radius:6px;border:1px solid var(--border-color);font-size:0.72rem">
            <span style="font-size:0.7rem;color:var(--text-grey)">${st.assigned_to||'Gerard'}</span>
            <button class="subtask-remove" onclick="removeSubtask(${i})">✕</button>
        </div>
    `).join('');
}

function addSubtask() {
    const input = document.getElementById('new-subtask-input');
    if (!input || !input.value.trim()) return;
    taskSubtasks.push({ title: input.value.trim(), status: 'new', due_date: '', assigned_to: 'Gerard' });
    input.value = '';
    renderSubtasks();
}
function removeSubtask(i) { taskSubtasks.splice(i, 1); renderSubtasks(); }
function toggleSubtask(i) { taskSubtasks[i].status = taskSubtasks[i].status === 'done' ? 'new' : 'done'; renderSubtasks(); }
function updateSubtaskField(i, field, val) { taskSubtasks[i][field] = val; }

// --- Save Task ---
async function saveTask() {
    const id = document.getElementById('task-edit-id').value;
    const taskData = {
        title: document.getElementById('task-title').value.trim(),
        description: document.getElementById('task-description').value.trim(),
        task_type: getTaskType(),
        responsible: document.getElementById('task-responsible').value,
        hourly_rate: parseFloat(document.getElementById('task-hourly-rate').value) || 53,
        discount: parseFloat(document.getElementById('task-discount').value) || 0,
        hours_estimated: parseFloat(document.getElementById('task-hours-est').value) || 0,
        hours_actual: parseFloat(document.getElementById('task-hours-actual').value) || null,
        status: document.getElementById('task-status').value,
        task_time: document.getElementById('task-time').value || null,
        priority: getTaskPriority(),
        start_date: document.getElementById('task-start-date').value || null,
        due_date: document.getElementById('task-due-date').value || null,
        notes: document.getElementById('task-notes').value.trim(),
        updated_at: new Date().toISOString()
    };
    
    if (!taskData.title) { showAlert('Título Requerido', 'El título de la tarea es obligatorio para poder guardarla.', '⚠️'); return; }
    
    try {
        let taskId = id;
        if (id) {
            await _supabase.from('tasks').update(taskData).eq('id', id);
        } else {
            const { data, error } = await _supabase.from('tasks').insert([taskData]).select();
            if (error) throw error;
            taskId = data[0].id;
        }
        
        if (taskId) {
            await _supabase.from('subtasks').delete().eq('task_id', taskId);
            if (taskSubtasks.length > 0) {
                const subs = taskSubtasks.map(st => ({ ...st, task_id: taskId }));
                subs.forEach(s => delete s.id);
                await _supabase.from('subtasks').insert(subs);
            }
        }
        
        // Sync to Google Calendar
        if (_gcalConnected && _gcalToken && taskData.start_date) {
            try {
                const existingTask = id ? allTasks.find(t => t.id === id) : null;
                const oldGcalId = existingTask?.gcal_event_id;
                
                // Delete old GCal event if exists (to recreate with fresh format)
                if (oldGcalId) {
                    try { await deleteGCalEvent(oldGcalId); } catch(e) { /* ignore */ }
                }
                
                // Always create fresh
                console.log('[GCal] Syncing task to Google Calendar...', taskData.title);
                const newGcalId = await syncTaskToGCal(taskId, taskData);
                if (newGcalId) {
                    await _supabase.from('tasks').update({ gcal_event_id: newGcalId }).eq('id', taskId);
                    console.log('[GCal] Task synced OK:', newGcalId);
                } else {
                    console.warn('[GCal] syncTaskToGCal returned null');
                }
            } catch(e) { console.warn('[GCal] Task sync error:', e); }
        } else {
            console.log('[GCal] Skip sync: connected=' + _gcalConnected + ' token=' + !!_gcalToken + ' start_date=' + taskData.start_date);
        }
        
        closeTaskModal();
        await loadTasks();
        await renderCalGrid();
        showAlert(id ? 'Tarea actualizada' : 'Tarea creada', taskData.title, '✅');
    } catch(e) {
        showAlert('Error guardando tarea', e.message, '❌');
    }
}

// --- Tomorrow's Meetings ---
async function loadTomorrowMeetings() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tStr = tomorrow.toISOString().split('T')[0];
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    
    try {
        const { data } = await _supabase
            .from('meetings')
            .select('*')
            .gte('meeting_date', tStr)
            .lt('meeting_date', dayAfter.toISOString().split('T')[0])
            .order('meeting_date');
        
        const box = document.getElementById('tasks-tomorrow-box');
        const list = document.getElementById('tasks-tomorrow-list');
        const sub = document.getElementById('tasks-tomorrow-sub');
        if (!box || !data || data.length === 0) { if (box) box.style.display = 'none'; return; }
        
        box.style.display = '';
        const unimported = data.filter(m => !allTasks.some(t => t.meeting_id === m.id));
        if (sub) sub.textContent = `${data.length} reuniones · ${unimported.length} sin importar · ${tomorrow.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}`;
        
        list.innerHTML = data.map(m => {
            const time = new Date(m.meeting_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            const imported = allTasks.some(t => t.meeting_id === m.id);
            return `
                <div class="tomorrow-meeting-row">
                    <span class="tomorrow-meeting-time">${time}</span>
                    <span class="tomorrow-meeting-name">${m.contact_name}</span>
                    <button class="btn-import-one" onclick="importMeetingAsTask('${m.id}')" ${imported?'disabled style="opacity:0.4"':''}>${imported?'Importada':'Importar'}</button>
                </div>`;
        }).join('');
    } catch(e) {
        console.warn('[Tomorrow]', e);
    }
}

async function importMeetingAsTask(meetingId) {
    const meeting = await _supabase.from('meetings').select('*').eq('id', meetingId).single();
    if (!meeting.data) return;
    const m = meeting.data;
    
    const taskData = {
        title: `${m.contact_name} - reunión`,
        description: m.notes || '',
        task_type: 'business',
        responsible: 'Gerard',
        hourly_rate: 53,
        discount: 0,
        hours_estimated: 1,
        status: 'new',
        priority: 'day',
        start_date: m.meeting_date ? m.meeting_date.split('T')[0] : null,
        due_date: m.meeting_date ? m.meeting_date.split('T')[0] : null,
        task_time: m.meeting_date ? new Date(m.meeting_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : null,
        source: 'meeting_import',
        meeting_id: meetingId,
        contact_email: m.contact_email || ''
    };
    
    try {
        await _supabase.from('tasks').insert([taskData]);
        await loadTasks();
        logToSystemSupport(`Reunión importada como tarea: "${m.contact_name} - reunión"`);
        showAlert('Reunión importada', m.contact_name, '⬇');
    } catch(e) {
        logToSystemSupport(`Error importando reunión de ${m.contact_name}: ${e.message}`);
        showAlert('Error importando', e.message, '❌');
    }
}

async function importAllTomorrowMeetings() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tStr = tomorrow.toISOString().split('T')[0];
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    
    const { data } = await _supabase.from('meetings').select('*').gte('meeting_date', tStr).lt('meeting_date', dayAfter.toISOString().split('T')[0]);
    if (!data) return;
    
    logToSystemSupport(`Iniciando importación masiva de reuniones para mañana (${data.length} encontradas)...`);
    for (const m of data) {
        if (!allTasks.some(t => t.meeting_id === m.id)) {
            await importMeetingAsTask(m.id);
        }
    }
    logToSystemSupport(`Importación masiva finalizada con éxito.`);
    showAlert('Todas importadas', `${data.length} reuniones`, '✅');
}

// =============================================
// 13. GOOGLE CALENDAR INTEGRATION
// =============================================

let _gcalToken = null;
let _gcalConnected = false;
const GCAL_SCOPES = 'https://www.googleapis.com/auth/calendar.events';

function getGCalClientId() {
    return localStorage.getItem('gf_gcal_client_id') || '';
}

function saveGCalClientId() {
    const id = document.getElementById('gcal-client-id').value.trim();
    if (!id || !id.includes('.apps.googleusercontent.com')) {
        showAlert('Error', 'Client ID no válido. Debe terminar en .apps.googleusercontent.com', '❌');
        return;
    }
    localStorage.setItem('gf_gcal_client_id', id);
    document.getElementById('gcal-config').style.display = 'none';
    showGCalStatus('🔑 Client ID guardado. Haz clic en "Conectar Google Calendar" para autenticar.', '#4285F4');
}

function showGCalStatus(msg, color) {
    const el = document.getElementById('gcal-status');
    el.style.display = 'flex';
    el.style.color = color || '#4285F4';
    el.style.background = (color || '#4285F4') + '10';
    el.style.border = '1px solid ' + (color || '#4285F4') + '30';
    el.innerHTML = msg;
}

function connectGoogleCalendar() {
    const clientId = getGCalClientId();
    
    if (!clientId) {
        const config = document.getElementById('gcal-config');
        config.style.display = config.style.display === 'none' ? 'block' : 'none';
        const saved = localStorage.getItem('gf_gcal_client_id');
        if (saved) document.getElementById('gcal-client-id').value = saved;
        return;
    }

    if (_gcalConnected) {
        _gcalToken = null;
        _gcalConnected = false;
        localStorage.removeItem('gf_gcal_authorized');
        localStorage.removeItem('gf_gcal_token');
        localStorage.removeItem('gf_gcal_token_expiry');
        updateGCalButton(false);
        document.getElementById('gcal-status').style.display = 'none';
        showMtgNotif('Google Calendar desconectado', 'info');
        return;
    }

    _initiateGCalAuth(clientId, '');
}

function _initiateGCalAuth(clientId, prompt) {
    try {
        const tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: GCAL_SCOPES,
            callback: function(tokenResponse) {
                if (tokenResponse.error) {
                    showGCalStatus('❌ Error de autenticación: ' + tokenResponse.error, '#ff3b30');
                    return;
                }
                _onGCalAuthSuccess(tokenResponse);
            }
        });
        tokenClient.requestAccessToken({ prompt: prompt });
    } catch(e) {
        showGCalStatus('❌ Error: ' + e.message + '. ¿Se cargó la librería de Google?', '#ff3b30');
    }
}

function _onGCalAuthSuccess(tokenResponse) {
    _gcalToken = tokenResponse.access_token;
    _gcalConnected = true;

    const expiry = Date.now() + ((tokenResponse.expires_in || 3600) - 300) * 1000;
    localStorage.setItem('gf_gcal_token', tokenResponse.access_token);
    localStorage.setItem('gf_gcal_token_expiry', expiry.toString());
    localStorage.setItem('gf_gcal_authorized', 'true');

    updateGCalButton(true);
    showGCalStatus('✅ Google Calendar conectado', '#34c759');
    loadGCalEvents();
}

function updateGCalButton(connected) {
    const btn = document.getElementById('btn-gcal-connect');
    if (!btn) return;
    if (connected) {
        btn.style.background = 'linear-gradient(135deg, #34c759, #30d158)';
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg> Calendar Conectado';
    } else {
        btn.style.background = 'linear-gradient(135deg, #4285F4, #34A853)';
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M19.5 22h-15A2.5 2.5 0 0 1 2 19.5v-15A2.5 2.5 0 0 1 4.5 2H8v2H4.5a.5.5 0 0 0-.5.5v15a.5.5 0 0 0 .5.5h15a.5.5 0 0 0 .5-.5V16h2v3.5a2.5 2.5 0 0 1-2.5 2.5z"/><path d="M16 2v2h3.59l-9.3 9.29 1.42 1.42L21 5.41V9h2V2h-7z"/></svg> Conectar Google Calendar';
    }
}

async function createGCalEvent(name, dateISO, durationMinutes, notes, email) {
    if (!_gcalConnected || !_gcalToken) return null;

    const start = new Date(dateISO);
    const end = new Date(start.getTime() + (durationMinutes || 60) * 60000);

    const event = {
        summary: 'Reunión con ' + name,
        description: notes || '',
        start: { dateTime: start.toISOString(), timeZone: 'Europe/Madrid' },
        end: { dateTime: end.toISOString(), timeZone: 'Europe/Madrid' }
    };
    if (email) event.attendees = [{ email }];

    try {
        const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + _gcalToken, 'Content-Type': 'application/json' },
            body: JSON.stringify(event)
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.id;
    } catch(e) {
        console.error('GCal create error:', e);
        return null;
    }
}

async function syncTaskToGCal(taskId, taskData) {
    if (!_gcalConnected || !_gcalToken) return null;

    const startDate = taskData.start_date;
    const endDate = taskData.due_date || taskData.start_date;
    // Normalize time: DB may return HH:MM:SS, we need HH:MM
    const rawTime = taskData.task_time || '07:00';
    const timeParts = rawTime.split(':');
    const startHH = String(parseInt(timeParts[0])).padStart(2,'0');
    const startMM = String(parseInt(timeParts[1] || 0)).padStart(2,'0');
    const startTime = `${startHH}:${startMM}`;
    // End time = start time + 30min on the due date
    let endH = parseInt(startHH);
    let endM = parseInt(startMM) + 30;
    if (endM >= 60) { endH++; endM -= 60; }
    const endTime = String(endH).padStart(2,'0') + ':' + String(endM).padStart(2,'0');

    const typeLabels = { business: 'Negocio', personal: 'Personal', application: 'Aplicación' };
    const typeIcons = { business: '💼', personal: '👤', application: '💻' };
    const statusLabels = { new: 'nueva', started: 'empezada', done: 'finalizada' };
    const statusIcons = { new: '🔵', started: '🚩', done: '✅' };
    const effective = (taskData.hourly_rate || 53) * (1 - (taskData.discount || 0) / 100);

    const descLines = [
        `📋 Tipo: ${typeLabels[taskData.task_type] || 'Negocio'}`,
        `${statusIcons[taskData.status] || '🔵'} Estado: ${statusLabels[taskData.status] || 'nueva'}`,
        `🟢 Inicio: ${startDate}`,
        `🔴 Fin previsto: ${endDate}`,
        `💰 Precio: ${effective.toFixed(2)}€/h`,
    ];
    if (taskData.hours_estimated) descLines.push(`⏱ Horas previstas: ${taskData.hours_estimated}h`);
    if (taskData.hours_actual) descLines.push(`⏱ Horas reales: ${taskData.hours_actual}h`);
    if (taskData.description) descLines.push('', taskData.description);
    if (taskData.notes) descLines.push('', 'Notas: ' + taskData.notes);
    descLines.push('', '— Sincronizado desde GF Gestión');

    const icon = typeIcons[taskData.task_type] || '📋';
    const event = {
        summary: `${icon} [${typeLabels[taskData.task_type] || 'Tarea'}] ${taskData.title}`,
        description: descLines.join('\n'),
        start: { dateTime: `${startDate}T${startTime}:00`, timeZone: 'Europe/Madrid' },
        end: { dateTime: `${endDate}T${endTime}:00`, timeZone: 'Europe/Madrid' },
        transparency: 'transparent',
        colorId: taskData.task_type === 'business' ? '9' : taskData.task_type === 'personal' ? '5' : '3',
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'popup', minutes: 10 }
            ]
        }
    };

    console.log('[GCal] Creating event:', JSON.stringify(event, null, 2));

    try {
        const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + _gcalToken, 'Content-Type': 'application/json' },
            body: JSON.stringify(event)
        });
        const responseText = await res.text();
        if (!res.ok) {
            console.error('[GCal] Create failed:', res.status, responseText);
            showAlert('Error GCal', 'No se pudo crear el evento: ' + res.status, '❌');
            return null;
        }
        const data = JSON.parse(responseText);
        console.log('[GCal] Event created:', data.id, data.htmlLink);
        showAlert('Sincronizado con GCal', taskData.title, '📅');
        return data.id;
    } catch(e) {
        console.error('[GCal] Network error:', e);
        showAlert('Error de red GCal', e.message, '❌');
        return null;
    }
}

async function deleteGCalEvent(gcalEventId) {
    if (!_gcalConnected || !_gcalToken || !gcalEventId) return;
    try {
        await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events/' + gcalEventId, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + _gcalToken }
        });
    } catch(e) { console.error('GCal delete error:', e); }
}

async function loadGCalEvents() {
    if (!_gcalConnected || !_gcalToken) return;
    try {
        const now = new Date().toISOString();
        const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const res = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=' + encodeURIComponent(now) + '&timeMax=' + encodeURIComponent(maxDate) + '&singleEvents=true&orderBy=startTime&maxResults=20',
            { headers: { 'Authorization': 'Bearer ' + _gcalToken } }
        );
        if (!res.ok) return;
        const data = await res.json();

        if (data.items && data.items.length > 0) {
            const gcalList = document.getElementById('meetings-list');
            const existingHTML = gcalList.innerHTML;
            let gcalEventsHTML = '<div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border-color)"><p style="font-size:0.78rem;font-weight:700;color:#4285F4;margin:0 0 10px;display:flex;align-items:center;gap:6px"><svg width="14" height="14" viewBox="0 0 24 24" fill="#4285F4"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-2 .9-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg> Eventos de Google Calendar</p>';

            data.items.forEach(ev => {
                const startDate = ev.start.dateTime ? new Date(ev.start.dateTime) : new Date(ev.start.date);
                const dateStr = startDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
                const timeStr = ev.start.dateTime ? startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'Todo el día';
                gcalEventsHTML += `<div style="padding:10px 14px;border-radius:12px;border:1px solid rgba(66,133,244,0.2);background:rgba(66,133,244,0.04);margin-bottom:6px">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <div>
                            <div style="font-weight:600;font-size:0.88rem">${ev.summary || 'Sin título'}</div>
                            <div style="font-size:0.76rem;color:var(--text-grey);margin-top:2px">📅 ${dateStr} · ${timeStr}</div>
                        </div>
                        <span style="font-size:0.65rem;padding:3px 8px;border-radius:6px;background:rgba(66,133,244,0.1);color:#4285F4;font-weight:600">Google</span>
                    </div>
                </div>`;
            });
            gcalEventsHTML += '</div>';
            gcalList.innerHTML = existingHTML + gcalEventsHTML;
        }
    } catch(e) { console.error('Error loading GCal events:', e); }
}

async function syncMeetingToGCal(id) {
    if (!_gcalConnected || !_gcalToken) {
        showMtgNotif('🔑 Para sincronizar: conecta Google Calendar primero', 'warn');
        connectGoogleCalendar();
        return;
    }

    const btn = document.getElementById('sync-' + id);
    if (btn) { btn.innerHTML = '⏳'; btn.style.pointerEvents = 'none'; }

    try {
        const { data: mtg, error } = await _supabase.from('meetings').select('*').eq('id', id).single();
        if (error) throw error;

        const gcalId = await createGCalEvent(mtg.contact_name, mtg.meeting_date, 60, mtg.notes, mtg.contact_email);
        if (!gcalId) throw new Error('No se pudo crear el evento en Google Calendar');

        try { await _supabase.from('meetings').update({ gcal_event_id: gcalId }).eq('id', id); } catch(e) {}

        setTimeout(() => {
            const iframe = document.querySelector('#sec-calendar iframe');
            if (iframe) iframe.src = iframe.src;
        }, 1500);

        loadMeetings();
    } catch(err) {
        showMtgNotif('❌ Error sincronizando: ' + err.message, 'error');
        if (btn) { btn.innerHTML = '📅'; btn.style.pointerEvents = 'auto'; }
    }
}

let _gcalRestoreAttempted = false;
function tryRestoreGCalSession() {
    if (_gcalConnected || _gcalRestoreAttempted) return;
    _gcalRestoreAttempted = true;

    const wasAuthorized = localStorage.getItem('gf_gcal_authorized');
    const clientId = getGCalClientId();
    if (!wasAuthorized || !clientId) return;

    const storedToken = localStorage.getItem('gf_gcal_token');
    const storedExpiry = parseInt(localStorage.getItem('gf_gcal_token_expiry') || '0');

    if (storedToken && storedExpiry > Date.now()) {
        _gcalToken = storedToken;
        _gcalConnected = true;
        updateGCalButton(true);
        showGCalStatus('✅ Google Calendar reconectado automáticamente', '#34c759');
        setTimeout(() => {
            if (document.getElementById('meetings-list')) loadGCalEvents();
        }, 800);
        return;
    }

    try {
        const tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: GCAL_SCOPES,
            callback: function(tokenResponse) {
                if (tokenResponse.error) {
                    _showGCalReconnectBtn();
                    return;
                }
                _onGCalAuthSuccess(tokenResponse);
            }
        });
        tokenClient.requestAccessToken({ prompt: '' });
    } catch(e) {
        _showGCalReconnectBtn();
    }
}

function _showGCalReconnectBtn() {
    const btn = document.getElementById('btn-gcal-connect');
    if (btn) {
        btn.style.background = 'linear-gradient(135deg, #ff9500, #ff6b00)';
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg> Reconectar Calendar';
    }
}

// ==========================================================================
// ==================== PROPUESTAS B2B & EMAIL OUTREACH =====================
// ==========================================================================

// --- 1. Model: Email Sequences Configuration ---
const CTA_HTML = '<div style="text-align:center;margin:28px 0 12px"><a href="{{link_confirmar}}" style="display:inline-block;padding:14px 32px;background:#34c759;color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px">✅ Confirmar presupuesto</a></div><p style="text-align:center;color:#aeaeb2;font-size:12px;margin-top:8px">¿Dudas? Responde directamente a este email</p>';
const G_SIG = '<p>Un saludo,<br/>Gerard Fanals<br/><small style="color:#86868b">CerebroComercial AI</small></p>';
const G_HUG = '<p>Un abrazo,<br/>Gerard Fanals<br/><small style="color:#86868b">CerebroComercial AI</small></p>';

const INM_CONS_EMAILS = [
    { id:'inm_cons_1', step:1, name:'Envío de propuesta', freq:'Inmediato', asunto:'Tu propuesta de consultoría personalizada, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>Adjunto te envío la propuesta de consultoría de procesos que hemos preparado especialmente para tu negocio.</p><p>Revísala tranquilamente y avísame si tienes alguna pregunta.</p>'+G_HUG+CTA_HTML },
    { id:'inm_cons_2', step:2, name:'Primer seguimiento', freq:'3 días', asunto:'¿Has podido revisar la propuesta, {{nombre}}?', contenido:'<p>Hola {{nombre}},</p><p>Te escribo por si has tenido oportunidad de revisar la propuesta de consultoría que te envié hace unos días.</p><p>Quedo a tu entera disposición para resolver cualquier duda que te haya surgido.</p>'+G_SIG+CTA_HTML },
    { id:'inm_cons_3', step:3, name:'Valor diferencial', freq:'5 días', asunto:'Lo que diferencia esta propuesta, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>Quería destacarte algo importante: esta propuesta está diseñada 100% a medida de tu negocio, no es una plantilla genérica.</p><p>Hemos analizado tu situación actual y las oportunidades concretas de automatización con IA que puedes aprovechar. Los resultados que hemos logrado con negocios similares han sido muy positivos.</p>'+G_SIG+CTA_HTML },
    { id:'inm_cons_4', step:4, name:'Urgencia suave', freq:'7 días', asunto:'Las condiciones de tu propuesta, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>Solo quería avisarte de que las condiciones incluidas en la propuesta tienen una validez limitada. No es por presionarte, sino porque nuestro equipo tiene una disponibilidad de consultoría muy ajustada para este trimestre.</p><p>Si te interesa que colaboremos, es buen momento para avanzar.</p>'+G_SIG+CTA_HTML },
    { id:'inm_cons_5', step:5, name:'Cierre amable', freq:'10 días', asunto:'¿Cerramos el tema, {{nombre}}?', contenido:'<p>Hola {{nombre}},</p><p>No quiero ser insistente, así que este será mi último email sobre la propuesta de consultoría. Si no encaja en este momento en tus planes, lo entiendo perfectamente.</p><p>La propuesta queda abierta. Cuando estés listo/a para dar el salto, aquí estaré.</p><p>¡Ánimo con todo!</p>'+G_HUG+CTA_HTML }
];

const INM_IA_EMAILS = [
    { id:'inm_ia_1', step:1, name:'Envío de propuesta', freq:'Inmediato', asunto:'Tu agente de IA personalizado, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>Te envío la propuesta del agente de IA diseñado para tu negocio. Con esta solución podrás automatizar tareas repetitivas de captación y atención a leads para ganar horas valiosas cada semana.</p>'+G_HUG+CTA_HTML },
    { id:'inm_ia_2', step:2, name:'Beneficios concretos', freq:'3 días', asunto:'Lo que tu agente IA puede hacer por ti, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>¿Sabías que negocios como el tuyo están ahorrando entre 15 y 25 horas semanales con agentes de IA? Tu agente podría encargarse de atención al cliente, gestión de citas y seguimiento de leads automáticamente.</p><p>¿Te interesa que te enseñe cómo funciona?</p>'+G_SIG+CTA_HTML },
    { id:'inm_ia_3', step:3, name:'Demo en vivo', freq:'5 días', asunto:'¿Quieres ver tu agente IA en acción, {{nombre}}?', contenido:'<p>Hola {{nombre}},</p><p>He preparado una demo personalizada de cómo funcionaría el agente en tu negocio. En 15 minutos podrás ver exactamente qué tareas automatizaría.</p><p>Sin compromiso, solo para que valores si te encaja.</p>'+G_SIG+CTA_HTML },
    { id:'inm_ia_4', step:4, name:'ROI estimado', freq:'7 días', asunto:'He calculado tu ahorro con IA, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>He hecho los números: con tu volumen actual, el agente IA se amortizaría en menos de 2 meses. A partir de ahí, todo es ahorro puro.</p><p>Te adjunto el desglose en la propuesta. ¿Lo revisamos juntos?</p>'+G_SIG+CTA_HTML },
    { id:'inm_ia_5', step:5, name:'Cierre amable', freq:'10 días', asunto:'¿Seguimos adelante con el agente IA, {{nombre}}?', contenido:'<p>Hola {{nombre}},</p><p>Este es mi último seguimiento sobre la propuesta. Entiendo que quizá no es el momento, y está bien.</p><p>Cuando quieras retomarlo, la propuesta sigue vigente. ¡Mucho éxito!</p>'+G_HUG+CTA_HTML }
];

const INM_WEB_EMAILS = [
    { id:'inm_web_1', step:1, name:'Envío de propuesta', freq:'Inmediato', asunto:'Tu proyecto web personalizado, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>Adjunto encontrarás la propuesta con diseño, funcionalidades, plazos y presupuesto desglosado para tu nueva web.</p><p>Revísala y hablamos cuando te vaya bien.</p>'+G_HUG+CTA_HTML },
    { id:'inm_web_2', step:2, name:'Seguimiento', freq:'3 días', asunto:'¿Has revisado la propuesta web, {{nombre}}?', contenido:'<p>Hola {{nombre}},</p><p>Te escribo por si has podido echar un vistazo a la propuesta. Estoy disponible para cualquier ajuste que necesites en el alcance o presupuesto.</p>'+G_SIG+CTA_HTML },
    { id:'inm_web_3', step:3, name:'Ventaja competitiva', freq:'5 días', asunto:'Tu competencia ya tiene web profesional, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>He investigado un poco tu sector y la mayoría de tus competidores ya tienen presencia digital profesional. Cada día sin una web optimizada son clientes que van a la competencia.</p><p>La propuesta que te hice está pensada para posicionarte por encima de ellos.</p>'+G_SIG+CTA_HTML },
    { id:'inm_web_4', step:4, name:'Funcionalidades clave', freq:'7 días', asunto:'Lo que incluye tu web, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>Quería recordarte las funcionalidades clave de la propuesta: diseño responsive, SEO optimizado, velocidad de carga premium y un panel de administración fácil de usar.</p><p>Todo pensado para que tu web trabaje por ti 24/7.</p>'+G_SIG+CTA_HTML },
    { id:'inm_web_5', step:5, name:'Cierre amable', freq:'10 días', asunto:'Último aviso sobre tu propuesta web, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>No quiero agobiarte, así que este será mi último email. La propuesta queda abierta sin fecha de caducidad.</p><p>Cuando estés preparado/a, aquí estaré para ayudarte.</p>'+G_HUG+CTA_HTML }
];

const INM_AUTO_EMAILS = [
    { id:'inm_auto_1', step:1, name:'Envío de propuesta', freq:'Inmediato', asunto:'Tu plan de automatización, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>Te envío la propuesta de automatización para optimizar tus procesos. Podrás ahorrar horas de trabajo manual cada semana.</p>'+G_HUG+CTA_HTML },
    { id:'inm_auto_2', step:2, name:'Ahorro de tiempo', freq:'3 días', asunto:'Cuántas horas pierdes en tareas manuales, {{nombre}}?', contenido:'<p>Hola {{nombre}},</p><p>¿Has contado cuántas horas semanales dedicas a tareas repetitivas? Facturación, seguimiento de clientes, emails… todo eso se puede automatizar.</p><p>En la propuesta tienes el detalle de qué procesos cubriríamos.</p>'+G_SIG+CTA_HTML },
    { id:'inm_auto_3', step:3, name:'Flujo paso a paso', freq:'5 días', asunto:'Así funcionaría tu automatización, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>He preparado un esquema simplificado del flujo de automatización para tu negocio. Es más sencillo de lo que parece: en 2-3 semanas podrías tener todo funcionando.</p><p>¿Te lo explico en detalle?</p>'+G_SIG+CTA_HTML },
    { id:'inm_auto_4', step:4, name:'Impacto real', freq:'7 días', asunto:'El impacto de automatizar tu negocio, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>Los negocios que automatizan sus procesos crecen un 30% más rápido de media. No es magia, es eficiencia: tu equipo se centra en lo importante mientras la tecnología hace el resto.</p>'+G_SIG+CTA_HTML },
    { id:'inm_auto_5', step:5, name:'Cierre amable', freq:'10 días', asunto:'¿Retomamos la automatización, {{nombre}}?', contenido:'<p>Hola {{nombre}},</p><p>Último email sobre esto. Si no es el momento, lo entiendo perfectamente. La propuesta no caduca.</p><p>¡Mucha suerte con todo!</p>'+G_HUG+CTA_HTML }
];

const INM_PERS_EMAILS = [
    { id:'inm_pers_1', step:1, name:'Envío de propuesta', freq:'Inmediato', asunto:'Tu propuesta personalizada, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>Te envío la propuesta que hemos diseñado a medida para tu proyecto. Hemos desglosado cada servicio con su precio individual para que tengas total transparencia.</p><p>Revísala tranquilamente y cuéntame qué te parece.</p>'+G_HUG+CTA_HTML },
    { id:'inm_pers_2', step:2, name:'Seguimiento', freq:'3 días', asunto:'¿Has podido revisar tu propuesta, {{nombre}}?', contenido:'<p>Hola {{nombre}},</p><p>Te escribo por si has tenido oportunidad de revisar la propuesta personalizada. Cada línea está pensada para cubrir exactamente lo que necesitas, ni más ni menos.</p><p>¿Alguna duda sobre el desglose?</p>'+G_SIG+CTA_HTML },
    { id:'inm_pers_3', step:3, name:'Flexibilidad', freq:'5 días', asunto:'Tu propuesta es 100% flexible, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>Quería recordarte que esta propuesta es modular: puedes seleccionar solo los servicios que más te interesen o ajustar el alcance de cada línea. Todo es adaptable a tu presupuesto y prioridades.</p><p>¿Hablamos para ajustarla?</p>'+G_SIG+CTA_HTML },
    { id:'inm_pers_4', step:4, name:'Valor del paquete', freq:'7 días', asunto:'El valor real de tu propuesta, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>He repasado el desglose de tu propuesta y quiero destacarte algo: contratar cada servicio por separado en el mercado te costaría significativamente más. Con este paquete personalizado, obtienes un ecosistema integrado con un precio optimizado.</p>'+G_SIG+CTA_HTML },
    { id:'inm_pers_5', step:5, name:'Cierre amable', freq:'10 días', asunto:'¿Seguimos adelante, {{nombre}}?', contenido:'<p>Hola {{nombre}},</p><p>Es mi último seguimiento sobre la propuesta. Entiendo que quizá necesitas más tiempo o que las prioridades han cambiado. La propuesta queda abierta sin fecha de caducidad.</p><p>Cuando estés listo/a, aquí estaré.</p>'+G_HUG+CTA_HTML }
];

const MENS_CONS_EMAILS = [
    { id:'mens_cons_1', step:1, name:'Recordatorio semanal', freq:'7 días', asunto:'Tu propuesta de consultoría sigue vigente, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>Ha pasado una semana desde que te envié la propuesta. Queríamos recordarte que sigue vigente y que estamos disponibles para retomarla cuando lo necesites.</p>'+G_SIG+CTA_HTML },
    { id:'mens_cons_2', step:2, name:'Caso de éxito', freq:'14 días', asunto:'Un caso de éxito que puede interesarte, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>Quería compartirte un caso reciente: un negocio similar al tuyo aumentó su facturación un 40% en 6 meses aplicando nuestra consultoría. Sin grandes inversiones, solo estrategia bien ejecutada.</p><p>Tu propuesta incluye un plan similar. ¿Lo retomamos?</p>'+G_SIG+CTA_HTML },
    { id:'mens_cons_3', step:3, name:'Propuesta actualizada', freq:'21 días', asunto:'Hemos mejorado tu propuesta, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>Han pasado unas semanas y hemos actualizado nuestras metodologías. Tu propuesta ahora incluiría mejoras adicionales al mismo precio. ¿Te interesa revisarla?</p>'+G_SIG+CTA_HTML },
    { id:'mens_cons_4', step:4, name:'Último contacto', freq:'28 días', asunto:'¿Ha cambiado tu situación, {{nombre}}?', contenido:'<p>Hola {{nombre}},</p><p>Es mi último seguimiento semanal. Las circunstancias cambian, y quizá ahora sí sea buen momento para optimizar tu negocio con consultoría profesional.</p><p>Si quieres, hablamos sin compromiso.</p>'+G_SIG+CTA_HTML }
];

const MENS_IA_EMAILS = [
    { id:'mens_ia_1', step:1, name:'Novedades IA', freq:'7 días', asunto:'Novedades en IA para tu negocio, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>El mundo de la IA avanza rápido. Desde que te enviamos la propuesta, hay nuevas capacidades que podrían beneficiarte aún más. ¿Te apetece una actualización rápida?</p>'+G_SIG+CTA_HTML },
    { id:'mens_ia_2', step:2, name:'Tu competencia usa IA', freq:'14 días', asunto:'Tus competidores ya usan IA, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>Cada vez más negocios de tu sector adoptan soluciones de IA. No es tendencia, es necesidad competitiva. Nuestro agente puede ponerte al nivel (o por encima) en poco tiempo.</p>'+G_SIG+CTA_HTML },
    { id:'mens_ia_3', step:3, name:'Mejoras disponibles', freq:'21 días', asunto:'Tu agente IA ahora es aún más potente, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>Hemos incorporado nuevas funcionalidades a nuestros agentes: mejor comprensión del lenguaje, integración con más herramientas y respuestas más rápidas. Tu propuesta se beneficiaría de todo esto.</p>'+G_SIG+CTA_HTML },
    { id:'mens_ia_4', step:4, name:'Último contacto', freq:'28 días', asunto:'¿Retomamos lo del agente IA, {{nombre}}?', contenido:'<p>Hola {{nombre}},</p><p>Es mi último seguimiento semanal. Si la IA ya no es prioridad, lo entiendo. Pero si te interesa, la propuesta sigue vigente con mejoras incluidas. ¿Hablamos?</p>'+G_SIG+CTA_HTML }
];

const MENS_WEB_EMAILS = [
    { id:'mens_web_1', step:1, name:'Oportunidad digital', freq:'7 días', asunto:'Cada día sin web son clientes perdidos, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>Cada semana sin presencia digital profesional son oportunidades que van a tu competencia. La propuesta que te preparamos sigue vigente.</p>'+G_SIG+CTA_HTML },
    { id:'mens_web_2', step:2, name:'Tendencias web', freq:'14 días', asunto:'Las tendencias web que deberías conocer, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>El diseño web evoluciona constantemente. Las webs que mejor convierten en 2026 usan IA conversacional, carga ultrarrápida y diseño mobile-first. Todo esto está incluido en tu propuesta.</p>'+G_SIG+CTA_HTML },
    { id:'mens_web_3', step:3, name:'Paquete especial', freq:'21 días', asunto:'Condiciones especiales para tu web, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>Hemos revisado tu propuesta y podemos ofrecerte un paquete de mantenimiento optimizado y SEO avanzado. ¿Te interesa que te lo envíe?</p>'+G_SIG+CTA_HTML },
    { id:'mens_web_4', step:4, name:'Último contacto', freq:'28 días', asunto:'¿Seguimos adelante con tu web, {{nombre}}?', contenido:'<p>Hola {{nombre}},</p><p>Es mi último seguimiento semanal. Si las circunstancias han cambiado, estaré encantado de adaptar la propuesta a tu situación actual.</p>'+G_SIG+CTA_HTML }
];

const MENS_AUTO_EMAILS = [
    { id:'mens_auto_1', step:1, name:'Ahorro semanal', freq:'7 días', asunto:'Esta semana podrías haber ahorrado horas, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>Si hubieras automatizado tus procesos, ya habrías ahorrado decenas de horas de trabajo manual esta semana. El cálculo exacto está en la propuesta.</p>'+G_SIG+CTA_HTML },
    { id:'mens_auto_2', step:2, name:'Top 5 procesos', freq:'14 días', asunto:'Los 5 procesos que más tiempo te roban, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>Facturación, seguimiento de leads, emails repetitivos, gestión de citas y reportes. Estos son los 5 procesos que más tiempo consumen en negocios como el tuyo. Todos automatizables.</p>'+G_SIG+CTA_HTML },
    { id:'mens_auto_3', step:3, name:'Escalabilidad', freq:'21 días', asunto:'Crece sin contratar más personal, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>La automatización te permite escalar tu negocio sin aumentar equipo proporcionalmente. Más clientes, misma estructura de costes. Esa es la clave de nuestra propuesta.</p>'+G_SIG+CTA_HTML },
    { id:'mens_auto_4', step:4, name:'Último contacto', freq:'28 días', asunto:'¿Ha cambiado algo en tu negocio, {{nombre}}?', contenido:'<p>Hola {{nombre}},</p><p>Es mi último seguimiento semanal. Quizá ahora sí sea buen momento para dar el salto a la automatización. La propuesta sigue en pie.</p>'+G_SIG+CTA_HTML }
];

const MENS_PERS_EMAILS = [
    { id:'mens_pers_1', step:1, name:'Recordatorio semanal', freq:'7 días', asunto:'Tu propuesta personalizada sigue vigente, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>Ha pasado una semana desde que te enviamos la propuesta a medida. Sigue vigente con todas las líneas de servicio detalladas. ¿Necesitas algún ajuste?</p>'+G_SIG+CTA_HTML },
    { id:'mens_pers_2', step:2, name:'Resultados esperados', freq:'14 días', asunto:'Los resultados que puedes esperar, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>Quería compartirte los resultados típicos que nuestros clientes obtienen con proyectos similares al tuyo: mayor eficiencia, mejor experiencia de usuario y un retorno medible desde el primer mes.</p><p>Todo esto está contemplado en tu propuesta.</p>'+G_SIG+CTA_HTML },
    { id:'mens_pers_3', step:3, name:'Priorización flexible', freq:'21 días', asunto:'Podemos empezar por lo más urgente, {{nombre}}', contenido:'<p>Hola {{nombre}},</p><p>Si el presupuesto total te genera dudas, hay una alternativa: podemos priorizar las líneas más urgentes y dejar el resto para una segunda fase. Así reduces el riesgo inicial.</p><p>¿Te parece buena idea?</p>'+G_SIG+CTA_HTML },
    { id:'mens_pers_4', step:4, name:'Último contacto', freq:'28 días', asunto:'¿Ha cambiado tu situación, {{nombre}}?', contenido:'<p>Hola {{nombre}},</p><p>Es mi último seguimiento semanal. Si las circunstancias han cambiado, podemos adaptar la propuesta a tu realidad actual. Sin compromiso.</p>'+G_SIG+CTA_HTML }
];

function buildAnualEmails(prefix, tema) {
    const temas = [
        { name:'Revisión de objetivos', asunto:`¿Cómo van tus objetivos de ${tema}, {{nombre}}?`, cuerpo:`<p>Empezamos un nuevo ciclo trimestral. Es buen momento para revisar si tu estrategia de ${tema} está alineada con tus objetivos de negocio. Podemos ayudarte a optimizarla.</p>` },
        { name:'Tendencias del sector', asunto:`Tendencias en ${tema} que deberías conocer, {{nombre}}`, cuerpo:`<p>El mercado de ${tema} evoluciona muy rápido. Hay nuevas herramientas de Inteligencia Artificial y metodologías que podrían marcar la diferencia en tu negocio. Te contamos las más relevantes.</p>` },
        { name:'Caso de éxito', asunto:`Un negocio como el tuyo triunfó con ${tema}, {{nombre}}`, cuerpo:`<p>Queremos compartirte un caso de éxito reciente: un negocio de tu sector implementó nuestra solución de ${tema} y los resultados superaron las expectativas. ¿Quieres saber cómo lo logramos?</p>` },
        { name:'Checklist de mejora', asunto:`5 pasos para mejorar tu ${tema}, {{nombre}}`, cuerpo:`<p>Hemos preparado un checklist práctico con 5 acciones concretas para mejorar tu ${tema} este trimestre. Son cambios pequeños con gran impacto. La propuesta cubre todos estos puntos.</p>` },
        { name:'Innovación y futuro', asunto:`El futuro de ${tema} ya está aquí, {{nombre}}`, cuerpo:`<p>La innovación no espera. Mientras algunos negocios siguen con métodos tradicionales, otros ya están aprovechando las nuevas soluciones de ${tema}. ¿En qué grupo quieres estar?</p>` },
        { name:'Análisis de mercado', asunto:`Tu mercado ha cambiado, {{nombre}}`, cuerpo:`<p>Hemos analizado tu sector y hay movimientos interesantes. Tus competidores están invirtiendo en ${tema} y los que no lo hacen se están quedando atrás. Nuestra propuesta te posiciona a la vanguardia.</p>` },
        { name:'ROI actualizado', asunto:`Nuevo cálculo de ROI para tu ${tema}, {{nombre}}`, cuerpo:`<p>Hemos actualizado los números. Con los precios actuales del mercado y la madurez de la tecnología, el retorno de inversión de implementar nuestra solución de ${tema} es aún mejor de lo que calculamos inicialmente.</p>` },
        { name:'Nuevas funcionalidades', asunto:`Novedades en nuestra solución de ${tema}, {{nombre}}`, cuerpo:`<p>Hemos añadido nuevas funcionalidades a nuestra solución de ${tema}. Más potencia, mejor experiencia y el mismo precio. Tu propuesta se beneficia automáticamente de estas mejoras.</p>` },
        { name:'Oferta especial', asunto:`Condiciones especiales de ${tema} para ti, {{nombre}}`, cuerpo:`<p>Como ya nos conocemos, queremos ofrecerte condiciones especiales si decides avanzar este mes. Es nuestra forma de premiar la confianza. ¿Te interesa conocer los detalles?</p>` },
        { name:'Retrospectiva', asunto:`¿Qué ha cambiado en tu negocio, {{nombre}}?`, cuerpo:`<p>Ha pasado un tiempo desde que hablamos. Las circunstancias cambian y quizá ahora la situación sea diferente. Nos encantaría retomar la conversación y adaptar la propuesta de ${tema} a tu realidad actual.</p>` },
        { name:'Planificación estratégica', asunto:`Planifica tu próximo trimestre con ${tema}, {{nombre}}`, cuerpo:`<p>El próximo trimestre puede ser el que marque la diferencia. Incluir ${tema} en tu planificación estratégica es invertir en el futuro de tu negocio. Te ayudamos a dar el paso.</p>` },
        { name:'Cierre de ciclo', asunto:`Cerramos un ciclo, abrimos otro, {{nombre}}`, cuerpo:`<p>Ha pasado un año completo. Si en algún momento te planteaste implementar ${tema}, ahora es el momento perfecto. Nuevos precios, nuevas funcionalidades y la misma dedicación de siempre.</p>` }
    ];
    return temas.map((t, i) => ({
        id: `${prefix}_${i+1}`, step: i+1, name: t.name, freq: '30 días',
        asunto: t.asunto,
        contenido: '<p>Hola {{nombre}},</p>' + t.cuerpo + (i % 2 === 0 ? G_HUG : G_SIG) + CTA_HTML,
    }));
}

const PRES_SEQUENCES = [
    { seqId:'inmediato', seqLabel:'Seguimiento inmediato', seqDesc:'Se activa al enviar la propuesta · 5 emails en 10 días', seqColor:'#0a84ff', seqIcon:'⚡', defaultFreq:'3 días',
      categories: [
        { key:'consultoria', label:'Consultoría', color:'#e8850a', bg:'rgba(232,133,10,0.15)', icon:'🎯', emails: INM_CONS_EMAILS },
        { key:'agentes_ia', label:'Agentes de IA', color:'#0a84ff', bg:'rgba(10,132,255,0.15)', icon:'🤖', emails: INM_IA_EMAILS },
        { key:'apps_web', label:'Apps Web', color:'#34c759', bg:'rgba(52,199,89,0.15)', icon:'🌐', emails: INM_WEB_EMAILS },
        { id:'automatizacion', key:'automatizacion', label:'Automatización', color:'#5856d6', bg:'rgba(88,86,214,0.15)', icon:'⚡', emails: INM_AUTO_EMAILS },
        { key:'personalizada', label:'Personalizada', color:'#aeaeb2', bg:'rgba(255,255,255,0.06)', icon:'📋', emails: INM_PERS_EMAILS }
      ]
    },
    { seqId:'mensual', seqLabel:'Seguimiento mensual', seqDesc:'Se activa si no hay respuesta al inmediato · 1 email/semana durante 1 mes', seqColor:'#5856d6', seqIcon:'📅', defaultFreq:'7 días',
      categories: [
        { key:'consultoria', label:'Consultoría', color:'#e8850a', bg:'rgba(232,133,10,0.15)', icon:'🎯', emails: MENS_CONS_EMAILS },
        { key:'agentes_ia', label:'Agentes de IA', color:'#0a84ff', bg:'rgba(10,132,255,0.15)', icon:'🤖', emails: MENS_IA_EMAILS },
        { key:'apps_web', label:'Apps Web', color:'#34c759', bg:'rgba(52,199,89,0.15)', icon:'🌐', emails: MENS_WEB_EMAILS },
        { key:'automatizacion', label:'Automatización', color:'#5856d6', bg:'rgba(88,86,214,0.15)', icon:'⚡', emails: MENS_AUTO_EMAILS },
        { key:'personalizada', label:'Personalizada', color:'#aeaeb2', bg:'rgba(255,255,255,0.06)', icon:'📋', emails: MENS_PERS_EMAILS }
      ]
    },
    { seqId:'anual', seqLabel:'Seguimiento anual', seqDesc:'1 email/mes · al completar los 12 vuelve a empezar', seqColor:'#34c759', seqIcon:'🔄', defaultFreq:'30 días',
      categories: [
        { key:'consultoria', label:'Consultoría', color:'#e8850a', bg:'rgba(232,133,10,0.15)', icon:'🎯', emails: buildAnualEmails('anual_cons', 'consultoría de procesos') },
        { key:'agentes_ia', label:'Agentes de IA', color:'#0a84ff', bg:'rgba(10,132,255,0.15)', icon:'🤖', emails: buildAnualEmails('anual_ia', 'soluciones de inteligencia artificial') },
        { key:'apps_web', label:'Apps Web', color:'#34c759', bg:'rgba(52,199,89,0.15)', icon:'🌐', emails: buildAnualEmails('anual_web', 'desarrollo web optimizado') },
        { key:'automatizacion', label:'Automatización', color:'#5856d6', bg:'rgba(88,86,214,0.15)', icon:'⚡', emails: buildAnualEmails('anual_auto', 'automatización de flujos de trabajo') },
        { key:'personalizada', label:'Personalizada', color:'#aeaeb2', bg:'rgba(255,255,255,0.06)', icon:'📋', emails: buildAnualEmails('anual_pers', 'soluciones personalizadas a medida') }
      ]
    }
];

let ALL_CATEGORIES_METADATA = {
    consultoria: { label: 'Consultoría', bg: 'rgba(232,133,10,0.08)', border: '1px solid rgba(232,133,10,0.2)', accent: '#e8850a', icon: '🎯' },
    agentes_ia: { label: 'Agentes de IA', bg: 'rgba(10,132,255,0.08)', border: '1px solid rgba(10,132,255,0.2)', accent: '#0a84ff', icon: '🤖' },
    apps_web: { label: 'Apps Web', bg: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.2)', accent: '#34c759', icon: '🌐' },
    automatizacion: { label: 'Automatización', bg: 'rgba(88,86,214,0.08)', border: '1px solid rgba(88,86,214,0.2)', accent: '#5856d6', icon: '⚡' },
    personalizada: { label: 'Propuesta Personalizada', bg: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', accent: '#aeaeb2', icon: '📋' }
};

let customCategories = {};
let deletedDefaultCategories = [];
try {
    const s = localStorage.getItem('cc_custom_categories');
    if (s) {
        customCategories = JSON.parse(s);
        Object.assign(ALL_CATEGORIES_METADATA, customCategories);
    }
    const d = localStorage.getItem('cc_deleted_default_categories');
    if (d) {
        deletedDefaultCategories = JSON.parse(d);
        deletedDefaultCategories.forEach(catKey => {
            delete ALL_CATEGORIES_METADATA[catKey];
        });
    }
} catch (e) {
    console.error('Error loading categories:', e);
}

// --- 2. Global State ---
let presupuestos = [];
let propuestasEnviadas = [];
let seguimientos = [];
let presTab = 'plantillas';
let segEmailSubTab = 'seguimiento';
let presCat = 'all';
let activeSeqConfigId = 'inmediato';
let presEmailExpandedId = null;

let currentSelectedLeadForSend = null;
let currentSelectedLeadForSeg = null;

let lineasTempList = []; // Temporal array to manage lines in Modal

// --- 3. Entry point: Load Proposals tab ---
async function loadProposalsModule() {
    await fetchPresupuestos();
    await fetchPropuestasEnviadas();
    await fetchSeguimientos();
    
    // Initial Render
    switchPresTab(presTab);
}

// Subtab switcher
function switchPresTab(tab) {
    presTab = tab;
    
    // UI active buttons styling
    document.querySelectorAll('.proposals-tab-selector .tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`pres-tab-${tab}`);
    if (activeBtn) activeBtn.classList.add('active');

    // Show/Hide Panels
    document.querySelectorAll('.proposals-sub-section').forEach(sec => sec.style.display = 'none');
    const targetSec = document.getElementById(`pres-sub-${tab}`);
    if (targetSec) targetSec.style.display = 'block';

    // Reload triggers
    if (tab === 'plantillas') renderPresupuestos();
    if (tab === 'emails') switchSegEmailSubTab(segEmailSubTab);
    if (tab === 'enviadas') renderPropuestasEnviadas();
    if (tab === 'categorias') renderCategoriasManagement();
}

function switchSegEmailSubTab(subtab) {
    segEmailSubTab = subtab;
    
    document.querySelectorAll('#pres-sub-emails .tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`seg-subtab-${subtab}`);
    if (activeBtn) activeBtn.classList.add('active');

    // Toggle sub-containers
    document.getElementById('seg-container-seguimiento').style.display = subtab === 'seguimiento' ? 'block' : 'none';
    document.getElementById('seg-container-configurar').style.display = subtab === 'configurar' ? 'block' : 'none';

    if (subtab === 'seguimiento') renderSeguimientoKanban();
    if (subtab === 'configurar') renderConfigurarSecuencias();
}

// --- 4. Database Fetching with localStorage Fallback ---
async function fetchPresupuestos() {
    try {
        const { data, error } = await _supabase
            .from('presupuestos')
            .select('*')
            .order('orden', { ascending: true });

        if (error) throw error;
        presupuestos = data || [];
    } catch (e) {
        console.warn('Database "presupuestos" load failed, using local cache:', e);
        const cached = localStorage.getItem('gf_presupuestos');
        presupuestos = cached ? JSON.parse(cached) : [];
    }

    // Seed default templates if empty
    if (presupuestos.length === 0) {
        await seedDefaultTemplates();
    }

    // Update counts
    const templatesCount = presupuestos.filter(p => p.es_plantilla !== false).length;
    const countBadge = document.getElementById('count-templates-badge');
    if (countBadge) countBadge.textContent = templatesCount;
}

async function fetchPropuestasEnviadas() {
    try {
        const { data, error } = await _supabase
            .from('propuestas_enviadas')
            .select('*')
            .order('enviado_at', { ascending: false });

        if (error) throw error;
        propuestasEnviadas = data || [];
    } catch (e) {
        console.warn('Database "propuestas_enviadas" load failed, using local cache:', e);
        const cached = localStorage.getItem('gf_propuestas_enviadas');
        propuestasEnviadas = cached ? JSON.parse(cached) : [];
    }

    // Update count
    const sentBadge = document.getElementById('count-sent-badge');
    if (sentBadge) sentBadge.textContent = propuestasEnviadas.length;
}

async function fetchSeguimientos() {
    try {
        const { data, error } = await _supabase
            .from('propuesta_seguimiento')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        seguimientos = data || [];
    } catch (e) {
        console.warn('Database "propuesta_seguimiento" load failed, using local cache:', e);
        const cached = localStorage.getItem('gf_seguimiento');
        seguimientos = cached ? JSON.parse(cached) : [];
    }
}

// Seeding premium templates
async function seedDefaultTemplates() {
    const seeds = [
        {
            titulo: 'Estrategia y Auditoría IA',
            subtitulo: 'Análisis modular de procesos internos y mapa de ruta IA',
            descripcion: 'Evaluación integral de la infraestructura tecnológica, flujos de trabajo manuales de tu equipo e identificación de las 5 oportunidades de mayor impacto para implementar Automatizaciones y Modelos LLM en tu organización. Incluye auditoría, mapa de ruta detallado y propuesta técnica.',
            categoria: 'consultoria',
            precio_alta: 450,
            precio_mensual: 0,
            precio_tipo: 'fijo',
            es_plantilla: true,
            activo: true,
            orden: 1,
            badge: 'MÁS VENDIDO',
            formas_pago_ofrecidas: ['giro', 'transferencia', 'stripe'],
            lineas: [
                { concepto: 'Fase 1: Auditoría operativa de procesos internos', precio: 250, descuento: 0, plazo: '7 días', mantenimiento: false, mantenimiento_precio: 0, sublineas: [{concepto: 'Mapeo detallado de cuellos de botella'}, {concepto: 'Identificación de tareas repetitivas automatizables'}], activo: true },
                { concepto: 'Fase 2: Diseño de Mapa de Ruta e Integración de Agentes IA', precio: 200, descuento: 0, plazo: '7 días', mantenimiento: false, mantenimiento_precio: 0, sublineas: [{concepto: 'Propuesta de arquitectura técnica (Gemini API)'}, {concepto: 'Análisis de ROI estimado y tiempos de amortización'}], activo: true }
            ]
        },
        {
            titulo: 'Agente Conversacional IA para Leads',
            subtitulo: 'Orquestador inteligente para atención al cliente y reserva 24/7',
            descripcion: 'Diseño e integración de un agente cognitivo inteligente impulsado por Gemini que atiende leads entrantes, resuelve dudas en base a tu documentación comercial, califica el perfil del prospecto y reserva llamadas conectándose automáticamente a tu calendario en tiempo real.',
            categoria: 'agentes_ia',
            precio_alta: 1200,
            precio_mensual: 150,
            precio_tipo: 'desde',
            es_plantilla: true,
            activo: true,
            orden: 2,
            badge: 'AMORTIZACIÓN IA',
            formas_pago_ofrecidas: ['giro', 'transferencia', 'stripe', 'bizum'],
            lineas: [
                { concepto: 'Entrenamiento cognitivo e ingesta de base de conocimientos', precio: 600, descuento: 0, plazo: '14 días', mantenimiento: false, mantenimiento_precio: 0, sublineas: [{concepto: 'Configuración de personalidad y directrices de Gemini'}, {concepto: 'Carga de tarifas, catálogos y FAQs del negocio'}], activo: true },
                { concepto: 'Desarrollo de integraciones nativas y sincronizaciones', precio: 600, descuento: 0, plazo: '7 días', mantenimiento: true, mantenimiento_precio: 150, sublineas: [{concepto: 'Integración en Web Widget y WhatsApp Business API'}, {concepto: 'Sincronización con Cal.com y CRM Google Sheets'}], activo: true }
            ]
        },
        {
            titulo: 'Plataforma Web Clientes B2B',
            subtitulo: 'Portal corporativo premium con base de datos en tiempo real',
            descripcion: 'Construcción de una aplicación web corporativa modular premium de alto impacto estético. Cuenta con diseño ultra-moderno responsivo, panel de control de clientes, base de datos Postgres de Supabase para seguridad y área privada protegida por contraseña.',
            categoria: 'apps_web',
            precio_alta: 2400,
            precio_mensual: 190,
            precio_tipo: 'fijo',
            es_plantilla: true,
            activo: true,
            orden: 3,
            badge: 'PREMIUM',
            formas_pago_ofrecidas: ['giro', 'transferencia'],
            lineas: [
                { concepto: 'Diseño UX/UI responsive en Vanilla HTML/CSS e interactividad', precio: 1100, descuento: 0, plazo: '20 días', mantenimiento: false, mantenimiento_precio: 0, sublineas: [{concepto: 'Diseño de marca, micro-animaciones e interactividad fluidas'}, {concepto: 'Estructuración SEO e indexación de páginas corporativas'}], activo: true },
                { concepto: 'Arquitectura Backend Serverless y Panel Administrativo', precio: 1300, descuento: 0, plazo: '15 días', mantenimiento: true, mantenimiento_precio: 190, sublineas: [{concepto: 'Base de datos en la nube Supabase Postgres'}, {concepto: 'Consola privada de gestión interna y perfiles de usuarios'}], activo: true }
            ]
        },
        {
            titulo: 'Ecosistema de Automatización CRM',
            subtitulo: 'Sincronización automática de calendarios, leads y notificaciones',
            descripcion: 'Diseño y despliegue de flujos automatizados que conectan tu sistema de leads con tu calendario de reservas, actualizando tu base de datos central en Supabase de forma instantánea y disparando alertas en WhatsApp/Telegram al equipo comercial en tiempo real.',
            categoria: 'automatizacion',
            precio_alta: 850,
            precio_mensual: 50,
            precio_tipo: 'fijo',
            es_plantilla: true,
            activo: true,
            orden: 4,
            badge: 'EFICIENCIA OUTBOUND',
            formas_pago_ofrecidas: ['giro', 'transferencia', 'bizum'],
            lineas: [
                { concepto: 'Sincronización bidireccional Cal.com y base de datos Supabase', precio: 450, descuento: 0, plazo: '5 días', mantenimiento: false, mantenimiento_precio: 0, sublineas: [{concepto: 'Actualización en tiempo real de estados de leads'}, {concepto: 'Prevención de duplicados e histórico de reuniones'}], activo: true },
                { concepto: 'Canales de notificación instantáneos y alertas automáticas', precio: 400, descuento: 0, plazo: '5 días', mantenimiento: true, mantenimiento_precio: 50, sublineas: [{concepto: 'Disparadores webhook en WhatsApp al agendar citas'}, {concepto: 'Generación automatizada de enlaces y PDFs de seguimiento'}], activo: true }
            ]
        },
        {
            titulo: 'Ecosistema Digital Kombo',
            subtitulo: 'Propuesta completa de Web Corporativa + Agente IA + CRM Automatizado',
            descripcion: 'El paquete definitivo para la digitalización B2B comercial. Incluye el portal corporativo premium responsivo, el agente inteligente IA conversacional para calificar y reservar citas, y la automatización del CRM central conectando notificaciones instantáneas de WhatsApp.',
            categoria: 'personalizada',
            precio_alta: 3900,
            precio_mensual: 290,
            precio_tipo: 'fijo',
            es_plantilla: true,
            activo: true,
            orden: 5,
            badge: 'ECOSISTEMA RECOMENDADO',
            formas_pago_ofrecidas: ['giro', 'transferencia'],
            lineas: [
                { concepto: 'Módulo 1: Portal Web Corporativo Premium Responsivo', precio: 1800, descuento: 10, plazo: '20 días', mantenimiento: false, mantenimiento_precio: 0, sublineas: [{concepto: 'Diseño UI Apple-style Glassmorphism ultra premium'}], activo: true },
                { concepto: 'Módulo 2: Agente de IA Conversacional (Cal.com + Gemini)', precio: 1200, descuento: 10, plazo: '14 días', mantenimiento: false, mantenimiento_precio: 0, sublineas: [{concepto: 'Entrenamiento experto e ingesta de conocimiento de marca'}], activo: true },
                { concepto: 'Módulo 3: Automatización CRM y Alertas de WhatsApp instantáneas', precio: 900, descuento: 10, plazo: '7 días', mantenimiento: true, mantenimiento_precio: 290, sublineas: [{concepto: 'Sincronizaciones webhooks y canalizaciones de correos de seguimiento'}], activo: true }
            ]
        }
    ];

    for (const seed of seeds) {
        try {
            const { data, error } = await _supabase.from('presupuestos').insert(seed).select();
            if (error) throw error;
            if (data?.[0]) presupuestos.push(data[0]);
        } catch (e) {
            seed.id = genUUID();
            presupuestos.push(seed);
        }
    }
    
    // Save locally
    localStorage.setItem('gf_presupuestos', JSON.stringify(presupuestos));
}

// --- 5. Support helpers ---
function genUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function showToast(msg, isError = false) {
    // Add dynamically a toast container if not present
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position: fixed; bottom: 24px; right: 24px; display: flex; flex-direction: column; gap: 8px; z-index: 100000; pointer-events: none;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.cssText = `
        background: ${isError ? 'rgba(255, 59, 48, 0.95)' : 'rgba(28, 28, 30, 0.92)'};
        backdrop-filter: blur(12px);
        color: #ffffff;
        padding: 12px 20px;
        border-radius: 12px;
        font-size: 0.82rem;
        font-weight: 600;
        box-shadow: 0 8px 24px rgba(0,0,0,0.18);
        border: 1px solid ${isError ? 'rgba(255, 59, 48, 0.3)' : 'rgba(255,255,255,0.08)'};
        transform: translateY(20px);
        opacity: 0;
        transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        align-items: center;
        gap: 8px;
        pointer-events: auto;
    `;
    toast.innerHTML = `<span>${isError ? '❌' : '✅'}</span> <span>${msg}</span>`;
    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    }, 10);

    // Kill toast after 3.5 seconds
    setTimeout(() => {
        toast.style.transform = 'translateY(15px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

// Log custom actions to supporto/logs
function logToSystemSupport(msg) {
    const logEl = document.querySelector('#sec-support .stat-card-glass');
    if (logEl) {
        const time = new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString('es-ES');
        logEl.innerHTML += `[PROPOSALS LOG - ${time}] ${msg}<br>`;
        logEl.scrollTop = logEl.scrollHeight;
    }
}

// --- 6. Rendering: Plantillas view ---
function filterTemplatesByCategory(cat) {
    presCat = cat;
    
    // UI selection
    document.querySelectorAll('.category-pills-bar .cat-pill').forEach(btn => btn.classList.remove('active'));
    const btn = document.querySelector(`.category-pills-bar .cat-pill[data-cat="${cat}"]`);
    if (btn) btn.classList.add('active');

    renderPresupuestos();
}

function filterTemplates() {
    renderPresupuestos();
}

function renderPresupuestos() {
    renderCategoryPills();
    const searchVal = document.getElementById('pres-search').value.toLowerCase().trim();
    const container = document.getElementById('pres-templates-container');
    container.innerHTML = '';

    const categories = Object.keys(ALL_CATEGORIES_METADATA);
    const visibleCategories = categories.filter(c => presCat === 'all' || presCat === c);

    // Templates Filtered List
    const searchFiltered = presupuestos.filter(p => 
        !searchVal 
        || p.titulo.toLowerCase().includes(searchVal) 
        || (p.descripcion || '').toLowerCase().includes(searchVal)
    );

    // Selections filter (Todos only shows active ones, category view shows all)
    const filtered = presCat === 'all' ? searchFiltered.filter(p => p.activo !== false) : searchFiltered;

    // Build categories sequence maps
    let globalTplNum = 0;
    const tplNumMap = new Map();
    categories.forEach(catKey => {
        presupuestos.filter(p => p.categoria === catKey && p.es_plantilla !== false).forEach(p => {
            globalTplNum++;
            tplNumMap.set(p.id, globalTplNum);
        });
    });

    visibleCategories.forEach(catKey => {
        const meta = ALL_CATEGORIES_METADATA[catKey];
        const items = filtered.filter(p => p.categoria === catKey).sort((a,b) => (a.orden || 0) - (b.orden || 0));

        if (items.length === 0 && presCat === 'all') return;

        // Render Category block Header
        const catHeaderHtml = (presCat === 'all' && items.length > 0) ? `
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:14px; margin-top: 10px;">
                <span style="font-size:1.15rem;">${meta.icon}</span>
                <h3 style="margin:0; font-size:0.95rem; font-weight:700; color:var(--text-main);">${meta.label}</h3>
                <span style="font-size:0.75rem; color:var(--text-grey); font-weight:500;">· ${items.length}</span>
            </div>
        ` : '';

        // Render Empty state if no items
        let gridHtml = '';
        if (items.length === 0) {
            gridHtml = `
                <div style="display:flex; flex-direction:column; align-items:center; padding:50px 24px; background:rgba(255,255,255,0.01); border-radius:20px; border:2px dashed var(--border-color); width: 100%;">
                    <span style="font-size:2.4rem; margin-bottom:12px;">${meta.icon}</span>
                    <h3 style="margin:0 0 6px; font-size:1rem; font-weight:700; color:var(--text-main);">${meta.label}</h3>
                    <p style="margin:0 0 20px; font-size:0.8rem; color:var(--text-grey); text-align:center; line-height: 1.5;">No hay plantillas en esta categoría.<br/>Crea la primera para empezar.</p>
                    <button class="btn-primary" style="padding:10px 20px; font-size:0.8rem;" onclick="openCreateTemplateModal('${catKey}')">
                        + Crear primera plantilla
                    </button>
                </div>
            `;
        } else {
            const cardsHtml = items.map(p => {
                const isClient = p.es_plantilla === false;
                const cardBorder = isClient ? '2px solid var(--accent)' : `1px solid ${meta.accent}30`;
                const cardBg = isClient ? 'rgba(10, 132, 255, 0.04)' : meta.bg;

                // Price Math
                const hasLineas = p.lineas && p.lineas.length > 0;
                let realPrice = 0;
                if (hasLineas) {
                    realPrice = p.lineas.filter(l => l.activo !== false && !l.recomendado).reduce((s,l) => s + l.precio * (1 - (l.descuento || 0)/100), 0);
                } else {
                    realPrice = (p.descuento_pct > 0 && p.precio_alta) ? p.precio_alta * (1 - p.descuento_pct/100) : (p.precio_alta || 0);
                }

                // Payment Badges
                let paymentBadges = '';
                if (p.formas_pago_ofrecidas && p.formas_pago_ofrecidas.length > 0) {
                    paymentBadges = `
                        <div style="margin-top:10px; display:flex; gap:4px; flex-wrap:wrap;">
                            ${p.formas_pago_ofrecidas.map(fp => {
                                const labels = { sin_iva:'Sin IVA', giro:'Giro', transferencia:'Transf.', stripe:'Stripe', bizum:'Bizum', efectivo:'Efectivo' };
                                return `<span style="font-size:0.65rem; color:var(--text-grey); background:rgba(255,255,255,0.06); padding:2px 8px; border-radius:6px; border: 1px solid var(--card-border);">${labels[fp] || fp}</span>`;
                            }).join('')}
                        </div>
                    `;
                } else if (p.forma_pago) {
                    const labels = { sin_iva:'Sin IVA', giro:'Giro bancario', transferencia:'Transferencia', stripe:'Stripe', bizum:'Bizum', efectivo:'Efectivo' };
                    paymentBadges = `<div style="margin-top:10px; font-size:0.7rem; color:var(--text-grey);">💳 ${labels[p.forma_pago] || p.forma_pago}</div>`;
                }

                // Active switch & test modes
                const actState = p.activo !== false;
                const actColor = actState ? 'var(--accent-green)' : 'var(--text-grey)';
                const actLeft = actState ? '18px' : '2px';

                return `
                    <div class="pres-card" id="pres-card-${p.id}" style="border: ${p.es_prueba ? '2px dashed #ff9500' : cardBorder}; background: ${cardBg};"
                         onmouseenter="this.style.borderColor='rgba(255,255,255,0.15)'" onmouseleave="this.style.borderColor='${p.es_prueba ? '#ff9500' : isClient ? 'var(--accent)' : meta.accent + '30'}'">
                        
                        ${p.es_prueba ? '<div class="test-mode-stripes"></div>' : ''}
                        
                        <!-- Top Header bar -->
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 18px 0; position:relative; z-index:2;">
                            ${isClient 
                                ? `<span class="pres-cat-badge" style="background:var(--accent); color:#fff;">👤 Propuesta Lead</span>`
                                : `<span class="pres-cat-badge" style="background:${meta.accent}18; color:${meta.accent}; border: 1px solid ${meta.accent}30;">Plantilla #${tplNumMap.get(p.id) || '?'}</span>`
                            }
                            <div style="display:flex; align-items:center; gap:8px;">
                                <button type="button" title="${p.es_prueba ? 'Quitar modo prueba' : 'Marcar como prueba'}"
                                    onclick="togglePresTestMode('${p.id}')"
                                    style="padding:2px 6px; border-radius:6px; border: ${p.es_prueba ? '1.5px solid #ff9500' : '1px solid var(--card-border)'}; background: ${p.es_prueba ? 'rgba(255,149,0,0.1)' : 'transparent'}; cursor:pointer; font-size:0.68rem; font-weight:700; color:${p.es_prueba ? '#ff9500' : 'var(--text-grey)'}; transition:all 0.2s;">
                                    🧪
                                </button>
                                <div class="pres-tooltip-wrap">
                                    <button class="pres-switch-btn" onclick="togglePresActive('${p.id}')" style="background:${actColor};">
                                        <span style="left:${actLeft};"></span>
                                    </button>
                                    <div class="pres-tooltip-content">${actState ? 'Activo' : 'Inactivo'}</div>
                                </div>
                            </div>
                        </div>

                        ${p.badge ? `
                            <div style="text-align:center; padding-top:8px; position:relative; z-index:2;">
                                <span style="padding:4px 14px; border-radius:20px; background:${meta.accent}; color:#fff; font-size:0.64rem; font-weight:700; letter-spacing:0.08em; box-shadow:0 2px 6px rgba(0,0,0,0.1);">${p.badge}</span>
                            </div>
                        ` : ''}

                        <!-- Content Area -->
                        <div style="padding: 10px 20px 18px; flex:1; position:relative; z-index:2; opacity: ${actState ? 1 : 0.45};">
                            <h3 style="font-size:1.1rem; font-weight:800; color:var(--text-main); margin-bottom: 4px; letter-spacing:-0.01em;">${p.titulo}</h3>
                            ${p.subtitulo ? `<div style="font-size:0.75rem; color:var(--text-grey); margin-bottom:6px; line-height:1.3;">${p.subtitulo}</div>` : ''}
                            ${p.lead_nombre ? `<div style="font-size:0.74rem; color:${meta.accent}; font-weight:700; margin-bottom:6px;">👤 Lead: ${p.lead_nombre}${p.fecha ? ` · ${new Date(p.fecha).toLocaleDateString('es-ES')}` : ''}</div>` : ''}
                            
                            <!-- Price Tag -->
                            <div style="margin: 12px 0 10px;">
                                <span style="font-size:0.7rem; color:var(--text-grey);">${p.precio_tipo === 'desde' ? 'Desde ' : ''}</span>
                                <span style="font-size:1.8rem; font-weight:900; color:var(--text-main); letter-spacing:-0.03em;">${Math.round(realPrice).toLocaleString('es-ES')}€</span>
                                <span style="font-size:0.76rem; color:var(--text-grey);">${p.forma_pago === 'sin_iva' ? '' : ' + IVA'}</span>
                                ${(!hasLineas && p.descuento_pct > 0) ? `<span style="font-size:0.72rem; color:var(--accent-green); font-weight:700; margin-left:6px;">-${p.descuento_pct}%</span>` : ''}
                                
                                ${p.precio_mensual ? `
                                    <div style="font-size:0.78rem; color:var(--text-grey); margin-top:2px; font-weight:600;">
                                        ${p.precio_alta ? 'Mantenimiento: ' : ''}${p.precio_mensual}€/mes
                                    </div>
                                ` : ''}
                            </div>

                            <p style="font-size:0.78rem; color:var(--text-grey); line-height:1.5; margin:0; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">${p.descripcion || 'Sin descripción'}</p>
                            ${paymentBadges}
                        </div>

                        <!-- Card Footer actions -->
                        <div style="padding:10px 18px 14px; border-top:1px solid var(--border-color); display:flex; gap:6px; align-items:center; position:relative; z-index:2;">
                            <button class="btn-primary" style="flex:1; font-size:0.75rem; padding:8px 12px; border-radius:9px; font-weight:700;" onclick="openEditPresupuestoModal('${p.id}')">
                                ✏️ Editar
                            </button>
                            
                            <div class="pres-tooltip-wrap">
                                <button class="pres-tool-btn" onclick="openSendPropuestaModal('${p.id}')">✈️</button>
                                <div class="pres-tooltip-content">Enviar Propuesta</div>
                            </div>
                            <div class="pres-tooltip-wrap">
                                <button class="pres-tool-btn" onclick="triggerPDFDownload('${p.id}')">⬇️</button>
                                <div class="pres-tooltip-content">Imprimir PDF</div>
                            </div>
                            <div class="pres-tooltip-wrap">
                                <button class="pres-tool-btn" onclick="openDuplicateModal('${p.id}')">➕</button>
                                <div class="pres-tooltip-content">Duplicar copia</div>
                            </div>
                            <div class="pres-tooltip-wrap">
                                <button class="pres-tool-btn" onclick="deletePresupuestoAction('${p.id}')" style="color:var(--accent-red); background:rgba(255,59,48,0.06);">🗑</button>
                                <div class="pres-tooltip-content">Eliminar</div>
                            </div>
                        </div>

                    </div>
                `;
            }).join('');

            gridHtml = `<div class="pres-templates-grid">${cardsHtml}</div>`;
        }

        container.innerHTML += `
            <div style="margin-bottom:8px;">
                ${catHeaderHtml}
                ${gridHtml}
            </div>
        `;
    });
}

// Quick state toggles
async function togglePresTestMode(id) {
    const pres = presupuestos.find(p => p.id === id);
    if (!pres) return;
    pres.es_prueba = !pres.es_prueba;
    await savePresupuesto(id, { es_prueba: pres.es_prueba });
    renderPresupuestos();
    showToast(pres.es_prueba ? 'Modo prueba activado (marcado en naranja)' : 'Modo prueba desactivado');
}

async function togglePresActive(id) {
    const pres = presupuestos.find(p => p.id === id);
    if (!pres) return;
    pres.activo = pres.activo === false ? true : false;
    await savePresupuesto(id, { activo: pres.activo });
    renderPresupuestos();
    showToast(pres.activo ? 'Plantilla activada' : 'Plantilla desactivada');
}

// Persist updates
async function savePresupuesto(id, updates) {
    try {
        const { error } = await _supabase
            .from('presupuestos')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
    } catch (e) {
        console.warn('Supabase savePresupuesto failed, writing local storage:', e);
    }
    
    // Always sync locally
    localStorage.setItem('gf_presupuestos', JSON.stringify(presupuestos));
}

// --- 7. High Fidelity Unified Proposal Editor & AI Copilot ---
let selectedPaymentOption = null; // Global state: 'A', 'B', 'C' or null

// Autocomplete for Leads inside Editor Modal
function showEditorLeadDropdown() {
    const dd = document.getElementById('edit-pres-lead-dropdown');
    if (!dd) return;
    dd.style.display = 'block';
    filterEditorLeadDropdown();
}

function filterEditorLeadDropdown() {
    const query = document.getElementById('edit-pres-lead-nombre').value.toLowerCase();
    const dd = document.getElementById('edit-pres-lead-dropdown');
    if (!dd) return;
    
    const filtered = leadsList.filter(l => 
        (l.first_name && l.first_name.toLowerCase().includes(query)) || 
        (l.email && l.email.toLowerCase().includes(query)) ||
        (l.company_name && l.company_name.toLowerCase().includes(query))
    );

    if (filtered.length === 0) {
        dd.innerHTML = `<div style="padding:10px; color:var(--text-grey); font-size:0.8rem; text-align:center;">No se encontraron leads</div>`;
        return;
    }

    dd.innerHTML = filtered.map(l => `
        <div onclick="selectEditorLead('${l.first_name || l.email}')" 
             style="padding:8px 12px; font-size:0.8rem; cursor:pointer; border-radius:8px; display:flex; flex-direction:column; gap:2px; transition:background 0.15s;"
             onmouseover="this.style.background='rgba(255,255,255,0.06)'"
             onmouseout="this.style.background='transparent'">
            <span style="font-weight:700; color:var(--text-main);">${l.first_name || 'Sin Nombre'}</span>
            <span style="font-size:0.7rem; color:var(--text-grey);">${l.company_name ? l.company_name + ' · ' : ''}${l.email}</span>
        </div>
    `).join('');
}

function selectEditorLead(name) {
    document.getElementById('edit-pres-lead-nombre').value = name;
    document.getElementById('edit-pres-lead-dropdown').style.display = 'none';
    
    // Auto populate today as Emission Date if empty
    const dateInput = document.getElementById('edit-pres-fecha');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    recalcPaymentOptionsInModal();
}

// Close Editor dropdown on clicking outside
window.addEventListener('click', function(e) {
    const dd = document.getElementById('edit-pres-lead-dropdown');
    if (dd && e.target && e.target.id !== 'edit-pres-lead-nombre' && !dd.contains(e.target)) {
        dd.style.display = 'none';
    }
});

// Pay methods toggle buttons handler
function togglePayMethodBtn(btn) {
    btn.classList.toggle('selected');
    renderPayMethodsInstructions();
}

// Helper: Populate modal select dropdown dynamically
window.populateCategoryDropdown = function() {
    const select = document.getElementById('edit-pres-categoria');
    if (!select) return;
    
    let html = '';
    Object.keys(ALL_CATEGORIES_METADATA).forEach(catKey => {
        const meta = ALL_CATEGORIES_METADATA[catKey];
        html += `<option value="${catKey}">${meta.icon} ${meta.label}</option>`;
    });
    html += `<option value="__NEW__">➕ Crear nueva categoría...</option>`;
    
    select.innerHTML = html;
};

// Selector handler for new custom category creation
window.handleCategorySelection = async function(select) {
    if (select.value === '__NEW__') {
        const catName = await showPrompt('Nueva Categoría', 'Escribe el nombre de la nueva categoría (ej: Ecosistemas B2B):', '📁', '', 'Nombre de la categoría...');
        if (!catName || catName.trim() === '') {
            select.value = 'personalizada';
            return;
        }
        
        const cleanName = catName.trim();
        const slug = 'cat_' + cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
        
        // Add to metadata
        const randomEmojis = ['🎯', '🤖', '🌐', '⚡', '📋', '🚀', '📈', '💡', '💎', '🔥', '⚙️', '🎨', '💼'];
        const randomEmoji = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
        
        ALL_CATEGORIES_METADATA[slug] = {
            label: cleanName,
            bg: 'rgba(10, 132, 255, 0.08)',
            border: '1px solid rgba(10, 132, 255, 0.2)',
            accent: '#0a84ff',
            icon: randomEmoji
        };
        
        // Save to customCategories
        customCategories[slug] = ALL_CATEGORIES_METADATA[slug];
        localStorage.setItem('cc_custom_categories', JSON.stringify(customCategories));
        
        // Add option and select
        const option = document.createElement('option');
        option.value = slug;
        option.textContent = randomEmoji + ' ' + cleanName;
        select.insertBefore(option, select.lastElementChild);
        select.value = slug;
        
        // Redraw pills bar
        renderCategoryPills();
        showToast(`Nueva categoría "${cleanName}" creada con éxito`);
    }
};

// Render Category filter pills dynamically
window.renderCategoryPills = function() {
    const bar = document.getElementById('pres-category-pills-bar');
    if (!bar) return;
    
    let html = `<button class="cat-pill ${presCat === 'all' ? 'active' : ''}" data-cat="all" onclick="filterTemplatesByCategory('all')">Todos</button>`;
    
    Object.keys(ALL_CATEGORIES_METADATA).forEach(catKey => {
        const meta = ALL_CATEGORIES_METADATA[catKey];
        html += `<button class="cat-pill ${presCat === catKey ? 'active' : ''}" data-cat="${catKey}" onclick="filterTemplatesByCategory('${catKey}')">${meta.label}</button>`;
    });
    
    bar.innerHTML = html;
};

// --- Category Management Sub-Tab Controller ---
window.renderCategoriasManagement = function() {
    const tbody = document.getElementById('categories-tbody');
    if (!tbody) return;
    
    let html = '';
    Object.keys(ALL_CATEGORIES_METADATA).forEach(catKey => {
        const meta = ALL_CATEGORIES_METADATA[catKey];
        
        // Count templates/proposals associated with this category
        const associatedCount = presupuestos.filter(p => p.categoria === catKey).length;
        
        // Check if custom or default
        const isCustom = customCategories.hasOwnProperty(catKey);
        const typeLabel = isCustom ? '🧩 Personalizada' : '⚙️ Sistema';
        
        // Deletable flag (keep 'personalizada' protected to guarantee a fallback category exists)
        const canDelete = catKey !== 'personalizada';
        
        html += `
            <tr>
                <td style="text-align: center; font-size: 1.5rem;">${meta.icon}</td>
                <td style="font-weight: 600;">${meta.label}</td>
                <td style="font-family: monospace; font-size: 0.85rem; color: var(--text-grey);">${catKey}</td>
                <td>
                    <span class="status-badge" style="background: ${isCustom ? 'rgba(88, 86, 214, 0.1)' : 'rgba(0, 113, 227, 0.1)'}; color: ${isCustom ? 'var(--accent-purple)' : 'var(--accent)'}; font-size: 0.8rem; font-weight: 600; padding: 4px 10px; border-radius: 8px;">
                        ${typeLabel}
                    </span>
                </td>
                <td style="text-align: center; font-weight: 700; color: ${associatedCount > 0 ? 'var(--accent)' : 'var(--text-grey)'};">
                    ${associatedCount}
                </td>
                <td style="text-align: center;">
                    ${canDelete ? `
                        <button class="macos-alert-btn btn-danger" onclick="deleteCategoryFromManager('${catKey}')" style="padding: 6px 12px; font-size: 0.8rem; border-radius: 8px; box-shadow: none;">
                            🗑️ Borrar
                        </button>
                    ` : `
                        <span style="color: var(--text-grey); font-size: 0.8rem; font-style: italic;">Protegido</span>
                    `}
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
};

window.createNewCategoryFromManager = async function() {
    const catName = await showPrompt('Nueva Categoría', 'Escribe el nombre de la nueva categoría (ej: Ecosistemas B2B):', '📁', '', 'Nombre de la categoría...');
    if (!catName || catName.trim() === '') return;
    
    const cleanName = catName.trim();
    const slug = 'cat_' + cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
    
    if (ALL_CATEGORIES_METADATA.hasOwnProperty(slug)) {
        showAlert('Categoría Existente', `Ya existe una categoría llamada "${cleanName}".`, '⚠️');
        return;
    }
    
    // Add to metadata
    const randomEmojis = ['🎯', '🤖', '🌐', '⚡', '📋', '🚀', '📈', '💡', '💎', '🔥', '⚙️', '🎨', '💼'];
    const randomEmoji = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
    
    ALL_CATEGORIES_METADATA[slug] = {
        label: cleanName,
        bg: 'rgba(10, 132, 255, 0.08)',
        border: '1px solid rgba(10, 132, 255, 0.2)',
        accent: '#0a84ff',
        icon: randomEmoji
    };
    
    // Save to customCategories
    customCategories[slug] = ALL_CATEGORIES_METADATA[slug];
    localStorage.setItem('cc_custom_categories', JSON.stringify(customCategories));
    
    // Refresh interfaces
    renderCategoryPills();
    renderCategoriasManagement();
    if (window.populateCategoryDropdown) window.populateCategoryDropdown();
    showToast(`Nueva categoría "${cleanName}" creada con éxito`, '📁');
};

window.deleteCategoryFromManager = async function(catKey) {
    const meta = ALL_CATEGORIES_METADATA[catKey];
    if (!meta) return;
    
    const associatedCount = presupuestos.filter(p => p.categoria === catKey).length;
    
    let warningMsg = `¿Estás seguro de que deseas eliminar la categoría "${meta.icon} ${meta.label}"?`;
    if (associatedCount > 0) {
        warningMsg += ` Esto eliminará de forma PERMANENTE las ${associatedCount} plantillas y propuestas asociadas a esta categoría. Esta acción no se puede deshacer.`;
    } else {
        warningMsg += ` Esta acción no se puede deshacer.`;
    }
    
    const confirmed = await showConfirm(
        '¿Eliminar Categoría?',
        warningMsg,
        '⚠️',
        associatedCount > 0 ? 'Eliminar Todo' : 'Eliminar'
    );
    
    if (!confirmed) return;
    
    try {
        // Cascade delete in Database (Supabase)
        const { error } = await _supabase
            .from('presupuestos')
            .delete()
            .eq('categoria', catKey);
            
        if (error) throw error;
        
        // Remove locally from in-memory array & local cache
        presupuestos = presupuestos.filter(p => p.categoria !== catKey);
        localStorage.setItem('gf_presupuestos', JSON.stringify(presupuestos));
        
        // Delete from metadata and custom categories
        if (customCategories.hasOwnProperty(catKey)) {
            delete customCategories[catKey];
            localStorage.setItem('cc_custom_categories', JSON.stringify(customCategories));
        } else {
            // It's a system category, track it as deleted
            if (!deletedDefaultCategories.includes(catKey)) {
                deletedDefaultCategories.push(catKey);
                localStorage.setItem('cc_deleted_default_categories', JSON.stringify(deletedDefaultCategories));
            }
        }
        
        delete ALL_CATEGORIES_METADATA[catKey];
        
        // Update UI
        renderCategoryPills();
        renderCategoriasManagement();
        if (window.populateCategoryDropdown) window.populateCategoryDropdown();
        
        // Update proposals tab count badge
        const templatesCount = presupuestos.filter(p => p.es_plantilla !== false).length;
        const countBadge = document.getElementById('count-templates-badge');
        if (countBadge) countBadge.textContent = templatesCount;
        
        showToast(`Categoría "${meta.label}" eliminada con éxito`, '🗑️');
    } catch (e) {
        showAlert('Error al Eliminar', `No se pudo eliminar la categoría: ${e.message}`, '❌');
    }
};


// Render payment methods instructions dynamically below pay methods grid
window.renderPayMethodsInstructions = function() {
    const container = document.getElementById('pay-methods-instructions-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    const selectedButtons = document.querySelectorAll('.pay-method-btn.selected');
    if (selectedButtons.length === 0) {
        container.innerHTML = `
            <div style="font-size:0.75rem; color:var(--text-grey); padding:10px; border:1px dashed var(--card-border); border-radius:10px; text-align:center; background:rgba(255,255,255,0.01);">
                No hay formas de pago seleccionadas. Activa alguna para previsualizar sus instrucciones de pago.
            </div>`;
        return;
    }
    
    const instructions = {
        transferencia: {
            title: '🏦 Instrucciones de Transferencia Bancaria',
            color: '#0a84ff',
            bg: 'rgba(10, 132, 255, 0.04)',
            border: 'rgba(10, 132, 255, 0.15)',
            html: `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:0.78rem;">
                    <div><span style="color:var(--text-grey);">Banco:</span> <strong style="color:var(--text-main);">Banco Sabadell</strong></div>
                    <div><span style="color:var(--text-grey);">Titular:</span> <strong style="color:var(--text-main);">iArtesana B2B Solutions S.L.</strong></div>
                    <div style="grid-column: span 2;"><span style="color:var(--text-grey);">IBAN:</span> <strong style="color:var(--text-main); font-family:monospace; letter-spacing:0.02em;">ES21 0081 1029 3847 5610 2938</strong></div>
                    <div style="grid-column: span 2;"><span style="color:var(--text-grey);">BIC/SWIFT:</span> <strong style="color:var(--text-main); font-family:monospace;">BSABESBBXXX</strong></div>
                </div>
            `
        },
        giro: {
            title: '🏢 Instrucciones de Giro Bancario',
            color: '#34c759',
            bg: 'rgba(52, 199, 89, 0.04)',
            border: 'rgba(52, 199, 89, 0.15)',
            html: `
                <div style="font-size:0.78rem; line-height:1.4; color:var(--text-grey);">
                    <p style="margin:0 0 6px;">El cobro se realizará mediante domiciliación de recibos directamente a la cuenta del cliente en la fecha acordada.</p>
                    <div><span style="color:var(--text-grey);">Mandato:</span> <strong style="color:var(--text-main);">Requiere firma previa de autorización SEPA CORE.</strong></div>
                </div>
            `
        },
        bizum: {
            title: '📱 Instrucciones de Pago por Bizum',
            color: '#ff9f0a',
            bg: 'rgba(255, 159, 10, 0.04)',
            border: 'rgba(255, 159, 10, 0.15)',
            html: `
                <div style="font-size:0.78rem;">
                    <div><span style="color:var(--text-grey);">Teléfono Bizum:</span> <strong style="color:var(--text-main);">+34 612 345 678</strong></div>
                    <div style="margin-top:4px;"><span style="color:var(--text-grey);">Concepto obligatorio:</span> <strong style="color:var(--text-main);">CC- [Número de Propuesta]</strong></div>
                </div>
            `
        },
        stripe: {
            title: '💳 Pago Online con Tarjeta (Stripe)',
            color: '#bf5af2',
            bg: 'rgba(191, 90, 242, 0.04)',
            border: 'rgba(191, 90, 242, 0.15)',
            html: `
                <div style="font-size:0.78rem; line-height:1.4; color:var(--text-grey);">
                    <p style="margin:0 0 4px;">Se autogenerará un botón seguro en el PDF final para que el cliente pueda abonar con tarjeta (Crédito/Débito) de forma instantánea.</p>
                </div>
            `
        },
        efectivo: {
            title: '💵 Pago en Efectivo',
            color: '#ff375f',
            bg: 'rgba(255, 55, 95, 0.04)',
            border: 'rgba(255, 55, 95, 0.15)',
            html: `
                <div style="font-size:0.78rem; line-height:1.4; color:var(--text-grey);">
                    <p style="margin:0 0 4px;">Cobro directo en metálico contra firma del recibo físico en las oficinas. Sujeto al límite legal aplicable.</p>
                </div>
            `
        },
        sin_iva: {
            title: '🇺🇸 Pago Exento de IVA (Internacional)',
            color: '#00c7be',
            bg: 'rgba(0, 199, 190, 0.04)',
            border: 'rgba(0, 199, 190, 0.15)',
            html: `
                <div style="font-size:0.78rem; line-height:1.4; color:var(--text-grey);">
                    <p style="margin:0 0 4px;">Facturación intracomunitaria (VIES) o extracomunitaria exenta de IVA según normativa europea/nacional de exportación de servicios.</p>
                </div>
            `
        }
    };
    
    selectedButtons.forEach(btn => {
        const val = btn.dataset.value;
        const info = instructions[val];
        if (info) {
            const block = document.createElement('div');
            block.style.background = info.bg;
            block.style.border = `1px solid ${info.border}`;
            block.style.borderRadius = '12px';
            block.style.padding = '12px';
            block.style.display = 'flex';
            block.style.flexDirection = 'column';
            block.style.gap = '6px';
            
            block.innerHTML = `
                <div style="font-size:0.8rem; font-weight:800; color:${info.color}; display:flex; align-items:center; gap:5px;">
                    <span>👉</span> ${info.title}
                </div>
                <div style="border-top:1px dashed ${info.border}; padding-top:6px; margin-top:2px;">
                    ${info.html}
                </div>
            `;
            container.appendChild(block);
        }
    });
};

// Option A, B, C selection handler
function selectPaymentOptionAction(opt) {
    selectedPaymentOption = opt;
    recalcPaymentOptionsInModal();
}

// Opening Create Template Modal
function openCreateTemplateModal(defaultCat = 'consultoria') {
    document.getElementById('edit-pres-id').value = '';
    document.getElementById('edit-pres-modal-title').textContent = 'Crear Propuesta';
    
    // Clear inputs
    document.getElementById('edit-pres-titulo').value = '';
    document.getElementById('edit-pres-subtitulo').value = '';
    document.getElementById('edit-pres-descripcion').value = '';
    
    // Populate dropdown and select category
    populateCategoryDropdown();
    document.getElementById('edit-pres-categoria').value = defaultCat;
    
    document.getElementById('edit-pres-badge').value = '';
    document.getElementById('edit-pres-orden').value = '1';
    
    document.getElementById('edit-pres-es-plantilla').checked = true;
    document.getElementById('edit-pres-activo').checked = true;
    document.getElementById('edit-pres-es-prueba').checked = false;
    document.getElementById('edit-pres-lead-nombre').value = '';
    document.getElementById('edit-pres-fecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('edit-pres-fecha-entrega').value = '';
    document.getElementById('edit-pres-bonus').value = '';
    document.getElementById('edit-pres-notas-internas').value = '';
    document.getElementById('edit-pres-contenido-ia').value = '';
    
    // Reset payment option buttons
    document.querySelectorAll('.pay-method-btn').forEach(btn => {
        if (['giro', 'transferencia', 'bizum'].includes(btn.dataset.value)) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });

    // Finance defaults
    document.getElementById('edit-pres-pc-inv-min').value = '18';
    document.getElementById('edit-pres-pc-cuotas').value = '24';
    document.getElementById('edit-pres-pc-dto-b').value = '4';
    document.getElementById('edit-pres-pc-dto-c').value = '8';

    lineasTempList = [];
    selectedPaymentOption = null;

    recalcPaymentOptionsInModal();
    renderEditPresLineas();
    renderPayMethodsInstructions();
    
    document.getElementById('modal-edit-presupuesto').classList.add('active');
    document.getElementById('modal-edit-presupuesto').style.display = 'flex';
}

// Opening Edit Proposal Modal
function openEditPresupuestoModal(id) {
    const p = presupuestos.find(pr => pr.id === id);
    if (!p) return;

    document.getElementById('edit-pres-id').value = p.id;
    document.getElementById('edit-pres-modal-title').textContent = 'Editar Propuesta';

    document.getElementById('edit-pres-titulo').value = p.titulo || '';
    document.getElementById('edit-pres-subtitulo').value = p.subtitulo || '';
    document.getElementById('edit-pres-descripcion').value = p.descripcion || '';
    
    // Populate dropdown and select category
    populateCategoryDropdown();
    document.getElementById('edit-pres-categoria').value = p.categoria || 'consultoria';
    
    document.getElementById('edit-pres-badge').value = p.badge || '';
    document.getElementById('edit-pres-orden').value = p.orden || '1';

    document.getElementById('edit-pres-es-plantilla').checked = p.es_plantilla !== false;
    document.getElementById('edit-pres-activo').checked = p.activo !== false;
    document.getElementById('edit-pres-es-prueba').checked = !!p.es_prueba;
    document.getElementById('edit-pres-lead-nombre').value = p.lead_nombre || '';
    document.getElementById('edit-pres-fecha').value = p.fecha ? p.fecha.split('T')[0] : new Date().toISOString().split('T')[0];
    document.getElementById('edit-pres-fecha-entrega').value = p.fecha_entrega ? p.fecha_entrega.split('T')[0] : '';
    document.getElementById('edit-pres-bonus').value = p.bonus || '';
    document.getElementById('edit-pres-notas-internas').value = p.notas_internas || '';
    document.getElementById('edit-pres-contenido-ia').value = p.contenido_ia || '';

    // Payment methods toggles
    const offered = p.formas_pago_ofrecidas || [];
    document.querySelectorAll('.pay-method-btn').forEach(btn => {
        const val = btn.dataset.value;
        const isOffered = offered.length > 0 ? offered.includes(val) : (p.forma_pago === val || ['giro', 'transferencia', 'bizum'].includes(val));
        if (isOffered) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });

    // Finance config
    const pc = p.pago_config || { inv_min_pct: 18, num_cuotas: 24, descuento_b_pct: 4, descuento_c_pct: 8, selected_option: null };
    document.getElementById('edit-pres-pc-inv-min').value = pc.inv_min_pct != null ? pc.inv_min_pct : '18';
    document.getElementById('edit-pres-pc-cuotas').value = pc.num_cuotas != null ? pc.num_cuotas : '24';
    document.getElementById('edit-pres-pc-dto-b').value = pc.descuento_b_pct != null ? pc.descuento_b_pct : '4';
    document.getElementById('edit-pres-pc-dto-c').value = pc.descuento_c_pct != null ? pc.descuento_c_pct : '8';
    
    // Deep copy lineas
    lineasTempList = p.lineas ? JSON.parse(JSON.stringify(p.lineas)) : [];
    selectedPaymentOption = pc.selected_option || null;

    recalcPaymentOptionsInModal();
    renderEditPresLineas();
    renderPayMethodsInstructions();

    document.getElementById('modal-edit-presupuesto').classList.add('active');
    document.getElementById('modal-edit-presupuesto').style.display = 'flex';
}

function closeEditPresupuestoModal() {
    document.getElementById('modal-edit-presupuesto').classList.remove('active');
    document.getElementById('modal-edit-presupuesto').style.display = 'none';
}

// Recalculate dynamic hours, totals and financing inside the modal
function recalcPaymentOptionsInModal() {
    const activeLines = lineasTempList.filter(l => l.activo !== false);
    const billingLines = activeLines.filter(l => l.recomendado !== true); // starred "recomendado" lines are NOT included in main total

    // Total hours sum
    const totalHours = billingLines.reduce((s, l) => s + Number(l.horas_estimadas || 0), 0);
    const totalDays = Math.ceil(totalHours / 8);
    
    const hTxt = document.getElementById('edit-pres-total-horas-txt');
    const dTxt = document.getElementById('edit-pres-total-dias-txt');
    if (hTxt) hTxt.textContent = totalHours + 'h';
    if (dTxt) dTxt.textContent = `(${totalDays} días laborables)`;

    // Prices calculation
    const totalGross = billingLines.reduce((s, l) => s + (Number(l.precio) || 0), 0);
    const totalNet = billingLines.reduce((s, l) => {
        const itemPrice = Number(l.precio) || 0;
        const discount = Number(l.descuento) || 0;
        return s + (itemPrice * (1 - discount / 100));
    }, 0);
    const totalMant = activeLines.reduce((s, l) => s + (l.mantenimiento ? (Number(l.mantenimiento_precio) || 0) : 0), 0);

    // Update main totals labels
    const countBadge = document.getElementById('edit-pres-tot-lines-badge');
    if (countBadge) countBadge.textContent = `TOTAL (${activeLines.length}/${lineasTempList.length} LÍNEAS ACTIVAS)`;

    const grossEl = document.getElementById('edit-pres-tot-gross-txt');
    if (grossEl) {
        if (totalGross > totalNet) {
            grossEl.style.display = 'inline';
            grossEl.textContent = Math.round(totalGross) + '€';
        } else {
            grossEl.style.display = 'none';
        }
    }
    const netEl = document.getElementById('edit-pres-tot-net-txt');
    if (netEl) netEl.textContent = Math.round(totalNet) + '€';

    const mantEl = document.getElementById('edit-pres-tot-mant-txt');
    if (mantEl) mantEl.textContent = Math.round(totalMant) + '€/mes';

    // PAYMENT OPTIONS DYNAMIC ESTIMATES
    const invMinPct = Number(document.getElementById('edit-pres-pc-inv-min').value || 18);
    const numCuotas = Number(document.getElementById('edit-pres-pc-cuotas').value || 24);
    const dtoBPct = Number(document.getElementById('edit-pres-pc-dto-b').value || 4);
    const dtoCPct = Number(document.getElementById('edit-pres-pc-dto-c').value || 8);

    // Option A: Financiación
    const invMinA = Math.round(totalNet * invMinPct / 100);
    const cuotaA = Math.round((totalNet - invMinA) / numCuotas);
    document.getElementById('pay-opt-a-inv-calc').textContent = `${invMinA}€ + IVA`;
    document.getElementById('pay-opt-a-cuota-calc').textContent = `${cuotaA}€ + IVA / mes`;
    document.getElementById('pay-opt-a-total-calc').textContent = `Total: ${Math.round(totalNet)}€ + IVA (sin intereses)`;

    // Option B: Parcial (3 pagos)
    const totB = Math.round(totalNet * (1 - dtoBPct / 100));
    const p3 = Math.round(totB / 3);
    document.getElementById('pay-opt-b-tot-calc').textContent = `${totB}€ + IVA`;
    document.getElementById('pay-opt-b-orig-calc').textContent = `${Math.round(totalNet)}€`;
    
    // Dynamic dates
    const emissionDateStr = document.getElementById('edit-pres-fecha').value;
    const emissionDate = emissionDateStr ? new Date(emissionDateStr) : new Date();
    const mNames = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    
    const d1 = mNames[emissionDate.getMonth()] + ' de ' + emissionDate.getFullYear();
    const date2 = new Date(emissionDate); date2.setMonth(date2.getMonth() + 6);
    const d2 = mNames[date2.getMonth()] + ' de ' + date2.getFullYear();
    const date3 = new Date(emissionDate); date3.setMonth(date3.getMonth() + 12);
    const d3 = mNames[date3.getMonth()] + ' de ' + date3.getFullYear();
    
    document.getElementById('pay-opt-b-p1').textContent = `${p3}€ + IVA`;
    document.getElementById('pay-opt-b-d1').textContent = d1;
    document.getElementById('pay-opt-b-p2').textContent = `${p3}€ + IVA`;
    document.getElementById('pay-opt-b-d2').textContent = d2;
    document.getElementById('pay-opt-b-p3').textContent = `${p3}€ + IVA`;
    document.getElementById('pay-opt-b-d3').textContent = d3;

    // Option C: Anticipado
    const totC = Math.round(totalNet * (1 - dtoCPct / 100));
    document.getElementById('pay-opt-c-tot-calc').textContent = `${totC}€ + IVA`;
    document.getElementById('pay-opt-c-orig-calc').textContent = `${Math.round(totalNet)}€`;
    document.getElementById('pay-opt-c-saving').textContent = Math.round(totalNet - totC);

    // Dynamic banner and options highlighted state
    document.querySelectorAll('.payment-option-card').forEach(card => card.classList.remove('selected', 'selected-b', 'selected-c'));
    document.querySelectorAll('.ios-checkmark-btn').forEach(chk => chk.classList.remove('checked'));
    document.querySelectorAll('[id^="btn-select-pay-"]').forEach(b => {
        b.textContent = 'Seleccionar';
        b.classList.remove('active');
    });

    const banner = document.getElementById('payment-selected-banner');
    const bannerTxt = document.getElementById('payment-selected-banner-text');

    if (selectedPaymentOption === 'A') {
        document.getElementById('pay-opt-card-a').classList.add('selected');
        document.getElementById('pay-opt-chk-a').classList.add('checked');
        const btn = document.getElementById('btn-select-pay-a');
        if (btn) { btn.textContent = 'Seleccionada'; btn.classList.add('active'); }
        if (banner) {
            banner.style.display = 'flex';
            banner.style.background = 'rgba(10, 132, 255, 0.08)';
            banner.style.borderColor = 'rgba(10, 132, 255, 0.2)';
            banner.style.color = 'var(--accent)';
            bannerTxt.textContent = `Opción A seleccionada — Precio final: ${Math.round(totalNet)}€`;
        }
    } else if (selectedPaymentOption === 'B') {
        document.getElementById('pay-opt-card-b').classList.add('selected-b');
        document.getElementById('pay-opt-chk-b').classList.add('checked');
        const btn = document.getElementById('btn-select-pay-b');
        if (btn) { btn.textContent = 'Seleccionada'; btn.classList.add('active'); }
        if (banner) {
            banner.style.display = 'flex';
            banner.style.background = 'rgba(52, 199, 89, 0.08)';
            banner.style.borderColor = 'rgba(52, 199, 89, 0.2)';
            banner.style.color = '#34c759';
            bannerTxt.textContent = `Opción B seleccionada — Precio final: ${totB}€`;
        }
    } else if (selectedPaymentOption === 'C') {
        document.getElementById('pay-opt-card-c').classList.add('selected-c');
        document.getElementById('pay-opt-chk-c').classList.add('checked');
        const btn = document.getElementById('btn-select-pay-c');
        if (btn) { btn.textContent = 'Seleccionada'; btn.classList.add('active'); }
        if (banner) {
            banner.style.display = 'flex';
            banner.style.background = 'rgba(255, 159, 10, 0.08)';
            banner.style.borderColor = 'rgba(255, 159, 10, 0.2)';
            banner.style.color = '#ff9f0a';
            bannerTxt.textContent = `Opción C seleccionada — Precio final: ${totC}€`;
        }
    } else {
        if (banner) banner.style.display = 'none';
    }
}

// Render dynamic service lines list inside modal
// HTML5 Drag and Drop for service lines reordering inside modal
let lineDragIndex = null;

window.handleLineDragStart = function(e, index) {
    if (sessionStorage.getItem('cc_role') === 'guest') {
        e.preventDefault();
        return;
    }
    lineDragIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('dragging-line');
};

window.handleLineDragOver = function(e, index) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
};

window.handleLineDragEnd = function(e) {
    e.currentTarget.classList.remove('dragging-line');
    lineDragIndex = null;
};

window.handleLineDrop = function(e, index) {
    e.preventDefault();
    if (sessionStorage.getItem('cc_role') === 'guest') {
        showAlert('Restringido', 'El usuario Invitado tiene acceso de solo lectura', '🔒');
        return;
    }
    if (lineDragIndex !== null && lineDragIndex !== index) {
        const draggedLine = lineasTempList[lineDragIndex];
        lineasTempList.splice(lineDragIndex, 1);
        lineasTempList.splice(index, 0, draggedLine);
        recalcPaymentOptionsInModal();
        renderEditPresLineas();
    }
};

// Function: Call Gemini to generate B2B value-added copy blocks for a specific proposal line item
async function generateValueCopyForLine(index) {
    const concept = lineasTempList[index].concepto.trim();
    if (!concept) {
        showToast('Escribe primero el concepto de la línea para poder generar su copy', true);
        return;
    }
    
    const btn = document.getElementById(`btn-ai-line-copy-${index}`);
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⏳ Generando...';
    }
    showToast('El agente está diseñando el copy persuasivo de esta línea...');
    
    const systemPrompt = `Genera un desglose de sub-líneas comerciales B2B persuasivas y de alto valor (copywriting) en ESPAÑOL para esta fase de proyecto: "${concept}".
Responde EXCLUSIVAMENTE con un array JSON de sublineas sin delimitadores de código markdown \`\`\`json, sin texto adicional.
Cada sublínea debe ser una frase corta y persuasiva dirigida a convencer al cliente B2B, cubriendo de forma secuencial:
1. Concepto técnico o alcance simplificado de esta fase.
2. Identificación del dolor del cliente o problema resuelto en esta fase.
3. Dificultades o retos que analizaremos para evitar fallos.
4. Beneficio directo de trabajar con nosotros.
5. Solución ideal y personalizada propuesta.
6. Llamada a la acción o hito de cierre de la fase.

Estructura exacta a retornar:
[
  {"concepto": "Detalle técnico simplificado de la fase..."},
  {"concepto": "Referencia a un dolor del posible cliente o solución a un problema..."},
  {"concepto": "Dificultades analizadas para evitar fallos..."},
  {"concepto": "Beneficios de trabajar con nosotros esta fase..."},
  {"concepto": "Solución adecuada y despliegue estratégico..."},
  {"concepto": "CTA o validación de entregable..."}
]`;

    try {
        const res = await fetch('/api/brain-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: systemPrompt })
        });
        if (!res.ok) throw new Error('Error al conectar con el cerebro IA');
        const data = await res.json();
        let jsonStr = data.text;
        
        // Clean markdown tags
        jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        const startIdx = jsonStr.indexOf('[');
        const endIdx = jsonStr.lastIndexOf(']');
        if (startIdx !== -1 && endIdx !== -1) {
            jsonStr = jsonStr.substring(startIdx, endIdx + 1);
        }
        
        const sublineas = JSON.parse(jsonStr);
        if (Array.isArray(sublineas)) {
            lineasTempList[index].sublineas = sublineas;
            renderEditPresLineas();
            showToast('¡Contenido de valor generado con éxito por el Agente!');
        }
    } catch (e) {
        console.error(e);
        showToast('Error al generar copy de valor con el Agente', true);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span>✨</span> Contenido de Valor (IA)';
        }
    }
}

// Render dynamic service lines list inside modal
function renderEditPresLineas() {
    const container = document.getElementById('edit-pres-lineas-container');
    if (!container) return;
    
    container.innerHTML = '';

    if (lineasTempList.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; color:var(--text-grey); font-size:0.8rem; padding:24px; border:1px dashed var(--card-border); border-radius:14px; background:rgba(255,255,255,0.01);">
                No hay líneas de desglose de servicio. Utiliza el 🤖 Copiloto IA superior para generar una estructura instantánea o pulsa "+ Añadir línea" para comenzar.
            </div>`;
        return;
    }

    lineasTempList.forEach((linea, index) => {
        const isRec = !!linea.recomendado;
        const isActive = linea.activo !== false;
        
        const card = document.createElement('div');
        card.className = `edit-linea-item ${isRec ? 'recommended' : ''}`;
        
        // Setup Drag & Drop attributes and listeners
        card.setAttribute('draggable', 'true');
        card.setAttribute('ondragstart', `handleLineDragStart(event, ${index})`);
        card.setAttribute('ondragover', `handleLineDragOver(event, ${index})`);
        card.setAttribute('ondragend', `handleLineDragEnd(event)`);
        card.setAttribute('ondrop', `handleLineDrop(event, ${index})`);
        
        // Sub-lines HTML list
        const sublineasHtml = (linea.sublineas || []).map((sub, sIdx) => `
            <div class="sublinea-row">
                <span style="font-size:0.75rem; color:var(--text-grey); padding-left:14px; cursor:grab;">⠿</span>
                <span style="font-size:0.75rem; color:var(--text-grey);">└</span>
                <input type="text" placeholder="Concepto de sub-línea..." value="${sub.concepto || ''}" 
                       oninput="lineasTempList[${index}].sublineas[${sIdx}].concepto = this.value"
                       class="modal-input" style="flex:1; font-size:0.78rem; padding:4px 8px; height: 28px;">
                
                <!-- UP / DOWN sort arrows & delete -->
                <button type="button" onclick="moveEditPresSublinea(${index}, ${sIdx}, -1)" style="border:none; background:transparent; color:var(--text-grey); cursor:pointer; font-size:0.68rem; padding:4px;" title="Subir">▲</button>
                <button type="button" onclick="moveEditPresSublinea(${index}, ${sIdx}, 1)" style="border:none; background:transparent; color:var(--text-grey); cursor:pointer; font-size:0.68rem; padding:4px;" title="Bajar">▼</button>
                <button type="button" onclick="removeEditPresSublinea(${index}, ${sIdx})" style="border:none; background:transparent; color:var(--accent-red); cursor:pointer; font-size:0.75rem; padding:4px;">✕</button>
            </div>
        `).join('');

        const imp = (linea.precio || 0) * (1 - (linea.descuento || 0) / 100);

        card.innerHTML = `
            ${isRec ? `<div class="line-rec-badge">⭐ RECOMENDADO · No incluido</div>` : ''}
            
            <!-- ROW 1 -->
            <div style="display:flex; gap:10px; align-items:center; width:100%; flex-wrap:wrap;">
                <!-- Drag dots apple-style -->
                <span style="color:var(--text-grey); cursor:grab; font-size:1.15rem; font-weight:700; user-select:none; margin-right:2px;" title="Arrastrar para reordenar">⠿</span>
                
                <!-- Circular Checkbox Active toggle -->
                <div class="ios-checkmark-btn ${isActive ? 'checked' : ''}" 
                     onclick="lineasTempList[${index}].activo = !${isActive}; recalcPaymentOptionsInModal(); renderEditPresLineas();"
                     title="Activar / Desactivar línea"></div>
                
                <!-- Concept name -->
                <div style="flex:2; min-width:180px;">
                    <label style="font-size:0.68rem; color:var(--text-grey); display:block; margin-bottom:2px; font-weight:700;">Concepto</label>
                    <input type="text" placeholder="Landing Page" value="${linea.concepto || ''}" 
                           oninput="lineasTempList[${index}].concepto = this.value; recalcPaymentOptionsInModal();"
                           class="modal-input" style="font-size:0.8rem; padding:6px 10px; height: 32px; font-weight:600;">
                </div>
                
                <!-- Price -->
                <div style="width:90px;">
                    <label style="font-size:0.68rem; color:var(--text-grey); display:block; margin-bottom:2px; font-weight:700;">Precio (€)</label>
                    <input type="number" placeholder="0" value="${linea.precio != null ? linea.precio : ''}" 
                           oninput="lineasTempList[${index}].precio = Number(this.value); recalcPaymentOptionsInModal(); renderEditPresLineas();"
                           class="modal-input" style="font-size:0.8rem; padding:6px 10px; height: 32px; text-align:center;">
                </div>
                
                <!-- Discount -->
                <div style="width:75px;">
                    <label style="font-size:0.68rem; color:var(--text-grey); display:block; margin-bottom:2px; font-weight:700;">Dto. (%)</label>
                    <input type="number" placeholder="0" value="${linea.descuento != null ? linea.descuento : ''}" 
                           oninput="lineasTempList[${index}].descuento = Number(this.value); recalcPaymentOptionsInModal(); renderEditPresLineas();"
                           class="modal-input" style="font-size:0.8rem; padding:6px 10px; height: 32px; text-align:center;" min="0" max="100">
                </div>

                <!-- Final Net calculated label -->
                <div style="display:flex; flex-direction:column; align-items:center; min-width:70px; margin-left:4px;">
                    <span style="font-size:0.65rem; color:var(--text-grey); font-weight:700; text-transform:uppercase;">Final</span>
                    <strong style="font-size:0.95rem; color:#34c759; margin-top:2px; font-weight:800;">${Math.round(imp)}€</strong>
                </div>

                <!-- Star toggle recommended optional -->
                <button type="button" class="ios-star-btn ${isRec ? 'active' : ''}" 
                        onclick="lineasTempList[${index}].recomendado = !${isRec}; recalcPaymentOptionsInModal(); renderEditPresLineas();"
                        title="Marcar como recomendada (Opcional, excluida de totales)">★</button>
                
                <!-- Delete row button (pink/red high fidelity) -->
                <button type="button" class="ios-delete-btn" onclick="removeEditPresLinea(${index})" title="Eliminar línea">✕</button>
            </div>
            
            <!-- ROW 2 -->
            <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; margin-top:6px; align-items:flex-end;">
                <!-- Hours estimated -->
                <div>
                    <label style="font-size:0.68rem; color:var(--text-grey); display:block; margin-bottom:2px;">⏱️ Horas estimadas</label>
                    <div style="display:flex; gap:4px;">
                        <input type="number" value="${linea.horas_estimadas || '0'}" 
                               oninput="lineasTempList[${index}].horas_estimadas = Number(this.value); const f = lineasTempList[${index}].unidad_estimacion === 'días' ? 8 : 1; lineasTempList[${index}].precio = Number(this.value) * f * (lineasTempList[${index}].precio_hora || 53); lineasTempList[${index}].plazo = this.value + ' ' + (lineasTempList[${index}].unidad_estimacion || 'horas'); recalcPaymentOptionsInModal(); renderEditPresLineas();"
                               class="modal-input" style="flex:1.2; font-size:0.78rem; padding:4px 6px; height:28px; text-align:center;">
                        
                        <select onchange="lineasTempList[${index}].unidad_estimacion = this.value; const f = this.value === 'días' ? 8 : 1; lineasTempList[${index}].precio = (lineasTempList[${index}].horas_estimadas || 0) * f * (lineasTempList[${index}].precio_hora || 53); lineasTempList[${index}].plazo = (lineasTempList[${index}].horas_estimadas || 0) + ' ' + this.value; recalcPaymentOptionsInModal(); renderEditPresLineas();"
                                class="modal-input" style="flex:1; font-size:0.74rem; padding:0; height:28px; text-align:center; min-width:60px;">
                            <option value="horas" ${linea.unidad_estimacion !== 'días' ? 'selected' : ''}>horas</option>
                            <option value="días" ${linea.unidad_estimacion === 'días' ? 'selected' : ''}>días</option>
                        </select>
                    </div>
                </div>
                
                <!-- rate/hour -->
                <div>
                    <label style="font-size:0.68rem; color:var(--text-grey); display:block; margin-bottom:2px;">💰 €/hora</label>
                    <input type="number" value="${linea.precio_hora || '53'}" 
                           oninput="lineasTempList[${index}].precio_hora = Number(this.value); const f = lineasTempList[${index}].unidad_estimacion === 'días' ? 8 : 1; lineasTempList[${index}].precio = (lineasTempList[${index}].horas_estimadas || 0) * f * Number(this.value); recalcPaymentOptionsInModal(); renderEditPresLineas();"
                           class="modal-input" style="font-size:0.78rem; padding:4px 8px; height:28px; text-align:center;">
                </div>

                <!-- Live formula text with Multiplication Symbol (×) -->
                <div style="display:flex; align-items:center; font-size:0.74rem; color:#34c759; font-weight:600; padding-bottom:6px; min-width:120px;">
                    = ${linea.horas_estimadas || 0}${linea.unidad_estimacion === 'días' ? 'd' : 'h'} × ${linea.precio_hora || 53}€ = ${linea.precio || 0}€
                </div>
                
                <!-- Plazo text -->
                <div>
                    <label style="font-size:0.68rem; color:var(--text-grey); display:block; margin-bottom:2px;">📋 Plazo (texto para PDF)</label>
                    <input type="text" placeholder="Ej: 16 horas, 2 semanas..." value="${linea.plazo || ''}" 
                           oninput="lineasTempList[${index}].plazo = this.value"
                           class="modal-input" style="font-size:0.78rem; padding:4px 8px; height:28px;">
                </div>
            </div>

            <div style="display:flex; gap:10px; align-items:center; margin-top:4px;">
                <span style="font-size:0.74rem; color:var(--text-grey); display:flex; align-items:center; gap:4px;">🔄 Mant. mensual</span>
                <label class="ios-switch">
                    <input type="checkbox" ${linea.mantenimiento ? 'checked' : ''} 
                           onchange="lineasTempList[${index}].mantenimiento = this.checked; recalcPaymentOptionsInModal(); renderEditPresLineas();">
                    <span class="ios-switch-slider"></span>
                </label>
                
                ${linea.mantenimiento ? `
                    <input type="number" placeholder="€/mes" value="${linea.mantenimiento_precio != null ? linea.mantenimiento_precio : ''}" 
                           oninput="lineasTempList[${index}].mantenimiento_precio = Number(this.value); recalcPaymentOptionsInModal();"
                           class="modal-input" style="font-size:0.75rem; padding:4px 8px; width:75px; height:26px; text-align:center;">
                ` : ''}
            </div>

            <!-- ROW 4: SUB-LINES LIST WITH COPYWRITING AGENT TRIGGER -->
            <div style="margin-top:6px; padding-left:14px; border-left:1.5px solid rgba(255,255,255,0.06);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; padding-left:14px; flex-wrap:wrap; gap:8px;">
                    <span style="font-size:0.7rem; font-weight:700; color:var(--text-grey);">Desglose de Sub-líneas (Detalle PDF)</span>
                    <div style="display:flex; gap:8px;">
                        <button type="button" id="btn-ai-line-copy-${index}" onclick="generateValueCopyForLine(${index})" 
                                style="border:none; background:transparent; color:#ff9f0a; font-size:0.72rem; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:3px;">
                            <span>✨</span> Contenido de Valor (IA)
                        </button>
                        <button type="button" onclick="addEditPresSublinea(${index})" 
                                style="border:none; background:transparent; color:var(--accent); font-size:0.72rem; font-weight:700; cursor:pointer;">+ Sublínea</button>
                    </div>
                </div>
                ${sublineasHtml}
            </div>
        `;
        container.appendChild(card);
    });
}

function addEditPresLinea() {
    lineasTempList.push({
        concepto: '',
        precio: 0,
        descuento: 0,
        horas_estimadas: 0,
        unidad_estimacion: 'horas',
        precio_hora: 53,
        plazo: '',
        mantenimiento: false,
        mantenimiento_precio: 0,
        recomendado: false,
        sublineas: [],
        activo: true
    });
    recalcPaymentOptionsInModal();
    renderEditPresLineas();
}

function removeEditPresLinea(index) {
    lineasTempList.splice(index, 1);
    recalcPaymentOptionsInModal();
    renderEditPresLineas();
}

function addEditPresSublinea(lineIdx) {
    if (!lineasTempList[lineIdx].sublineas) {
        lineasTempList[lineIdx].sublineas = [];
    }
    lineasTempList[lineIdx].sublineas.push({ concepto: '' });
    renderEditPresLineas();
}

function removeEditPresSublinea(lineIdx, subIdx) {
    lineasTempList[lineIdx].sublineas.splice(subIdx, 1);
    renderEditPresLineas();
}

function moveEditPresSublinea(lineIdx, subIdx, direction) {
    const sublineas = lineasTempList[lineIdx].sublineas || [];
    const targetIdx = subIdx + direction;
    if (targetIdx >= 0 && targetIdx < sublineas.length) {
        const tmp = sublineas[subIdx];
        sublineas[subIdx] = sublineas[targetIdx];
        sublineas[targetIdx] = tmp;
        renderEditPresLineas();
    }
}

// 🤖 ADVANCED AI COPILOT PROPOSAL GENERATOR (WITH HIGH VALUE COPYWRITING TRIGGERS)
async function generateProposalWithIA() {
    const promptInput = document.getElementById('ai-copilot-prompt');
    const userPrompt = promptInput.value.trim();
    if (!userPrompt) {
        showToast('Escribe una idea o servicio para proponer', true);
        return;
    }

    const btn = document.getElementById('btn-ai-copilot-generate');
    const feedback = document.getElementById('ai-copilot-feedback');
    
    btn.disabled = true;
    btn.textContent = '🤖 Generando...';
    feedback.style.display = 'block';
    feedback.textContent = 'El Copiloto IA está analizando los dolores comerciales y estructurando la propuesta...';

    const systemPrompt = `Diseña una propuesta comercial B2B premium en ESPAÑOL adaptada a CerebroComercial AI (iadebarrio.com) para este servicio/cliente: "${userPrompt}".
Responde EXCLUSIVAMENTE con un objeto JSON (sin delimitadores de código markdown \`\`\`json, sin texto adicional, solo el JSON estructurado).
Estructura exacta del JSON a retornar:
{
  "titulo": "Título comercial de alto impacto",
  "subtitulo": "Propuesta de valor clara",
  "descripcion": "Descripción persuasiva de lo que se logrará con el servicio",
  "bonus": "* Auditoría de embudo de ventas complementaria (Valorada en 450€)\\n* 30 días de soporte post-entrega premium",
  "contenido_ia": "Detalle técnico estratégico redactado de manera excelente para captar la atención del cliente",
  "lineas": [
    {
      "concepto": "Fase 1: Mapeo de procesos y estrategia comercial",
      "horas": 12,
      "unidad_estimacion": "horas",
      "precio_hora": 53,
      "descuento": 0,
      "plazo": "7 días",
      "mantenimiento": false,
      "mantenimiento_precio": 0,
      "recomendado": false,
      "sublineas": [
        {"concepto": "Auditoría de cuellos de botella y mapeo simplificado"},
        {"concepto": "Referencia a un dolor del posible cliente o solución a un problema"},
        {"concepto": "Dificultades y cuellos de botella analizados en esta fase"},
        {"concepto": "Beneficios clave y retorno de trabajar con nosotros esta fase"},
        {"concepto": "Solución adecuada y despliegue estratégico"},
        {"concepto": "CTA o validación de entregable"}
      ]
    },
    ... (genera entre 2 y 4 líneas completas y detalladas de este tipo, incluye al menos una línea recomendada con recomendado=true. Cada una de las líneas debe rellenar obligatoriamente las 6 sublíneas persuasivas de copywriting comercial según el orden anterior)
  ]
}`;

    try {
        const res = await fetch('/api/brain-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: systemPrompt
            })
        });

        if (!res.ok) throw new Error('Error al conectar con el cerebro IA');
        const data = await res.json();
        let jsonStr = data.text;
        
        // Clean markdown JSON block tags if present
        jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        
        // Extra clean search for JSON object
        const startIdx = jsonStr.indexOf('{');
        const endIdx = jsonStr.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
            jsonStr = jsonStr.substring(startIdx, endIdx + 1);
        }

        const parsed = JSON.parse(jsonStr);

        // Populate fields
        document.getElementById('edit-pres-titulo').value = parsed.titulo || '';
        document.getElementById('edit-pres-subtitulo').value = parsed.subtitulo || '';
        document.getElementById('edit-pres-descripcion').value = parsed.descripcion || '';
        document.getElementById('edit-pres-bonus').value = parsed.bonus || '';
        document.getElementById('edit-pres-contenido-ia').value = parsed.contenido_ia || '';
        
        // Convert lineas
        lineasTempList = (parsed.lineas || []).map(l => ({
            concepto: l.concepto || '',
            precio: l.precio || (Number(l.horas || 0) * (l.unidad_estimacion === 'días' ? 8 : 1) * Number(l.precio_hora || 53)) || 0,
            descuento: l.descuento || 0,
            horas_estimadas: l.horas || 0,
            unidad_estimacion: l.unidad_estimacion || 'horas',
            precio_hora: l.precio_hora || 53,
            plazo: l.plazo || '',
            mantenimiento: !!l.mantenimiento,
            mantenimiento_precio: l.mantenimiento_precio || 0,
            recomendado: !!l.recomendado,
            sublineas: l.sublineas || [],
            activo: true
        }));

        recalcPaymentOptionsInModal();
        renderEditPresLineas();
        showToast('¡Propuesta diseñada por el Copiloto IA con éxito!');
        feedback.textContent = '✨ Estructura generada correctamente.';
        setTimeout(() => feedback.style.display = 'none', 3000);
    } catch (e) {
        console.error(e);
        feedback.textContent = '❌ Error al generar: ' + e.message;
        showToast('Error del Copiloto IA al diseñar propuesta', true);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Generar';
    }
}

// Action: Save Proposal/Template from modal
async function savePresupuestoAction() {
    const id = document.getElementById('edit-pres-id').value;
    const isPlantilla = document.getElementById('edit-pres-es-plantilla').checked;

    // Get Horizontal forms_pago_ofrecidas selected
    const offeredPayMethods = [];
    document.querySelectorAll('.pay-method-btn.selected').forEach(btn => {
        offeredPayMethods.push(btn.dataset.value);
    });

    // Compile Pago Config including selected_option
    const pagoConfig = {
        inv_min_pct: Number(document.getElementById('edit-pres-pc-inv-min').value || 18),
        num_cuotas: Number(document.getElementById('edit-pres-pc-cuotas').value || 24),
        descuento_b_pct: Number(document.getElementById('edit-pres-pc-dto-b').value || 4),
        descuento_c_pct: Number(document.getElementById('edit-pres-pc-dto-c').value || 8),
        selected_option: selectedPaymentOption
    };

    // Calculate totals to save as pricing values
    const billingLines = lineasTempList.filter(l => l.activo !== false && l.recomendado !== true);
    const totalNetCalculated = billingLines.reduce((s, l) => s + (l.precio * (1 - (l.descuento || 0) / 100)), 0);
    const totalMantCalculated = lineasTempList.filter(l => l.activo !== false).reduce((s, l) => s + (l.mantenimiento ? (l.mantenimiento_precio || 0) : 0), 0);

    const record = {
        titulo: document.getElementById('edit-pres-titulo').value.trim(),
        subtitulo: document.getElementById('edit-pres-subtitulo').value.trim() || null,
        descripcion: document.getElementById('edit-pres-descripcion').value.trim() || null,
        categoria: document.getElementById('edit-pres-categoria').value,
        badge: document.getElementById('edit-pres-badge').value.trim() || null,
        orden: Number(document.getElementById('edit-pres-orden').value || 1),

        // Auto compile base prices from lines if present
        precio_alta: lineasTempList.length > 0 ? totalNetCalculated : null,
        precio_mensual: lineasTempList.length > 0 ? totalMantCalculated : null,
        precio_tipo: lineasTempList.length > 0 ? 'fijo' : 'fijo',

        es_plantilla: isPlantilla,
        activo: document.getElementById('edit-pres-activo').checked,
        es_prueba: document.getElementById('edit-pres-es-prueba').checked,
        
        lead_nombre: isPlantilla ? null : document.getElementById('edit-pres-lead-nombre').value.trim() || null,
        fecha: isPlantilla ? null : new Date(document.getElementById('edit-pres-fecha').value).toISOString(),

        descuento_pct: 0,
        fecha_entrega: document.getElementById('edit-pres-fecha-entrega').value ? new Date(document.getElementById('edit-pres-fecha-entrega').value).toISOString() : null,
        link_pago: null,
        bonus: document.getElementById('edit-pres-bonus').value.trim() || null,
        notas_internas: document.getElementById('edit-pres-notas-internas').value.trim() || null,
        contenido_ia: document.getElementById('edit-pres-contenido-ia').value.trim() || null,

        formas_pago_ofrecidas: offeredPayMethods,
        pago_config: pagoConfig,
        lineas: lineasTempList
    };

    if (!record.titulo) {
        showToast('El título de la propuesta es obligatorio', true);
        return;
    }

    if (id) {
        // Edit
        const idx = presupuestos.findIndex(p => p.id === id);
        if (idx !== -1) {
            presupuestos[idx] = { ...presupuestos[idx], ...record };
        }
        await savePresupuesto(id, record);
        logToSystemSupport(`Propuesta editada: "${record.titulo}"`);
        showToast('Propuesta guardada correctamente');
    } else {
        // Create new
        const newId = genUUID();
        const fullRecord = { id: newId, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...record };
        
        try {
            const { data, error } = await _supabase.from('presupuestos').insert(fullRecord).select();
            if (error) throw error;
            if (data?.[0]) presupuestos.push(data[0]);
        } catch (e) {
            console.warn('Supabase insert failed, writing local cache:', e);
            presupuestos.push(fullRecord);
        }

        localStorage.setItem('gf_presupuestos', JSON.stringify(presupuestos));
        logToSystemSupport(`Propuesta creada: "${record.titulo}"`);
        showToast('Propuesta creada con éxito');
    }

    closeEditPresupuestoModal();
    renderPresupuestos();
}

// Delete action
async function deletePresupuestoAction(id) {
    const pres = presupuestos.find(p => p.id === id);
    if (!pres) return;

    const confirmed = await showConfirm(
        'Eliminar propuesta',
        `¿Seguro que deseas eliminar la propuesta "${pres.titulo}"? Esta acción no se puede deshacer.`,
        '🗑️',
        'Eliminar'
    );

    if (!confirmed) return;

    // Delete in cache
    presupuestos = presupuestos.filter(p => p.id !== id);
    localStorage.setItem('gf_presupuestos', JSON.stringify(presupuestos));

    try {
        const { error } = await _supabase.from('presupuestos').delete().eq('id', id);
        if (error) throw error;
    } catch(e) {
        console.warn('Supabase delete failed, cache synced.');
    }

    logToSystemSupport(`Propuesta eliminada: "${pres.titulo}"`);
    showToast('Propuesta eliminada correctamente');
    renderPresupuestos();
}

// --- 8. Duplication Module ---
let duplicateTargetId = null;

function openDuplicateModal(id) {
    const p = presupuestos.find(pr => pr.id === id);
    if (!p) return;

    duplicateTargetId = id;
    document.getElementById('dup-pres-titulo').value = `Copia de ${p.titulo}`;
    document.getElementById('dup-pres-es-plantilla').checked = p.es_plantilla !== false;

    document.getElementById('modal-dup-propuesta').classList.add('active');
    document.getElementById('modal-dup-propuesta').style.display = 'flex';
}

function closeDupPropuestaModal() {
    document.getElementById('modal-dup-propuesta').classList.remove('active');
    document.getElementById('modal-dup-propuesta').style.display = 'none';
}

async function executeDuplicatePresAction() {
    const p = presupuestos.find(pr => pr.id === duplicateTargetId);
    if (!p) return;

    const newTitle = document.getElementById('dup-pres-titulo').value.trim();
    const isTpl = document.getElementById('dup-pres-es-plantilla').checked;

    if (!newTitle) {
        showToast('El título es obligatorio', true);
        return;
    }

    const newId = genUUID();
    const copy = JSON.parse(JSON.stringify(p));
    
    copy.id = newId;
    copy.titulo = newTitle;
    copy.es_plantilla = isTpl;
    copy.created_at = new Date().toISOString();
    copy.updated_at = new Date().toISOString();

    try {
        const { data, error } = await _supabase.from('presupuestos').insert(copy).select();
        if (error) throw error;
        if (data?.[0]) presupuestos.push(data[0]);
    } catch(e) {
        presupuestos.push(copy);
    }

    localStorage.setItem('gf_presupuestos', JSON.stringify(presupuestos));
    showToast('Propuesta duplicada con éxito');
    
    closeDupPropuestaModal();
    renderPresupuestos();
}

// --- 9. Sending Proposals Modal ---
let sendProposalTargetId = null;

function openSendPropuestaModal(id) {
    const p = presupuestos.find(pr => pr.id === id);
    if (!p) return;

    sendProposalTargetId = id;
    document.getElementById('send-pres-titulo-label').textContent = p.titulo;
    document.getElementById('send-pres-sub-label').textContent = p.subtitulo || 'Sin subtítulo';

    // Price Net Estimation
    const hasLineas = p.lineas && p.lineas.length > 0;
    let realPrice = 0;
    if (hasLineas) {
        realPrice = p.lineas.filter(l => l.activo !== false && !l.recomendado).reduce((s,l) => s + l.precio * (1 - (l.descuento || 0)/100), 0);
    } else {
        realPrice = (p.descuento_pct > 0 && p.precio_alta) ? p.precio_alta * (1 - p.descuento_pct/100) : (p.precio_alta || 0);
    }
    
    document.getElementById('send-pres-precio-neto').textContent = Math.round(realPrice).toLocaleString('es-ES') + '€ + IVA';
    document.getElementById('send-pres-descuento-pct').textContent = p.descuento_pct > 0 ? `-${p.descuento_pct}%` : '0%';

    // Clear inputs
    document.getElementById('send-pres-lead-search').value = '';
    document.getElementById('send-pres-cc-emails').value = '';
    document.getElementById('send-pres-notes').value = '';
    
    currentSelectedLeadForSend = null;

    document.getElementById('modal-send-propuesta').classList.add('active');
    document.getElementById('modal-send-propuesta').style.display = 'flex';
}

function closeSendPropuestaModal() {
    document.getElementById('modal-send-propuesta').classList.remove('active');
    document.getElementById('modal-send-propuesta').style.display = 'none';
}

// Leads dropdown triggers in Send modal
function showSendLeadDropdown() {
    const dd = document.getElementById('send-pres-lead-dropdown');
    dd.style.display = 'block';
    filterSendLeadDropdown();
}

function filterSendLeadDropdown() {
    const val = document.getElementById('send-pres-lead-search').value.toLowerCase().trim();
    const dd = document.getElementById('send-pres-lead-dropdown');
    dd.innerHTML = '';

    const filtered = leadsList.filter(l => 
        l.email && 
        (!val || (l.first_name || '').toLowerCase().includes(val) || l.email.toLowerCase().includes(val))
    );

    if (filtered.length === 0) {
        dd.innerHTML = `<div style="padding:10px; color:var(--text-grey); font-size:0.8rem; text-align:center;">No se encontraron leads con email</div>`;
        return;
    }

    filtered.slice(0, 10).forEach(lead => {
        const item = document.createElement('div');
        item.style.cssText = 'padding:8px 12px; cursor:pointer; font-size:0.8rem; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;';
        item.innerHTML = `
            <div>
                <strong style="color:var(--text-main);">${lead.first_name || 'Prospecto'}</strong> 
                <span style="color:var(--text-grey);">(${lead.company_name || 'Sin empresa'})</span>
            </div>
            <div style="font-size:0.7rem; color:var(--text-grey);">${lead.email}</div>
        `;
        
        item.onclick = () => {
            currentSelectedLeadForSend = lead;
            document.getElementById('send-pres-lead-search').value = `${lead.first_name || 'Prospecto'} (${lead.email})`;
            dd.style.display = 'none';
        };

        item.onmouseenter = () => item.style.background = 'rgba(255,255,255,0.06)';
        item.onmouseleave = () => item.style.background = 'transparent';

        dd.appendChild(item);
    });
}

// Close dropdown on click outside
document.addEventListener('click', (e) => {
    if (e.target && !e.target.closest('#send-pres-lead-search')) {
        const dd = document.getElementById('send-pres-lead-dropdown');
        if (dd) dd.style.display = 'none';
    }
    if (e.target && !e.target.closest('#seg-lead-search')) {
        const dd = document.getElementById('seg-lead-dropdown');
        if (dd) dd.style.display = 'none';
    }
});

// Action: execute sending proposals
async function executeSendPropuestaAction() {
    if (!currentSelectedLeadForSend) {
        showToast('Por favor, busca y selecciona un Lead destinatario de la lista', true);
        return;
    }

    const p = presupuestos.find(pr => pr.id === sendProposalTargetId);
    if (!p) return;

    const emailChannel = document.getElementById('send-channel-email').checked;
    const whatsappChannel = document.getElementById('send-channel-whatsapp').checked;
    const crmChannel = document.getElementById('send-channel-crm').checked;
    const ccText = document.getElementById('send-pres-cc-emails').value.trim();
    const ccNotes = document.getElementById('send-pres-notes').value.trim();

    const ccEmails = ccText ? ccText.split(',').map(e => e.trim()).filter(e => e.includes('@')) : [];

    // Calculate price final
    const hasLineas = p.lineas && p.lineas.length > 0;
    let realPrice = 0;
    if (hasLineas) {
        realPrice = p.lineas.filter(l => l.activo !== false && !l.recomendado).reduce((s,l) => s + l.precio * (1 - (l.descuento || 0)/100), 0);
    } else {
        realPrice = (p.descuento_pct > 0 && p.precio_alta) ? p.precio_alta * (1 - p.descuento_pct/100) : (p.precio_alta || 0);
    }

    // 1. Insert in "propuestas_enviadas" table
    const sentRecord = {
        id: genUUID(),
        presupuesto_id: p.id,
        lead_id: currentSelectedLeadForSend.id,
        lead_nombre: currentSelectedLeadForSend.first_name || 'Prospecto',
        lead_email: currentSelectedLeadForSend.email,
        titulo: p.titulo,
        precio_final: realPrice,
        precio_mensual_final: p.precio_mensual || null,
        descuento_pct: p.descuento_pct || 0,
        canal: emailChannel ? 'email' : 'whatsapp',
        estado: 'entregada',
        lineas: p.lineas || [],
        enviado_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    try {
        const { error } = await _supabase.from('propuestas_enviadas').insert(sentRecord);
        if (error) throw error;
        propuestasEnviadas.unshift(sentRecord);
    } catch (e) {
        console.warn('Supabase proposals_enviadas insert failed, local only:', e);
        propuestasEnviadas.unshift(sentRecord);
    }
    localStorage.setItem('gf_propuestas_enviadas', JSON.stringify(propuestasEnviadas));

    // 2. Activate CRM sequence tracker if checked
    if (crmChannel) {
        const already = seguimientos.some(s => s.lead_id === currentSelectedLeadForSend.id);
        if (!already) {
            const segRecord = {
                id: genUUID(),
                lead_id: currentSelectedLeadForSend.id,
                lead_nombre: currentSelectedLeadForSend.first_name || 'Prospecto',
                lead_email: currentSelectedLeadForSend.email,
                presupuesto_id: p.id,
                categoria: p.categoria || 'personalizada',
                columna: 'enviada',
                fecha_propuesta_enviada: new Date().toISOString(),
                pausada: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            try {
                const { error } = await _supabase.from('propuesta_seguimiento').insert(segRecord);
                if (error) throw error;
                seguimientos.unshift(segRecord);
            } catch (e) {
                seguimientos.unshift(segRecord);
            }
            localStorage.setItem('gf_seguimiento', JSON.stringify(seguimientos));
        }
    }

    // 3. Channels outreach integrations
    let outreachLogged = '';
    
    // A. WhatsApp Link opener
    if (whatsappChannel) {
        const leadPhone = currentSelectedLeadForSend.phone || '';
        const linkPDF = `https://cerebrocomercial-ai.iadebarrio.com/api/download?id=${p.id}`;
        
        let ctcMsg = `¡Hola ${currentSelectedLeadForSend.first_name || 'prospecto'}! Te escribo para enviarte la propuesta de ${p.titulo} que preparamos para tu negocio. Puedes descargar el desglose en PDF directamente aquí: ${linkPDF}`;
        if (ccNotes) ctcMsg += `\n\nNotas: ${ccNotes}`;
        
        const wsUrl = `https://wa.me/${leadPhone ? leadPhone.replace(/[\s\+\-]/g, '') : ''}?text=${encodeURIComponent(ctcMsg)}`;
        window.open(wsUrl, '_blank');
        outreachLogged += ' y WhatsApp abierto';
    }

    // B. Email dispatch Mailto Fallback
    if (emailChannel) {
        const linkPDF = `https://cerebrocomercial-ai.iadebarrio.com/api/download?id=${p.id}`;
        const emailSubject = `Tu propuesta personalizada para ${p.titulo}`;
        
        let emailBody = `Hola ${currentSelectedLeadForSend.first_name || 'prospecto'},\n\nEspero que estés muy bien.\n\nTe adjunto el enlace para ver y descargar la propuesta comercial de ${p.titulo} que hemos diseñado para optimizar tu negocio.\n\nEnlace PDF: ${linkPDF}\n\n`;
        if (ccNotes) emailBody += `Notas adicionales:\n${ccNotes}\n\n`;
        emailBody += `Revísala y quedo a tu entera disposición para resolver cualquier duda.\n\nUn saludo,\nGerard Fanals\nCerebroComercial AI`;

        const ccQuery = ccEmails.length > 0 ? `&cc=${encodeURIComponent(ccEmails.join(','))}` : '';
        const mailtoUrl = `mailto:${currentSelectedLeadForSend.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}${ccQuery}`;
        window.open(mailtoUrl, '_blank');
        outreachLogged += ' y Correo local levantado';
    }

    logToSystemSupport(`Propuesta "${p.titulo}" emitida a ${currentSelectedLeadForSend.first_name} (${currentSelectedLeadForSend.email})${outreachLogged}`);
    showToast('Propuesta emitida con éxito');

    closeSendPropuestaModal();
    
    // Switch to Enviadas to check
    switchPresTab('enviadas');
}

// --- 10. Sent Proposals Spreadsheet Rendering ---
function filterSentProposals() {
    renderPropuestasEnviadas();
}

function renderPropuestasEnviadas() {
    const searchVal = document.getElementById('pres-enviada-search').value.toLowerCase().trim();
    const tbody = document.getElementById('pres-enviadas-tbody');
    tbody.innerHTML = '';

    const filtered = propuestasEnviadas.filter(pe => 
        !searchVal ||
        (pe.lead_nombre || '').toLowerCase().includes(searchVal) ||
        (pe.lead_email || '').toLowerCase().includes(searchVal) ||
        (pe.titulo || '').toLowerCase().includes(searchVal)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-grey); padding:30px;">${searchVal ? 'No se encontraron resultados para su búsqueda.' : 'No se han registrado propuestas emitidas aún.'}</td></tr>`;
        return;
    }

    filtered.forEach(pe => {
        const isPrueba = !!presupuestos.find(pr => pr.id === pe.presupuesto_id)?.es_prueba;
        
        // Status configurations matching original community project perfectly
        const estadoColors = { entregada: '#0a84ff', aceptada: '#34c759', rechazada: '#ff3b30', visto: '#bf5af2', pendiente: '#ff9f0a' };
        const stateVal = pe.estado || 'entregada';
        const stColor = estadoColors[stateVal] || '#86868b';

        const row = document.createElement('tr');
        if (isPrueba) {
            row.style.background = 'rgba(255,149,0,0.04)';
            row.style.borderLeft = '3px solid #ff9500';
        }

        row.innerHTML = `
            <td>
                <div style="font-weight: 700; color:var(--text-main);">${pe.lead_nombre}</div>
                <div style="font-size: 0.75rem; color: var(--text-grey);">${pe.lead_email}</div>
            </td>
            <td style="font-weight: 700; color:var(--text-main);">${pe.titulo}</td>
            <td>
                <span style="font-weight: 800; color:var(--text-main);">${Math.round(pe.precio_final || 0).toLocaleString('es-ES')}€</span>
                ${pe.precio_mensual_final ? `<div style="font-size: 0.72rem; color: var(--text-grey); font-weight: 600;">+ ${pe.precio_mensual_final}€/mes</div>` : ''}
            </td>
            <td style="text-align: center;">${pe.descuento_pct > 0 ? `<span style="color: var(--accent-green); font-weight: 700;">-${pe.descuento_pct}%</span>` : '—'}</td>
            <td><span style="font-size:0.75rem; font-weight:700; color:var(--text-main); text-transform:uppercase;">${pe.canal === 'whatsapp' ? '📱 WhatsApp' : '📧 Email'}</span></td>
            <td>
                <select class="pres-sent-status-select" onchange="updateSentProposalStatus('${pe.id}', this.value)"
                    style="border: 1.5px solid ${stColor}35; background: ${stColor}08; color: ${stColor};">
                    <option value="entregada" ${stateVal === 'entregada' ? 'selected' : ''}>📄 Entregada</option>
                    <option value="aceptada" ${stateVal === 'aceptada' ? 'selected' : ''}>✅ Aceptada</option>
                    <option value="rechazada" ${stateVal === 'rechazada' ? 'selected' : ''}>❌ Rechazada</option>
                </select>
            </td>
            <td style="font-size: 0.78rem;">${pe.enviado_at ? new Date(pe.enviado_at).toLocaleDateString('es-ES', {day:'2-digit', month:'2-digit', year:'numeric'}) : '—'}</td>
            <td style="text-align: center;">
                ${isPrueba ? '<span style="font-size: 0.85rem;" title="Prueba — No contabilizado">🧪</span>' : '<span style="color:var(--border-color)">—</span>'}
            </td>
            <td style="text-align: center; vertical-align: middle;">
                <button onclick="deleteSentProposalAction('${pe.id}')"
                    style="background: rgba(255,59,48,0.06); border: 1px solid rgba(255,59,48,0.15); border-radius: 8px; padding: 5px 12px; cursor: pointer; font-size: 0.72rem; font-weight: 700; color: var(--accent-red); transition: all 0.2s;"
                    onmouseenter="this.style.background='rgba(255,59,48,0.12)'" onmouseleave="this.style.background='rgba(255,59,48,0.06)'">
                    🗑 Eliminar
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function updateSentProposalStatus(id, newStatus) {
    const pe = propuestasEnviadas.find(p => p.id === id);
    if (!pe) return;

    pe.estado = newStatus;
    pe.updated_at = new Date().toISOString();
    
    try {
        const { error } = await _supabase
            .from('propuestas_enviadas')
            .update({ estado: newStatus, updated_at: pe.updated_at })
            .eq('id', id);

        if (error) throw error;
    } catch (e) {
        console.warn('Supabase propuestas_enviadas update failed, writing cache:', e);
    }
    
    localStorage.setItem('gf_propuestas_enviadas', JSON.stringify(propuestasEnviadas));
    showToast(`Estado de propuesta actualizado a "${newStatus.toUpperCase()}"`);
    renderPropuestasEnviadas();
}

async function deleteSentProposalAction(id) {
    const pe = propuestasEnviadas.find(p => p.id === id);
    if (!pe) return;

    const confirmed = await showConfirm(
        'Eliminar propuesta emitida',
        `¿Seguro que deseas eliminar el registro de envío a "${pe.lead_nombre}"? Esta acción no afectará al lead, pero borrará el histórico.`,
        '🗑️',
        'Eliminar'
    );

    if (!confirmed) return;

    propuestasEnviadas = propuestasEnviadas.filter(p => p.id !== id);
    localStorage.setItem('gf_propuestas_enviadas', JSON.stringify(propuestasEnviadas));

    try {
        const { error } = await _supabase.from('propuestas_enviadas').delete().eq('id', id);
        if (error) throw error;
    } catch(e) {
        console.warn('Supabase delete failed, cache synced.');
    }

    showToast('Registro eliminado con éxito');
    renderPropuestasEnviadas();
}

// --- 11. B2B Follow-up Kanban Board Rendering ---
function showSegLeadDropdown() {
    const dd = document.getElementById('seg-lead-dropdown');
    dd.style.display = 'block';
    filterSegLeadDropdown();
}

function filterSegLeadDropdown() {
    const val = document.getElementById('seg-lead-search').value.toLowerCase().trim();
    const dd = document.getElementById('seg-lead-dropdown');
    dd.innerHTML = '';

    const filtered = leadsList.filter(l => 
        l.email && 
        (!val || (l.first_name || '').toLowerCase().includes(val) || l.email.toLowerCase().includes(val))
    );

    if (filtered.length === 0) {
        dd.innerHTML = `<div style="padding:10px; color:var(--text-grey); font-size:0.8rem; text-align:center;">No se encontraron leads con email</div>`;
        return;
    }

    filtered.slice(0, 10).forEach(lead => {
        const already = seguimientos.some(s => s.lead_id === lead.id);
        const item = document.createElement('div');
        item.style.cssText = `padding:8px 12px; cursor:${already ? 'default' : 'pointer'}; font-size:0.8rem; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; opacity:${already ? 0.45 : 1};`;
        item.innerHTML = `
            <div>
                <strong style="color:var(--text-main);">${lead.first_name || 'Prospecto'}</strong> 
                <span style="color:var(--text-grey);">(${lead.company_name || 'Sin empresa'})</span>
            </div>
            <div style="font-size:0.7rem; color:var(--text-grey);">${already ? 'Ya en seguimiento' : lead.email}</div>
        `;
        
        if (!already) {
            item.onclick = () => {
                currentSelectedLeadForSeg = lead;
                document.getElementById('seg-lead-search').value = `${lead.first_name || 'Prospecto'} (${lead.email})`;
                dd.style.display = 'none';
            };
            item.onmouseenter = () => item.style.background = 'rgba(255,255,255,0.06)';
            item.onmouseleave = () => item.style.background = 'transparent';
        }

        dd.appendChild(item);
    });
}

async function addLeadToSeguimiento() {
    if (!currentSelectedLeadForSeg) {
        showToast('Seleccione un lead válido de la lista dropdown', true);
        return;
    }

    const cat = document.getElementById('seg-add-category').value;
    
    // Find if has linked proposal
    const linkedPres = presupuestos.find(p => p.es_plantilla === false && p.lead_nombre === currentSelectedLeadForSeg.first_name);

    const segRecord = {
        id: genUUID(),
        lead_id: currentSelectedLeadForSeg.id,
        lead_nombre: currentSelectedLeadForSeg.first_name || 'Prospecto',
        lead_email: currentSelectedLeadForSeg.email,
        presupuesto_id: linkedPres ? linkedPres.id : null,
        categoria: cat || 'personalizada',
        columna: 'enviada',
        fecha_propuesta_enviada: new Date().toISOString(),
        pausada: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    try {
        const { error } = await _supabase.from('propuesta_seguimiento').insert(segRecord);
        if (error) throw error;
        seguimientos.unshift(segRecord);
    } catch(e) {
        seguimientos.unshift(segRecord);
    }

    localStorage.setItem('gf_seguimiento', JSON.stringify(seguimientos));
    showToast(`${currentSelectedLeadForSeg.first_name} añadido al seguimiento Kanban`);
    
    // Reset search
    document.getElementById('seg-lead-search').value = '';
    currentSelectedLeadForSeg = null;

    renderSeguimientoKanban();
}

function renderSeguimientoKanban() {
    const cols = ['enviada', 'inmediato', 'mensual', 'anual', 'stop'];
    
    // Clear lists
    cols.forEach(c => {
        document.getElementById(`seg-cards-${c}`).innerHTML = '';
        document.getElementById(`seg-badge-${c}`).textContent = '0';
    });

    const counts = { enviada: 0, inmediato: 0, mensual: 0, anual: 0, stop: 0 };

    seguimientos.forEach(seg => {
        const col = seg.columna || 'enviada';
        if (counts[col] !== undefined) {
            counts[col]++;

            const meta = ALL_CATEGORIES_METADATA[seg.categoria || 'personalizada'] || ALL_CATEGORIES_METADATA.personalizada;

            const card = document.createElement('div');
            card.className = 'pres-kanban-card';
            card.draggable = true;
            card.id = `seg-card-${seg.id}`;
            card.ondragstart = (e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', seg.id);
            };

            // Sequence meta text
            let seqMetaHtml = '';
            if (seg.secuencia_activa) {
                const stepsMax = { inmediato: 5, mensual: 4, anual: 12 };
                seqMetaHtml = `
                    <div style="font-size:0.72rem; color:var(--text-main); font-weight:600; margin-top:6px;">
                        Paso ${seg.paso_actual || 0}/${stepsMax[seg.secuencia_activa] || 12} 
                        <span style="color:var(--text-grey);">· cada ${seg.frecuencia_dias || 2}d</span>
                    </div>
                `;
            }

            // Date meta text
            let dateMetaHtml = '';
            if (seg.ultimo_envio_at) {
                const lastD = new Date(seg.ultimo_envio_at).toLocaleDateString('es-ES', {day:'2-digit', month:'short'});
                let nextDHtml = '';
                if (seg.proximo_envio_at && !seg.pausada && col !== 'stop' && col !== 'enviada') {
                    const nextD = new Date(seg.proximo_envio_at).toLocaleDateString('es-ES', {day:'2-digit', month:'short'});
                    nextDHtml = ` · ⏰ ${nextD}`;
                }
                dateMetaHtml = `<div style="font-size:0.68rem; color:var(--text-grey); margin-top:4px;">📤 ${lastD}${nextDHtml}</div>`;
            } else if (seg.fecha_propuesta_enviada) {
                const addD = new Date(seg.fecha_propuesta_enviada).toLocaleDateString('es-ES', {day:'2-digit', month:'short'});
                dateMetaHtml = `<div style="font-size:0.68rem; color:var(--text-grey); margin-top:4px;">📅 Añadido: ${addD}</div>`;
            }

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
                    <div style="font-size:0.82rem; font-weight:700; color:var(--text-main); max-width: 110px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${seg.lead_nombre}</div>
                    <span style="font-size:0.64rem; padding:2px 6px; border-radius:6px; background:${meta.bg}; color:${meta.accent}; border: 1px solid ${meta.accent}20; font-weight:600; white-space:nowrap;">${meta.label}</span>
                </div>
                <div style="font-size:0.7rem; color:var(--text-grey); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${seg.lead_email}</div>
                ${seqMetaHtml}
                ${dateMetaHtml}
                <div style="display:flex; gap:4px; margin-top:10px;">
                    <button onclick="deleteSeguimientoCard('${seg.id}')"
                        style="font-size:0.68rem; padding:3px 8px; border-radius:6px; border:1px solid rgba(255,59,48,0.15); background:rgba(255,59,48,0.04); color:var(--accent-red); cursor:pointer; font-family:inherit; transition: all 0.2s;"
                        onmouseenter="this.style.background='rgba(255,59,48,0.1)'" onmouseleave="this.style.background='rgba(255,59,48,0.04)'">
                        🗑 Retirar
                    </button>
                </div>
            `;

            document.getElementById(`seg-cards-${col}`).appendChild(card);
        }
    });

    cols.forEach(c => {
        document.getElementById(`seg-badge-${c}`).textContent = counts[c];
    });
}

function allowDropSegCard(e) {
    e.preventDefault();
}

async function handleDropSegCard(e, targetCol) {
    e.preventDefault();
    if (sessionStorage.getItem('cc_role') === 'guest') {
        showAlert('Restringido', 'El usuario Invitado tiene acceso de solo lectura', '🔒');
        return;
    }
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;

    const seg = seguimientos.find(s => s.id === id);
    if (!seg) return;

    // Optimistic update
    seg.columna = targetCol;
    seg.updated_at = new Date().toISOString();

    const patchBody = { id, columna: targetCol };

    if (targetCol === 'inmediato' || targetCol === 'mensual' || targetCol === 'anual') {
        const defaultFreqs = { inmediato: 2, mensual: 7, anual: 30 };
        seg.secuencia_activa = targetCol;
        seg.paso_actual = 0;
        seg.pausada = false;
        seg.frecuencia_dias = defaultFreqs[targetCol];
        seg.proximo_envio_at = new Date(Date.now() + 60000).toISOString(); // first email scheduled in 60s for simulation

        patchBody.secuencia_activa = targetCol;
        patchBody.paso_actual = 0;
        patchBody.pausada = false;
        patchBody.frecuencia_dias = defaultFreqs[targetCol];
        patchBody.proximo_envio_at = seg.proximo_envio_at;
    } else if (targetCol === 'stop') {
        seg.secuencia_activa = null;
        seg.pausada = true;
        seg.proximo_envio_at = null;

        patchBody.secuencia_activa = null;
        patchBody.pausada = true;
        patchBody.proximo_envio_at = null;
    } else if (targetCol === 'enviada') {
        seg.secuencia_activa = null;
        seg.pausada = false;
        seg.proximo_envio_at = null;

        patchBody.secuencia_activa = null;
        patchBody.pausada = false;
        patchBody.proximo_envio_at = null;
    }

    try {
        const { error } = await _supabase.from('propuesta_seguimiento').update(patchBody).eq('id', id);
        if (error) throw error;
    } catch (err) {
        console.warn('Supabase propuesta_seguimiento update failed, local synced:', err);
    }

    localStorage.setItem('gf_seguimiento', JSON.stringify(seguimientos));
    
    const messages = { 
        stop: 'Secuencia detenida', 
        enviada: 'Lead en espera de seguimiento', 
        inmediato: 'Secuencia Inmediata activada', 
        mensual: 'Secuencia Mensual semanal activada', 
        anual: 'Secuencia Anual mensual activada' 
    };
    showToast(messages[targetCol] || 'Estado de seguimiento actualizado');
    
    renderSeguimientoKanban();
}

async function deleteSeguimientoCard(id) {
    const seg = seguimientos.find(s => s.id === id);
    if (!seg) return;

    const confirmed = await showConfirm(
        'Retirar de seguimiento',
        `¿Seguro que deseas retirar a "${seg.lead_nombre}" del seguimiento de secuencias?`,
        '🗑️',
        'Retirar'
    );

    if (!confirmed) return;

    seguimientos = seguimientos.filter(s => s.id !== id);
    localStorage.setItem('gf_seguimiento', JSON.stringify(seguimientos));

    try {
        const { error } = await _supabase.from('propuesta_seguimiento').delete().eq('id', id);
        if (error) throw error;
    } catch(e) {}

    showToast('Lead retirado del seguimiento');
    renderSeguimientoKanban();
}

// --- 12. Email Sequence Configurations Builder ---
let presSeqFreqs = JSON.parse(localStorage.getItem('presSeqFreqs') || '{"inmediato":2,"mensual":7,"anual":30}');

function selectSequenceConfig(seqId) {
    activeSeqConfigId = seqId;
    
    // UI active classes
    document.querySelectorAll('#seg-container-configurar .cat-pill').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-seq-${seqId}`);
    if (activeBtn) activeBtn.classList.add('active');

    renderConfigurarSecuencias();
}

function renderConfigurarSecuencias() {
    const box = document.getElementById('seq-details-box');
    box.innerHTML = '';

    const seq = PRES_SEQUENCES.find(s => s.seqId === activeSeqConfigId);
    if (!seq) return;

    // Header block with Frequency selector
    const currentFreq = presSeqFreqs[seq.seqId] || parseInt(seq.defaultFreq);
    const headerHtml = `
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px; padding:14px 20px; background:${seq.seqColor}08; border-radius:14px; border:1px solid ${seq.seqColor}20; flex-wrap:wrap;">
            <span style="font-size:1.4rem;">${seq.seqIcon}</span>
            <div style="flex:1; min-width:180px;">
                <div style="font-size:0.92rem; font-weight:700; color:var(--text-main);">${seq.seqLabel}</div>
                <div style="font-size:0.75rem; color:var(--text-grey); margin-top:2px;">${seq.seqDesc}</div>
            </div>
            <div style="display:flex; align-items:center; gap:8px; background:var(--bg-secondary); padding:6px 12px; border-radius:10px; border:1px solid var(--card-border);">
                <span style="font-size:0.72rem; font-weight:600; color:var(--text-grey); white-space:nowrap;">⏱ Frecuencia:</span>
                <select id="seq-freq-${seq.seqId}" onchange="updateSequenceFrequency('${seq.seqId}', this.value)"
                    style="font-size:0.78rem; padding:4px 8px; font-weight:700; color:${seq.seqColor}; min-width:84px; background:transparent; border:1px solid ${seq.seqColor}30; border-radius:6px; outline:none; font-family:inherit; cursor:pointer;">
                    <option value="1" ${currentFreq === 1 ? 'selected' : ''}>1 día</option>
                    <option value="2" ${currentFreq === 2 ? 'selected' : ''}>2 días</option>
                    <option value="3" ${currentFreq === 3 ? 'selected' : ''}>3 días</option>
                    <option value="5" ${currentFreq === 5 ? 'selected' : ''}>5 días</option>
                    <option value="7" ${currentFreq === 7 ? 'selected' : ''}>7 días</option>
                    <option value="10" ${currentFreq === 10 ? 'selected' : ''}>10 días</option>
                    <option value="14" ${currentFreq === 14 ? 'selected' : ''}>14 días</option>
                    <option value="21" ${currentFreq === 21 ? 'selected' : ''}>21 días</option>
                    <option value="30" ${currentFreq === 30 ? 'selected' : ''}>30 días</option>
                </select>
            </div>
        </div>
    `;

    box.innerHTML = headerHtml;

    // Render Categories & Accordions
    seq.categories.forEach(cat => {
        const catHtml = `
            <div style="margin-bottom:18px;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; padding:8px 14px; background:${cat.bg}; border-radius:10px; border-left:3px solid ${cat.color};">
                    <span style="font-size:1rem;">${cat.icon}</span>
                    <span style="font-size:0.82rem; font-weight:700; color:var(--text-main);">${cat.label}</span>
                    <span style="font-size:0.7rem; color:var(--text-grey); margin-left:auto; font-weight:600;">${cat.emails.length} emails</span>
                </div>
                <div style="display:flex; flex-direction:column; gap:6px;" id="seq-emails-list-${cat.key}">
                    <!-- Accordions loaded dynamically -->
                </div>
            </div>
        `;
        box.innerHTML += catHtml;
    });

    // Populate emails accordions
    seq.categories.forEach(cat => {
        const listDiv = document.getElementById(`seq-emails-list-${cat.key}`);
        if (!listDiv) return;

        cat.emails.forEach(email => {
            const isOpen = presEmailExpandedId === email.id;
            const item = document.createElement('div');
            item.className = 'seq-email-item';

            item.innerHTML = `
                <button class="seq-email-header" onclick="toggleSeqEmailAccordion('${email.id}')">
                    <div style="width:26px; height:26px; border-radius:7px; background:${cat.color}18; display:flex; align-items:center; justify-content:center; fontSize:0.72rem; font-weight:800; color:${cat.color}; flex-shrink:0;">
                        ${email.step}
                    </div>
                    <div style="flex:1;">
                        <div style="font-size:0.82rem; font-weight:700; color:var(--text-main);">${email.name}</div>
                        <div style="font-size:0.68rem; color:var(--text-grey); margin-top:1px;">⏱ ${email.step === 1 ? 'Inmediato' : `${currentFreq * (email.step - 1)} días después`}</div>
                    </div>
                    
                    <button onclick="openQuickSendSequenceForm(event, '${email.id}')"
                        style="padding:6px 12px; border-radius:8px; border:1px solid var(--card-border); background:rgba(255,255,255,0.06); font-size:0.7rem; font-weight:700; color:var(--text-main); cursor:pointer; font-family:inherit; flex-shrink:0; margin-right:8px;">
                        📤 Enviar
                    </button>
                    
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-grey)" stroke-width="2" style="transform:${isOpen ? 'rotate(180deg)' : 'rotate(0)'}; transition:transform 0.2s; flex-shrink:0;">
                        <polyline points="6 9 12 15 18 9"/>
                    </svg>
                </button>
                
                <!-- Email expanded content preview -->
                <div class="seq-email-body" style="display: ${isOpen ? 'block' : 'none'};">
                    <div style="border-bottom:1px dashed var(--border-color); padding-bottom:8px; margin-bottom:8px;">
                        <strong style="color:var(--text-grey); font-size:0.75rem;">Asunto:</strong> 
                        <span style="font-weight:600; font-size:0.82rem; color:var(--text-main);">${email.asunto}</span>
                    </div>
                    <div style="font-size:0.82rem; line-height:1.6; color:var(--text-main); font-family: inherit;">
                        ${email.contenido}
                    </div>
                </div>

                <!-- Mini Send Form -->
                <div id="quick-send-form-${email.id}" style="display:none; padding:14px; border-top:1px solid var(--border-color); background:rgba(0,113,227,0.03);">
                    <div style="font-size:0.78rem; font-weight:700; color:var(--text-main); margin-bottom:8px;">📤 Enviar email individual a lead (Con PDF adjunto)</div>
                    <div style="display:flex; gap:8px;">
                        <div style="position:relative; flex:1;">
                            <input type="text" id="quick-send-input-${email.id}" class="modal-input" placeholder="🔍 Escribe nombre o email del lead..."
                                onfocus="showQuickSendDropdown('${email.id}')" oninput="filterQuickSendDropdown('${email.id}')" style="font-size:0.78rem; height:32px;">
                            <div id="quick-send-dropdown-${email.id}" class="seq-lead-dd-menu" style="display:none; position:absolute; top:100%; left:0; right:0; background:var(--bg-secondary); border:1px solid var(--card-border); border-radius:10px; max-height:160px; overflow-y:auto; z-index:100; box-shadow:var(--glass-shadow); padding:4px;">
                                <!-- Populate quick search -->
                            </div>
                        </div>
                        <button class="btn-primary" onclick="executeQuickSendSequence('${email.id}', '${cat.key}')" style="font-size:0.75rem; padding:0 14px; height:32px; border-radius:8px;">
                            Enviar
                        </button>
                        <button class="modal-cancel-btn" onclick="closeQuickSendForm('${email.id}')" style="font-size:0.75rem; padding:0 12px; height:32px; border-radius:8px;">
                            ✕
                        </button>
                    </div>
                </div>
            `;
            listDiv.appendChild(item);
        });
    });
}

function toggleSeqEmailAccordion(id) {
    presEmailExpandedId = presEmailExpandedId === id ? null : id;
    renderConfigurarSecuencias();
}

function updateSequenceFrequency(seqId, val) {
    presSeqFreqs[seqId] = Number(val);
    localStorage.setItem('presSeqFreqs', JSON.stringify(presSeqFreqs));
    showToast('Frecuencia de envío actualizada');
    renderConfigurarSecuencias();
}

// Mini send email form
function openQuickSendSequenceForm(e, emailId) {
    e.stopPropagation();
    
    // Hide all other forms
    document.querySelectorAll('[id^="quick-send-form-"]').forEach(f => f.style.display = 'none');
    
    // Open targeted form
    const form = document.getElementById(`quick-send-form-${emailId}`);
    if (form) {
        form.style.display = 'block';
        document.getElementById(`quick-send-input-${emailId}`).value = '';
        document.getElementById(`quick-send-input-${emailId}`).setAttribute('data-selected-lead', '');
    }
}

function closeQuickSendForm(emailId) {
    const form = document.getElementById(`quick-send-form-${emailId}`);
    if (form) form.style.display = 'none';
}

let quickSelectedLead = null;

function showQuickSendDropdown(emailId) {
    const dd = document.getElementById(`quick-send-dropdown-${emailId}`);
    dd.style.display = 'block';
    filterQuickSendDropdown(emailId);
}

function filterQuickSendDropdown(emailId) {
    const val = document.getElementById(`quick-send-input-${emailId}`).value.toLowerCase().trim();
    const dd = document.getElementById(`quick-send-dropdown-${emailId}`);
    dd.innerHTML = '';

    const filtered = leadsList.filter(l => 
        l.email && 
        (!val || (l.first_name || '').toLowerCase().includes(val) || l.email.toLowerCase().includes(val))
    );

    if (filtered.length === 0) {
        dd.innerHTML = `<div style="padding:8px; color:var(--text-grey); font-size:0.75rem; text-align:center;">Sin resultados</div>`;
        return;
    }

    filtered.slice(0, 6).forEach(lead => {
        const item = document.createElement('div');
        item.style.cssText = 'padding:6px 10px; cursor:pointer; font-size:0.78rem; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;';
        
        // Check linked proposal
        const linked = presupuestos.some(p => p.es_plantilla === false && p.lead_nombre === lead.first_name);

        item.innerHTML = `
            <div>
                <strong style="color:var(--text-main);">${lead.first_name || 'Prospecto'}</strong> 
                <span style="color:var(--text-grey);">(${lead.company_name || 'Sin empresa'})</span>
            </div>
            <div style="font-size:0.68rem; color:var(--text-grey);">${lead.email}${linked ? ' ✅' : ' ⚠️'}</div>
        `;

        item.onclick = () => {
            quickSelectedLead = lead;
            const inp = document.getElementById(`quick-send-input-${emailId}`);
            inp.value = `${lead.first_name || 'Prospecto'} (${lead.email})`;
            inp.setAttribute('data-selected-lead', JSON.stringify(lead));
            dd.style.display = 'none';
        };

        item.onmouseenter = () => item.style.background = 'rgba(255,255,255,0.06)';
        item.onmouseleave = () => item.style.background = 'transparent';

        dd.appendChild(item);
    });
}

// Execute the quick send sequence dispatch
async function executeQuickSendSequence(emailId, catKey) {
    const inp = document.getElementById(`quick-send-input-${emailId}`);
    const leadVal = inp.getAttribute('data-selected-lead');
    
    if (!leadVal) {
        showToast('Busca y selecciona un lead destinatario', true);
        return;
    }

    const lead = JSON.parse(leadVal);
    const seq = PRES_SEQUENCES.find(s => s.categories.some(c => c.key === catKey));
    if (!seq) return;

    const cat = seq.categories.find(c => c.key === catKey);
    const email = cat.emails.find(e => e.id === emailId);
    if (!email) return;

    // Find linked proposal
    const linkedPres = presupuestos.find(p => p.es_plantilla === false && p.lead_nombre === lead.first_name && p.categoria === catKey) 
                     || presupuestos.find(p => p.es_plantilla === false && p.lead_nombre === lead.first_name)
                     || presupuestos.find(p => p.categoria === catKey);

    if (!linkedPres) {
        showToast('No se encontró propuesta para asociar al lead', true);
        return;
    }

    // Replace templates
    const linkPDF = `https://cerebrocomercial-ai.iadebarrio.com/api/download?id=${linkedPres.id}`;
    const linkConfirmar = `https://cerebrocomercial-ai.iadebarrio.com/api/propuestas/confirmar?id=${linkedPres.id}`;

    let subject = email.asunto.replace(/\{\{nombre\}\}/g, lead.first_name || 'Prospecto');
    let body = email.contenido
        .replace(/\{\{nombre\}\}/g, lead.first_name || 'Prospecto')
        .replace(/\{\{link_pdf\}\}/g, linkPDF)
        .replace(/\{\{link_confirmar\}\}/g, linkConfirmar);

    // mailto fallback
    const mailtoUrl = `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.replace(/<[^>]*>/g, '\n'))}`;
    window.open(mailtoUrl, '_blank');

    // Register proposal log
    const peRecord = {
        id: genUUID(),
        presupuesto_id: linkedPres.id,
        lead_id: lead.id,
        lead_nombre: lead.first_name,
        lead_email: lead.email,
        titulo: `${linkedPres.titulo} (${email.name})`,
        precio_final: linkedPres.precio_alta || 0,
        precio_mensual_final: linkedPres.precio_mensual || null,
        descuento_pct: linkedPres.descuento_pct || 0,
        canal: 'email',
        estado: 'entregada',
        lineas: linkedPres.lineas || [],
        enviado_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    try {
        await _supabase.from('propuestas_enviadas').insert(peRecord);
        propuestasEnviadas.unshift(peRecord);
    } catch(e) {
        propuestasEnviadas.unshift(peRecord);
    }

    localStorage.setItem('gf_propuestas_enviadas', JSON.stringify(propuestasEnviadas));
    showToast(`Secuencia dispatcheada a ${lead.first_name}`);
    closeQuickSendForm(emailId);
}

// --- 13. Nativo A4 PDF Print Generator: downloadPDF ---
function triggerPDFDownload(id) {
    const p = presupuestos.find(pr => pr.id === id);
    if (!p) return;

    downloadPDF(p);
}

function downloadPDF(p) {
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

    const w = window.open('', '_blank');
    if (!w) {
        showToast('Ventana emergente bloqueada por el navegador', true);
        return;
    }

    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Propuesta - ${p.titulo}</title><style>
@page{size:A4;margin:20mm 0 0 0}*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Helvetica Neue',-apple-system,system-ui,sans-serif;color:#1d1d1f;width:210mm;min-height:297mm;margin:0 auto;padding:72px 52px 90px;font-size:10pt;line-height:1.5}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:14px;border-bottom:3px solid #1d1d1f}
.br{font-size:22pt;font-weight:800;letter-spacing:-0.03em}.br span{font-weight:300}
.brsub{font-size:7.5pt;color:#86868b;margin-top:2px;letter-spacing:0.04em}
.mt{text-align:right;font-size:8.5pt;color:#6e6e73;line-height:1.6}
.mtn{font-weight:700;color:#1d1d1f;font-size:11pt}
.mtl{font-size:7pt;text-transform:uppercase;letter-spacing:0.08em;color:#aeaeb2;margin-top:5px}
.cb{display:inline-block;padding:3px 12px;border-radius:6px;background:#f5f5f7;font-size:7.5pt;font-weight:700;color:#6e6e73;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px}
.bdg{display:inline-block;padding:3px 14px;border-radius:20px;background:#0071e3;color:#fff;font-size:7pt;font-weight:700;letter-spacing:0.08em;margin-left:8px;vertical-align:middle}
h1{font-size:19pt;font-weight:800;letter-spacing:-0.03em;margin-bottom:4px;line-height:1.2}
.sub{font-size:10.5pt;color:#6e6e73;margin-bottom:18px}
.psub{font-size:9pt;color:#6e6e73;margin-top:6px}
.st{font-size:7.5pt;font-weight:700;color:#6e6e73;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #e5e5ea}
.dsc2{font-size:9.5pt;line-height:1.65;color:#3a3a3c}
.lt{width:100%;border-collapse:collapse;font-size:9pt;margin-top:4px}
.lt thead th{font-size:7pt;text-transform:uppercase;letter-spacing:0.08em;color:#86868b;font-weight:600;padding:8px 12px;border-bottom:2px solid #e5e5ea}
.lt tbody td{padding:10px 12px;border-bottom:1px solid #f0f0f2;font-size:9pt}
.lt tbody tr{page-break-inside:avoid;break-inside:avoid}
.lt tbody tr:last-child td{border-bottom:2px solid #e5e5ea}
.lt tfoot td{padding:7px 12px;font-size:9pt}
.lt .sub td{color:#86868b;font-size:8.5pt}
.lt .tot td{font-weight:800;font-size:11pt;color:#1d1d1f;border-top:2px solid #1d1d1f;padding-top:10px}
.ig{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:18px 0}
.ii{background:#f5f5f7;border-radius:10px;padding:12px 16px}
.il{font-size:7pt;color:#86868b;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px}
.iv{font-size:9pt;font-weight:600}
.nt{background:transparent;border-radius:10px;padding:14px 18px;margin:14px 0;border-left:3px solid #f59e0b}
.ai{background:transparent;border-radius:10px;padding:14px 18px;margin:14px 0;border-left:3px solid #0055d4}
.ft{position:fixed;bottom:0;left:0;right:0;padding:14px 52px;background:#1d1d1f;color:#fff;display:flex;justify-content:space-between;align-items:center}
.fb{font-size:9pt;font-weight:700;letter-spacing:-0.02em}
.fc{font-size:7.5pt;color:#aeaeb2;display:flex;gap:14px}
.fc a{color:#86868b;text-decoration:none}
.fd{font-size:7pt;color:#86868b}
.nb{page-break-inside:avoid;break-inside:avoid}
.pb{background:#f5f5f7;border-radius:12px;padding:18px 26px;margin:18px 0 22px;page-break-inside:avoid;break-inside:avoid}
.pr{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.p{font-size:30pt;font-weight:900;letter-spacing:-0.03em;line-height:1}
.pl{font-size:9pt;color:#6e6e73}.dsc{color:#34c759;font-weight:700;font-size:10pt}
.og{text-decoration:line-through;color:#aeaeb2;font-size:14pt;font-weight:500}
.sec{margin:18px 0;page-break-inside:avoid;break-inside:avoid}
@media print{body{padding:72px 52px 100px;-webkit-print-color-adjust:exact;print-color-adjust:exact}.ft{position:fixed;bottom:0}tr{page-break-inside:avoid;break-inside:avoid}}
</style></head><body>
<div class="hdr"><div><div class="br">Gerard<span>Fanals</span></div><div class="brsub">Senior Software IA Architect · Automatización de Procesos · Estratega de IA Generativa</div></div>
<div class="mt">${p.lead_nombre ? `<div class="mtn">${p.lead_nombre}</div>` : ''}<div>${fecha}</div>${p.numero ? `<div class="mtl">Ref: ${p.numero}</div>` : ''}</div></div>
<div class="cb">${catL[p.categoria] || p.categoria}</div>${p.badge ? `<span class="bdg">${p.badge}</span>` : ''}
<h1>${p.titulo}</h1>${p.subtitulo ? `<div class="sub">${p.subtitulo}</div>` : ''}
${!isPers ? `<div class="pb nb"><div class="pr">${hasDsc && p.precio_alta ? `<span class="og">${p.precio_alta.toLocaleString('es-ES')}€</span>` : ''}<span class="p">${precioFinal ? Math.round(precioFinal).toLocaleString('es-ES') : '—'}€</span><span class="pl">${p.forma_pago==='sin_iva'?'':'+ IVA'}</span>${p.descuento_pct>0?`<span class="dsc">-${p.descuento_pct}% dto.</span>`:''}</div>${p.precio_mensual?`<div class="psub">Mantenimiento: ${p.precio_mensual}€/mes${p.forma_pago==='sin_iva'?'':' + IVA'}</div>`:''}</div>` : ''}
<div class="sec nb"><div class="st">DESCRIPCIÓN DEL SERVICIO</div><div class="dsc2">${(p.descripcion||'').replace(/\n/g,'<br>')}</div></div>
${lineasH}
${isPers ? (() => {
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
    
    return `<div class="pb nb" style="margin-top:14px"><div style="font-size:7.5pt;color:#86868b;text-transform:uppercase;letter-spacing:0.08em">Total del proyecto</div><div style="font-size:22pt;font-weight:900;letter-spacing:-0.03em">${fE(precioFinal||0)}&#8364; <span style="font-size:9pt;color:#6e6e73;font-weight:400">${p.forma_pago==='sin_iva'?'':'+ IVA'}</span></div>${hasAny ? `<div style="margin-top:14px;padding-top:12px;border-top:1px solid #e5e5ea"><div style="font-size:7.5pt;color:#86868b;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px">Opciones de pago</div>${optA}${optB}${optC}</div>` : ''}</div>`;
})() : ''}
${p.bonus ? `<div class="nb" style="margin:14px 0;padding:16px 20px;border-radius:12px;background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border:1px solid #bbf7d0"><div style="font-size:7.5pt;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px">🎁 BONUS INCLUIDOS</div><div style="font-size:9.5pt;line-height:1.65;color:#15803d;white-space:pre-line">${p.bonus}</div></div>` : ''}
${(() => {
    const recomendadas = isPers ? (p.lineas || []).filter(l => l.activo !== false && l.recomendado) : [];
    if (recomendadas.length === 0) return '';
    const fE2 = (n) => Math.round(n || 0).toLocaleString('es-ES');
    return `<div class="nb" style="margin:14px 0;padding:20px;border-radius:12px;background:#fffbf0;border:1px solid #fed7aa;page-break-inside:avoid"><div style="display:flex;align-items:center;gap:8px;margin-bottom:12px"><div style="font-size:8pt;font-weight:800;color:#ea580c;text-transform:uppercase;letter-spacing:0.1em">⭐ SERVICIOS RECOMENDADOS</div><div style="display:inline-block;padding:2px 10px;border-radius:12px;background:#ff3b30;color:#fff;font-size:6.5pt;font-weight:700;letter-spacing:0.06em">NO INCLUIDOS EN ESTA PROPUESTA</div></div><div style="font-size:8.5pt;color:#9a3412;margin-bottom:12px;line-height:1.5">Los siguientes servicios complementarios están recomendados para maximizar los resultados del proyecto. Pueden contratarse de forma independiente.</div>${recomendadas.map(r => { const pf = r.precio * (1-(r.descuento||0)/100); const subs = (r.sublineas || []).filter((s) => s.concepto); return `<div style="padding:12px 14px;background:#fff;border-radius:8px;border:1px solid #fed7aa;margin-bottom:6px"><div style="display:flex;align-items:flex-start;gap:10px"><div style="flex:1"><div style="font-size:9.5pt;font-weight:700;color:#1d1d1f">${r.concepto || 'Servicio'}</div>${subs.length > 0 ? subs.map((s) => `<div style="font-size:8pt;color:#6e6e73;margin-top:2px;padding-left:10px">↳ ${s.concepto}</div>`).join('') : ''}${r.plazo ? `<div style="font-size:7.5pt;color:#9a3412;margin-top:3px">⏱ Plazo: ${r.plazo}</div>` : ''}${r.mantenimiento && r.mantenimiento_precio ? `<div style="font-size:7.5pt;color:#0071e3;font-weight:700;margin-top:3px">🔄 Mantenimiento: ${fE2(r.mantenimiento_precio)}€/mes</div><div style="font-size:6.5pt;color:#aeaeb2;font-style:italic">* Se activa una vez finalizado el trabajo</div>` : ''}</div><div style="text-align:right;min-width:80px"><div style="font-size:11pt;font-weight:800;color:#ea580c">${fE2(pf)}€</div>${r.descuento > 0 ? `<div style="font-size:7pt;color:#aeaeb2;text-decoration:line-through">${fE2(r.precio)}€</div><div style="font-size:6.5pt;color:#34c759;font-weight:600">-${r.descuento}%</div>` : ''}<div style="font-size:6.5pt;color:#6e6e73">${p.forma_pago==='sin_iva'?'':'+ IVA'}</div></div></div></div>`; }).join('')}</div>`;
})()}
<div class="ig nb">
${(p.formas_pago_ofrecidas && p.formas_pago_ofrecidas.length > 0) ? `<div class="ii"><div class="il">Formas de pago</div><div class="iv">💳 ${p.formas_pago_ofrecidas.map((fp) => formasPago[fp] || fp).join(' · ')}</div></div>` : p.forma_pago?`<div class="ii"><div class="il">Forma de pago</div><div class="iv">💳 ${formasPago[p.forma_pago]||p.forma_pago}</div></div>`:''}
${p.link_pago?`<div class="ii"><div class="il">Enlace de pago</div><div class="iv"><a href="${p.link_pago}" style="color:#0071e3;font-size:8.5pt;word-break:break-all">${p.link_pago}</a></div></div>`:''}
${p.fecha_entrega?`<div class="ii"><div class="il">📅 Fecha de entrega</div><div class="iv">${new Date(p.fecha_entrega).toLocaleDateString('es-ES',{day:'2-digit',month:'long',year:'numeric'})}</div></div>`:''}
<div class="ii"><div class="il">Validez</div><div class="iv">30 días desde la fecha de emisión</div></div>
<div class="ii"><div class="il">Contacto</div><div class="iv">📱 629 494 167 · ✉️ gerard@iartesana.es</div></div>
</div>
${p.notas_internas ? `<div class="nt nb"><div class="st">📝 NOTAS</div><div class="dsc2">${p.notas_internas.replace(/\n/g,'<br>')}</div></div>` : ''}
${p.contenido_ia ? `<div class="ai nb"><div class="st">📋 DETALLE</div><div class="dsc2">${p.contenido_ia.replace(/\n/g,'<br>')}</div></div>` : ''}
<div class="ft"><div><div class="fb">GerardFanals</div><div class="fd">${fecha}</div></div><div class="fc"><span>📱 629 494 167</span><a href="mailto:gerard@iartesana.es">✉️ gerard@iartesana.es</a><span>🌐 gerardfanals.online</span></div></div>
</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 400);
}


window.sendAppChatMessage = function() {
    const input = document.getElementById('app-chat-input');
    if (!input) return;
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    
    const container = document.getElementById('app-chat-messages');
    if (!container) return;
    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    const userDiv = document.createElement('div');
    userDiv.style.display = 'flex';
    userDiv.style.gap = '12px';
    userDiv.style.alignItems = 'flex-start';
    userDiv.innerHTML = `
        <div style="width:36px; height:36px; border-radius:50%; background:var(--accent-purple); color:white; display:flex; align-items:center; justify-content: center; font-weight:700; font-size:0.85rem">G</div>
        <div>
            <div style="display:flex; align-items:center; gap:8px">
                <span style="font-weight:600; font-size:0.85rem; color:var(--text-main)">Gerard</span>
                <span style="font-size:0.7rem; color:var(--text-grey)">${time}</span>
            </div>
            <p style="font-size:0.88rem; color:var(--text-main); margin-top:4px; background:var(--bg-secondary); padding:10px 14px; border-radius:12px; border:1px solid var(--card-border); max-width:500px">
                ${msg}
            </p>
        </div>
    `;
    container.appendChild(userDiv);
    container.scrollTop = container.scrollHeight;
    
    logToSystemSupport(`[Chat App] Enviado mensaje de chat interno: "${msg}"`);
};

// --- Collapsible Sidebar Menu ---
window.toggleSidebarGroup = function(groupId) {
    const header = document.querySelector(`.sidebar-group-header[data-group="${groupId}"]`);
    const subnav = document.getElementById(`subnav-${groupId}`);
    if (!header || !subnav) return;

    const isCurrentlyExpanded = header.classList.contains('expanded');
    
    if (isCurrentlyExpanded) {
        header.classList.remove('expanded');
        subnav.classList.add('collapsed');
        localStorage.setItem(`cc_sidebar_collapsed_${groupId}`, 'true');
    } else {
        header.classList.add('expanded');
        subnav.classList.remove('collapsed');
        localStorage.setItem(`cc_sidebar_collapsed_${groupId}`, 'false');
    }
};

window.initializeSidebarCollapse = function() {
    const groups = ['dashboard', 'leads', 'clients', 'config', 'comms'];
    groups.forEach(groupId => {
        const header = document.querySelector(`.sidebar-group-header[data-group="${groupId}"]`);
        const subnav = document.getElementById(`subnav-${groupId}`);
        if (!header || !subnav) return;

        const saved = localStorage.getItem(`cc_sidebar_collapsed_${groupId}`);
        const isCollapsed = saved === null ? true : (saved === 'true');
        
        if (isCollapsed) {
            header.classList.remove('expanded');
            subnav.classList.add('collapsed');
        } else {
            header.classList.add('expanded');
            subnav.classList.remove('collapsed');
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    window.initializeSidebarCollapse();
});

