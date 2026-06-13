// 🧠 CerebroComercial AI — Frontend Orchestrator (app.js)

const CLAUSULAS_DEFAULT = {
    cuarta: "El Prestador se compromete a:\n• Realizar los servicios y entregables con la mayor diligencia y profesionalidad conforme al calendario acordado.\n• Se acordará día y hora para cada reunión, pudiendo ser una reunión al mes si el cliente lo desea.\n• Realizar las rondas necesarias hasta la fecha de entrega para tener el proyecto 100% aceptado por el cliente.\n• A petición del cliente, se entregarán todos los archivos y documentos existentes del proyecto, excepto el código fuente que es propio del prestador.",
    quinta: "El/la Cliente se compromete a:\n• Facilitar al Prestador la información y materiales necesarios para el desarrollo de los servicios.\n• Respetar los plazos de pago según el desglose de la cláusula tercera.\n• Proporcionar acceso a plataformas y herramientas necesarias para la ejecución de los servicios.",
    sexta: "Una vez abonados íntegramente los servicios entregables, todos los trabajos desarrollados serán propiedad exclusiva del/la Cliente. El Prestador entregará todo el material realizado, incluidos los archivos definitivos y manuales, a la finalización y pago completo de los servicios. NO se entregará el código fuente del proyecto, es propiedad del prestador.\n\nTus Datos son tuyos: Los datos operativos del cliente son de su exclusiva propiedad y exportables en cualquier momento.",
    septima: "1. Entrega del Código Fuente por Cese de Actividad:\nEn caso de que el Prestador cese definitivamente su actividad empresarial, se compromete a entregar al Cliente el código fuente completo del proyecto técnico.\n\n2. Viabilidad de Migración a Terceros:\nEl Prestador certifica que la arquitectura general del sistema se construye utilizando tecnologías de mercado estándar, abiertas y ampliamente documentadas. El sistema es técnicamente viable para ser transferido y mantenido por cualquier equipo de desarrollo externo.\n\n3. Exportación de Datos:\nEl Prestador garantiza que la funcionalidad de \"Exportación Total de Datos\" permitirá extraer la base de datos completa en formatos estándar (CSV/Excel).",
    octava: "Si el Cliente o el Prestador comercializa o sublicencia la idea, concepto o proyecto desarrollado, se aplicará una comisión del 10% sobre los ingresos netos derivados de dicha comercialización. Esta cláusula será revisada anualmente para la aceptación por ambas partes.",
    novena: "El presente contrato podrá resolverse por:\n• Mutuo acuerdo de ambas partes.\n• Incumplimiento de alguna de las partes, previa notificación por escrito y sin subsanación en 30 días.\n• Causas de fuerza mayor que imposibiliten la ejecución del contrato.",
    decima: "Ambas partes se comprometen a mantener confidenciales todos los datos, información y documentos intercambiados durante la vigencia del contrato.",
    undecima: "Cumplimiento de la Normativa de Protección de Datos (RGPD y LOPD-GDD):\nEn cumplimiento de la Ley Orgánica 3/2018 (LOPD-GDD) y el Reglamento General de Protección de Datos (RGPD UE 2016/679), el Prestador actuará exclusivamente en calidad de Encargado del Tratamiento de los datos personales introducidos por el Cliente, quien ostenta la condición de Responsable del Tratamiento. El Prestador tratará dichos datos únicamente siguiendo las instrucciones del Cliente y para el fin del presente contrato.\n\nCumplimiento de la Ley de Inteligencia Artificial (AI Act / Reglamento UE 2024/1689):\nAmbas partes reconocen que los módulos de Inteligencia Artificial integrados se diseñan y utilizan de conformidad con el Reglamento Europeo de IA (AI Act). El sistema se categoriza como de \"Riesgo Mínimo o Nulo\".",
    duodecima: "Compromiso de Ciberseguridad y Medidas Técnicas:\nAmbas partes se comprometen a implementar y mantener las medidas de seguridad técnicas y organizativas necesarias para garantizar un nivel de seguridad adecuado al riesgo, protegiendo el ecosistema tecnológico de accesos no autorizados, alteraciones, pérdidas o tratamientos ilícitos.\n\nProtocolo de Gestión de Brechas de Seguridad:\n• Notificación inmediata: La parte que detecte la brecha notificará a la otra parte por escrito en un plazo máximo de 48 horas.\n• Mitigación y Colaboración: Ambas partes colaborarán estrechamente para contener el incidente y restaurar la normalidad.\n• Exención de Responsabilidad: El Prestador no será responsable de las brechas provocadas por negligencia del Cliente o fallos en infraestructuras de terceros.",
    adicional: ""
};

// EMAIL COMPOSE - defined early to ensure availability
window._composeAttachments = [];

// Auto-expand textareas logic
document.addEventListener('input', function (event) {
    if (event.target.tagName.toLowerCase() === 'textarea') {
        autoExpandTextarea(event.target);
    }
}, false);

function autoExpandTextarea(field) {
    // Reset height to calculate scrollHeight properly
    field.style.height = 'inherit';
    const computed = window.getComputedStyle(field);
    const borderTop = parseInt(computed.getPropertyValue('border-top-width'), 10) || 0;
    const borderBottom = parseInt(computed.getPropertyValue('border-bottom-width'), 10) || 0;
    const height = field.scrollHeight + borderTop + borderBottom;
    field.style.height = height + 'px';
}


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
    // Auto-load activity log when switching to the actividad tab
    if (tabName === 'actividad') loadActivityLog();
    // Auto-load formularios when switching to the forms tab
    if (tabName === 'forms') loadFormularios();
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
        const avatarBg = bothSigned ? 'linear-gradient(135deg,#34c759,#30d158)' : 'linear-gradient(135deg,#ff9500,#ff6b00)';
        const initial = (ct.cliente_nombre || '?')[0].toUpperCase();

        // Dates
        const fechaContrato = ct.fecha_contrato ? new Date(ct.fecha_contrato + 'T00:00:00').toLocaleDateString('es-ES') : '—';
        let fechaFinStr = '—';
        let fechaFinColor = 'var(--text-grey)';
        if (ct.fecha_contrato && ct.duracion_meses > 0) {
            const inicio = new Date(ct.fecha_contrato + 'T00:00:00');
            const fin = new Date(inicio); fin.setMonth(fin.getMonth() + ct.duracion_meses);
            const expirado = fin < new Date();
            fechaFinStr = fin.toLocaleDateString('es-ES');
            fechaFinColor = expirado ? '#ff3b30' : 'var(--text-grey)';
        }

        // Service title
        const serviceTitulo = ct.objeto_texto || (ct.content && ct.content.titulo) || '';

        // Payment method
        const formasPago = ct.formas_pago || {};
        const metodoPagoMap = { transferencia: 'Transferencia bancaria', giro: 'Giro bancario', bizum: 'Bizum', stripe: 'Tarjeta (Stripe)', efectivo: 'Efectivo' };
        const metodoSeleccionado = formasPago.seleccionada || '';
        const metodoNombre = metodoPagoMap[metodoSeleccionado] || metodoSeleccionado || '';

        // IBAN
        const datos = ct.datos_cliente || {};
        const ibanCliente = datos.cuenta_bancaria || ct.cuenta_bancaria || '';

        // Client data section
        let clientDataHtml = '';
        const hasClientData = ct.cliente_nif || ct.cliente_profesion || datos.nombre_negocio || datos.cif_negocio || ct.cliente_direccion || ct.cliente_email || ct.cliente_telefono;
        if (hasClientData) {
            let rows = '';
            if (ct.cliente_nif) rows += `<span>NIF: <strong style="color:var(--text-main)">${ct.cliente_nif}</strong></span>`;
            if (ct.cliente_profesion) rows += `<span>Profesión: ${ct.cliente_profesion}</span>`;
            if (datos.nombre_negocio || ct.cliente_empresa) rows += `<span>Empresa: <strong style="color:var(--text-main)">${datos.nombre_negocio || ct.cliente_empresa || ''}</strong></span>`;
            if (datos.cif_negocio) rows += `<span>CIF: ${datos.cif_negocio}</span>`;
            if (ct.cliente_direccion) {
                const loc = [datos.localidad, datos.provincia].filter(Boolean).join(', ');
                rows += `<span style="grid-column:1/-1">📍 ${ct.cliente_direccion}${loc ? ', ' + loc.toLowerCase() : ''}</span>`;
            }
            if (ct.cliente_email) rows += `<span>✉️ ${ct.cliente_email}</span>`;
            if (ct.cliente_telefono) rows += `<span>📞 ${ct.cliente_telefono}</span>`;
            clientDataHtml = `<div style="background:#f5f5f7;border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:0.72rem;color:var(--text-grey);line-height:1.7">
                <div style="font-weight:700;color:var(--text-main);margin-bottom:4px;font-size:0.74rem">📋 Datos del cliente</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 12px">${rows}</div>
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
                <span style="flex:1;text-align:center;font-size:0.68rem;padding:5px 8px;border-radius:8px;font-weight:700;background:${isFirmadoCliente ? 'rgba(52,199,89,0.08)' : 'rgba(255,149,0,0.08)'};color:${isFirmadoCliente ? '#34c759' : '#ff9500'};border:1px solid ${isFirmadoCliente ? 'rgba(52,199,89,0.15)' : 'rgba(255,149,0,0.15)'}">✋ ${isFirmadoCliente ? 'Cliente firmado' : 'Cliente no firmado'}</span>
                <span style="flex:1;text-align:center;font-size:0.68rem;padding:5px 8px;border-radius:8px;font-weight:700;background:${isFirmadoPrestador ? 'rgba(0,113,227,0.06)' : 'rgba(255,149,0,0.08)'};color:${isFirmadoPrestador ? '#0071e3' : '#ff9500'};border:1px solid ${isFirmadoPrestador ? 'rgba(0,113,227,0.12)' : 'rgba(255,149,0,0.15)'}">🖊️ ${isFirmadoPrestador ? 'Prestador firmado' : 'Prestador no firmado'}</span>
            </div>

            <!-- Service Title -->
            ${serviceTitulo ? `<div style="font-size:0.88rem;font-weight:600;color:var(--text-main);margin-bottom:14px;display:flex;align-items:center;gap:6px">🎨 ${serviceTitulo}</div>` : ''}

            <!-- Row 1: Code + Price + Monthly -->
            <div style="font-size:0.78rem;color:var(--text-grey);display:flex;gap:14px;flex-wrap:wrap;margin-bottom:8px;align-items:center">
                ${ct.codigo_contrato ? `<span style="font-family:monospace;font-weight:600;color:#5856d6">📋 ${ct.codigo_contrato}</span>` : ''}
                <span>💰 ${(parseFloat(ct.precio_total) || 0).toLocaleString('es-ES')}€</span>
                ${ct.precio_mensual > 0 ? `<span>💳 ${ct.precio_mensual}€/mes</span>` : ''}
            </div>

            <!-- Row 2: Duration + Start + End -->
            <div style="font-size:0.78rem;color:var(--text-grey);display:flex;gap:14px;flex-wrap:wrap;margin-bottom:14px;align-items:center">
                <span>📅 ${ct.duracion_meses || 0} meses</span>
                <span>⏰ ${fechaContrato}</span>
                <span style="color:${fechaFinColor};font-weight:${fechaFinColor === '#ff3b30' ? '700' : '400'}">🏁 ${fechaFinStr}</span>
            </div>

            <!-- Payment Method -->
            ${metodoNombre ? `<div style="background:rgba(0,113,227,0.04);border-radius:10px;padding:8px 14px;margin-bottom:10px;font-size:0.72rem;display:flex;align-items:center;gap:8px;border:1px solid rgba(0,113,227,0.1)">
                <span style="font-weight:700;color:#0071e3">💳 Forma de pago:</span>
                <span style="color:var(--text-main);font-weight:600">${metodoNombre}</span>
            </div>` : ''}

            <!-- IBAN -->
            ${ibanCliente ? `<div style="background:rgba(255,149,0,0.04);border-radius:10px;padding:8px 14px;margin-bottom:14px;font-size:0.72rem;display:flex;align-items:center;gap:8px;border:1px solid rgba(255,149,0,0.1);flex-wrap:wrap">
                <span style="font-weight:700;color:#ff9500">🏦 IBAN cliente:</span>
                <span style="color:var(--text-main);font-weight:600;font-family:monospace;letter-spacing:0.5px">${ibanCliente}</span>
            </div>` : ''}

            <!-- Client Data Section -->
            ${clientDataHtml}

            <!-- Action Buttons: Row 1 -->
            <div style="margin-top:auto;padding-top:4px;display:flex;flex-direction:column;gap:6px">
                <div style="display:flex;gap:6px">
                    <button class="btn-secondary" style="font-size:0.7rem;padding:5px 12px;flex:1" onclick="event.stopPropagation();editarContrato('${ct.id}')">👁 Ver / Editar</button>
                    <button class="btn-secondary" style="font-size:0.7rem;padding:5px 12px;flex:1;border-color:rgba(0,113,227,0.2);color:#0071e3" onclick="event.stopPropagation();abrirFichaClienteDesdeContrato('${ct.id}')">📋 Ficha cliente</button>
                </div>
                <!-- Action Buttons: Row 2 -->
                <div style="display:flex;gap:6px">
                    <button class="btn-secondary" style="font-size:0.7rem;padding:5px 12px;border-color:rgba(255,59,48,0.2);color:#ff3b30" onclick="event.stopPropagation();eliminarContrato('${ct.id}','${(ct.cliente_nombre||'').replace(/'/g,"\\\\'")}')">🗑 Borrar</button>
                    <button class="btn-secondary" style="font-size:0.7rem;padding:5px 12px;margin-left:auto;border-color:${isPrueba ? '#ff9500' : 'rgba(0,0,0,0.1)'};background:${isPrueba ? 'rgba(255,149,0,0.1)' : 'transparent'};color:${isPrueba ? '#ff9500' : '#aeaeb2'}" onclick="event.stopPropagation();togglePruebaContrato('${ct.id}',${isPrueba})" title="${isPrueba ? 'Quitar modo prueba' : 'Marcar como prueba'}">🧪 ${isPrueba ? 'Prueba' : 'Prueba'}</button>
                </div>
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
    // Datos generales
    const el = id => document.getElementById(id);
    if (el('ct-codigo-contrato')) el('ct-codigo-contrato').value = codigo;
    if (el('ct-lugar')) el('ct-lugar').value = 'Mahón (Menorca)';
    if (el('ct-fecha-contrato')) el('ct-fecha-contrato').value = new Date().toISOString().split('T')[0];
    // Client personal
    ['ct-cliente-nombre','ct-cli-apellidos','ct-cliente-nif','ct-cli-fecha-nacimiento','ct-cliente-profesion','ct-cliente-email','ct-cliente-telefono','ct-cliente-direccion'].forEach(id => { if (el(id)) el(id).value = ''; });
    if (el('ct-cliente-representacion')) el('ct-cliente-representacion').value = 'en su propio nombre y representación';
    // Client business
    ['ct-cli-nombre-negocio','ct-cli-nombre-comercial','ct-cli-cif-negocio','ct-cli-actividad','ct-cli-direccion-negocio','ct-cli-codigo-postal','ct-cli-localidad','ct-cli-provincia'].forEach(id => { if (el(id)) el(id).value = ''; });
    if (el('ct-cli-pais')) el('ct-cli-pais').value = 'España';
    // Client contact
    ['ct-cli-email-negocio','ct-cli-telefono-negocio','ct-cli-web','ct-cli-instagram','ct-cli-facebook','ct-cli-linkedin','ct-cli-tiktok','ct-cli-youtube','ct-cli-twitter','ct-cli-pinterest'].forEach(id => { if (el(id)) el(id).value = ''; });
    // Prestador defaults
    if (el('ct-prestador-nombre')) el('ct-prestador-nombre').value = 'Gerard Fanals';
    if (el('ct-prestador-cargo')) el('ct-prestador-cargo').value = 'Director';
    if (el('ct-prestador-empresa')) el('ct-prestador-empresa').value = 'Vigila y Actúa S.L.';
    if (el('ct-prestador-cif')) el('ct-prestador-cif').value = 'B 57973562';
    if (el('ct-prestador-telefono')) el('ct-prestador-telefono').value = '+34 629 494 167';
    if (el('ct-prestador-email')) el('ct-prestador-email').value = 'gerard@iartesana.es';
    if (el('ct-prestador-direccion')) el('ct-prestador-direccion').value = "Avda. Fort de L'eau 131, Mahón 07701, Menorca";
    if (el('ct-prestador-actividad')) el('ct-prestador-actividad').value = 'Tecnología Online y OFFline a través de inteligencia artificial';
    // Objeto + servicios
    if (el('ct-objeto-texto')) el('ct-objeto-texto').value = '';
    const servList = el('ct-servicios-list');
    if (servList) servList.innerHTML = '';
    // Plazo entrega
    ['ct-plazo-entrega','ct-clausula-plazo'].forEach(id => { if (el(id)) el(id).value = ''; });
    if (el('ct-plazo-countdown')) el('ct-plazo-countdown').textContent = '— días restantes';
    // Prueba
    ['ct-prueba-inicio','ct-prueba-fin'].forEach(id => { if (el(id)) el(id).value = ''; });
    if (el('ct-prueba-status')) { el('ct-prueba-status').textContent = 'Sin periodo de prueba definido'; el('ct-prueba-status').style.background = 'rgba(142,142,147,0.1)'; el('ct-prueba-status').style.color = '#8e8e93'; }
    // Duración y precios
    if (el('ct-duracion')) el('ct-duracion').value = '12';
    ['ct-fecha-inicio','ct-fecha-fin','ct-precio-total','ct-precio-mensual','ct-cuota-fecha-inicio','ct-cuota-concepto','ct-cli-banco','ct-cli-titular-cuenta','ct-cli-cuenta-bancaria','ct-precio-texto'].forEach(id => { if (el(id)) el(id).value = ''; });
    // Payment options
    ['ct-pago-a-entrada'].forEach(id => { if (el(id)) el(id).value = '30'; });
    ['ct-pago-a-plazos'].forEach(id => { if (el(id)) el(id).value = '3'; });
    ['ct-pago-b-descuento'].forEach(id => { if (el(id)) el(id).value = '5'; });
    ['ct-pago-c-descuento'].forEach(id => { if (el(id)) el(id).value = '10'; });
    ['ct-pago-a-fecha','ct-pago-b-fecha','ct-pago-c-fecha'].forEach(id => { if (el(id)) el(id).value = ''; });
    ['ct-pago-a-resumen','ct-pago-b-resumen','ct-pago-c-resumen'].forEach(id => { if (el(id)) el(id).textContent = ''; });
    _selectedPagoOpcion = null;
    if (el('ct-pago-seleccionada')) el('ct-pago-seleccionada').style.display = 'none';
    ['ct-pago-opcion-a','ct-pago-opcion-b','ct-pago-opcion-c'].forEach(id => { if (el(id)) el(id).style.borderColor = 'var(--border-color)'; });
    // Precio final
    if (el('ct-precio-final')) el('ct-precio-final').value = '';
    if (el('ct-precio-total-letras')) el('ct-precio-total-letras').value = '';
    // Formas de pago
    let bc = null;
    try {
        const bcRaw = localStorage.getItem('cc_biz_config');
        if (bcRaw) bc = JSON.parse(bcRaw);
    } catch(e) {}

    ['giro','transferencia','stripe','bizum','efectivo','otro'].forEach(k => { 
        if (el('ct-fp-' + k)) {
            if (bc && bc[k] !== undefined) {
                el('ct-fp-' + k).checked = bc[k].active;
            } else {
                el('ct-fp-' + k).checked = false;
            }
        }
        updateFormasPago(k);
    });
    if (el('ct-cuenta-bancaria')) el('ct-cuenta-bancaria').value = (bc && bc.transferencia && bc.transferencia.active) ? bc.transferencia.iban : '';
    if (el('ct-prestador-iban')) el('ct-prestador-iban').value = (bc && bc.giro && bc.giro.active) ? bc.giro.iban : '';
    if (el('ct-stripe-link')) el('ct-stripe-link').value = '';
    if (el('ct-bizum-telefono')) el('ct-bizum-telefono').value = (bc && bc.bizum && bc.bizum.active) ? bc.bizum.telefono : '';
    if (el('ct-otro-metodo')) el('ct-otro-metodo').value = '';
    // Cláusulas
    ['cuarta','quinta','sexta','septima','octava','novena','decima','undecima','duodecima','adicional'].forEach(k => {
        const input = el('ct-clausula-' + k);
        if (input) input.value = CLAUSULAS_DEFAULT[k] || '';
    });
    if (el('ct-notas')) el('ct-notas').value = '';
    clearFirma();

    // Reset firmas
    if (el('firma-prestador-text')) el('firma-prestador-text').style.display = '';
    if (el('firma-prestador-img')) el('firma-prestador-img').style.display = 'none';
    if (el('firma-cliente-text')) el('firma-cliente-text').style.display = '';
    if (el('firma-cliente-img')) el('firma-cliente-img').style.display = 'none';
    if (el('firma-cliente-fecha')) el('firma-cliente-fecha').textContent = '';
    
    // Auto-expand all textareas
    setTimeout(() => {
        document.querySelectorAll('#contrato-tab-editor textarea').forEach(txt => {
            autoExpandTextarea(txt);
        });
    }, 10);
    
    switchContratoTab('editor');
}

function editarContrato(id) {
    const ct = contratosData.find(c => c.id === id);
    if (!ct) return;
    contratoEditId = id;
    const el = fid => document.getElementById(fid);
    document.getElementById('editor-title').textContent = 'Editar: ' + (ct.cliente_nombre || 'Contrato');
    document.getElementById('editor-codigo').textContent = ct.codigo_contrato || '';
    const datos = ct.datos_cliente || {};
    const fp = ct.formas_pago || {};
    const pc = ct.pago_config || {};
    const cl = ct.clausulas_custom || {};

    // 1. Datos generales
    if (el('ct-codigo-contrato')) el('ct-codigo-contrato').value = ct.codigo_contrato || '';
    if (el('ct-lugar')) el('ct-lugar').value = ct.lugar || 'Mahón (Menorca)';
    if (el('ct-fecha-contrato')) el('ct-fecha-contrato').value = ct.fecha_contrato || '';

    // 2. Datos personales del cliente
    if (el('ct-cliente-nombre')) el('ct-cliente-nombre').value = ct.cliente_nombre || '';
    if (el('ct-cli-apellidos')) el('ct-cli-apellidos').value = datos.apellidos || '';
    if (el('ct-cliente-nif')) el('ct-cliente-nif').value = ct.cliente_nif || '';
    if (el('ct-cli-fecha-nacimiento')) el('ct-cli-fecha-nacimiento').value = datos.fecha_nacimiento || '';
    if (el('ct-cliente-profesion')) el('ct-cliente-profesion').value = ct.cliente_profesion || '';
    if (el('ct-cliente-email')) el('ct-cliente-email').value = ct.cliente_email || '';
    if (el('ct-cliente-telefono')) el('ct-cliente-telefono').value = ct.cliente_telefono || '';
    if (el('ct-cliente-direccion')) el('ct-cliente-direccion').value = ct.cliente_direccion || '';
    if (el('ct-cliente-representacion')) el('ct-cliente-representacion').value = ct.cliente_representacion || 'en su propio nombre y representación';

    // 3. Datos del negocio del cliente
    if (el('ct-cli-nombre-negocio')) el('ct-cli-nombre-negocio').value = datos.nombre_negocio || '';
    if (el('ct-cli-nombre-comercial')) el('ct-cli-nombre-comercial').value = datos.nombre_comercial || '';
    if (el('ct-cli-cif-negocio')) el('ct-cli-cif-negocio').value = datos.cif_negocio || '';
    if (el('ct-cli-actividad')) el('ct-cli-actividad').value = datos.actividad || '';
    if (el('ct-cli-direccion-negocio')) el('ct-cli-direccion-negocio').value = datos.direccion_negocio || '';
    if (el('ct-cli-codigo-postal')) el('ct-cli-codigo-postal').value = datos.codigo_postal || '';
    if (el('ct-cli-localidad')) el('ct-cli-localidad').value = datos.localidad || '';
    if (el('ct-cli-provincia')) el('ct-cli-provincia').value = datos.provincia || '';
    if (el('ct-cli-pais')) el('ct-cli-pais').value = datos.pais || 'España';

    // 4. Contacto del negocio
    if (el('ct-cli-email-negocio')) el('ct-cli-email-negocio').value = datos.email_negocio || '';
    if (el('ct-cli-telefono-negocio')) el('ct-cli-telefono-negocio').value = datos.telefono_negocio || '';
    if (el('ct-cli-web')) el('ct-cli-web').value = datos.web || '';
    if (el('ct-cli-instagram')) el('ct-cli-instagram').value = datos.instagram || '';
    if (el('ct-cli-facebook')) el('ct-cli-facebook').value = datos.facebook || '';
    if (el('ct-cli-linkedin')) el('ct-cli-linkedin').value = datos.linkedin || '';
    if (el('ct-cli-tiktok')) el('ct-cli-tiktok').value = datos.tiktok || '';
    if (el('ct-cli-youtube')) el('ct-cli-youtube').value = datos.youtube || '';
    if (el('ct-cli-twitter')) el('ct-cli-twitter').value = datos.twitter || '';
    if (el('ct-cli-pinterest')) el('ct-cli-pinterest').value = datos.pinterest || '';

    // 5. Datos del prestador
    if (el('ct-prestador-nombre')) el('ct-prestador-nombre').value = ct.prestador_nombre || 'Gerard Fanals';
    if (el('ct-prestador-cargo')) el('ct-prestador-cargo').value = ct.prestador_cargo || 'Director';
    if (el('ct-prestador-empresa')) el('ct-prestador-empresa').value = ct.prestador_empresa || 'Vigila y Actúa S.L.';
    if (el('ct-prestador-cif')) el('ct-prestador-cif').value = ct.prestador_cif || 'B 57973562';
    if (el('ct-prestador-telefono')) el('ct-prestador-telefono').value = ct.prestador_telefono || '+34 629 494 167';
    if (el('ct-prestador-email')) el('ct-prestador-email').value = ct.prestador_email || 'gerard@iartesana.es';
    if (el('ct-prestador-direccion')) el('ct-prestador-direccion').value = ct.prestador_direccion || '';
    if (el('ct-prestador-actividad')) el('ct-prestador-actividad').value = ct.prestador_actividad || '';

    // 6. Objeto del contrato + servicios
    if (el('ct-objeto-texto')) el('ct-objeto-texto').value = ct.objeto_texto || '';
    const servList = el('ct-servicios-list');
    if (servList) {
        servList.innerHTML = '';
        (ct.servicios || []).forEach(s => addServicio(s));
    }

    // 7. Plazo de entrega
    if (el('ct-plazo-entrega')) el('ct-plazo-entrega').value = ct.plazo_entrega || '';
    if (el('ct-clausula-plazo')) el('ct-clausula-plazo').value = ct.clausula_plazo || '';
    updateCountdown();

    // 8. Periodo de prueba
    if (el('ct-prueba-inicio')) el('ct-prueba-inicio').value = ct.prueba_inicio || '';
    if (el('ct-prueba-fin')) el('ct-prueba-fin').value = ct.prueba_fin || '';
    updatePruebaStatus();

    // 9. Duración y precios
    if (el('ct-duracion')) el('ct-duracion').value = ct.duracion_meses || 12;
    if (el('ct-fecha-inicio')) el('ct-fecha-inicio').value = ct.fecha_inicio || '';
    if (el('ct-fecha-fin')) el('ct-fecha-fin').value = ct.fecha_fin || '';
    if (el('ct-precio-total')) el('ct-precio-total').value = ct.precio_total || '';
    if (el('ct-precio-mensual')) el('ct-precio-mensual').value = ct.precio_mensual || '';
    if (el('ct-cuota-fecha-inicio')) el('ct-cuota-fecha-inicio').value = ct.cuota_fecha_inicio || '';
    if (el('ct-cuota-concepto')) el('ct-cuota-concepto').value = ct.cuota_concepto || '';
    if (el('ct-cli-banco')) el('ct-cli-banco').value = datos.banco || '';
    if (el('ct-cli-titular-cuenta')) el('ct-cli-titular-cuenta').value = datos.titular_cuenta || '';
    if (el('ct-cli-cuenta-bancaria')) el('ct-cli-cuenta-bancaria').value = datos.cuenta_bancaria || ct.cuenta_bancaria || '';
    if (el('ct-precio-texto')) el('ct-precio-texto').value = ct.precio_texto || '';

    // 10. Opciones de pago
    if (el('ct-pago-a-entrada')) el('ct-pago-a-entrada').value = pc.a_entrada || 30;
    if (el('ct-pago-a-plazos')) el('ct-pago-a-plazos').value = pc.a_plazos || 3;
    if (el('ct-pago-a-fecha')) el('ct-pago-a-fecha').value = pc.a_fecha || '';
    if (el('ct-pago-b-descuento')) el('ct-pago-b-descuento').value = pc.b_descuento || 5;
    if (el('ct-pago-b-fecha')) el('ct-pago-b-fecha').value = pc.b_fecha || '';
    if (el('ct-pago-c-descuento')) el('ct-pago-c-descuento').value = pc.c_descuento || 10;
    if (el('ct-pago-c-fecha')) el('ct-pago-c-fecha').value = pc.c_fecha || '';
    _selectedPagoOpcion = pc.opcion_seleccionada || null;
    if (_selectedPagoOpcion) selectPagoOpcion(_selectedPagoOpcion, true);
    else {
        if (el('ct-pago-seleccionada')) el('ct-pago-seleccionada').style.display = 'none';
        ['ct-pago-opcion-a','ct-pago-opcion-b','ct-pago-opcion-c'].forEach(fid => { if (el(fid)) el(fid).style.borderColor = 'var(--border-color)'; });
    }
    recalcPago();

    // 11. Precio final
    if (el('ct-precio-final')) el('ct-precio-final').value = ct.precio_final || ct.precio_total || '';
    if (el('ct-precio-total-letras')) el('ct-precio-total-letras').value = ct.precio_total_letras || '';

    // 12. Formas de pago
    ['giro','transferencia','stripe','bizum','efectivo','otro'].forEach(k => {
        if (el('ct-fp-' + k)) el('ct-fp-' + k).checked = !!(fp[k]);
        updateFormasPago(k);
    });
    if (el('ct-cuenta-bancaria')) el('ct-cuenta-bancaria').value = ct.cuenta_bancaria || datos.cuenta_bancaria || '';
    if (el('ct-prestador-iban')) el('ct-prestador-iban').value = ct.prestador_iban || fp.iban || '';
    if (el('ct-stripe-link')) el('ct-stripe-link').value = ct.stripe_link || fp.stripe_link || '';
    if (el('ct-bizum-telefono')) el('ct-bizum-telefono').value = ct.bizum_telefono || fp.bizum_telefono || '';
    if (el('ct-otro-metodo')) el('ct-otro-metodo').value = ct.otro_metodo || fp.otro_metodo || '';

    // 13. Cláusulas
    ['cuarta','quinta','sexta','septima','octava','novena','decima','undecima','duodecima','adicional'].forEach(k => {
        if (el('ct-clausula-' + k)) {
            el('ct-clausula-' + k).value = cl[k] || CLAUSULAS_DEFAULT[k] || '';
        }
    });

    // 14. Notas
    if (el('ct-notas')) el('ct-notas').value = ct.notas || '';

    // Firma prestador
    clearFirma();
    const prestText = document.getElementById('firma-prestador-text');
    const prestImg = document.getElementById('firma-prestador-img');
    const btnBorrarPrest = document.getElementById('btn-borrar-firma-prestador');
    if (ct.firma_prestador) {
        const preview = document.getElementById('firma-preview-img');
        const container = document.getElementById('firma-preview-container');
        if (preview && container) { preview.src = ct.firma_prestador; container.style.display = ''; }
        if (prestImg && prestText) {
            prestImg.src = ct.firma_prestador;
            prestImg.style.display = '';
            prestText.style.display = 'none';
        }
        if (btnBorrarPrest) btnBorrarPrest.style.display = '';
    } else {
        if (prestImg && prestText) { prestImg.style.display = 'none'; prestText.style.display = ''; }
        if (btnBorrarPrest) btnBorrarPrest.style.display = 'none';
    }

    // Firma cliente
    const cliText = document.getElementById('firma-cliente-text');
    const cliImg = document.getElementById('firma-cliente-img');
    const cliFecha = document.getElementById('firma-cliente-fecha');
    const btnBorrarCli = document.getElementById('btn-borrar-firma-cliente');
    if (ct.firma_cliente) {
        if (cliImg && cliText) {
            cliImg.src = ct.firma_cliente;
            cliImg.style.display = '';
            cliText.style.display = 'none';
        }
        if (cliFecha && ct.firma_cliente_fecha) {
            cliFecha.textContent = 'Firmado el ' + new Date(ct.firma_cliente_fecha).toLocaleString('es-ES');
        }
        if (btnBorrarCli) btnBorrarCli.style.display = '';
    } else {
        if (cliImg && cliText) { cliImg.style.display = 'none'; cliText.style.display = ''; }
        if (cliFecha) cliFecha.textContent = '';
        if (btnBorrarCli) btnBorrarCli.style.display = 'none';
    }
    
    // Auto-expand all textareas based on their initial content
    setTimeout(() => {
        document.querySelectorAll('#contrato-tab-editor textarea').forEach(txt => {
            autoExpandTextarea(txt);
        });
    }, 10);
    
    switchContratoTab('editor');
}

async function guardarContrato() {
    const btn = document.getElementById('btn-guardar-contrato');
    const btnBottom = document.getElementById('btn-guardar-contrato-bottom');
    if (btn) { btn.textContent = '⏳ Guardando...'; btn.disabled = true; }
    if (btnBottom) { btnBottom.textContent = '⏳ Guardando...'; btnBottom.disabled = true; }

    const el = id => { const e = document.getElementById(id); return e ? (e.type === 'checkbox' ? e.checked : e.value) : ''; };

    // Collect services from dynamic list
    const servicios = [];
    document.querySelectorAll('#ct-servicios-list input').forEach(inp => {
        const v = inp.value.trim();
        if (v) servicios.push(v);
    });

    // Build datos_cliente JSON
    const datos_cliente = {
        apellidos: el('ct-cli-apellidos'),
        fecha_nacimiento: el('ct-cli-fecha-nacimiento'),
        email_personal: el('ct-cliente-email'),
        telefono_personal: el('ct-cliente-telefono'),
        nombre_negocio: el('ct-cli-nombre-negocio'),
        nombre_comercial: el('ct-cli-nombre-comercial'),
        cif_negocio: el('ct-cli-cif-negocio'),
        actividad: el('ct-cli-actividad'),
        direccion_negocio: el('ct-cli-direccion-negocio'),
        codigo_postal: el('ct-cli-codigo-postal'),
        localidad: el('ct-cli-localidad'),
        provincia: el('ct-cli-provincia'),
        pais: el('ct-cli-pais'),
        email_negocio: el('ct-cli-email-negocio'),
        telefono_negocio: el('ct-cli-telefono-negocio'),
        web: el('ct-cli-web'),
        instagram: el('ct-cli-instagram'),
        facebook: el('ct-cli-facebook'),
        linkedin: el('ct-cli-linkedin'),
        tiktok: el('ct-cli-tiktok'),
        youtube: el('ct-cli-youtube'),
        twitter: el('ct-cli-twitter'),
        pinterest: el('ct-cli-pinterest'),
        banco: el('ct-cli-banco'),
        titular_cuenta: el('ct-cli-titular-cuenta'),
        cuenta_bancaria: el('ct-cli-cuenta-bancaria'),
    };

    // Build formas_pago JSON
    const formas_pago = {};
    ['giro','transferencia','stripe','bizum','efectivo','otro'].forEach(k => {
        formas_pago[k] = el('ct-fp-' + k);
    });
    if (_selectedPagoOpcion) formas_pago.opcion = _selectedPagoOpcion;

    // Build pago_config JSON
    const pago_config = {
        a_entrada: parseFloat(el('ct-pago-a-entrada')) || 30,
        a_plazos: parseInt(el('ct-pago-a-plazos')) || 3,
        a_fecha: el('ct-pago-a-fecha'),
        b_descuento: parseFloat(el('ct-pago-b-descuento')) || 5,
        b_fecha: el('ct-pago-b-fecha'),
        c_descuento: parseFloat(el('ct-pago-c-descuento')) || 10,
        c_fecha: el('ct-pago-c-fecha'),
        opcion_seleccionada: _selectedPagoOpcion || null,
    };

    // Build clausulas_custom JSON
    const clausulas_custom = {};
    ['cuarta','quinta','sexta','septima','octava','novena','decima','undecima','duodecima','adicional'].forEach(k => {
        const v = el('ct-clausula-' + k);
        if (v) clausulas_custom[k] = v;
    });

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
        lugar: el('ct-lugar'),
        fecha_contrato: el('ct-fecha-contrato') || null,
        cliente_nombre: el('ct-cliente-nombre'),
        cliente_email: el('ct-cliente-email'),
        cliente_telefono: el('ct-cliente-telefono'),
        cliente_nif: el('ct-cliente-nif'),
        cliente_direccion: el('ct-cliente-direccion'),
        cliente_profesion: el('ct-cliente-profesion'),
        cliente_representacion: el('ct-cliente-representacion'),
        prestador_nombre: el('ct-prestador-nombre'),
        prestador_cargo: el('ct-prestador-cargo'),
        prestador_empresa: el('ct-prestador-empresa'),
        prestador_cif: el('ct-prestador-cif'),
        prestador_telefono: el('ct-prestador-telefono'),
        prestador_email: el('ct-prestador-email'),
        prestador_direccion: el('ct-prestador-direccion'),
        prestador_actividad: el('ct-prestador-actividad'),
        servicios,
        objeto_texto: el('ct-objeto-texto'),
        plazo_entrega: el('ct-plazo-entrega') || null,
        clausula_plazo: el('ct-clausula-plazo'),
        prueba_inicio: el('ct-prueba-inicio') || null,
        prueba_fin: el('ct-prueba-fin') || null,
        duracion_meses: parseInt(el('ct-duracion')) || 12,
        fecha_inicio: el('ct-fecha-inicio') || null,
        fecha_fin: el('ct-fecha-fin') || null,
        precio_total: parseFloat(el('ct-precio-total')) || 0,
        precio_mensual: parseFloat(el('ct-precio-mensual')) || 0,
        cuota_fecha_inicio: el('ct-cuota-fecha-inicio') || null,
        cuota_concepto: el('ct-cuota-concepto'),
        precio_texto: el('ct-precio-texto'),
        precio_total_letras: el('ct-precio-total-letras'),
        cuenta_bancaria: el('ct-cuenta-bancaria'),
        notas: el('ct-notas'),
        firma_prestador: firmaPrestador,
        estado: firmaPrestador ? 'firmado_prestador' : 'no_firmado',
        datos_cliente,
        formas_pago,
        pago_config,
        clausulas_custom,
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
    if (btn) { btn.textContent = '💾 Guardar'; btn.disabled = false; }
    if (btnBottom) { btnBottom.textContent = '💾 Guardar'; btnBottom.disabled = false; }
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

async function borrarFirmaContrato(tipo) {
    const id = contratoEditId;
    if (!id) { showToast('No hay contrato abierto', true); return; }

    const label = tipo === 'prestador' ? 'del prestador' : 'del cliente';
    const confirmed = await showConfirm('¿Borrar firma?', `¿Seguro que quieres borrar la firma ${label}? Esta acción no se puede deshacer.`, '✍️');
    if (!confirmed) return;

    const payload = { id };
    if (tipo === 'prestador') {
        payload.firma_prestador = null;
    } else {
        payload.firma_cliente = null;
        payload.firma_cliente_fecha = null;
        payload.firmado_at = null;
    }

    try {
        const res = await fetch(`/api/contratos?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success || result.data) {
            showAlert('Firma eliminada', `La firma ${label} ha sido eliminada correctamente.`, '✍️');

            // Update UI immediately
            if (tipo === 'prestador') {
                const img = document.getElementById('firma-prestador-img');
                const text = document.getElementById('firma-prestador-text');
                const btn = document.getElementById('btn-borrar-firma-prestador');
                if (img) { img.style.display = 'none'; img.src = ''; }
                if (text) text.style.display = '';
                if (btn) btn.style.display = 'none';
                const preview = document.getElementById('firma-preview-img');
                const container = document.getElementById('firma-preview-container');
                if (preview) preview.src = '';
                if (container) container.style.display = 'none';
            } else {
                const img = document.getElementById('firma-cliente-img');
                const text = document.getElementById('firma-cliente-text');
                const fecha = document.getElementById('firma-cliente-fecha');
                const btn = document.getElementById('btn-borrar-firma-cliente');
                if (img) { img.style.display = 'none'; img.src = ''; }
                if (text) text.style.display = '';
                if (fecha) fecha.textContent = '';
                if (btn) btn.style.display = 'none';
            }

            // Reload contracts to update cards
            await loadContratos();
        } else {
            showAlert('Error', result.error || 'No se pudo borrar la firma.', '❌');
        }
    } catch (e) {
        showAlert('Error', e.message, '❌');
    }
}

function abrirFichaClienteDesdeContrato(contratoId) {
    const ct = contratosData.find(c => c.id === contratoId);
    if (!ct) { showToast('Contrato no encontrado', true); return; }

    // Try to find the lead by lead_id first, then by email
    let lead = null;
    if (ct.lead_id && typeof leadsData !== 'undefined') {
        lead = leadsData.find(l => l.id === ct.lead_id);
    }
    if (!lead && ct.cliente_email && typeof leadsData !== 'undefined') {
        lead = leadsData.find(l => l.email === ct.cliente_email);
    }

    if (lead) {
        // Navigate to CRM section and open the lead modal
        if (typeof switchSection === 'function') switchSection('crm');
        if (typeof editLeadModal === 'function') {
            setTimeout(() => editLeadModal(lead.id), 300);
        } else {
            showToast(`Lead encontrado: ${lead.first_name || ''} ${lead.last_name || ''} (${lead.email})`, false);
        }
    } else {
        showToast('No se encontró un lead asociado a este contrato', true);
    }
}

// ── Contract Editor Helpers ──────────────────────────────────
let _selectedPagoOpcion = null;

function addServicio(value) {
    const list = document.getElementById('ct-servicios-list');
    if (!list) return;
    const idx = list.children.length;
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:6px;align-items:center';
    row.innerHTML = `<input class="nl-config-input" value="${(value || '').replace(/"/g, '&quot;')}" placeholder="Servicio ${idx + 1}" style="flex:1;margin-bottom:0" /><button class="btn-secondary" style="padding:4px 8px;font-size:0.7rem;flex-shrink:0" onclick="removeServicio(this)" title="Eliminar">✕</button>`;
    list.appendChild(row);
}

function removeServicio(btn) {
    const row = btn.parentElement;
    if (row) row.remove();
}

function updateCountdown() {
    const plazoEl = document.getElementById('ct-plazo-entrega');
    const countEl = document.getElementById('ct-plazo-countdown');
    if (!plazoEl || !countEl) return;
    const fecha = plazoEl.value;
    if (!fecha) { countEl.textContent = '— días restantes'; countEl.style.color = 'var(--text-grey)'; return; }
    const diff = Math.ceil((new Date(fecha + 'T00:00:00') - new Date()) / (1000 * 60 * 60 * 24));
    if (diff < 0) { countEl.textContent = `⚠️ Vencido hace ${Math.abs(diff)} días`; countEl.style.color = '#ff453a'; }
    else if (diff === 0) { countEl.textContent = '⚡ Hoy es el último día'; countEl.style.color = '#ff9500'; }
    else if (diff <= 7) { countEl.textContent = `⏳ ${diff} días restantes`; countEl.style.color = '#ff9500'; }
    else { countEl.textContent = `✅ ${diff} días restantes`; countEl.style.color = '#34c759'; }
}

function updatePruebaStatus() {
    const inicio = document.getElementById('ct-prueba-inicio');
    const fin = document.getElementById('ct-prueba-fin');
    const status = document.getElementById('ct-prueba-status');
    if (!status) return;
    if (!inicio || !inicio.value || !fin || !fin.value) {
        status.textContent = 'Sin periodo de prueba definido';
        status.style.background = 'rgba(142,142,147,0.1)'; status.style.color = '#8e8e93';
        return;
    }
    const now = new Date();
    const start = new Date(inicio.value + 'T00:00:00');
    const end = new Date(fin.value + 'T00:00:00');
    if (now < start) { status.textContent = '🕐 Pendiente de inicio'; status.style.background = 'rgba(0,113,227,0.1)'; status.style.color = '#0071e3'; }
    else if (now >= start && now <= end) { status.textContent = '🟢 En curso'; status.style.background = 'rgba(52,199,89,0.1)'; status.style.color = '#34c759'; }
    else { status.textContent = '✅ Finalizado'; status.style.background = 'rgba(142,142,147,0.1)'; status.style.color = '#8e8e93'; }
}

function selectPagoOpcion(opcion, silent) {
    _selectedPagoOpcion = opcion;
    const el = id => document.getElementById(id);
    const colors = { A: '#0071e3', B: '#34c759', C: '#ff9500' };
    ['ct-pago-opcion-a','ct-pago-opcion-b','ct-pago-opcion-c'].forEach(id => { if (el(id)) el(id).style.borderColor = 'var(--border-color)'; });
    const selectedId = 'ct-pago-opcion-' + opcion.toLowerCase();
    if (el(selectedId)) el(selectedId).style.borderColor = colors[opcion] || '#0071e3';
    const indicator = el('ct-pago-seleccionada');
    if (indicator) { indicator.style.display = ''; indicator.textContent = `✅ Opción ${opcion} seleccionada`; }
    recalcPago();
    if (!silent) showAlert('Opción de pago', `Has seleccionado la opción ${opcion}`, '✅');
}

function recalcPago() {
    const total = parseFloat(document.getElementById('ct-precio-total')?.value) || 0;
    const el = id => document.getElementById(id);
    // Option A
    const entradaPct = parseFloat(el('ct-pago-a-entrada')?.value) || 30;
    const plazos = parseInt(el('ct-pago-a-plazos')?.value) || 3;
    const entrada = total * entradaPct / 100;
    const restA = total - entrada;
    const cuotaA = plazos > 0 ? restA / plazos : 0;
    if (el('ct-pago-a-resumen')) el('ct-pago-a-resumen').innerHTML = total > 0 ? `Entrada: <strong>${entrada.toFixed(2)}€</strong> (${entradaPct}%) + ${plazos} plazos de <strong>${cuotaA.toFixed(2)}€</strong>` : '';
    // Option B
    const descB = parseFloat(el('ct-pago-b-descuento')?.value) || 5;
    const totalB = total * (1 - descB / 100);
    const cuotaB = totalB / 3;
    if (el('ct-pago-b-resumen')) el('ct-pago-b-resumen').innerHTML = total > 0 ? `Total con ${descB}% dto: <strong>${totalB.toFixed(2)}€</strong> — 3 pagos de <strong>${cuotaB.toFixed(2)}€</strong>` : '';
    // Option C
    const descC = parseFloat(el('ct-pago-c-descuento')?.value) || 10;
    const totalC = total * (1 - descC / 100);
    if (el('ct-pago-c-resumen')) el('ct-pago-c-resumen').innerHTML = total > 0 ? `Pago único con ${descC}% dto: <strong>${totalC.toFixed(2)}€</strong>` : '';
    // Update precio final based on selected option
    let precioFinal = total;
    if (_selectedPagoOpcion === 'B') precioFinal = totalB;
    else if (_selectedPagoOpcion === 'C') precioFinal = totalC;
    if (el('ct-precio-final')) el('ct-precio-final').value = precioFinal > 0 ? precioFinal.toFixed(2) : '';
}

function updateFormasPago(key) {
    const isChecked = document.getElementById('ct-fp-' + key).checked;
    const infoDiv = document.getElementById('ct-fp-info-' + key);
    if (infoDiv) {
        infoDiv.style.display = isChecked ? 'block' : 'none';
    }
}

function updateClausula(key, value) {
    // Stored on save — this is a hook for future live-preview
}

function numALetras(n) {
    if (n === 0) return 'cero';
    const unidades = ['','un','dos','tres','cuatro','cinco','seis','siete','ocho','nueve'];
    const especiales = ['diez','once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve'];
    const decenas = ['','diez','veinte','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa'];
    const centenas = ['','ciento','doscientos','trescientos','cuatrocientos','quinientos','seiscientos','setecientos','ochocientos','novecientos'];
    function bloque(num) {
        if (num === 0) return '';
        if (num === 100) return 'cien';
        let txt = '';
        if (num >= 100) { txt += centenas[Math.floor(num / 100)] + ' '; num %= 100; }
        if (num >= 20) { txt += decenas[Math.floor(num / 10)]; if (num % 10 > 0) txt += ' y ' + unidades[num % 10]; }
        else if (num >= 10) { txt += especiales[num - 10]; }
        else if (num > 0) { txt += unidades[num]; }
        return txt.trim();
    }
    let resultado = '';
    const entero = Math.floor(Math.abs(n));
    const centimos = Math.round((Math.abs(n) - entero) * 100);
    if (entero >= 1000000) {
        const millones = Math.floor(entero / 1000000);
        resultado += (millones === 1 ? 'un millón' : bloque(millones) + ' millones') + ' ';
    }
    const resto = entero % 1000000;
    if (resto >= 1000) {
        const miles = Math.floor(resto / 1000);
        resultado += (miles === 1 ? 'mil' : bloque(miles) + ' mil') + ' ';
    }
    const final = resto % 1000;
    if (final > 0 || entero === 0) resultado += bloque(final);
    resultado = resultado.trim() + ' euros';
    if (centimos > 0) resultado += ' con ' + bloque(centimos) + ' céntimos';
    return resultado.charAt(0).toUpperCase() + resultado.slice(1);
}

function autoRellenarLetras() {
    const precio = parseFloat(document.getElementById('ct-precio-final')?.value || document.getElementById('ct-precio-total')?.value) || 0;
    const letras = numALetras(precio);
    const el = document.getElementById('ct-precio-total-letras');
    if (el) el.value = letras;
}

function abrirFirmaPrestador() {
    const modal = document.getElementById('firma-modal');
    if (modal) { modal.style.display = 'flex'; initFirmaCanvas(); }
}

function cerrarFirmaModal() {
    const modal = document.getElementById('firma-modal');
    if (modal) modal.style.display = 'none';
}

function guardarFirmaDesdeModal() {
    const canvas = document.getElementById('firma-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasDrawing = imgData.data.some((v, i) => i % 4 === 3 && v > 0);
    if (!hasDrawing) { showAlert('Sin firma', 'Dibuja tu firma antes de guardar.', '⚠️'); return; }
    
    const signatureData = canvas.toDataURL('image/png');
    const preview = document.getElementById('firma-preview-img');
    const container = document.getElementById('firma-preview-container');
    if (preview && container) { preview.src = signatureData; container.style.display = ''; }
    
    const prestImg = document.getElementById('firma-prestador-img');
    const prestText = document.getElementById('firma-prestador-text');
    if (prestImg && prestText) {
        prestImg.src = signatureData;
        prestImg.style.display = '';
        prestText.style.display = 'none';
    }
    
    cerrarFirmaModal();
    showAlert('Firma guardada', 'La firma se ha guardado. Recuerda guardar el contrato.', '✅');
}

function enviarContratoEmail() {
    showAlert('Próximamente', 'El envío por email estará disponible próximamente.', '📧');
}

function enviarContratoWhatsApp() {
    const nombre = document.getElementById('ct-cliente-nombre')?.value || '';
    const tel = document.getElementById('ct-cliente-telefono')?.value || '';
    if (!tel) { showAlert('Sin teléfono', 'Introduce el teléfono del cliente primero.', '⚠️'); return; }
    const cleanTel = tel.replace(/[^0-9+]/g, '');
    const msg = encodeURIComponent(`Hola ${nombre}, te envío el contrato para revisión.`);
    window.open(`https://wa.me/${cleanTel}?text=${msg}`, '_blank');
}

function generarLinkFirma() {
    if (!contratoEditId) { showAlert('Guarda primero', 'Guarda el contrato antes de generar el link de firma.', '⚠️'); return; }
    const link = `${window.location.origin}/firma/${contratoEditId}`;
    navigator.clipboard.writeText(link).then(() => {
        showAlert('Link copiado', `Link de firma digital copiado al portapapeles:\n${link}`, '✅');
    }).catch(() => {
        showAlert('Link de firma', link, '🔗');
    });
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
        servicios: Array.from(document.querySelectorAll('#ct-servicios-list input')).map(i => i.value.trim()).filter(Boolean),
        precio_total: parseFloat(document.getElementById('ct-precio-total')?.value) || 0,
        precio_mensual: parseFloat(document.getElementById('ct-precio-mensual')?.value) || 0,
        duracion: parseInt(document.getElementById('ct-duracion')?.value) || 12,
        lugar: document.getElementById('ct-lugar')?.value || 'Mahón (Menorca)',
        fecha: document.getElementById('ct-fecha-contrato')?.value || '',
        fecha_inicio: document.getElementById('ct-fecha-inicio')?.value || '',
        notas: document.getElementById('ct-notas')?.value || '',
        // Payment methods
        fp_giro: document.getElementById('ct-fp-giro')?.checked,
        fp_transferencia: document.getElementById('ct-fp-transferencia')?.checked,
        fp_stripe: document.getElementById('ct-fp-stripe')?.checked,
        fp_bizum: document.getElementById('ct-fp-bizum')?.checked,
        fp_efectivo: document.getElementById('ct-fp-efectivo')?.checked,
        fp_otro: document.getElementById('ct-fp-otro')?.checked,
        // Payment details
        cuenta_bancaria: document.getElementById('ct-cuenta-bancaria')?.value || '',
        prestador_iban: document.getElementById('ct-prestador-iban')?.value || '',
        stripe_link: document.getElementById('ct-stripe-link')?.value || '',
        bizum_telefono: document.getElementById('ct-bizum-telefono')?.value || '',
        otro_metodo: document.getElementById('ct-otro-metodo')?.value || '',
        // Selected option
        pago_opcion: _selectedPagoOpcion || '',
        pago_opcion: _selectedPagoOpcion || '',
        // Textos de cláusulas custom
        clausulas: {
            cuarta: document.getElementById('ct-clausula-cuarta')?.value || CLAUSULAS_DEFAULT.cuarta,
            quinta: document.getElementById('ct-clausula-quinta')?.value || CLAUSULAS_DEFAULT.quinta,
            sexta: document.getElementById('ct-clausula-sexta')?.value || CLAUSULAS_DEFAULT.sexta,
            septima: document.getElementById('ct-clausula-septima')?.value || CLAUSULAS_DEFAULT.septima,
            octava: document.getElementById('ct-clausula-octava')?.value || CLAUSULAS_DEFAULT.octava,
            novena: document.getElementById('ct-clausula-novena')?.value || CLAUSULAS_DEFAULT.novena,
            decima: document.getElementById('ct-clausula-decima')?.value || CLAUSULAS_DEFAULT.decima,
            undecima: document.getElementById('ct-clausula-undecima')?.value || CLAUSULAS_DEFAULT.undecima,
            duodecima: document.getElementById('ct-clausula-duodecima')?.value || CLAUSULAS_DEFAULT.duodecima,
            adicional: document.getElementById('ct-clausula-adicional')?.value || ''
        }
    };
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
    addText('La forma de pago seleccionada por el/la Cliente y acordada por ambas partes es la siguiente:', margin, 8.5, 'normal');
    y += 2;
    
    // Add payment methods details
    let selectedMethods = [];
    if (c.fp_giro) selectedMethods.push(`Giro bancario (Cuenta del cliente: ${c.cuenta_bancaria || 'No indicada'})`);
    if (c.fp_transferencia) selectedMethods.push(`Transferencia bancaria (IBAN a transferir: ${c.prestador_iban || 'No indicado'})`);
    if (c.fp_stripe) selectedMethods.push(`Tarjeta bancaria vía Stripe (Enlace: ${c.stripe_link || 'No indicado'})`);
    if (c.fp_bizum) selectedMethods.push(`Bizum (Teléfono: ${c.bizum_telefono || 'No indicado'})`);
    if (c.fp_efectivo) selectedMethods.push(`Pago en efectivo`);
    if (c.fp_otro) selectedMethods.push(`Otro método: ${c.otro_metodo || 'No indicado'}`);
    
    if (selectedMethods.length > 0) {
        selectedMethods.forEach(sm => bullet(sm));
    } else {
        bullet('A acordar entre las partes.');
    }

    // Add selected payment timing (A, B, or C) if configured
    if (c.pago_opcion) {
        y += 2;
        let opcionText = '';
        if (c.pago_opcion === 'A') opcionText = 'Opción A: Pago aplazado.';
        if (c.pago_opcion === 'B') opcionText = 'Opción B: Pago fraccionado con descuento.';
        if (c.pago_opcion === 'C') opcionText = 'Opción C: Pago único adelantado con descuento.';
        addText(`Modalidad de pago seleccionada: ${opcionText}`, margin, 8.5, 'bold');
    }

    y += 2;
    addText('NOTAS IMPORTANTES:', margin, 8.5, 'bold');
    bullet('En caso de retraso en el pago, se aplicará un recargo del 5% más los gastos bancarios ocasionados sobre el importe impagado.');
    bullet('En caso de baja laboral debidamente justificada, se podrán acordar nuevos plazos de pago, sin ningún recargo por ello.');

    y += 4;
    sectionTitle('CUARTA.- OBLIGACIONES DEL PRESTADOR:');
    addText(c.clausulas.cuarta, margin, 8.5, 'normal');

    footer(2);

    // ═══════════════════════════════════════════════════════════
    // PAGE 3 - OBLIGACIONES CLIENTE + IP + GARANTÍA
    // ═══════════════════════════════════════════════════════════
    doc.addPage(); y = 30;

    sectionTitle('QUINTA.- OBLIGACIONES DEL CLIENTE:');
    addText(c.clausulas.quinta, margin, 8.5, 'normal');

    y += 4;
    sectionTitle('SEXTA.- PROPIEDAD INTELECTUAL Y ENTREGA DE TRABAJOS:');
    addText(c.clausulas.sexta, margin, 8.5, 'normal');

    y += 4;
    sectionTitle('SÉPTIMA.- GARANTÍA Y CONTINUIDAD:');
    addText(c.clausulas.septima, margin, 8.5, 'normal');

    footer(3);

    // ═══════════════════════════════════════════════════════════
    // PAGE 4 - COMISIÓN + RESOLUCIÓN + CONFIDENCIALIDAD + RGPD
    // ═══════════════════════════════════════════════════════════
    doc.addPage(); y = 30;

    sectionTitle('OCTAVA.- COMISIÓN POR COMERCIALIZACIÓN:');
    addText(c.clausulas.octava, margin, 8.5, 'normal');

    y += 4;
    sectionTitle('NOVENA.- RESOLUCIÓN DEL CONTRATO:');
    addText(c.clausulas.novena, margin, 8.5, 'normal');

    y += 4;
    sectionTitle('DÉCIMA.- CONFIDENCIALIDAD:');
    addText(c.clausulas.decima, margin, 8.5, 'normal');

    y += 4;
    sectionTitle('UNDÉCIMA.- PROTECCIÓN DE DATOS:');
    addText(c.clausulas.undecima, margin, 8.5, 'normal');

    footer(4);

    // ═══════════════════════════════════════════════════════════
    // PAGE 5 - CIBERSEGURIDAD + FIRMAS
    // ═══════════════════════════════════════════════════════════
    doc.addPage(); y = 30;

    sectionTitle('DUODÉCIMA.- CIBERSEGURIDAD Y SEGURIDAD DE LA INFORMACIÓN:');
    addText(c.clausulas.duodecima, margin, 8.5, 'normal');

    if (c.clausulas.adicional && c.clausulas.adicional.trim() !== '') {
        y += 4;
        sectionTitle('CLÁUSULAS ADICIONALES:');
        addText(c.clausulas.adicional, margin, 8.5, 'normal');
    }


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

// ── Activity Log (Configuración > Actividad) ──────────────────────
async function loadActivityLog() {
    const statsEl = document.getElementById('activity-stats');
    const timelineEl = document.getElementById('activity-timeline');
    const footerEl = document.getElementById('activity-footer');
    if (!timelineEl) return;

    // Show loading
    timelineEl.innerHTML = '<div style="position:absolute;left:5px;top:0;bottom:0;width:2px;background:var(--border-color)"></div><div style="text-align:center;padding:40px;color:var(--text-grey);font-size:0.85rem;">⏳ Cargando actividad...</div>';

    try {
        // Fetch ALL activity sources in parallel
        const [leadsRes, propEnvRes, presRes, contratosRes, emailLogsRes, meetingsRes, tasksRes, seguimientosRes] = await Promise.all([
            _supabase.from('outreach_leads').select('id, first_name, last_name, email, company_name, status, created_at, updated_at').order('created_at', { ascending: false }).limit(200),
            _supabase.from('propuestas_enviadas').select('id, lead_nombre, lead_email, titulo, estado, enviado_at, created_at').order('created_at', { ascending: false }).limit(100),
            _supabase.from('presupuestos').select('id, titulo, categoria, created_at, updated_at').order('created_at', { ascending: false }).limit(100),
            _supabase.from('contratos').select('id, titulo, cliente_nombre, estado, created_at, updated_at').order('created_at', { ascending: false }).limit(50),
            _supabase.from('outreach_email_logs').select('id, lead_id, lead_name, lead_email, subject, status, cadena_num, step_num, created_at').order('created_at', { ascending: false }).limit(200),
            _supabase.from('meetings').select('id, title, date, start_time, type, created_at, updated_at').order('created_at', { ascending: false }).limit(100),
            _supabase.from('tasks').select('id, title, status, created_at, updated_at').order('created_at', { ascending: false }).limit(100),
            _supabase.from('propuesta_seguimiento').select('id, lead_nombre, lead_email, columna, secuencia_activa, created_at, updated_at').order('created_at', { ascending: false }).limit(100)
        ]);

        const leads = leadsRes.data || [];
        const propEnv = propEnvRes.data || [];
        const pres = presRes.data || [];
        const contratos = contratosRes.data || [];
        const emailLogs = emailLogsRes.data || [];
        const meetings = meetingsRes.data || [];
        const tasks = tasksRes.data || [];
        const segRecords = seguimientosRes.data || [];

        // Build unified events list
        const events = [];

        // Lead events
        leads.forEach(l => {
            events.push({
                date: l.created_at,
                icon: '🎯',
                user: 'sistema',
                action: 'Crear',
                actionBg: 'rgba(52,199,89,0.1)',
                actionColor: '#34c759',
                desc: `Lead registrado: ${l.first_name || ''} ${l.last_name || ''} ${l.company_name ? '(' + l.company_name + ')' : ''}`.trim(),
                section: 'Leads',
                sectionBg: 'rgba(52,199,89,0.1)',
                sectionColor: '#34c759'
            });
            if (l.status === 'cliente') {
                events.push({
                    date: l.updated_at || l.created_at,
                    icon: '✅',
                    user: 'sistema',
                    action: 'Convertir',
                    actionBg: 'rgba(52,199,89,0.1)',
                    actionColor: '#34c759',
                    desc: `Lead convertido a cliente: ${l.first_name || ''} ${l.last_name || ''}`,
                    section: 'Leads',
                    sectionBg: 'rgba(52,199,89,0.1)',
                    sectionColor: '#34c759'
                });
            }
        });

        // Propuestas enviadas events
        propEnv.forEach(pe => {
            events.push({
                date: pe.enviado_at || pe.created_at,
                icon: '📨',
                user: 'gerard',
                action: 'Enviar',
                actionBg: 'rgba(175,82,222,0.1)',
                actionColor: '#af52de',
                desc: `Propuesta enviada a ${pe.lead_nombre || 'lead'}: ${pe.titulo || 'Sin título'}`,
                section: 'Propuestas',
                sectionBg: 'rgba(175,82,222,0.1)',
                sectionColor: '#af52de'
            });
            if (pe.estado === 'aceptada') {
                events.push({
                    date: pe.created_at,
                    icon: '🎉',
                    user: pe.lead_nombre || 'cliente',
                    action: 'Aceptar',
                    actionBg: 'rgba(52,199,89,0.1)',
                    actionColor: '#34c759',
                    desc: `Propuesta aceptada por ${pe.lead_nombre || 'cliente'}: ${pe.titulo || ''}`,
                    section: 'Propuestas',
                    sectionBg: 'rgba(175,82,222,0.1)',
                    sectionColor: '#af52de'
                });
            }
        });

        // Presupuestos (templates) events
        pres.forEach(p => {
            events.push({
                date: p.created_at,
                icon: '📄',
                user: 'gerard',
                action: 'Crear',
                actionBg: 'rgba(0,113,227,0.1)',
                actionColor: '#007AFF',
                desc: `Presupuesto creado: ${p.titulo || 'Sin título'}`,
                section: 'Presupuestos',
                sectionBg: 'rgba(0,113,227,0.1)',
                sectionColor: '#007AFF'
            });
            // Detect edits: if updated_at is significantly different from created_at
            if (p.updated_at && p.created_at && Math.abs(new Date(p.updated_at) - new Date(p.created_at)) > 60000) {
                events.push({
                    date: p.updated_at,
                    icon: '✏️',
                    user: 'gerard',
                    action: 'Editar',
                    actionBg: 'rgba(0,113,227,0.1)',
                    actionColor: '#007AFF',
                    desc: `Presupuesto editado: ${p.titulo || 'Sin título'}`,
                    section: 'Presupuestos',
                    sectionBg: 'rgba(0,113,227,0.1)',
                    sectionColor: '#007AFF'
                });
            }
        });

        // Contratos events
        contratos.forEach(c => {
            events.push({
                date: c.created_at,
                icon: '📝',
                user: 'sistema',
                action: 'Crear',
                actionBg: 'rgba(255,149,0,0.1)',
                actionColor: '#ff9500',
                desc: `Contrato creado: ${c.titulo || 'Sin título'} — ${c.cliente_nombre || ''}`,
                section: 'Contratos',
                sectionBg: 'rgba(255,149,0,0.1)',
                sectionColor: '#ff9500'
            });
            if (c.estado === 'firmado') {
                events.push({
                    date: c.updated_at || c.created_at,
                    icon: '✍️',
                    user: c.cliente_nombre || 'cliente',
                    action: 'Firmar',
                    actionBg: 'rgba(52,199,89,0.1)',
                    actionColor: '#34c759',
                    desc: `Contrato firmado: ${c.titulo || ''} por ${c.cliente_nombre || ''}`,
                    section: 'Contratos',
                    sectionBg: 'rgba(255,149,0,0.1)',
                    sectionColor: '#ff9500'
                });
            }
        });

        // Outreach email logs
        emailLogs.forEach(e => {
            const statusLabel = e.status === 'sent' ? 'Enviado' : e.status === 'failed' ? 'Fallido' : e.status || 'Enviado';
            const statusIcon = e.status === 'failed' ? '❌' : '📧';
            events.push({
                date: e.created_at,
                icon: statusIcon,
                user: 'sistema',
                action: statusLabel,
                actionBg: e.status === 'failed' ? 'rgba(255,59,48,0.1)' : 'rgba(255,69,58,0.1)',
                actionColor: e.status === 'failed' ? '#ff453a' : '#ff453a',
                desc: `Email outreach a ${e.lead_name || e.lead_email || 'lead'}: "${e.subject || 'Sin asunto'}"${e.cadena_num ? ' (Cadena ' + e.cadena_num + ', paso ' + (e.step_num || 1) + ')' : ''}`,
                section: 'Emails',
                sectionBg: 'rgba(255,69,58,0.1)',
                sectionColor: '#ff453a'
            });
        });

        // Meetings events
        meetings.forEach(m => {
            const typeLabels = { meeting: 'Reunión', call: 'Llamada', followup: 'Seguimiento', demo: 'Demo', other: 'Evento' };
            events.push({
                date: m.created_at,
                icon: '📅',
                user: 'gerard',
                action: 'Crear',
                actionBg: 'rgba(88,86,214,0.1)',
                actionColor: '#5856d6',
                desc: `${typeLabels[m.type] || 'Evento'} creado: ${m.title || 'Sin título'}${m.date ? ' — ' + new Date(m.date).toLocaleDateString('es-ES', {day:'2-digit', month:'short'}) : ''}`,
                section: 'Calendario',
                sectionBg: 'rgba(88,86,214,0.1)',
                sectionColor: '#5856d6'
            });
        });

        // Tasks events
        tasks.forEach(t => {
            events.push({
                date: t.created_at,
                icon: '☑️',
                user: 'gerard',
                action: 'Crear',
                actionBg: 'rgba(0,199,190,0.1)',
                actionColor: '#00c7be',
                desc: `Tarea creada: ${t.title || 'Sin título'}`,
                section: 'Tareas',
                sectionBg: 'rgba(0,199,190,0.1)',
                sectionColor: '#00c7be'
            });
            if (t.status === 'done' || t.status === 'completed') {
                events.push({
                    date: t.updated_at || t.created_at,
                    icon: '✅',
                    user: 'gerard',
                    action: 'Completar',
                    actionBg: 'rgba(52,199,89,0.1)',
                    actionColor: '#34c759',
                    desc: `Tarea completada: ${t.title || 'Sin título'}`,
                    section: 'Tareas',
                    sectionBg: 'rgba(0,199,190,0.1)',
                    sectionColor: '#00c7be'
                });
            }
        });

        // Seguimiento (kanban) events
        segRecords.forEach(s => {
            const colLabels = { enviada: 'Enviada', inmediato: 'Inmediato', mensual: 'Mensual', anual: 'Anual', cliente: 'Es Cliente', perdido: 'Lead Perdido', stop: 'Stop' };
            if (s.columna && s.columna !== 'enviada') {
                events.push({
                    date: s.updated_at || s.created_at,
                    icon: '🔀',
                    user: 'gerard',
                    action: 'Mover',
                    actionBg: 'rgba(88,86,214,0.1)',
                    actionColor: '#5856d6',
                    desc: `Seguimiento de ${s.lead_nombre || 'lead'} movido a columna "${colLabels[s.columna] || s.columna}"${s.secuencia_activa ? ' — secuencia ' + s.secuencia_activa : ''}`,
                    section: 'Seguimiento',
                    sectionBg: 'rgba(88,86,214,0.1)',
                    sectionColor: '#5856d6'
                });
            }
        });

        // Sort by date descending
        events.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Render stats (8 counters in 2 rows of 4)
        const statsData = [
            { icon: '🎯', count: leads.length, label: 'Leads' },
            { icon: '📄', count: pres.length, label: 'Presupuestos' },
            { icon: '📨', count: propEnv.length, label: 'Prop. Enviadas' },
            { icon: '✅', count: propEnv.filter(p => p.estado === 'aceptada').length, label: 'Aceptadas' },
            { icon: '📧', count: emailLogs.length, label: 'Emails Outreach' },
            { icon: '📝', count: contratos.length, label: 'Contratos' },
            { icon: '📅', count: meetings.length, label: 'Reuniones' },
            { icon: '☑️', count: tasks.length, label: 'Tareas' }
        ];

        if (statsEl) {
            statsEl.innerHTML = statsData.map(s => `
                <div style="padding:14px 12px;border-radius:12px;border:1px solid var(--border-color);background:var(--bg-card);display:flex;align-items:center;gap:10px">
                    <span style="font-size:1.1rem">${s.icon}</span>
                    <div><div style="font-size:1.1rem;font-weight:800;color:var(--text-main)">${s.count}</div><div style="font-size:0.65rem;color:var(--text-grey);font-weight:500">${s.label}</div></div>
                </div>
            `).join('');
        }

        // Group events by date
        const grouped = {};
        events.forEach(ev => {
            const d = new Date(ev.date);
            const key = d.toISOString().split('T')[0];
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(ev);
        });

        // Render timeline
        let html = '<div style="position:absolute;left:5px;top:0;bottom:0;width:2px;background:var(--border-color)"></div>';

        const sortedDays = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
        // Limit to last 30 days for performance
        const recentDays = sortedDays.slice(0, 30);

        recentDays.forEach(day => {
            const d = new Date(day + 'T12:00:00');
            const dayLabel = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            const capitalLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);

            html += `
                <div style="position:relative;margin-bottom:6px">
                    <div style="position:absolute;left:-20px;top:4px;width:12px;height:12px;border-radius:50%;background:#007AFF;border:2px solid var(--bg-main);z-index:1"></div>
                    <h4 style="font-size:0.82rem;font-weight:700;color:var(--text-main);padding:0 0 8px 8px">${capitalLabel}</h4>
                </div>
            `;

            grouped[day].forEach(ev => {
                const time = new Date(ev.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                html += `
                    <div style="position:relative;margin-left:8px;margin-bottom:12px">
                        <div style="position:absolute;left:-24px;top:14px;width:8px;height:8px;border-radius:50%;background:rgba(0,122,255,0.3);z-index:1"></div>
                        <div style="padding:12px 16px;border-radius:12px;border:1px solid var(--border-color);background:var(--bg-card);display:flex;justify-content:space-between;align-items:flex-start">
                            <div>
                                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                                    <span style="font-size:0.85rem">${ev.icon}</span>
                                    <span style="font-weight:600;font-size:0.82rem;color:var(--text-main)">${ev.user}</span>
                                    <span style="padding:2px 8px;border-radius:5px;background:${ev.actionBg};color:${ev.actionColor};font-size:0.65rem;font-weight:800;text-transform:uppercase">${ev.action}</span>
                                </div>
                                <div style="font-size:0.78rem;color:var(--text-grey);margin-bottom:3px">${ev.desc}</div>
                                <div style="display:flex;align-items:center;gap:4px"><span style="padding:2px 8px;border-radius:5px;background:${ev.sectionBg};color:${ev.sectionColor};font-size:0.62rem;font-weight:700">${ev.section}</span></div>
                            </div>
                            <span style="font-size:0.72rem;color:var(--text-grey);white-space:nowrap;margin-left:12px">${time}</span>
                        </div>
                    </div>
                `;
            });
        });

        if (events.length === 0) {
            html += '<div style="text-align:center;padding:40px;color:var(--text-grey);font-size:0.85rem;">No hay actividad registrada todavía</div>';
        }

        timelineEl.innerHTML = html;
        if (footerEl) footerEl.textContent = `Mostrando ${events.length} registros · ${recentDays.length} días · Actualizado: ${new Date().toLocaleTimeString('es-ES', {hour:'2-digit', minute:'2-digit'})}`;

    } catch (err) {
        console.error('loadActivityLog error:', err);
        timelineEl.innerHTML = '<div style="position:absolute;left:5px;top:0;bottom:0;width:2px;background:var(--border-color)"></div><div style="text-align:center;padding:40px;color:var(--accent-red);font-size:0.85rem;">❌ Error al cargar la actividad</div>';
    }
}

// ═══════════════════════════════════════════════════════════
// ── FORMULARIOS MANAGEMENT ─────────────────────────────────
// ═══════════════════════════════════════════════════════════

let formulariosList = [];
let formBuilderFields = [];
let currentEmbedForm = null;
let currentResponsesForm = null;

async function loadFormularios() {
    const listEl = document.getElementById('forms-list');
    try {
        const res = await fetch('/api/formularios');
        const data = await res.json();

        if (!data.success) {
            // Maybe tables don't exist yet — try setup
            if (data.sql) {
                listEl.innerHTML = `<div class="stat-card-glass" style="padding:30px;text-align:center">
                    <div style="font-size:2rem;margin-bottom:12px">🔧</div>
                    <h3 style="font-size:0.95rem;font-weight:700;color:var(--text-main);margin-bottom:8px">Configuración necesaria</h3>
                    <p style="color:var(--text-grey);font-size:0.82rem;margin-bottom:16px">Ejecuta el SQL en Supabase para crear las tablas de formularios.</p>
                    <button class="btn-primary" style="padding:8px 18px;font-size:0.82rem" onclick="navigator.clipboard.writeText(${JSON.stringify(data.sql)}).then(()=>showAlert('Copiado','SQL copiado al portapapeles. Pégalo en Supabase SQL Editor.','✅'))">📋 Copiar SQL</button>
                </div>`;
            } else {
                listEl.innerHTML = `<div style="text-align:center;padding:30px;color:var(--accent-red);font-size:0.82rem">❌ ${data.error || 'Error desconocido'}</div>`;
            }
            return;
        }

        formulariosList = data.formularios || [];

        // Update stats
        document.getElementById('forms-count').textContent = formulariosList.length;
        document.getElementById('forms-active-count').textContent = formulariosList.filter(f => f.activo).length;

        // Load responses count
        let totalResp = 0;
        let todayResp = 0;
        const today = new Date().toISOString().split('T')[0];
        for (const f of formulariosList) {
            if (f._response_count) {
                totalResp += f._response_count;
            }
        }
        document.getElementById('forms-responses-count').textContent = totalResp;
        document.getElementById('forms-today-count').textContent = todayResp || '—';

        renderFormulariosList(formulariosList);

    } catch (err) {
        console.error('loadFormularios error:', err);
        listEl.innerHTML = `<div style="text-align:center;padding:30px;color:var(--accent-red);font-size:0.82rem">❌ Error al cargar formularios</div>`;
    }
}

function renderFormulariosList(forms) {
    const listEl = document.getElementById('forms-list');
    const filter = document.getElementById('forms-filter')?.value || 'all';

    let filtered = forms;
    if (filter === 'active') filtered = forms.filter(f => f.activo);
    if (filter === 'inactive') filtered = forms.filter(f => !f.activo);
    if (filter === 'ficha_cliente') filtered = forms.filter(f => f.tipo === 'ficha_cliente');
    if (filter === 'custom') filtered = forms.filter(f => f.tipo !== 'ficha_cliente');

    if (filtered.length === 0) {
        listEl.innerHTML = `<div class="stat-card-glass" style="padding:40px;text-align:center">
            <div style="font-size:2.5rem;margin-bottom:12px;opacity:0.4">📋</div>
            <h3 style="font-size:0.95rem;font-weight:700;color:var(--text-main);margin-bottom:8px">No hay formularios</h3>
            <p style="color:var(--text-grey);font-size:0.82rem;margin-bottom:16px">Crea tu primer formulario para empezar a captar datos.</p>
            <button class="btn-primary" style="padding:8px 18px;font-size:0.82rem" onclick="openFormBuilder()">+ Crear Formulario</button>
        </div>`;
        return;
    }

    let html = '';
    filtered.forEach(f => {
        const campos = f.campos || [];
        const isFicha = f.tipo === 'ficha_cliente';
        const typeIcon = isFicha ? '👤' : f.tipo === 'contacto' ? '📞' : f.tipo === 'captacion' ? '🎯' : f.tipo === 'encuesta' ? '📊' : '📋';
        const typeLabel = isFicha ? 'Ficha Cliente' : f.tipo === 'contacto' ? 'Contacto' : f.tipo === 'captacion' ? 'Captación' : f.tipo === 'encuesta' ? 'Encuesta' : 'Personalizado';
        const statusColor = f.activo ? '#34c759' : '#8e8e93';
        const statusLabel = f.activo ? '🟢 Activo' : '⚪ Inactivo';
        const dateStr = f.created_at ? new Date(f.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

        html += `<div class="stat-card-glass" style="padding:16px 20px;display:flex;align-items:center;gap:16px;transition:all 0.15s" 
                     onmouseenter="this.style.transform='translateY(-1px)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'" 
                     onmouseleave="this.style.transform='none';this.style.boxShadow='none'">
            <!-- Icon -->
            <div style="width:48px;height:48px;border-radius:14px;background:${isFicha ? 'linear-gradient(135deg,#007AFF,#5856d6)' : 'linear-gradient(135deg,#ff9500,#ff6b35)'};display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0">${typeIcon}</div>
            
            <!-- Info -->
            <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
                    <span style="font-weight:700;font-size:0.9rem;color:var(--text-main)">${escHtml(f.nombre)}</span>
                    ${isFicha ? '<span style="padding:2px 8px;border-radius:5px;background:rgba(0,113,227,0.1);color:#007AFF;font-size:0.62rem;font-weight:700">PRINCIPAL</span>' : ''}
                    <span style="font-size:0.7rem;color:${statusColor};font-weight:600">${statusLabel}</span>
                </div>
                <div style="font-size:0.75rem;color:var(--text-grey);margin-bottom:4px">${escHtml(f.descripcion || '')}</div>
                <div style="display:flex;gap:12px;font-size:0.7rem;color:var(--text-grey)">
                    <span>📋 ${campos.length} campos</span>
                    <span>🏷️ ${typeLabel}</span>
                    <span>📅 ${dateStr}</span>
                </div>
            </div>

            <!-- Actions -->
            <div style="display:flex;gap:6px;flex-shrink:0">
                <button onclick="window.open(window.location.origin+'/api/public/form?id=${f.id}','_blank')" title="Ver formulario" style="padding:8px 10px;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-main);cursor:pointer;font-size:0.82rem;transition:all 0.15s" onmouseenter="this.style.background='rgba(52,199,89,0.08)'" onmouseleave="this.style.background='var(--bg-main)'">👁️</button>
                <button onclick="viewFormResponses('${f.id}')" title="Ver respuestas" style="padding:8px 10px;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-main);cursor:pointer;font-size:0.82rem;transition:all 0.15s" onmouseenter="this.style.background='rgba(0,113,227,0.08)'" onmouseleave="this.style.background='var(--bg-main)'">📊</button>
                <button onclick="openFormEmbed('${f.id}')" title="Compartir/Embed" style="padding:8px 10px;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-main);cursor:pointer;font-size:0.82rem;transition:all 0.15s" onmouseenter="this.style.background='rgba(0,113,227,0.08)'" onmouseleave="this.style.background='var(--bg-main)'">🔗</button>
                <button onclick="editFormulario('${f.id}')" title="Editar" style="padding:8px 10px;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-main);cursor:pointer;font-size:0.82rem;transition:all 0.15s" onmouseenter="this.style.background='rgba(255,149,0,0.08)'" onmouseleave="this.style.background='var(--bg-main)'">✏️</button>
                <button onclick="toggleFormulario('${f.id}', ${!f.activo})" title="${f.activo ? 'Desactivar' : 'Activar'}" style="padding:8px 10px;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-main);cursor:pointer;font-size:0.82rem;transition:all 0.15s" onmouseenter="this.style.background='rgba(52,199,89,0.08)'" onmouseleave="this.style.background='var(--bg-main)'">${f.activo ? '⏸️' : '▶️'}</button>
                ${!isFicha ? `<button onclick="deleteFormulario('${f.id}')" title="Eliminar" style="padding:8px 10px;border-radius:8px;border:1px solid rgba(255,59,48,0.2);background:var(--bg-main);cursor:pointer;font-size:0.82rem;transition:all 0.15s" onmouseenter="this.style.background='rgba(255,59,48,0.08)'" onmouseleave="this.style.background='var(--bg-main)'">🗑️</button>` : ''}
            </div>
        </div>`;
    });

    listEl.innerHTML = html;
}

function filterFormularios() {
    renderFormulariosList(formulariosList);
}

// ── Form Builder ──────────────────────────────────────────
function openFormBuilder(editData) {
    formBuilderFields = [];
    document.getElementById('fb-edit-id').value = '';
    document.getElementById('fb-nombre').value = '';
    document.getElementById('fb-descripcion').value = '';
    document.getElementById('fb-tipo').value = 'custom';
    document.getElementById('fb-color').value = '#0071e3';
    document.getElementById('fb-submit-text').value = 'Enviar';
    document.getElementById('fb-success-msg').value = '¡Gracias! Tus datos se han enviado correctamente.';
    document.getElementById('form-builder-title').textContent = 'Crear Formulario';

    if (editData) {
        document.getElementById('fb-edit-id').value = editData.id;
        document.getElementById('fb-nombre').value = editData.nombre || '';
        document.getElementById('fb-descripcion').value = editData.descripcion || '';
        document.getElementById('fb-tipo').value = editData.tipo || 'custom';
        document.getElementById('fb-color').value = editData.config?.color_primary || '#0071e3';
        document.getElementById('fb-submit-text').value = editData.config?.submit_text || 'Enviar';
        document.getElementById('fb-success-msg').value = editData.config?.success_message || '¡Gracias!';
        document.getElementById('form-builder-title').textContent = 'Editar Formulario';
        formBuilderFields = (editData.campos || []).map(c => ({...c}));
    }

    renderBuilderFields();
    document.getElementById('form-builder-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeFormBuilder() {
    document.getElementById('form-builder-modal').style.display = 'none';
    document.body.style.overflow = '';
}

function addFormField() {
    const id = 'field_' + Date.now();
    formBuilderFields.push({
        id,
        label: 'Nuevo campo',
        type: 'text',
        required: false,
        placeholder: '',
        section: 'general',
        options: []
    });
    renderBuilderFields();
}

function removeFormField(idx) {
    formBuilderFields.splice(idx, 1);
    renderBuilderFields();
}

function moveFormField(idx, dir) {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= formBuilderFields.length) return;
    [formBuilderFields[idx], formBuilderFields[newIdx]] = [formBuilderFields[newIdx], formBuilderFields[idx]];
    renderBuilderFields();
}

function updateFormField(idx, key, val) {
    if (formBuilderFields[idx]) {
        formBuilderFields[idx][key] = val;
        if (key === 'label' && !formBuilderFields[idx]._idManual) {
            formBuilderFields[idx].id = 'field_' + val.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+$/, '');
        }
    }
}

function renderBuilderFields() {
    const container = document.getElementById('fb-fields-list');
    if (formBuilderFields.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-grey);font-size:0.8rem">Haz clic en "+ Añadir campo" para empezar</div>';
        return;
    }

    const typeLabels = { text: '📝 Texto', email: '📧 Email', tel: '📞 Teléfono', number: '🔢 Número', date: '📅 Fecha', url: '🔗 URL', textarea: '📄 Texto largo', select: '📋 Selector', checkbox: '☑️ Checkbox', radio: '🔘 Radio' };
    const sectionLabels = { general: 'General', personal: 'Personal', negocio: 'Negocio', redes: 'Redes Sociales' };

    let html = '';
    formBuilderFields.forEach((f, i) => {
        html += `<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;background:var(--bg-card);border:1px solid var(--border-color);transition:all 0.15s">
            <!-- Drag handle -->
            <div style="display:flex;flex-direction:column;gap:2px;cursor:grab;color:var(--text-grey);font-size:0.7rem">
                <button onclick="moveFormField(${i},-1)" style="background:none;border:none;cursor:pointer;padding:0;font-size:0.65rem;color:var(--text-grey)">▲</button>
                <button onclick="moveFormField(${i},1)" style="background:none;border:none;cursor:pointer;padding:0;font-size:0.65rem;color:var(--text-grey)">▼</button>
            </div>
            <!-- Label -->
            <input type="text" value="${escHtml(f.label)}" onchange="updateFormField(${i},'label',this.value)" 
                style="flex:1;padding:6px 10px;border-radius:6px;border:1px solid var(--border-color);background:var(--bg-main);color:var(--text-main);font-size:0.8rem;font-family:inherit;min-width:100px" placeholder="Nombre">
            <!-- Type -->
            <select onchange="updateFormField(${i},'type',this.value)" 
                style="padding:6px 8px;border-radius:6px;border:1px solid var(--border-color);background:var(--bg-main);color:var(--text-main);font-size:0.75rem;font-family:inherit;min-width:100px">
                ${Object.entries(typeLabels).map(([k, v]) => `<option value="${k}" ${f.type === k ? 'selected' : ''}>${v}</option>`).join('')}
            </select>
            <!-- Section -->
            <select onchange="updateFormField(${i},'section',this.value)" 
                style="padding:6px 8px;border-radius:6px;border:1px solid var(--border-color);background:var(--bg-main);color:var(--text-main);font-size:0.75rem;font-family:inherit;min-width:80px">
                ${Object.entries(sectionLabels).map(([k, v]) => `<option value="${k}" ${f.section === k ? 'selected' : ''}>${v}</option>`).join('')}
            </select>
            <!-- Required -->
            <label style="display:flex;align-items:center;gap:4px;font-size:0.72rem;color:var(--text-grey);white-space:nowrap;cursor:pointer">
                <input type="checkbox" ${f.required ? 'checked' : ''} onchange="updateFormField(${i},'required',this.checked)"> Req.
            </label>
            <!-- Delete -->
            <button onclick="removeFormField(${i})" style="background:none;border:none;cursor:pointer;font-size:0.85rem;color:var(--accent-red);padding:4px">✕</button>
        </div>`;
    });
    container.innerHTML = html;
}

async function saveFormulario() {
    const nombre = document.getElementById('fb-nombre').value.trim();
    if (!nombre) {
        showAlert('Error', 'El nombre del formulario es obligatorio.', '⚠️');
        return;
    }

    const editId = document.getElementById('fb-edit-id').value;
    const payload = {
        nombre,
        descripcion: document.getElementById('fb-descripcion').value.trim(),
        tipo: document.getElementById('fb-tipo').value,
        campos: formBuilderFields,
        activo: true,
        config: {
            color_primary: document.getElementById('fb-color').value,
            submit_text: document.getElementById('fb-submit-text').value || 'Enviar',
            success_message: document.getElementById('fb-success-msg').value || '¡Gracias!'
        }
    };

    try {
        const method = editId ? 'PUT' : 'POST';
        if (editId) payload.id = editId;

        const res = await fetch('/api/formularios', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        
        if (result.success) {
            showAlert('Guardado', `Formulario "${nombre}" ${editId ? 'actualizado' : 'creado'} correctamente.`, '✅');
            closeFormBuilder();
            loadFormularios();
        } else {
            showAlert('Error', result.error || 'No se pudo guardar.', '❌');
        }
    } catch (err) {
        showAlert('Error', 'Error de red al guardar.', '❌');
    }
}

async function editFormulario(id) {
    const form = formulariosList.find(f => f.id === id);
    if (form) {
        openFormBuilder(form);
    }
}

async function toggleFormulario(id, newState) {
    try {
        const res = await fetch('/api/formularios', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, activo: newState })
        });
        const result = await res.json();
        if (result.success) {
            showAlert('Actualizado', `Formulario ${newState ? 'activado' : 'desactivado'}.`, newState ? '▶️' : '⏸️');
            loadFormularios();
        }
    } catch (err) {
        showAlert('Error', 'No se pudo actualizar.', '❌');
    }
}

async function deleteFormulario(id) {
    if (!confirm('¿Eliminar este formulario y todas sus respuestas?')) return;
    try {
        const res = await fetch(`/api/formularios?id=${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            showAlert('Eliminado', 'Formulario eliminado.', '🗑️');
            loadFormularios();
        }
    } catch (err) {
        showAlert('Error', 'No se pudo eliminar.', '❌');
    }
}

// ── Form Responses ──────────────────────────────────────────
async function viewFormResponses(id) {
    const form = formulariosList.find(f => f.id === id);
    if (!form) return;

    currentResponsesForm = form;
    document.getElementById('responses-title').textContent = `Respuestas — ${form.nombre}`;
    document.getElementById('forms-responses-panel').style.display = 'block';
    document.getElementById('responses-list').innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-grey);font-size:0.82rem">⏳ Cargando...</div>';

    try {
        const res = await fetch(`/api/formularios?id=${id}&respuestas=true`);
        const data = await res.json();

        const respuestas = data.respuestas || [];
        document.getElementById('responses-count-badge').textContent = respuestas.length;

        if (respuestas.length === 0) {
            document.getElementById('responses-list').innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-grey);font-size:0.82rem"><div style="font-size:2rem;margin-bottom:8px;opacity:0.4">📭</div>Aún no hay respuestas para este formulario</div>';
            return;
        }

        let html = '';
        respuestas.forEach((r, i) => {
            const datos = r.datos || {};
            const dateStr = r.created_at ? new Date(r.created_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
            
            let fieldsHtml = '';
            Object.entries(datos).forEach(([k, v]) => {
                if (!v) return;
                const label = (form.campos || []).find(c => c.id === k)?.label || k;
                fieldsHtml += `<div style="display:flex;gap:8px;font-size:0.78rem;padding:3px 0">
                    <span style="color:var(--text-grey);min-width:120px;font-weight:600">${escHtml(label)}</span>
                    <span style="color:var(--text-main)">${escHtml(String(v))}</span>
                </div>`;
            });

            html += `<div style="padding:14px 18px;border-bottom:1px solid var(--border-color)">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                    <span style="font-weight:700;font-size:0.82rem;color:var(--text-main)">Respuesta #${respuestas.length - i}</span>
                    <span style="font-size:0.7rem;color:var(--text-grey)">${dateStr}</span>
                </div>
                ${fieldsHtml}
                ${r.ip ? `<div style="font-size:0.68rem;color:var(--text-grey);margin-top:6px">IP: ${r.ip}</div>` : ''}
            </div>`;
        });

        document.getElementById('responses-list').innerHTML = html;
    } catch (err) {
        document.getElementById('responses-list').innerHTML = '<div style="text-align:center;padding:30px;color:var(--accent-red);font-size:0.82rem">❌ Error al cargar respuestas</div>';
    }
}

function closeResponsesPanel() {
    document.getElementById('forms-responses-panel').style.display = 'none';
    currentResponsesForm = null;
}

function exportResponses() {
    if (!currentResponsesForm) return;
    // Re-fetch and export as CSV
    fetch(`/api/formularios?id=${currentResponsesForm.id}&respuestas=true`)
        .then(r => r.json())
        .then(data => {
            const respuestas = data.respuestas || [];
            if (respuestas.length === 0) { showAlert('Sin datos', 'No hay respuestas para exportar.', '📭'); return; }
            
            // Get all unique keys
            const allKeys = new Set();
            respuestas.forEach(r => Object.keys(r.datos || {}).forEach(k => allKeys.add(k)));
            const keys = ['created_at', ...allKeys];

            const campos = currentResponsesForm.campos || [];
            const headers = keys.map(k => {
                if (k === 'created_at') return 'Fecha';
                const campo = campos.find(c => c.id === k);
                return campo ? campo.label : k;
            });

            let csv = headers.join(',') + '\n';
            respuestas.forEach(r => {
                const row = keys.map(k => {
                    let val = k === 'created_at' ? (r.created_at || '') : (r.datos?.[k] || '');
                    return `"${String(val).replace(/"/g, '""')}"`;
                });
                csv += row.join(',') + '\n';
            });

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `respuestas_${currentResponsesForm.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
        })
        .catch(() => showAlert('Error', 'No se pudo exportar.', '❌'));
}

// ── Embed/Export ─────────────────────────────────────────────
function openFormEmbed(id) {
    const form = formulariosList.find(f => f.id === id);
    if (!form) return;

    currentEmbedForm = form;
    const baseUrl = window.location.origin;
    const formUrl = `${baseUrl}/api/public/form?id=${id}`;

    document.getElementById('embed-form-name').textContent = form.nombre;
    document.getElementById('embed-link-url').value = formUrl;
    document.getElementById('embed-link-open').href = formUrl;

    // iframe code
    document.getElementById('embed-iframe-code').value = `<iframe src="${formUrl}" width="100%" height="700" frameborder="0" style="border:none;border-radius:12px;max-width:640px;margin:0 auto;display:block"></iframe>`;

    // HTML embed code
    const campos = form.campos || [];
    const color = form.config?.color_primary || '#0071e3';
    let htmlCode = `<!-- Formulario: ${escHtml(form.nombre)} -->\n<form id="cerebro-form-${id.slice(0,8)}" action="${baseUrl}/api/public/form" method="POST" style="max-width:640px;margin:0 auto;font-family:system-ui,sans-serif">\n  <input type="hidden" name="formulario_id" value="${id}">\n`;
    campos.forEach(c => {
        const req = c.required ? ' required' : '';
        if (c.type === 'textarea') {
            htmlCode += `  <div style="margin-bottom:14px"><label style="font-weight:600;font-size:14px;display:block;margin-bottom:4px">${escHtml(c.label)}</label><textarea name="${c.id}" placeholder="${escHtml(c.placeholder || '')}"${req} style="width:100%;padding:10px;border-radius:8px;border:1px solid #ddd;font-family:inherit;font-size:14px" rows="3"></textarea></div>\n`;
        } else if (c.type === 'select') {
            htmlCode += `  <div style="margin-bottom:14px"><label style="font-weight:600;font-size:14px;display:block;margin-bottom:4px">${escHtml(c.label)}</label><select name="${c.id}"${req} style="width:100%;padding:10px;border-radius:8px;border:1px solid #ddd;font-size:14px"><option value="">Seleccionar</option></select></div>\n`;
        } else {
            htmlCode += `  <div style="margin-bottom:14px"><label style="font-weight:600;font-size:14px;display:block;margin-bottom:4px">${escHtml(c.label)}</label><input type="${c.type}" name="${c.id}" placeholder="${escHtml(c.placeholder || '')}"${req} style="width:100%;padding:10px;border-radius:8px;border:1px solid #ddd;font-size:14px"></div>\n`;
        }
    });
    htmlCode += `  <button type="submit" style="background:${color};color:#fff;border:none;padding:12px 24px;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;width:100%">${escHtml(form.config?.submit_text || 'Enviar')}</button>\n</form>`;
    document.getElementById('embed-html-code').value = htmlCode;

    // Script embed
    document.getElementById('embed-script-code').value = `<!-- Widget: ${escHtml(form.nombre)} -->\n<div id="cerebro-form-widget-${id.slice(0,8)}"></div>\n<script>\n(function(){\n  var c=document.getElementById("cerebro-form-widget-${id.slice(0,8)}");\n  var f=document.createElement("iframe");\n  f.src="${formUrl}";\n  f.style="width:100%;height:700px;border:none;border-radius:12px";\n  c.appendChild(f);\n})();\n<\/script>`;

    switchEmbedTab('link');
    document.getElementById('form-embed-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeEmbedModal() {
    document.getElementById('form-embed-modal').style.display = 'none';
    document.body.style.overflow = '';
}

function switchEmbedTab(tab) {
    ['link', 'html', 'iframe', 'script'].forEach(t => {
        const tabEl = document.getElementById(`embed-tab-${t}`);
        if (tabEl) tabEl.style.display = t === tab ? 'block' : 'none';
    });
    document.querySelectorAll('.embed-tab').forEach(btn => {
        const isActive = btn.dataset.tab === tab;
        btn.style.color = isActive ? 'var(--accent-blue)' : 'var(--text-grey)';
        btn.style.borderBottomColor = isActive ? 'var(--accent-blue)' : 'transparent';
        btn.classList.toggle('active', isActive);
    });
}

function copyEmbedCode(elId) {
    const el = document.getElementById(elId);
    if (el) {
        navigator.clipboard.writeText(el.value).then(() => {
            showAlert('Copiado', 'Código copiado al portapapeles.', '📋');
        });
    }
}

// Helper used for escaping in formularios
function escHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ═══════════════════════════════════════════════════════════
// ── STORAGE MANAGEMENT ─────────────────────────────────────
// ═══════════════════════════════════════════════════════════

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
            propuestas: { label: 'Propuestas', color: '#af52de', bgColor: 'rgba(175,82,222,0.1)', icon: '📨' },
            imagenes: { label: 'Imágenes', color: '#007AFF', bgColor: 'rgba(0,113,227,0.1)', icon: '🖼️' },
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
            const iconMap = { pdf: '📕', doc: '📘', docx: '📘', xls: '📊', xlsx: '📊', csv: '📊', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', svg: '🎨', webp: '🖼️', zip: '📦', rar: '📦', txt: '📝', html: '🌐' };
            const catBadges = {
                contratos: { label: 'Contrato', bg: 'rgba(255,69,58,0.1)', color: '#ff453a' },
                propuestas: { label: 'Propuesta', bg: 'rgba(175,82,222,0.1)', color: '#af52de' },
                imagenes: { label: 'Imagen', bg: 'rgba(0,113,227,0.1)', color: '#007AFF' },
                documentos: { label: 'Documento', bg: 'rgba(255,149,0,0.1)', color: '#ff9500' },
                otros: { label: 'Otro', bg: 'rgba(142,142,147,0.1)', color: '#8e8e93' }
            };
            let html = '';
            files.forEach(f => {
                const ext = (f.name.split('.').pop() || '').toLowerCase();
                let icon = iconMap[ext] || '📄';
                if (f.source === 'db_contratos') icon = '📝';
                if (f.source === 'db_propuestas') icon = '📨';
                
                const dateStr = f.created_at ? new Date(f.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
                const badge = catBadges[f.category] || catBadges.otros;
                const sourceLabel = f.source === 'db_contratos' ? 'Base de datos' : f.source === 'db_propuestas' ? 'Base de datos' : f.bucket;
                
                // Estado badge for DB items
                let estadoHtml = '';
                if (f.meta && f.meta.estado_label) {
                    const isGreen = f.meta.estado_label.includes('Firmado') || f.meta.estado_label.includes('Aceptada');
                    const isRed = f.meta.estado_label.includes('Rechazada');
                    const estadoColor = isGreen ? '#34c759' : isRed ? '#ff453a' : '#ff9500';
                    const estadoBg = isGreen ? 'rgba(52,199,89,0.1)' : isRed ? 'rgba(255,59,48,0.1)' : 'rgba(255,149,0,0.1)';
                    estadoHtml = `<span style="padding:2px 8px;border-radius:5px;background:${estadoBg};color:${estadoColor};font-size:0.62rem;font-weight:700;white-space:nowrap">${f.meta.estado_label}</span>`;
                }

                // Action button
                let actionHtml = '';
                if (f.url) {
                    actionHtml = `<a href="${f.url}" target="_blank" style="color:#007AFF;font-size:0.75rem;font-weight:600;text-decoration:none;white-space:nowrap;padding:4px 10px;border-radius:6px;border:1px solid rgba(0,113,227,0.2);background:rgba(0,113,227,0.04);transition:all 0.15s" onmouseenter="this.style.background='rgba(0,113,227,0.1)'" onmouseleave="this.style.background='rgba(0,113,227,0.04)'">⬇️ Abrir</a>`;
                }

                html += `<div style="display:flex;align-items:center;gap:12px;padding:12px 18px;border-bottom:1px solid var(--border-color);transition:background 0.15s" onmouseenter="this.style.background='var(--bg-hover)'" onmouseleave="this.style.background='transparent'">
                    <span style="font-size:1.4rem">${icon}</span>
                    <div style="flex:1;min-width:0">
                        <div style="font-size:0.82rem;font-weight:600;color:var(--text-main);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.name}</div>
                        <div style="font-size:0.68rem;color:var(--text-grey);margin-top:2px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                            <span>📁 ${sourceLabel}</span>
                            <span>·</span>
                            <span>${formatFileSize(f.size)}</span>
                            <span>·</span>
                            <span>${dateStr}</span>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px">
                        ${estadoHtml}
                        <span style="padding:2px 8px;border-radius:5px;background:${badge.bg};color:${badge.color};font-size:0.62rem;font-weight:700;white-space:nowrap">${badge.label}</span>
                        ${actionHtml}
                    </div>
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

// Load business data
function loadBizData() {
    try {
        const el = id => document.getElementById(id);
        const bcRaw = localStorage.getItem('cc_biz_config');
        if (!bcRaw) return;
        const bc = JSON.parse(bcRaw);
        
        if (bc.stripe) {
            if (el('cfg-fp-stripe-toggle')) el('cfg-fp-stripe-toggle').checked = bc.stripe.active;
            if (el('cfg-fp-stripe-titular')) el('cfg-fp-stripe-titular').value = bc.stripe.titular || '';
            if (el('cfg-fp-stripe-pais')) el('cfg-fp-stripe-pais').value = bc.stripe.pais || '';
            if (el('cfg-fp-stripe-business')) el('cfg-fp-stripe-business').value = bc.stripe.business || '';
            if (el('cfg-fp-stripe-email')) el('cfg-fp-stripe-email').value = bc.stripe.email || '';
        }
        if (bc.transferencia) {
            if (el('cfg-fp-transferencia-toggle')) el('cfg-fp-transferencia-toggle').checked = bc.transferencia.active;
            if (el('cfg-fp-transferencia-banco')) el('cfg-fp-transferencia-banco').value = bc.transferencia.banco || '';
            if (el('cfg-fp-transferencia-titular')) el('cfg-fp-transferencia-titular').value = bc.transferencia.titular || '';
            if (el('cfg-fp-transferencia-iban')) el('cfg-fp-transferencia-iban').value = bc.transferencia.iban || '';
            if (el('cfg-fp-transferencia-concepto')) el('cfg-fp-transferencia-concepto').value = bc.transferencia.concepto || '';
        }
        if (bc.bizum) {
            if (el('cfg-fp-bizum-toggle')) el('cfg-fp-bizum-toggle').checked = bc.bizum.active;
            if (el('cfg-fp-bizum-telefono')) el('cfg-fp-bizum-telefono').value = bc.bizum.telefono || '';
        }
        if (bc.giro) {
            if (el('cfg-fp-giro-toggle')) el('cfg-fp-giro-toggle').checked = bc.giro.active;
            if (el('cfg-fp-giro-banco')) el('cfg-fp-giro-banco').value = bc.giro.banco || '';
            if (el('cfg-fp-giro-iban')) el('cfg-fp-giro-iban').value = bc.giro.iban || '';
        }
        if (bc.efectivo) {
            if (el('cfg-fp-efectivo-toggle')) el('cfg-fp-efectivo-toggle').checked = bc.efectivo.active;
        }
        if (bc.siniva) {
            if (el('cfg-fp-siniva-toggle')) el('cfg-fp-siniva-toggle').checked = bc.siniva.active;
        }
    } catch (e) { console.error('Error loading biz config', e); }
}

// Save business data
function saveBizData() {
    try {
        const el = id => document.getElementById(id);
        const config = {
            stripe: {
                active: el('cfg-fp-stripe-toggle')?.checked || false,
                titular: el('cfg-fp-stripe-titular')?.value || '',
                pais: el('cfg-fp-stripe-pais')?.value || '',
                business: el('cfg-fp-stripe-business')?.value || '',
                email: el('cfg-fp-stripe-email')?.value || ''
            },
            transferencia: {
                active: el('cfg-fp-transferencia-toggle')?.checked || false,
                banco: el('cfg-fp-transferencia-banco')?.value || '',
                titular: el('cfg-fp-transferencia-titular')?.value || '',
                iban: el('cfg-fp-transferencia-iban')?.value || '',
                concepto: el('cfg-fp-transferencia-concepto')?.value || ''
            },
            bizum: {
                active: el('cfg-fp-bizum-toggle')?.checked || false,
                telefono: el('cfg-fp-bizum-telefono')?.value || ''
            },
            giro: {
                active: el('cfg-fp-giro-toggle')?.checked || false,
                banco: el('cfg-fp-giro-banco')?.value || '',
                iban: el('cfg-fp-giro-iban')?.value || ''
            },
            efectivo: {
                active: el('cfg-fp-efectivo-toggle')?.checked || false
            },
            siniva: {
                active: el('cfg-fp-siniva-toggle')?.checked || false
            }
        };
        localStorage.setItem('cc_biz_config', JSON.stringify(config));

        const status = document.getElementById('biz-save-status');
        if (status) {
            status.textContent = '✅ Datos guardados';
            status.style.color = '#34c759';
            setTimeout(() => { status.textContent = ''; }, 3000);
        }
        showAlert('Datos guardados', 'La información de las formas de pago se ha actualizado correctamente.', '✅');
    } catch (e) {
        console.error('Error saving biz config', e);
        showAlert('Error', 'Ha ocurrido un error al guardar las formas de pago.', '❌');
    }
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
        if (btn.dataset.section === 'config-forms') loadFormularios();
        if (btn.dataset.section === 'app-chat') loadChatRooms();
    });
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

let currentLeadEditId = null;

function abrirModalLead(id = null) {
    currentLeadEditId = id;
    document.getElementById('modal-lead-title').textContent = id ? 'Editar Lead' : 'Crear Nuevo Lead';
    
    // Reset all fields
    const fields = [
        'lead-nombre', 'lead-apellidos', 'lead-nif', 'lead-fecha-nacimiento', 'lead-cargo',
        'lead-negocio-nombre', 'lead-negocio-comercial', 'lead-negocio-cif', 'lead-negocio-actividad',
        'lead-negocio-direccion', 'lead-negocio-cp', 'lead-negocio-localidad', 'lead-negocio-provincia', 'lead-negocio-pais',
        'lead-email', 'lead-telefono', 'lead-negocio-email', 'lead-negocio-telefono', 'lead-web',
        'lead-rs-instagram', 'lead-rs-facebook', 'lead-rs-linkedin', 'lead-rs-tiktok', 'lead-rs-twitter', 'lead-rs-pinterest', 'lead-rs-youtube', 'lead-rs-otra',
        'lead-iban', 'lead-iban-titular'
    ];
    fields.forEach(f => {
        if(document.getElementById(f)) document.getElementById(f).value = '';
    });
    
    // default
    document.getElementById('lead-negocio-pais').value = 'España';

    if (id) {
        const lead = _allLeadsGridData.find(l => l.id === id);
        if (lead) {
            document.getElementById('lead-nombre').value = lead.first_name || '';
            document.getElementById('lead-apellidos').value = lead.last_name || '';
            document.getElementById('lead-email').value = lead.email || '';
            document.getElementById('lead-telefono').value = lead.phone || '';
            document.getElementById('lead-negocio-nombre').value = lead.company_name || '';
            
            document.getElementById('lead-nif').value = lead.nif || '';
            document.getElementById('lead-fecha-nacimiento').value = lead.fecha_nacimiento || '';
            document.getElementById('lead-cargo').value = lead.position || '';
            document.getElementById('lead-negocio-comercial').value = lead.nombre_comercial || '';
            document.getElementById('lead-negocio-cif').value = lead.cif || '';
            document.getElementById('lead-negocio-actividad').value = lead.actividad || '';
            document.getElementById('lead-negocio-direccion').value = lead.direccion || '';
            document.getElementById('lead-negocio-cp').value = lead.cp || '';
            document.getElementById('lead-negocio-localidad').value = lead.localidad || '';
            document.getElementById('lead-negocio-provincia').value = lead.provincia || '';
            document.getElementById('lead-negocio-pais').value = lead.pais || 'España';
            
            document.getElementById('lead-negocio-email').value = lead.email_negocio || '';
            document.getElementById('lead-negocio-telefono').value = lead.telefono_negocio || '';
            document.getElementById('lead-web').value = lead.web || '';
            
            document.getElementById('lead-rs-instagram').value = lead.instagram || '';
            document.getElementById('lead-rs-facebook').value = lead.facebook || '';
            document.getElementById('lead-rs-linkedin').value = lead.linkedin || '';
            document.getElementById('lead-rs-tiktok').value = lead.tiktok || '';
            document.getElementById('lead-rs-twitter').value = lead.twitter || '';
            document.getElementById('lead-rs-pinterest').value = lead.pinterest || '';
            document.getElementById('lead-rs-youtube').value = lead.youtube || '';
            document.getElementById('lead-rs-otra').value = lead.otra_red || '';
            
            document.getElementById('lead-iban').value = lead.iban || '';
            document.getElementById('lead-iban-titular').value = lead.iban_titular || '';
        }
    }

    document.getElementById('modal-lead').style.display = 'flex';
}

function closeModalLead() {
    document.getElementById('modal-lead').style.display = 'none';
}

async function guardarLead() {
    const nombre = document.getElementById('lead-nombre').value.trim();
    const email = document.getElementById('lead-email').value.trim();

    if (!nombre || !email) {
        return showAlert('Campos requeridos', 'Por favor, rellena el nombre y el email personal.');
    }

    const leadData = {
        first_name: nombre,
        last_name: document.getElementById('lead-apellidos').value.trim(),
        email: email,
        phone: document.getElementById('lead-telefono').value.trim(),
        company_name: document.getElementById('lead-negocio-nombre').value.trim(),
        status: 'lead',
        nif: document.getElementById('lead-nif').value.trim(),
        fecha_nacimiento: document.getElementById('lead-fecha-nacimiento').value,
        position: document.getElementById('lead-cargo').value.trim(),
        nombre_comercial: document.getElementById('lead-negocio-comercial').value.trim(),
        cif: document.getElementById('lead-negocio-cif').value.trim(),
        actividad: document.getElementById('lead-negocio-actividad').value.trim(),
        direccion: document.getElementById('lead-negocio-direccion').value.trim(),
        cp: document.getElementById('lead-negocio-cp').value.trim(),
        localidad: document.getElementById('lead-negocio-localidad').value.trim(),
        provincia: document.getElementById('lead-negocio-provincia').value.trim(),
        pais: document.getElementById('lead-negocio-pais').value.trim(),
        email_negocio: document.getElementById('lead-negocio-email').value.trim(),
        telefono_negocio: document.getElementById('lead-negocio-telefono').value.trim(),
        web: document.getElementById('lead-web').value.trim(),
        instagram: document.getElementById('lead-rs-instagram').value.trim(),
        facebook: document.getElementById('lead-rs-facebook').value.trim(),
        linkedin: document.getElementById('lead-rs-linkedin').value.trim(),
        tiktok: document.getElementById('lead-rs-tiktok').value.trim(),
        twitter: document.getElementById('lead-rs-twitter').value.trim(),
        pinterest: document.getElementById('lead-rs-pinterest').value.trim(),
        youtube: document.getElementById('lead-rs-youtube').value.trim(),
        otra_red: document.getElementById('lead-rs-otra').value.trim(),
        iban: document.getElementById('lead-iban').value.trim(),
        iban_titular: document.getElementById('lead-iban-titular').value.trim()
    };

    try {
        const btn = document.querySelector('#modal-lead .btn-primary');
        const ogText = btn.innerHTML;
        btn.innerHTML = '⏳ Guardando...';
        btn.disabled = true;

        if (currentLeadEditId) {
            const { error } = await _supabase.from('outreach_leads').update(leadData).eq('id', currentLeadEditId);
            if (error) throw error;
        } else {
            const { error } = await _supabase.from('outreach_leads').insert([leadData]);
            if (error) throw error;
        }

        closeModalLead();
        loadLeadsGrid();
        showAlert('Éxito', 'Lead guardado correctamente');
    } catch (e) {
        console.error(e);
        showAlert('Error', `No se pudo guardar el lead: ${e.message}`);
    } finally {
        const btn = document.querySelector('#modal-lead .btn-primary');
        if(btn) {
            btn.innerHTML = '💾 Guardar Lead';
            btn.disabled = false;
        }
    }
}

function importarLeads() {
    showAlert('Importar', 'Esta función se configurará más adelante.');
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
                <button class="lead-action-btn btn-edit" data-tooltip="Editar" onclick="abrirModalLead('${lead.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="svg-icon"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
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

let _allEmailLogs = [];
let _currentEmailFolder = 'all';
let _currentViewEmail = null;

const _defaultLabels = [
    { id: 'importante', name: 'Importante', icon: '🔴', color: '#ff3b30' },
    { id: 'seguimiento', name: 'Seguimiento', icon: '🟡', color: '#ff9500' },
    { id: 'respondido', name: 'Respondido', icon: '🟢', color: '#34c759' },
    { id: 'archivado', name: 'Archivado', icon: '⚫', color: '#8e8e93' },
];

function _getCustomLabels() {
    try { return JSON.parse(localStorage.getItem('cc_custom_labels') || '[]'); } catch { return []; }
}
function _saveCustomLabels(arr) {
    localStorage.setItem('cc_custom_labels', JSON.stringify(arr));
}
function _getAllLabels() {
    return [..._defaultLabels, ..._getCustomLabels()];
}

function _getStarredEmails() {
    try { return JSON.parse(localStorage.getItem('cc_starred_emails') || '[]'); } catch { return []; }
}
function _setStarredEmails(arr) {
    localStorage.setItem('cc_starred_emails', JSON.stringify(arr));
}
function _getEmailLabels() {
    try { return JSON.parse(localStorage.getItem('cc_email_labels') || '{}'); } catch { return {}; }
}
function _setEmailLabel(id, label) {
    const labels = _getEmailLabels();
    if (label) labels[id] = label; else delete labels[id];
    localStorage.setItem('cc_email_labels', JSON.stringify(labels));
}

function createCustomLabel() {
    const name = prompt('Nombre de la nueva etiqueta:');
    if (!name || !name.trim()) return;
    const icon = prompt('Emoji/icono para la etiqueta (ej: 🔵, 📌, 💼):', '🔵') || '🔵';
    const customLabels = _getCustomLabels();
    const id = 'custom_' + name.trim().toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    customLabels.push({ id, name: name.trim(), icon, color: '#007AFF' });
    _saveCustomLabels(customLabels);
    refreshLabelSelect();
    refreshFolderTabs();
    showAlert('Etiqueta creada', `La etiqueta "${name.trim()}" se ha creado correctamente`, '🏷️');
}

function deleteCustomLabel(labelId) {
    const customLabels = _getCustomLabels().filter(l => l.id !== labelId);
    _saveCustomLabels(customLabels);
    // Remove label from all emails
    const emailLabels = _getEmailLabels();
    Object.keys(emailLabels).forEach(k => { if (emailLabels[k] === labelId) delete emailLabels[k]; });
    localStorage.setItem('cc_email_labels', JSON.stringify(emailLabels));
    refreshLabelSelect();
    refreshFolderTabs();
    renderEmailList();
}

function refreshLabelSelect() {
    const sel = document.getElementById('email-label-select');
    if (!sel) return;
    const allLabels = _getAllLabels();
    const currentVal = sel.value;
    sel.innerHTML = '<option value="">🏷️ Etiqueta...</option>';
    allLabels.forEach(l => {
        sel.innerHTML += `<option value="${l.id}">${l.icon} ${l.name}</option>`;
    });
    sel.innerHTML += '<option value="__create__">➕ Crear etiqueta...</option>';
    sel.value = currentVal;
}

function refreshFolderTabs() {
    const container = document.getElementById('email-folder-tabs');
    if (!container) return;
    const customLabels = _getCustomLabels();
    const emailLabels = _getEmailLabels();
    
    // Count per label
    const labelCounts = {};
    Object.values(emailLabels).forEach(l => { labelCounts[l] = (labelCounts[l] || 0) + 1; });
    
    const _receivedUnreadCount = _allEmailLogs.filter(l => l._direction === 'received' && !l._is_read).length;
    const _receivedBadge = _receivedUnreadCount > 0 ? ` (${_receivedUnreadCount})` : '';
    let html = `
        <button class="email-folder-tab ${_currentEmailFolder === 'all' ? 'active' : ''}" data-folder="all" onclick="switchEmailFolder('all')" style="padding:6px 14px;border-radius:8px;border:1px solid var(--border-color);background:${_currentEmailFolder === 'all' ? 'var(--accent-blue)' : 'var(--bg-card)'};color:${_currentEmailFolder === 'all' ? '#fff' : 'var(--text-grey)'};font-size:0.75rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.15s">📥 Todos</button>
        <button class="email-folder-tab ${_currentEmailFolder === 'received' ? 'active' : ''}" data-folder="received" onclick="switchEmailFolder('received')" style="padding:6px 14px;border-radius:8px;border:1px solid var(--border-color);background:${_currentEmailFolder === 'received' ? 'var(--accent-blue)' : 'var(--bg-card)'};color:${_currentEmailFolder === 'received' ? '#fff' : 'var(--text-grey)'};font-size:0.75rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.15s">📩 Recibidos${_receivedBadge}</button>
        <button class="email-folder-tab ${_currentEmailFolder === 'outreach' ? 'active' : ''}" data-folder="outreach" onclick="switchEmailFolder('outreach')" style="padding:6px 14px;border-radius:8px;border:1px solid var(--border-color);background:${_currentEmailFolder === 'outreach' ? 'var(--accent-blue)' : 'var(--bg-card)'};color:${_currentEmailFolder === 'outreach' ? '#fff' : 'var(--text-grey)'};font-size:0.75rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.15s">👥 Outreach</button>
        <button class="email-folder-tab ${_currentEmailFolder === 'proposal' ? 'active' : ''}" data-folder="proposal" onclick="switchEmailFolder('proposal')" style="padding:6px 14px;border-radius:8px;border:1px solid var(--border-color);background:${_currentEmailFolder === 'proposal' ? 'var(--accent-blue)' : 'var(--bg-card)'};color:${_currentEmailFolder === 'proposal' ? '#fff' : 'var(--text-grey)'};font-size:0.75rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.15s">📄 Propuestas</button>
        <button class="email-folder-tab ${_currentEmailFolder === 'manual' ? 'active' : ''}" data-folder="manual" onclick="switchEmailFolder('manual')" style="padding:6px 14px;border-radius:8px;border:1px solid var(--border-color);background:${_currentEmailFolder === 'manual' ? 'var(--accent-blue)' : 'var(--bg-card)'};color:${_currentEmailFolder === 'manual' ? '#fff' : 'var(--text-grey)'};font-size:0.75rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.15s">✉️ Manuales</button>
        <button class="email-folder-tab ${_currentEmailFolder === 'starred' ? 'active' : ''}" data-folder="starred" onclick="switchEmailFolder('starred')" style="padding:6px 14px;border-radius:8px;border:1px solid var(--border-color);background:${_currentEmailFolder === 'starred' ? 'var(--accent-blue)' : 'var(--bg-card)'};color:${_currentEmailFolder === 'starred' ? '#fff' : 'var(--text-grey)'};font-size:0.75rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.15s">⭐ Destacados</button>
    `;
    
    // Custom label folders
    customLabels.forEach(l => {
        const count = labelCounts[l.id] || 0;
        html += `<button class="email-folder-tab ${_currentEmailFolder === 'label_' + l.id ? 'active' : ''}" data-folder="label_${l.id}" onclick="switchEmailFolder('label_${l.id}')" style="padding:6px 14px;border-radius:8px;border:1px solid var(--border-color);background:${_currentEmailFolder === 'label_' + l.id ? 'var(--accent-blue)' : 'var(--bg-card)'};color:${_currentEmailFolder === 'label_' + l.id ? '#fff' : 'var(--text-grey)'};font-size:0.75rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.15s">${l.icon} ${l.name}${count ? ` (${count})` : ''}</button>`;
    });
    
    // Default label folders
    _defaultLabels.forEach(l => {
        const count = labelCounts[l.id] || 0;
        if (count > 0) {
            html += `<button class="email-folder-tab ${_currentEmailFolder === 'label_' + l.id ? 'active' : ''}" data-folder="label_${l.id}" onclick="switchEmailFolder('label_${l.id}')" style="padding:6px 14px;border-radius:8px;border:1px solid var(--border-color);background:${_currentEmailFolder === 'label_' + l.id ? 'var(--accent-blue)' : 'var(--bg-card)'};color:${_currentEmailFolder === 'label_' + l.id ? '#fff' : 'var(--text-grey)'};font-size:0.75rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.15s">${l.icon} ${l.name} (${count})</button>`;
        }
    });
    
    container.innerHTML = html;
}

async function loadBandejaInbox() {
    try {
        // Fetch sent emails
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
            .order('sent_at', { ascending: false })
            .limit(500);

        if (error) throw error;
        const sentEmails = (logs || []).map(l => ({ ...l, _direction: 'sent' }));

        // Fetch received email replies
        let receivedEmails = [];
        try {
            const { data: replies, error: repliesError } = await _supabase
                .from('email_replies')
                .select('*')
                .order('received_at', { ascending: false })
                .limit(500);
            if (!repliesError && replies) {
                receivedEmails = replies.map(r => ({
                    id: r.id,
                    email_type: 'received',
                    subject: r.subject || '(sin asunto)',
                    body: r.body_html || r.body || '',
                    sent_at: r.received_at,
                    _direction: 'received',
                    _is_read: r.is_read,
                    _reply_id: r.id,
                    _gmail_message_id: r.gmail_message_id,
                    _gmail_thread_id: r.gmail_thread_id,
                    outreach_leads: {
                        email: r.from_email || '',
                        company_name: '',
                        first_name: r.from_name || r.from_email || 'Desconocido'
                    }
                }));
            }
        } catch (replyErr) {
            console.warn('Could not fetch email replies:', replyErr);
        }

        // Merge and sort by date descending
        _allEmailLogs = [...sentEmails, ...receivedEmails].sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));

        const receivedCount = receivedEmails.filter(r => !r._is_read).length;
        const countText = receivedCount > 0 ? `${_allEmailLogs.length} correos · ${receivedCount} sin leer` : `${_allEmailLogs.length} correos`;
        document.getElementById('email-total-count').textContent = countText;
        refreshLabelSelect();
        refreshFolderTabs();
        renderEmailList();
    } catch (e) {
        console.error('Email log load error:', e);
        document.getElementById('email-inbox-list').innerHTML = '<div style="padding:20px;text-align:center;color:var(--accent-red);font-size:0.8rem">❌ Error al cargar correos</div>';
    }
}

function switchEmailFolder(folder) {
    _currentEmailFolder = folder;
    document.querySelectorAll('.email-folder-tab').forEach(btn => {
        const isActive = btn.dataset.folder === folder;
        btn.style.background = isActive ? 'var(--accent-blue)' : 'var(--bg-card)';
        btn.style.color = isActive ? '#fff' : 'var(--text-grey)';
        btn.classList.toggle('active', isActive);
    });
    renderEmailList();
}

function filterEmailList() {
    renderEmailList();
}

function renderEmailList() {
    const listDiv = document.getElementById('email-inbox-list');
    const searchQuery = (document.getElementById('email-search-input')?.value || '').toLowerCase();
    const starred = _getStarredEmails();
    const labels = _getEmailLabels();

    let filtered = [..._allEmailLogs];

    // Folder filter
    if (_currentEmailFolder === 'received') {
        filtered = filtered.filter(l => l._direction === 'received');
    } else if (_currentEmailFolder === 'outreach') {
        filtered = filtered.filter(l => l.email_type && l.email_type.includes('outreach'));
    } else if (_currentEmailFolder === 'proposal') {
        filtered = filtered.filter(l => l.email_type && (l.email_type.includes('proposal') || l.email_type.includes('propuesta')));
    } else if (_currentEmailFolder === 'manual') {
        filtered = filtered.filter(l => l.email_type === 'manual' || l.email_type === 'compose');
    } else if (_currentEmailFolder === 'starred') {
        filtered = filtered.filter(l => starred.includes(l.id));
    } else if (_currentEmailFolder.startsWith('label_')) {
        const labelId = _currentEmailFolder.replace('label_', '');
        filtered = filtered.filter(l => labels[l.id] === labelId);
    }

    // Search filter
    if (searchQuery) {
        filtered = filtered.filter(l => {
            const lead = l.outreach_leads || {};
            const searchStr = `${l.subject || ''} ${lead.email || ''} ${lead.company_name || ''} ${lead.first_name || ''}`.toLowerCase();
            return searchStr.includes(searchQuery);
        });
    }

    if (filtered.length === 0) {
        listDiv.innerHTML = `<div style="padding:30px;text-align:center;color:var(--text-grey);font-size:0.82rem">
            <div style="font-size:1.8rem;margin-bottom:8px;opacity:0.4">${_currentEmailFolder === 'starred' ? '⭐' : '📭'}</div>
            ${_currentEmailFolder === 'starred' ? 'No hay correos destacados' : searchQuery ? 'Sin resultados para la búsqueda' : 'No hay correos en esta carpeta'}
        </div>`;
        return;
    }

    const allLabels = _getAllLabels();
    const labelIcons = {};
    allLabels.forEach(l => { labelIcons[l.id] = l.icon; });

    let html = '';
    filtered.forEach((log, idx) => {
        const lead = log.outreach_leads || { email: 'Desconocido', company_name: '—', first_name: 'Prospecto' };
        const isStarred = starred.includes(log.id);
        const label = labels[log.id] || '';
        const labelIcon = labelIcons[label] || '';

        // Date formatting
        const sentDate = new Date(log.sent_at);
        const now = new Date();
        const isToday = sentDate.toDateString() === now.toDateString();
        const isYesterday = sentDate.toDateString() === new Date(now - 86400000).toDateString();
        let dateStr;
        if (isToday) {
            dateStr = sentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        } else if (isYesterday) {
            dateStr = 'Ayer ' + sentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        } else {
            dateStr = sentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) + ' ' + sentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        }

        // Type badge & direction
        const isReceived = log._direction === 'received';
        const directionIcon = isReceived ? '↙️' : '↗️';
        const directionColor = isReceived ? '#ff9500' : '#8e8e93';
        const unreadStyle = (isReceived && !log._is_read) ? 'font-weight:800;' : '';
        let typeColor, typeLabel;
        if (isReceived) {
            typeColor = '#ff9500';
            typeLabel = 'Recibido';
        } else {
            typeColor = log.email_type?.includes('outreach') ? '#5856d6' : log.email_type?.includes('proposal') ? '#007AFF' : '#34c759';
            typeLabel = log.email_type?.includes('outreach') ? 'Outreach' : log.email_type?.includes('proposal') ? 'Propuesta' : 'Manual';
        }
        const contactLine = isReceived
            ? `De: ${escHtml(lead.first_name || 'Desconocido')} &lt;${escHtml(lead.email || '')}&gt;`
            : `${escHtml(lead.company_name || '—')} · ${escHtml(lead.email || '')}`;
        const unreadDot = (isReceived && !log._is_read) ? '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#ff9500;margin-right:4px;flex-shrink:0"></span>' : '';

        html += `<div class="email-list-item ${idx === 0 ? 'active' : ''}" onclick="selectEmailItem(this, ${idx})" data-idx="${idx}"
            style="padding:12px 16px;cursor:pointer;border-bottom:1px solid var(--border-color);transition:background 0.1s;position:relative;${isReceived && !log._is_read ? 'background:var(--bg-hover);' : ''}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:3px">
                <div style="display:flex;align-items:center;gap:6px;min-width:0;flex:1">
                    ${unreadDot}
                    <span style="font-size:0.65rem;color:${directionColor};flex-shrink:0" title="${isReceived ? 'Recibido' : 'Enviado'}">${directionIcon}</span>
                    ${isStarred ? '<span style="font-size:0.7rem">⭐</span>' : ''}
                    ${labelIcon ? `<span style="font-size:0.6rem">${labelIcon}</span>` : ''}
                    <span style="${unreadStyle}font-size:0.82rem;color:var(--text-main);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(lead.first_name || 'Prospecto')}</span>
                </div>
                <span style="font-size:0.65rem;color:var(--text-grey);white-space:nowrap;margin-left:6px">${dateStr}</span>
            </div>
            <div style="font-size:0.72rem;color:var(--text-grey);margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${contactLine}</div>
            <div style="display:flex;align-items:center;gap:6px">
                <span style="font-size:0.78rem;color:var(--text-main);${unreadStyle}white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1">${escHtml(log.subject || '(sin asunto)')}</span>
                <span style="padding:1px 6px;border-radius:4px;background:${typeColor}15;color:${typeColor};font-size:0.58rem;font-weight:700;white-space:nowrap">${typeLabel}</span>
            </div>
        </div>`;
    });

    listDiv.innerHTML = html;

    // Auto-select first
    if (filtered.length > 0) {
        viewEmailDetails(filtered[0]);
    }
}

function selectEmailItem(el, idx) {
    document.querySelectorAll('.email-list-item').forEach(e => e.classList.remove('active'));
    el.classList.add('active');

    // Find the actual log from filtered view
    const searchQuery = (document.getElementById('email-search-input')?.value || '').toLowerCase();
    const starred = _getStarredEmails();
    let filtered = [..._allEmailLogs];
    const labels = _getEmailLabels();
    if (_currentEmailFolder === 'received') filtered = filtered.filter(l => l._direction === 'received');
    else if (_currentEmailFolder === 'outreach') filtered = filtered.filter(l => l.email_type?.includes('outreach'));
    else if (_currentEmailFolder === 'proposal') filtered = filtered.filter(l => l.email_type?.includes('proposal') || l.email_type?.includes('propuesta'));
    else if (_currentEmailFolder === 'manual') filtered = filtered.filter(l => l.email_type === 'manual' || l.email_type === 'compose');
    else if (_currentEmailFolder === 'starred') filtered = filtered.filter(l => starred.includes(l.id));
    else if (_currentEmailFolder.startsWith('label_')) { const labelId = _currentEmailFolder.replace('label_', ''); filtered = filtered.filter(l => labels[l.id] === labelId); }
    if (searchQuery) filtered = filtered.filter(l => {
        const lead = l.outreach_leads || {};
        return `${l.subject || ''} ${lead.email || ''} ${lead.company_name || ''} ${lead.first_name || ''}`.toLowerCase().includes(searchQuery);
    });

    if (filtered[idx]) viewEmailDetails(filtered[idx]);
}

function viewEmailDetails(log) {
    _currentViewEmail = log;
    const lead = log.outreach_leads || { email: 'Desconocido', company_name: '—', first_name: 'Prospecto' };
    const labels = _getEmailLabels();
    const starred = _getStarredEmails();
    const isReceived = log._direction === 'received';

    document.getElementById('email-view-subject').textContent = log.subject || '(sin asunto)';

    if (isReceived) {
        document.getElementById('email-view-from').textContent = `↙️ De: ${lead.first_name || 'Desconocido'} <${lead.email || '—'}>`;
    } else {
        document.getElementById('email-view-from').textContent = `↗️ Para: ${lead.first_name || 'Prospecto'} <${lead.email || '—'}> · Empresa: ${lead.company_name || '—'}`;
    }

    // Full date
    const sentDate = new Date(log.sent_at);
    if (isReceived) {
        document.getElementById('email-view-date').textContent = `📅 Recibido: ${sentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} a las ${sentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
        document.getElementById('email-view-date').textContent = `📅 Enviado: ${sentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} a las ${sentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} · Tipo: ${log.email_type || '—'}`;
    }

    // Body
    document.getElementById('email-view-body').innerHTML = log.body || '<span style="color:var(--text-grey)">(Sin contenido)</span>';

    // Show actions
    document.getElementById('email-view-actions').style.display = 'flex';

    // Star button
    const isStarred = starred.includes(log.id);
    document.getElementById('btn-star-email').innerHTML = isStarred ? '⭐ Destacado' : '☆ Destacar';

    // Label select
    const labelSelect = document.getElementById('email-label-select');
    if (labelSelect) labelSelect.value = labels[log.id] || '';

    // Mark received email as read
    if (isReceived && !log._is_read && log._reply_id) {
        log._is_read = true;
        _supabase.from('email_replies').update({ is_read: true }).eq('id', log._reply_id)
            .then(() => {
                // Update unread count in folder tabs
                refreshFolderTabs();
                const receivedCount = _allEmailLogs.filter(r => r._direction === 'received' && !r._is_read).length;
                const countText = receivedCount > 0 ? `${_allEmailLogs.length} correos · ${receivedCount} sin leer` : `${_allEmailLogs.length} correos`;
                document.getElementById('email-total-count').textContent = countText;
            })
            .catch(err => console.warn('Error marking email as read:', err));
    }
}

function toggleEmailStar() {
    if (!_currentViewEmail) return;
    const starred = _getStarredEmails();
    const id = _currentViewEmail.id;
    const idx = starred.indexOf(id);
    if (idx >= 0) starred.splice(idx, 1); else starred.push(id);
    _setStarredEmails(starred);
    renderEmailList();
    viewEmailDetails(_currentViewEmail);
}

function setEmailLabel(label) {
    if (!_currentViewEmail) return;
    if (label === '__create__') {
        createCustomLabel();
        const sel = document.getElementById('email-label-select');
        if (sel) sel.value = '';
        return;
    }
    _setEmailLabel(_currentViewEmail.id, label);
    refreshFolderTabs();
    renderEmailList();
}

async function replyToEmail() {
    if (!_currentViewEmail) return;
    const lead = _currentViewEmail.outreach_leads || {};
    await openComposeEmailModal();
    // Pre-fill after modal is ready
    setTimeout(() => {
        const select = document.getElementById('compose-email-to');
        if (select && lead.email) {
            for (let opt of select.options) {
                if (opt.value === lead.email) { select.value = lead.email; break; }
            }
        }
        const subjectEl = document.getElementById('compose-email-subject');
        if (subjectEl) subjectEl.value = `Re: ${_currentViewEmail.subject || ''}`;
        const bodyEl = document.getElementById('compose-email-body');
        if (bodyEl) bodyEl.value = `\n\n--- Mensaje original ---\n${(_currentViewEmail.body || '').replace(/<[^>]+>/g, '')}`;
    }, 500);
}

async function forwardEmail() {
    if (!_currentViewEmail) return;
    await openComposeEmailModal();
    setTimeout(() => {
        const subjectEl = document.getElementById('compose-email-subject');
        if (subjectEl) subjectEl.value = `Fwd: ${_currentViewEmail.subject || ''}`;
        const bodyEl = document.getElementById('compose-email-body');
        const lead = _currentViewEmail.outreach_leads || {};
        if (bodyEl) bodyEl.value = `\n\n--- Mensaje reenviado ---\nDe: Para ${lead.first_name || ''} <${lead.email || ''}>\nAsunto: ${_currentViewEmail.subject || ''}\n\n${(_currentViewEmail.body || '').replace(/<[^>]+>/g, '')}`;
    }, 500);
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
    console.log('[Compose] openComposeEmailModal called');
    if (sessionStorage.getItem('cc_role') === 'guest') {
        showAlert('Restringido', 'El usuario Invitado tiene acceso de solo lectura', '🔒');
        return;
    }
    
    // FIRST: Open modal immediately so user sees response
    const modal = document.getElementById('email-compose-modal');
    if (!modal) { console.error('[Compose] Modal not found'); return; }
    modal.style.display = 'flex';
    // Force reflow then add active class for CSS transition
    void modal.offsetWidth;
    modal.classList.add('active');
    console.log('[Compose] Modal opened with active class');
    
    try {
        const select = document.getElementById('compose-email-to');
        if (!select) { console.error('[Compose] Select not found'); return; }
        select.innerHTML = '<option value="">⏳ Cargando contactos...</option>';
        
        // Reset fields
        const subjectEl = document.getElementById('compose-email-subject');
        const bodyEl = document.getElementById('compose-email-body');
        if (subjectEl) subjectEl.value = '';
        if (bodyEl) bodyEl.value = '';
        
        // Reset custom input
        const customInput = document.getElementById('compose-custom-email');
        if (customInput) { customInput.style.display = 'none'; customInput.value = ''; }
        
        // Reset attachments
        window._composeAttachments = [];
        const attachList = document.getElementById('compose-attachments-list');
        if (attachList) attachList.innerHTML = '';
        
        // Load leads in background
        try {
            if (!outreachLeadsList || outreachLeadsList.length === 0) {
                await fetchOutreachLeadsList();
            }
        } catch(loadErr) {
            console.warn('[Compose] Failed to load leads:', loadErr);
        }
        
        // Populate select
        select.innerHTML = '';
        const allLeads = [...(outreachLeadsList || [])];
        try {
            if (typeof _allLeadsGridData !== 'undefined' && _allLeadsGridData && _allLeadsGridData.length > 0) {
                const existing = new Set(allLeads.map(l => l.email));
                _allLeadsGridData.forEach(l => {
                    if (l.email && !existing.has(l.email)) allLeads.push(l);
                });
            }
        } catch(e) { /* ignore grid data errors */ }
        
        allLeads.forEach(l => {
            if (!l.email) return;
            const opt = document.createElement('option');
            opt.value = l.email;
            opt.textContent = `${l.first_name || 'Prospecto'} (${l.company_name || '—'}) - ${l.email}`;
            select.appendChild(opt);
        });
        
        // Always add custom email option
        const customOpt = document.createElement('option');
        customOpt.value = '__custom__';
        customOpt.textContent = '✏️ Escribir otro email...';
        select.appendChild(customOpt);
        
        console.log('[Compose] Populated with', allLeads.length, 'leads');
    } catch(e) {
        console.error('[Compose] Error populating:', e);
    }
}

function closeComposeEmailModal() {
    const m = document.getElementById('email-compose-modal');
    if (!m) return;
    m.classList.remove('active');
    setTimeout(() => { m.style.display = 'none'; }, 300);
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
window.switchEmailFolder = switchEmailFolder;
window.filterEmailList = filterEmailList;
window.selectEmailItem = selectEmailItem;
window.toggleEmailStar = toggleEmailStar;
window.setEmailLabel = setEmailLabel;
window.createCustomLabel = createCustomLabel;
window.deleteCustomLabel = deleteCustomLabel;
window.replyToEmail = replyToEmail;
window.forwardEmail = forwardEmail;
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
    
    // Start auto-refresh to keep token alive
    const clientId = getGCalClientId();
    if (clientId) _startGCalAutoRefresh(clientId);
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
let _gcalRefreshInterval = null;

function tryRestoreGCalSession() {
    if (_gcalConnected || _gcalRestoreAttempted) return;
    _gcalRestoreAttempted = true;

    const wasAuthorized = localStorage.getItem('gf_gcal_authorized');
    const clientId = getGCalClientId();
    if (!wasAuthorized || !clientId) return;

    const storedToken = localStorage.getItem('gf_gcal_token');
    const storedExpiry = parseInt(localStorage.getItem('gf_gcal_token_expiry') || '0');

    // If token is still valid, use it directly
    if (storedToken && storedExpiry > Date.now()) {
        _gcalToken = storedToken;
        _gcalConnected = true;
        updateGCalButton(true);
        showGCalStatus('✅ Google Calendar reconectado automáticamente', '#34c759');
        setTimeout(() => {
            if (document.getElementById('meetings-list')) loadGCalEvents();
        }, 800);
        _startGCalAutoRefresh(clientId);
        return;
    }

    // Token expired — try silent renewal (no popup)
    _silentGCalRefresh(clientId);
}

function _silentGCalRefresh(clientId) {
    try {
        const tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: GCAL_SCOPES,
            callback: function(tokenResponse) {
                if (tokenResponse.error) {
                    console.warn('[GCal] Silent refresh failed:', tokenResponse.error);
                    _showGCalReconnectBtn();
                    return;
                }
                console.log('[GCal] Token renovado silenciosamente');
                _onGCalAuthSuccess(tokenResponse);
                _startGCalAutoRefresh(clientId);
            }
        });
        // prompt: '' = silent renewal if user already granted consent
        tokenClient.requestAccessToken({ prompt: '' });
    } catch(e) {
        console.warn('[GCal] Silent refresh error:', e);
        _showGCalReconnectBtn();
    }
}

function _startGCalAutoRefresh(clientId) {
    // Clear existing interval if any
    if (_gcalRefreshInterval) clearInterval(_gcalRefreshInterval);
    
    // Refresh token every 45 minutes (tokens last 60 min)
    _gcalRefreshInterval = setInterval(() => {
        console.log('[GCal] Auto-renovando token...');
        _gcalRestoreAttempted = false;
        _silentGCalRefresh(clientId);
    }, 45 * 60 * 1000);
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
        container.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; flex-direction: column; gap: 12px; z-index: 100000; pointer-events: none; align-items: center; justify-content: center; width: 100%;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.cssText = `
        background: ${isError ? 'rgba(255, 59, 48, 0.95)' : 'rgba(28, 28, 30, 0.92)'};
        backdrop-filter: blur(16px);
        color: #ffffff;
        padding: 16px 32px;
        border-radius: 16px;
        font-size: 0.95rem;
        font-weight: 600;
        box-shadow: 0 16px 40px rgba(0,0,0,0.25);
        border: 1px solid ${isError ? 'rgba(255, 59, 48, 0.3)' : 'rgba(255,255,255,0.1)'};
        transform: scale(0.9);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        align-items: center;
        gap: 8px;
        pointer-events: auto;
    `;
    toast.innerHTML = `<span>${isError ? '❌' : '✅'}</span> <span>${msg}</span>`;
    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
        toast.style.transform = 'scale(1)';
        toast.style.opacity = '1';
    }, 10);

    // Kill toast after 3.5 seconds
    setTimeout(() => {
        toast.style.transform = 'scale(0.9)';
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

    let globalLeadNum = 0;
    const leadNumMap = new Map();
    presupuestos.filter(p => p.es_plantilla === false)
        .sort((a,b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
        .forEach(p => {
            globalLeadNum++;
            leadNumMap.set(p.id, globalLeadNum);
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

                // Check if any sent proposal for this presupuesto was accepted
                const sentProp = propuestasEnviadas.find(pe => pe.presupuesto_id === p.id);
                const isAccepted = sentProp && sentProp.estado === 'aceptada';
                const acceptedBadge = isAccepted 
                    ? `<span style="display:inline-block; padding:3px 10px; border-radius:8px; background:rgba(52,199,89,0.15); color:#34c759; font-size:0.68rem; font-weight:800; text-transform:uppercase; letter-spacing:0.04em; border:1px solid rgba(52,199,89,0.3); margin-left:6px;">✅ ACEPTADA</span>`
                    : '';

                return `
                    <div class="pres-card" id="pres-card-${p.id}" style="border: ${isAccepted ? '2px solid #34c759' : p.es_prueba ? '2px dashed #ff9500' : cardBorder}; background: ${isAccepted ? 'rgba(52,199,89,0.04)' : cardBg};"
                         onmouseenter="this.style.borderColor='${isAccepted ? '#34c759' : 'rgba(255,255,255,0.15)'}'" onmouseleave="this.style.borderColor='${isAccepted ? '#34c759' : p.es_prueba ? '#ff9500' : isClient ? 'var(--accent)' : meta.accent + '30'}'">
                        
                        ${p.es_prueba ? '<div class="test-mode-stripes"></div>' : ''}
                        
                        <!-- Top Header bar -->
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 18px 0; position:relative; z-index:2;">
                            <div style="display:flex; align-items:center; flex-wrap:wrap; gap:4px;">
                            ${isClient 
                                ? `<span class="pres-cat-badge" style="background:var(--accent); color:#fff;">👤 Propuesta #${leadNumMap.get(p.id) || '?'}</span>`
                                : `<span class="pres-cat-badge" style="background:${meta.accent}18; color:${meta.accent}; border: 1px solid ${meta.accent}30;">Plantilla #${tplNumMap.get(p.id) || '?'}</span>`
                            }
                            ${acceptedBadge}
                            </div>
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
let selectedPaymentOptions = []; // Global state: ['A', 'B', 'C']

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

// Pay methods toggle handler
window.togglePayMethodCheck = function() {
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
    
    const selectedButtons = document.querySelectorAll('.pay-method-check:checked');
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
    if (!opt) {
        selectedPaymentOptions = [];
    } else {
        if (selectedPaymentOptions.includes(opt)) {
            selectedPaymentOptions = selectedPaymentOptions.filter(x => x !== opt);
        } else {
            selectedPaymentOptions.push(opt);
        }
    }
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
    selectedPaymentOptions = [];

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
    document.querySelectorAll('.pay-method-check').forEach(chk => {
        const val = chk.dataset.value;
        const isOffered = offered.length > 0 ? offered.includes(val) : (p.forma_pago === val || ['giro', 'transferencia', 'bizum'].includes(val));
        chk.checked = !!isOffered;
    });

    // Finance config
    const pc = p.pago_config || { inv_min_pct: 18, num_cuotas: 24, descuento_b_pct: 4, descuento_c_pct: 8, selected_option: null };
    document.getElementById('edit-pres-pc-inv-min').value = pc.inv_min_pct != null ? pc.inv_min_pct : '18';
    document.getElementById('edit-pres-pc-cuotas').value = pc.num_cuotas != null ? pc.num_cuotas : '24';
    document.getElementById('edit-pres-pc-dto-b').value = pc.descuento_b_pct != null ? pc.descuento_b_pct : '4';
    document.getElementById('edit-pres-pc-dto-c').value = pc.descuento_c_pct != null ? pc.descuento_c_pct : '8';
    
    // Deep copy lineas
    lineasTempList = p.lineas ? JSON.parse(JSON.stringify(p.lineas)) : [];
    let arrOpt = pc.selected_options || [];
    if (pc.selected_option && arrOpt.length === 0) arrOpt = [pc.selected_option];
    selectedPaymentOptions = arrOpt;

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

    if (selectedPaymentOptions.includes('A')) {
        document.getElementById('pay-opt-card-a').classList.add('selected');
        document.getElementById('pay-opt-chk-a').classList.add('checked');
        const btn = document.getElementById('btn-select-pay-a');
        if (btn) { btn.textContent = 'Seleccionada'; btn.classList.add('active'); }
    }
    if (selectedPaymentOptions.includes('B')) {
        document.getElementById('pay-opt-card-b').classList.add('selected-b');
        document.getElementById('pay-opt-chk-b').classList.add('checked');
        const btn = document.getElementById('btn-select-pay-b');
        if (btn) { btn.textContent = 'Seleccionada'; btn.classList.add('active'); }
    }
    if (selectedPaymentOptions.includes('C')) {
        document.getElementById('pay-opt-card-c').classList.add('selected-c');
        document.getElementById('pay-opt-chk-c').classList.add('checked');
        const btn = document.getElementById('btn-select-pay-c');
        if (btn) { btn.textContent = 'Seleccionada'; btn.classList.add('active'); }
    }
    
    // Hide banner since we can select multiple options now
    if (banner) {
        banner.style.display = 'none';
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
        const res = await fetch('/api/proposal-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: systemPrompt,
                systemInstruction: 'Actúas como redactor experto en B2B. Tu único objetivo es generar la propuesta comercial exacta en formato JSON según las instrucciones del usuario. Responde estrictamente con el JSON sin nada de texto extra antes ni después.'
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
    document.querySelectorAll('.pay-method-check:checked').forEach(chk => {
        offeredPayMethods.push(chk.dataset.value);
    });

    // Compile Pago Config including selected_option
    const pagoConfig = {
        inv_min_pct: Number(document.getElementById('edit-pres-pc-inv-min').value || 18),
        num_cuotas: Number(document.getElementById('edit-pres-pc-cuotas').value || 24),
        descuento_b_pct: Number(document.getElementById('edit-pres-pc-dto-b').value || 4),
        descuento_c_pct: Number(document.getElementById('edit-pres-pc-dto-c').value || 8),
        selected_options: selectedPaymentOptions
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

// AI Content generation for proposal benefits
async function generateAIContentForProposal() {
    const titulo = document.getElementById('edit-pres-titulo').value.trim();
    const sub = document.getElementById('edit-pres-subtitulo').value.trim();
    const desc = document.getElementById('edit-pres-descripcion').value.trim();
    const textArea = document.getElementById('edit-pres-contenido-ia');

    if (!titulo) {
        showToast('El título de la propuesta es necesario para generar contenido', true);
        return;
    }

    // Ask the user for their prompt via the Apple-style modal
    const userInstruction = await showPrompt(
        'Generar con IA',
        'Escribe qué quieres que genere la IA para esta propuesta (ej: "5 beneficios clave", "texto persuasivo de cierre", etc.)',
        '✨',
        '',
        'Ej: Dame 5 beneficios clave para el cliente...'
    );

    if (!userInstruction || !userInstruction.trim()) return; // User cancelled

    const btn = document.querySelector('button[onclick="generateAIContentForProposal()"]');
    if (btn) { btn.innerHTML = '⏳ Generando...'; btn.style.pointerEvents = 'none'; }
    showToast('Generando contenido con IA...', false);

    const prompt = `Actúa como un experto en redacción persuasiva y ventas B2B.
Tengo la siguiente propuesta comercial para un lead:
Título: ${titulo}
Subtítulo: ${sub}
Descripción del servicio: ${desc}

Instrucción del usuario: "${userInstruction.trim()}"

FORMATO OBLIGATORIO:
- Cada punto en una línea separada
- NO uses emojis ni iconos, solo texto limpio
- Cada punto debe ser una frase corta, directa y persuasiva (máximo 15 palabras)
- Usa un tono elegante, profesional y cercano (de usted)
- Resalta el ROI, el ahorro de tiempo y la automatización cuando aplique

Responde ÚNICAMENTE con el contenido generado, sin título, sin introducción, sin comentarios extra.`;

    try {
        const res = await fetch('/api/proposal-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: prompt,
                systemInstruction: 'Eres CerebroComercial AI, un asistente de ventas experto en copywriting de propuestas. Responde SOLO con el contenido solicitado formateado, nada más.'
            })
        });

        if (!res.ok) throw new Error('Error al conectar con IA');
        const data = await res.json();
        
        let result = data.reply || '';
        // Normalize escaped newlines and trim
        result = result.replace(/\\n/g, '\n').trim();
        // Remove any markdown bold markers for cleaner plain text
        result = result.replace(/\*\*/g, '');

        // Append to existing content (never overwrite)
        if (textArea.value.trim() !== '') {
            textArea.value = textArea.value.trimEnd() + '\n\n' + result;
        } else {
            textArea.value = result;
        }

        showToast('Contenido generado con éxito ✨');
    } catch (e) {
        console.error(e);
        showToast('Error generando contenido IA', true);
    } finally {
        if (btn) { btn.innerHTML = '✨ Generar con IA'; btn.style.pointerEvents = 'auto'; }
    }
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

    // Pre-select lead if available
    if (p.lead_nombre) {
        const leadName = p.lead_nombre.toLowerCase().trim();
        const lead = leadsList.find(l => {
            const fname = (l.first_name || '').toLowerCase().trim();
            const email = (l.email || '').toLowerCase().trim();
            return (fname && (leadName.includes(fname) || fname.includes(leadName))) || 
                   (email && (leadName === email));
        });
        if (lead) {
            currentSelectedLeadForSend = lead;
            document.getElementById('send-pres-lead-search').value = `${lead.first_name || 'Prospecto'} (${lead.email})`;
        }
    }

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

    // B. Email dispatch via API
    if (emailChannel) {
        const linkPDF = `https://cerebrocomercial-ai.iadebarrio.com/api/download?id=${p.id}`;
        const linkOnline = `https://cerebrocomercial-ai.iadebarrio.com/propuesta.html?id=${p.id}`;
        const emailSubject = `Tu propuesta personalizada para ${p.titulo}`;
        
        let emailBody = `Hola ${currentSelectedLeadForSend.first_name || 'prospecto'},\n\nEspero que estés muy bien.\n\nTe adjunto el enlace para ver y aceptar la propuesta comercial de ${p.titulo} que hemos diseñado para optimizar tu negocio.\n\n`;
        if (ccNotes) emailBody += `Notas adicionales:\n${ccNotes}\n\n`;
        emailBody += `<div style="text-align: center; margin: 30px 0;"><a href="${linkOnline}" style="background-color: #111111; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">Ver y Confirmar Propuesta</a></div>\n\n`;
        emailBody += `Puedes descargar el desglose en PDF directamente aquí: ${linkPDF}\n\n`;
        emailBody += `Revísala y quedo a tu entera disposición para resolver cualquier duda.\n\nUn saludo,\nGerard Fanals\nCerebroComercial AI`;

        showToast('Enviando email...', false);
        try {
            const res = await fetch('/api/send-manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: currentSelectedLeadForSend.email,
                    subject: emailSubject,
                    body: emailBody,
                    isTest: false
                })
            });
            if (!res.ok) throw new Error('Error en API');
            outreachLogged += ' y Correo enviado automáticamente';
        } catch (e) {
            console.error(e);
            outreachLogged += ' (Error al enviar correo)';
            showToast('Error al enviar el email automáticamente', true);
        }
    }

    logToSystemSupport(`Propuesta "${p.titulo}" emitida a ${currentSelectedLeadForSend.first_name} (${currentSelectedLeadForSend.email})${outreachLogged}`);
    showToast('Propuesta emitida con éxito');

    closeSendPropuestaModal();
    
    // Switch to Enviadas to check
    switchPresTab('enviadas');
    
    // Update tab badges
    updateCounters();
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
        if (stateVal === 'aceptada') {
            row.style.background = 'rgba(52,199,89,0.06)';
            row.style.borderLeft = '3px solid #34c759';
        }

        const isAccepted = stateVal === 'aceptada';

        row.innerHTML = `
            <td>
                <div style="display:flex; align-items:center; gap:8px;">
                    <div>
                        <div style="font-weight: 700; color:var(--text-main);">${pe.lead_nombre}</div>
                        <div style="font-size: 0.75rem; color: var(--text-grey);">${pe.lead_email}</div>
                    </div>
                    ${isAccepted ? '<span style="display:inline-block; padding:2px 8px; border-radius:6px; background:rgba(52,199,89,0.12); color:#34c759; font-size:0.65rem; font-weight:800; text-transform:uppercase; letter-spacing:0.04em; border:1px solid rgba(52,199,89,0.25); white-space:nowrap;">✅ ACEPTADA</span>' : ''}
                </div>
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
    const cols = ['enviada', 'inmediato', 'mensual', 'anual', 'cliente', 'perdido', 'stop'];
    
    // Clear lists
    cols.forEach(c => {
        const el = document.getElementById(`seg-cards-${c}`);
        if (el) el.innerHTML = '';
        const badge = document.getElementById(`seg-badge-${c}`);
        if (badge) badge.textContent = '0';
    });

    // Auto-sync: ensure every propuesta_enviada has a seguimiento card
    propuestasEnviadas.forEach(pe => {
        const exists = seguimientos.find(s => s.propuesta_enviada_id === pe.id);
        if (!exists) {
            // Auto-create a seguimiento entry for this proposal
            const autoCol = pe.estado === 'aceptada' ? 'cliente' : 'enviada';
            seguimientos.push({
                id: 'auto_' + pe.id,
                propuesta_enviada_id: pe.id,
                lead_id: pe.lead_id,
                lead_nombre: pe.lead_nombre,
                lead_email: pe.lead_email,
                categoria: pe.categoria || 'personalizada',
                columna: autoCol,
                fecha_propuesta_enviada: pe.enviado_at,
                titulo_propuesta: pe.titulo,
                auto_synced: true
            });
        } else if (pe.estado === 'aceptada' && exists.columna !== 'cliente') {
            // Auto-move accepted proposals to 'cliente' column
            exists.columna = 'cliente';
        }
    });

    const counts = {};
    cols.forEach(c => counts[c] = 0);

    seguimientos.forEach(seg => {
        const col = seg.columna || 'enviada';
        if (counts[col] === undefined) return;
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

        // Style based on column
        if (col === 'cliente') {
            card.style.borderLeft = '3px solid #34c759';
            card.style.background = 'rgba(52,199,89,0.04)';
        } else if (col === 'perdido') {
            card.style.borderLeft = '3px solid #ff9500';
            card.style.opacity = '0.7';
        }

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

        // Proposal title badge
        const titleBadge = seg.titulo_propuesta 
            ? `<div style="font-size:0.65rem; color:var(--text-grey); margin-top:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">📋 ${seg.titulo_propuesta}</div>`
            : '';

        // Date meta text
        let dateMetaHtml = '';
        if (seg.ultimo_envio_at) {
            const lastD = new Date(seg.ultimo_envio_at).toLocaleDateString('es-ES', {day:'2-digit', month:'short'});
            let nextDHtml = '';
            if (seg.proximo_envio_at && !seg.pausada && col !== 'stop' && col !== 'enviada' && col !== 'cliente' && col !== 'perdido') {
                const nextD = new Date(seg.proximo_envio_at).toLocaleDateString('es-ES', {day:'2-digit', month:'short'});
                nextDHtml = ` · ⏰ ${nextD}`;
            }
            dateMetaHtml = `<div style="font-size:0.68rem; color:var(--text-grey); margin-top:4px;">📤 ${lastD}${nextDHtml}</div>`;
        } else if (seg.fecha_propuesta_enviada) {
            const addD = new Date(seg.fecha_propuesta_enviada).toLocaleDateString('es-ES', {day:'2-digit', month:'short'});
            dateMetaHtml = `<div style="font-size:0.68rem; color:var(--text-grey); margin-top:4px;">📅 Enviada: ${addD}</div>`;
        }

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
                <div style="font-size:0.82rem; font-weight:700; color:var(--text-main); max-width: 110px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${seg.lead_nombre}</div>
                <span style="font-size:0.64rem; padding:2px 6px; border-radius:6px; background:${meta.bg}; color:${meta.accent}; border: 1px solid ${meta.accent}20; font-weight:600; white-space:nowrap;">${meta.label}</span>
            </div>
            <div style="font-size:0.7rem; color:var(--text-grey); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${seg.lead_email}</div>
            ${titleBadge}
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

        const container = document.getElementById(`seg-cards-${col}`);
        if (container) container.appendChild(card);
    });

    cols.forEach(c => {
        const badge = document.getElementById(`seg-badge-${c}`);
        if (badge) badge.textContent = counts[c];
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
    } else if (targetCol === 'cliente') {
        seg.secuencia_activa = null;
        seg.pausada = false;
        seg.proximo_envio_at = null;

        patchBody.secuencia_activa = null;
        patchBody.pausada = false;
        patchBody.proximo_envio_at = null;
    } else if (targetCol === 'perdido') {
        seg.secuencia_activa = null;
        seg.pausada = false;
        seg.proximo_envio_at = null;

        patchBody.secuencia_activa = null;
        patchBody.pausada = false;
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
        anual: 'Secuencia Anual mensual activada',
        cliente: '✅ Marcado como Cliente',
        perdido: '💤 Lead marcado como perdido'
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


// ============================================
// CHAT CON LEADS - Funciones completas
// ============================================

let _chatCurrentRoom = null;
let _chatSubscription = null;
let _chatRoomsCache = [];

// --- Cargar lista de salas ---
window.loadChatRooms = async function() {
    try {
        const { data, error } = await _supabase
            .from('chat_rooms')
            .select('*')
            .order('last_message_at', { ascending: false });
        if (error) throw error;
        _chatRoomsCache = data || [];
        renderChatRoomsList(_chatRoomsCache);
        loadScheduledMessages();
    } catch(e) {
        console.error('Error loading chat rooms:', e);
    }
};

function renderChatRoomsList(rooms) {
    const container = document.getElementById('chat-rooms-list');
    if (!container) return;
    if (!rooms.length) {
        container.innerHTML = `<div style="text-align:center;padding:60px 20px">
            <div style="font-size:2.5rem;margin-bottom:12px;opacity:0.3">💬</div>
            <div style="font-size:0.82rem;color:var(--text-grey)">No hay chats activos</div>
            <div style="font-size:0.72rem;color:var(--text-grey);margin-top:4px">Crea uno con "+ Nuevo Chat"</div>
        </div>`;
        return;
    }
    container.innerHTML = rooms.map(r => {
        const initial = (r.lead_name || '?')[0].toUpperCase();
        const colors = ['#007AFF','#FF9500','#34C759','#AF52DE','#FF3B30','#5AC8FA','#FF2D55'];
        const color = colors[r.lead_name.charCodeAt(0) % colors.length];
        const isActive = _chatCurrentRoom && _chatCurrentRoom.id === r.id;
        const time = r.last_message_at ? new Date(r.last_message_at).toLocaleTimeString('es-ES', {hour:'2-digit',minute:'2-digit'}) : '';
        return `<div onclick="openChatRoom('${r.id}')" style="display:flex;gap:10px;padding:10px 12px;border-radius:12px;cursor:pointer;transition:all 0.15s;align-items:center;margin-bottom:4px;${isActive ? 'background:var(--accent-glow);border:1px solid rgba(10,132,255,0.2)' : 'border:1px solid transparent'}" onmouseover="if(!this.style.background.includes('accent'))this.style.background='rgba(255,255,255,0.04)'" onmouseout="if(!this.style.background.includes('accent'))this.style.background='transparent'">
            <div style="width:38px;height:38px;min-width:38px;border-radius:50%;background:${color};color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem">${initial}</div>
            <div style="flex:1;min-width:0">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <span style="font-size:0.82rem;font-weight:700;color:var(--text-main);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.lead_name}</span>
                    <span style="font-size:0.65rem;color:var(--text-grey);flex-shrink:0;margin-left:6px">${time}</span>
                </div>
                <div style="font-size:0.72rem;color:var(--text-grey);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.lead_company || r.lead_email || ''}</div>
            </div>
            ${r.unread_count > 0 ? `<div style="min-width:20px;height:20px;border-radius:50%;background:#FF3B30;color:white;font-size:0.65rem;font-weight:700;display:flex;align-items:center;justify-content:center">${r.unread_count}</div>` : ''}
        </div>`;
    }).join('');
}

// --- Filtrar chats ---
window.filterChatRooms = function(query) {
    const q = query.toLowerCase();
    const filtered = _chatRoomsCache.filter(r => 
        (r.lead_name || '').toLowerCase().includes(q) ||
        (r.lead_company || '').toLowerCase().includes(q) ||
        (r.lead_email || '').toLowerCase().includes(q)
    );
    renderChatRoomsList(filtered);
};

// --- Abrir sala ---
window.openChatRoom = async function(roomId) {
    const room = _chatRoomsCache.find(r => r.id === roomId);
    if (!room) return;
    _chatCurrentRoom = room;

    // Show header & input bar
    const header = document.getElementById('chat-active-header');
    const inputBar = document.getElementById('chat-input-bar');
    if (header) header.style.display = 'flex';
    if (inputBar) inputBar.style.display = 'flex';

    // Update header info
    const initial = (room.lead_name || '?')[0].toUpperCase();
    const colors = ['#007AFF','#FF9500','#34C759','#AF52DE','#FF3B30','#5AC8FA','#FF2D55'];
    const color = colors[room.lead_name.charCodeAt(0) % colors.length];
    const avatar = document.getElementById('chat-active-avatar');
    if (avatar) { avatar.textContent = initial; avatar.style.background = color; }
    const nameEl = document.getElementById('chat-active-name');
    if (nameEl) nameEl.textContent = room.lead_name;
    const compEl = document.getElementById('chat-active-company');
    if (compEl) compEl.textContent = room.lead_company || room.lead_email || '';

    // Re-render room list to show active state
    renderChatRoomsList(_chatRoomsCache);

    // Load messages
    try {
        const { data, error } = await _supabase
            .from('chat_messages')
            .select('*')
            .eq('room_id', roomId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        renderChatMessages(data || []);

        // Mark as read
        await _supabase.from('chat_rooms').update({ unread_count: 0 }).eq('id', roomId);
        room.unread_count = 0;
        renderChatRoomsList(_chatRoomsCache);
    } catch(e) {
        console.error('Error loading messages:', e);
    }

    // Subscribe to realtime
    subscribeToChatRoom(roomId);

    // Focus input
    const input = document.getElementById('chat-msg-input');
    if (input) setTimeout(() => input.focus(), 100);
};

function renderChatMessages(messages) {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;
    const emptyState = document.getElementById('chat-empty-state');

    if (!messages.length) {
        container.innerHTML = '';
        if (emptyState) container.appendChild(emptyState);
        emptyState.style.display = 'flex';
        emptyState.querySelector('div:nth-child(2)').textContent = 'Sin mensajes aún';
        emptyState.querySelector('div:nth-child(3)').textContent = 'Envía el primer mensaje a este lead';
        return;
    }
    if (emptyState) emptyState.style.display = 'none';

    container.innerHTML = messages.map(m => {
        const isAdmin = m.sender_type === 'admin';
        const time = new Date(m.created_at).toLocaleTimeString('es-ES', {hour:'2-digit',minute:'2-digit'});
        const date = new Date(m.created_at).toLocaleDateString('es-ES', {day:'2-digit',month:'short'});
        const bubbleBg = isAdmin ? 'var(--accent)' : 'var(--bg-secondary)';
        const bubbleColor = isAdmin ? '#ffffff' : 'var(--text-main)';
        const bubbleBorder = isAdmin ? 'transparent' : 'var(--card-border)';
        const align = isAdmin ? 'flex-end' : 'flex-start';

        let fileHtml = '';
        if (m.file_url) {
            const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(m.file_name || '');
            fileHtml = isImg 
                ? `<img src="${m.file_url}" alt="${m.file_name}" style="max-width:260px;border-radius:10px;margin-top:6px;cursor:pointer" onclick="window.open('${m.file_url}','_blank')">`
                : `<a href="${m.file_url}" target="_blank" style="display:inline-flex;gap:4px;align-items:center;margin-top:6px;font-size:0.78rem;color:${isAdmin?'#ffffff':'var(--accent)'};text-decoration:underline">📄 ${m.file_name || 'Archivo'}</a>`;
        }

        return `<div style="display:flex;flex-direction:column;align-items:${align};gap:2px">
            <div style="font-size:0.65rem;color:var(--text-grey);margin-bottom:2px;padding:0 4px">${m.sender_name || (isAdmin ? 'Tú' : _chatCurrentRoom?.lead_name || 'Lead')} · ${date} ${time}</div>
            <div style="max-width:70%;padding:10px 14px;border-radius:14px;background:${bubbleBg};color:${bubbleColor};border:1px solid ${bubbleBorder};font-size:0.86rem;line-height:1.45;word-break:break-word">
                ${m.content || ''}${fileHtml}
            </div>
        </div>`;
    }).join('');

    container.scrollTop = container.scrollHeight;
}

// --- Realtime subscription ---
function subscribeToChatRoom(roomId) {
    if (_chatSubscription) {
        _supabase.removeChannel(_chatSubscription);
        _chatSubscription = null;
    }
    _chatSubscription = _supabase
        .channel('chat-room-' + roomId)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, payload => {
            const container = document.getElementById('chat-messages-container');
            if (!container) return;
            const m = payload.new;
            const isAdmin = m.sender_type === 'admin';
            const time = new Date(m.created_at).toLocaleTimeString('es-ES', {hour:'2-digit',minute:'2-digit'});
            const date = new Date(m.created_at).toLocaleDateString('es-ES', {day:'2-digit',month:'short'});
            const bubbleBg = isAdmin ? 'var(--accent)' : 'var(--bg-secondary)';
            const bubbleColor = isAdmin ? '#ffffff' : 'var(--text-main)';
            const bubbleBorder = isAdmin ? 'transparent' : 'var(--card-border)';
            const align = isAdmin ? 'flex-end' : 'flex-start';
            const emptyState = document.getElementById('chat-empty-state');
            if (emptyState) emptyState.style.display = 'none';

            const div = document.createElement('div');
            div.style.cssText = `display:flex;flex-direction:column;align-items:${align};gap:2px`;
            div.innerHTML = `
                <div style="font-size:0.65rem;color:var(--text-grey);margin-bottom:2px;padding:0 4px">${m.sender_name || (isAdmin ? 'Tú' : _chatCurrentRoom?.lead_name || 'Lead')} · ${date} ${time}</div>
                <div style="max-width:70%;padding:10px 14px;border-radius:14px;background:${bubbleBg};color:${bubbleColor};border:1px solid ${bubbleBorder};font-size:0.86rem;line-height:1.45;word-break:break-word">${m.content || ''}</div>
            `;
            container.appendChild(div);
            container.scrollTop = container.scrollHeight;
        })
        .subscribe();
}


// --- Dictado por voz (dashboard) ---
let _dashRecognition = null;
let _dashIsRecording = false;
let _dashMicRetry = 0;

window.showDashMicHelp = function() {
    let modal = document.getElementById('dash-mic-help-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'dash-mic-help-modal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.65);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:24px';
        modal.innerHTML = `
            <div style="background:linear-gradient(180deg,#1e1e2a 0%,#16161e 100%);border:1px solid rgba(255,255,255,0.1);border-radius:24px;max-width:340px;width:100%;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,0.6);animation:micModalPop 0.35s cubic-bezier(0.34,1.56,0.64,1)">
                <div style="padding:28px 24px 16px;text-align:center">
                    <div style="width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,#ff4757,#ff6b81);display:flex;align-items:center;justify-content:center;font-size:1.8rem;margin:0 auto 16px;box-shadow:0 8px 24px rgba(255,71,87,0.3)">🎙️</div>
                    <h3 style="font-size:1.15rem;font-weight:800;color:#e8e6f0;letter-spacing:-0.02em">Activar Micrófono</h3>
                    <p style="font-size:0.8rem;color:#8b8a97;margin-top:6px;line-height:1.4">Para dictar mensajes por voz, necesitas permitir el acceso al micrófono</p>
                </div>
                <div style="padding:0 20px 20px;display:flex;flex-direction:column;gap:8px">
                    <div style="display:flex;align-items:flex-start;gap:14px;padding:14px;border-radius:14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06)">
                        <div style="width:26px;height:26px;border-radius:50%;background:#6c5ce7;color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:800;flex-shrink:0">1</div>
                        <div style="font-size:0.82rem;line-height:1.5;color:#e8e6f0">Pulsa el botón <strong>🎙️</strong> del chat</div>
                    </div>
                    <div style="display:flex;align-items:flex-start;gap:14px;padding:14px;border-radius:14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06)">
                        <div style="width:26px;height:26px;border-radius:50%;background:#6c5ce7;color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:800;flex-shrink:0">2</div>
                        <div style="font-size:0.82rem;line-height:1.5;color:#e8e6f0">Cuando aparezca el aviso, pulsa <strong>"Permitir"</strong></div>
                    </div>
                    <div style="display:flex;align-items:flex-start;gap:14px;padding:14px;border-radius:14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06)">
                        <div style="width:26px;height:26px;border-radius:50%;background:#6c5ce7;color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:800;flex-shrink:0">3</div>
                        <div style="font-size:0.82rem;line-height:1.5;color:#e8e6f0">Pulsa <strong>🎙️ otra vez</strong> y empieza a hablar</div>
                    </div>
                </div>
                <button onclick="document.getElementById('dash-mic-help-modal').style.display='none'" style="display:block;width:calc(100% - 40px);margin:0 20px 20px;padding:14px;border-radius:14px;background:linear-gradient(135deg,#ff4757,#ff6b81);border:none;color:#fff;font-size:0.88rem;font-weight:700;cursor:pointer;font-family:inherit;text-align:center">Entendido</button>
            </div>
        `;
        // Add animation keyframe if not present
        if (!document.getElementById('mic-modal-style')) {
            const style = document.createElement('style');
            style.id = 'mic-modal-style';
            style.textContent = '@keyframes micModalPop { from { opacity:0; transform:scale(0.85); } to { opacity:1; transform:scale(1); } }';
            document.head.appendChild(style);
        }
        document.body.appendChild(modal);
    } else {
        modal.style.display = 'flex';
    }
};

window.toggleDashboardDictation = function() {
    if (_dashIsRecording) { _stopDashDictation(); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showToast('Tu navegador no soporta dictado por voz', true); return; }
    _dashRecognition = new SR();
    _dashRecognition.lang = 'es-ES';
    _dashRecognition.continuous = true;
    _dashRecognition.interimResults = true;
    const input = document.getElementById('chat-msg-input');
    const btn = document.getElementById('dashboard-mic-btn');
    const startText = input ? input.value : '';
    _dashRecognition.onstart = () => {
        _dashIsRecording = true;
        _dashMicRetry = 0;
        if (btn) { btn.style.background = 'linear-gradient(135deg,#ff4757,#ff6b81)'; btn.style.borderColor = '#ff4757'; btn.textContent = '⏹️'; btn.style.animation = 'micPulse 1s ease-in-out infinite'; }
        if (input) input.placeholder = 'Escuchando...';
    };
    _dashRecognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) { transcript += event.results[i][0].transcript; }
        if (input) input.value = startText + (startText ? ' ' : '') + transcript;
    };
    _dashRecognition.onerror = (event) => {
        console.warn('Speech error:', event.error);
        _stopDashDictation();
        if (event.error === 'not-allowed') {
            if (_dashMicRetry === 0) { showDashMicHelp(); }
            else { showToast('Permite el acceso al micrófono en Ajustes', true); }
            _dashMicRetry++;
        } else if (event.error === 'aborted' || event.error === 'audio-capture') {
            if (_dashMicRetry < 2) { _dashMicRetry++; setTimeout(() => toggleDashboardDictation(), 300); }
        }
    };
    _dashRecognition.onend = () => { if (_dashIsRecording) _stopDashDictation(); };
    try { _dashRecognition.start(); }
    catch(e) { if (_dashMicRetry < 2) { _dashMicRetry++; setTimeout(() => toggleDashboardDictation(), 500); } }
};

function _stopDashDictation() {
    _dashIsRecording = false;
    const btn = document.getElementById('dashboard-mic-btn');
    if (btn) { btn.style.background = 'transparent'; btn.style.borderColor = ''; btn.textContent = '🎙️'; btn.style.animation = ''; }
    const input = document.getElementById('chat-msg-input');
    if (input) input.placeholder = 'Escribe un mensaje...';
    if (_dashRecognition) { try { _dashRecognition.stop(); } catch(e) {} _dashRecognition = null; }
}

// --- Enviar mensaje desde dashboard ---
window.sendDashboardChatMsg = async function() {
    if (!_chatCurrentRoom) return;
    const input = document.getElementById('chat-msg-input');
    if (!input) return;
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';

    try {
        const { error } = await _supabase.from('chat_messages').insert({
            room_id: _chatCurrentRoom.id,
            sender_type: 'admin',
            sender_name: 'Gerard',
            content: msg
        });
        if (error) throw error;

        // Update room
        await _supabase.from('chat_rooms').update({ last_message_at: new Date().toISOString() }).eq('id', _chatCurrentRoom.id);
        _chatCurrentRoom.last_message_at = new Date().toISOString();
        renderChatRoomsList(_chatRoomsCache);
        
        // Send push notification to lead
        sendPushToLead(_chatCurrentRoom.id, msg);
    } catch(e) {
        console.error('Error sending message:', e);
        showToast('Error al enviar mensaje', true);
    }
};

// --- Adjuntar archivo ---
window.handleChatFileUpload = async function(inputEl) {
    if (!_chatCurrentRoom || !inputEl.files.length) return;
    const file = inputEl.files[0];
    if (file.size > 10 * 1024 * 1024) { showToast('Archivo máx 10MB', true); return; }

    try {
        const path = `chat/${_chatCurrentRoom.id}/${Date.now()}_${file.name}`;
        const { error: upErr } = await _supabase.storage.from('archivos').upload(path, file);
        if (upErr) throw upErr;
        const { data: urlData } = _supabase.storage.from('archivos').getPublicUrl(path);

        await _supabase.from('chat_messages').insert({
            room_id: _chatCurrentRoom.id,
            sender_type: 'admin',
            sender_name: 'Gerard',
            content: `📎 ${file.name}`,
            file_url: urlData.publicUrl,
            file_name: file.name
        });
        await _supabase.from('chat_rooms').update({ last_message_at: new Date().toISOString() }).eq('id', _chatCurrentRoom.id);
        showToast('Archivo enviado');
        sendPushToLead(_chatCurrentRoom.id, `📎 ${file.name}`);
    } catch(e) {
        console.error('Error uploading file:', e);
        showToast('Error al subir archivo', true);
    }
    inputEl.value = '';
};

// --- Push Notification to Lead ---
async function sendPushToLead(roomId, message) {
    try {
        const resp = await fetch('/api/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'send',
                room_id: roomId,
                title: 'Gerard — iadebarrio',
                message: message.length > 100 ? message.substring(0, 100) + '...' : message
            })
        });
        const result = await resp.json();
        if (result.sent > 0) {
            console.log(`Push sent to ${result.sent} device(s)`);
        }
    } catch(e) {
        console.error('Push notification error:', e);
    }
}

// --- Modal Nuevo Chat ---
let _chatLeadsCache = [];
let _chatSelectedLeadId = null;

window.showCreateChatModal = async function() {
    _chatSelectedLeadId = null;
    _chatLeadsCache = [];
    try {
        // Load from CRM leads (real column names)
        const { data: crmLeads } = await _supabase.from('outreach_leads').select('id, first_name, last_name, company_name, email, phone').order('first_name');
        // Load from existing chat rooms (manual leads)
        const { data: chatLeads } = await _supabase.from('chat_rooms').select('lead_id, lead_name, lead_company, lead_email, lead_phone');
        
        const merged = [];
        const seen = new Set();
        
        // Add CRM leads first (normalize field names)
        (crmLeads || []).forEach(l => {
            const nombre = [l.first_name, l.last_name].filter(Boolean).join(' ') || '';
            const key = (l.email || nombre).toLowerCase();
            if (key && !seen.has(key)) {
                seen.add(key);
                merged.push({ id: l.id, nombre, empresa: l.company_name || '', email: l.email || '', telefono: l.phone || '' });
            }
        });
        
        // Add chat room leads that aren't in CRM
        (chatLeads || []).forEach(r => {
            const key = (r.lead_email || r.lead_name || '').toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                merged.push({ id: r.lead_id, nombre: r.lead_name, empresa: r.lead_company, email: r.lead_email, telefono: r.lead_phone || '', _fromChat: true });
            }
        });
        
        _chatLeadsCache = merged;
    } catch(e) { console.warn('Could not load leads:', e); }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'create-chat-modal';
    modal.innerHTML = `
        <div class="modal-box" style="max-width:480px">
            <div class="modal-header">
                <h2 style="font-size:1.1rem;font-weight:800">💬 Nuevo Chat con Lead</h2>
                <button class="modal-close" onclick="document.getElementById('create-chat-modal').remove()">✕</button>
            </div>
            <div class="modal-body" style="display:flex;flex-direction:column;gap:14px">
                <div style="position:relative">
                    <label style="font-size:0.78rem;font-weight:700;color:var(--text-grey);margin-bottom:6px;display:block">🔍 Buscar Lead en el CRM</label>
                    <input type="text" id="new-chat-search" class="modal-input" placeholder="Escribe nombre, empresa o email..." style="width:100%" oninput="filterChatLeadSearch(this.value)" onfocus="filterChatLeadSearch(this.value)" autocomplete="off">
                    <div id="new-chat-lead-results" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--bg-secondary);border:1px solid var(--card-border);border-radius:12px;max-height:200px;overflow-y:auto;z-index:100;box-shadow:0 8px 24px rgba(0,0,0,0.3);margin-top:4px"></div>
                </div>
                <div id="new-chat-selected-badge" style="display:none;background:rgba(10,132,255,0.1);border:1px solid rgba(10,132,255,0.2);border-radius:10px;padding:8px 12px;font-size:0.78rem;color:var(--accent);font-weight:600;display:flex;align-items:center;justify-content:space-between">
                </div>
                <div>
                    <label style="font-size:0.78rem;font-weight:700;color:var(--text-grey);margin-bottom:6px;display:block">Nombre *</label>
                    <input type="text" id="new-chat-name" class="modal-input" placeholder="Nombre del lead" style="width:100%">
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                    <div>
                        <label style="font-size:0.78rem;font-weight:700;color:var(--text-grey);margin-bottom:6px;display:block">Empresa</label>
                        <input type="text" id="new-chat-company" class="modal-input" placeholder="Empresa" style="width:100%">
                    </div>
                    <div>
                        <label style="font-size:0.78rem;font-weight:700;color:var(--text-grey);margin-bottom:6px;display:block">Email</label>
                        <input type="text" id="new-chat-email" class="modal-input" placeholder="email@ejemplo.com" style="width:100%">
                    </div>
                </div>
                <div>
                    <label style="font-size:0.78rem;font-weight:700;color:var(--text-grey);margin-bottom:6px;display:block">📱 Teléfono / Móvil</label>
                    <input type="tel" id="new-chat-phone" class="modal-input" placeholder="+34 600 000 000" style="width:100%">
                </div>
                <button class="btn-primary" onclick="createChatRoom()" style="width:100%;padding:12px;border-radius:12px;font-weight:700;font-size:0.88rem;margin-top:6px">Crear Chat</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';

    // Close dropdown on outside click
    document.getElementById('new-chat-search')?.addEventListener('blur', () => {
        setTimeout(() => { const r = document.getElementById('new-chat-lead-results'); if(r) r.style.display='none'; }, 200);
    });
};

window.filterChatLeadSearch = function(query) {
    const container = document.getElementById('new-chat-lead-results');
    if (!container) return;
    const q = query.toLowerCase().trim();
    if (!q) { container.style.display = 'none'; return; }

    const filtered = _chatLeadsCache.filter(l =>
        (l.nombre || '').toLowerCase().includes(q) ||
        (l.empresa || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q)
    ).slice(0, 8);

    if (!filtered.length) {
        container.innerHTML = '<div style="padding:12px 16px;font-size:0.8rem;color:var(--text-grey)">Sin resultados</div>';
        container.style.display = 'block';
        return;
    }

    container.innerHTML = filtered.map(l => `
        <div onclick="selectChatLead('${l.id}')" style="padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:10px;transition:background 0.15s;border-bottom:1px solid var(--border-color)" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">
            <div style="width:32px;height:32px;min-width:32px;border-radius:50%;background:var(--accent);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.75rem">${(l.nombre||'?')[0].toUpperCase()}</div>
            <div style="flex:1;min-width:0">
                <div style="font-size:0.82rem;font-weight:700;color:var(--text-main)">${l.nombre || 'Sin nombre'}</div>
                <div style="font-size:0.7rem;color:var(--text-grey)">${l.empresa || ''} ${l.email ? '· ' + l.email : ''}</div>
            </div>
        </div>
    `).join('');
    container.style.display = 'block';
};

window.selectChatLead = function(leadId) {
    const lead = _chatLeadsCache.find(l => l.id === leadId);
    if (!lead) return;
    _chatSelectedLeadId = leadId;

    // Fill fields
    document.getElementById('new-chat-name').value = lead.nombre || '';
    document.getElementById('new-chat-company').value = lead.empresa || '';
    document.getElementById('new-chat-email').value = lead.email || '';
    document.getElementById('new-chat-phone').value = lead.telefono || '';

    // Show selected badge
    const badge = document.getElementById('new-chat-selected-badge');
    if (badge) {
        badge.style.display = 'flex';
        badge.innerHTML = `<span>✅ Lead seleccionado: <strong>${lead.nombre}</strong></span><button onclick="clearChatLeadSelection()" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:0.8rem;font-weight:700">✕</button>`;
    }

    // Hide dropdown and clear search
    const results = document.getElementById('new-chat-lead-results');
    if (results) results.style.display = 'none';
    const search = document.getElementById('new-chat-search');
    if (search) search.value = '';
};

window.clearChatLeadSelection = function() {
    _chatSelectedLeadId = null;
    const badge = document.getElementById('new-chat-selected-badge');
    if (badge) badge.style.display = 'none';
};

window.createChatRoom = async function() {
    const name = document.getElementById('new-chat-name')?.value.trim();
    if (!name) { showToast('El nombre es obligatorio', true); return; }
    const company = document.getElementById('new-chat-company')?.value.trim() || '';
    const email = document.getElementById('new-chat-email')?.value.trim() || '';

    try {
        const insertData = {
            lead_name: name,
            lead_company: company,
            lead_email: email
        };
        // Only add lead_id if it's a valid UUID
        if (_chatSelectedLeadId && _chatSelectedLeadId.length > 10) {
            insertData.lead_id = _chatSelectedLeadId;
        }

        console.log('[Chat] Creating room with:', insertData);
        const { data, error } = await _supabase.from('chat_rooms').insert(insertData).select().single();
        
        if (error) {
            console.error('[Chat] Insert error:', error);
            throw error;
        }

        console.log('[Chat] Room created:', data);
        document.getElementById('create-chat-modal')?.remove();
        showToast(`Chat con ${name} creado`);
        await loadChatRooms();
        openChatRoom(data.id);
    } catch(e) {
        console.error('[Chat] Error creating chat:', e.message || e);
        showToast('Error: ' + (e.message || 'No se pudo crear'), true);
    }
};

// --- Crear grupo de chat ---
let _groupMembers = [];

window.showCreateGroupModal = async function() {
    _groupMembers = [];
    _chatLeadsCache = [];
    try {
        const { data: crmLeads } = await _supabase.from('outreach_leads').select('id, first_name, last_name, company_name, email, phone').order('first_name');
        const merged = [];
        const seen = new Set();
        (crmLeads || []).forEach(l => {
            const nombre = [l.first_name, l.last_name].filter(Boolean).join(' ') || '';
            const key = (l.email || nombre).toLowerCase();
            if (key && !seen.has(key)) {
                seen.add(key);
                merged.push({ id: l.id, nombre, empresa: l.company_name || '', email: l.email || '' });
            }
        });
        _chatLeadsCache = merged;
    } catch(e) { console.warn('Could not load leads:', e); }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'create-group-modal';
    modal.innerHTML = `
        <div class="modal-box" style="max-width:520px">
            <div class="modal-header">
                <h2 style="font-size:1.1rem;font-weight:800">👥 Nuevo Grupo</h2>
                <button class="modal-close" onclick="document.getElementById('create-group-modal').remove()">✕</button>
            </div>
            <div class="modal-body" style="display:flex;flex-direction:column;gap:14px">
                <div>
                    <label style="font-size:0.78rem;font-weight:700;color:var(--text-grey);margin-bottom:6px;display:block">Nombre del grupo *</label>
                    <input type="text" id="new-group-name" class="modal-input" placeholder="Ej: Leads restaurantes" style="width:100%">
                </div>
                <div>
                    <label style="font-size:0.78rem;font-weight:700;color:var(--text-grey);margin-bottom:6px;display:block">Descripción</label>
                    <input type="text" id="new-group-desc" class="modal-input" placeholder="Descripción del grupo" style="width:100%">
                </div>
                <div style="position:relative">
                    <label style="font-size:0.78rem;font-weight:700;color:var(--text-grey);margin-bottom:6px;display:block">🔍 Añadir miembros</label>
                    <input type="text" id="new-group-search" class="modal-input" placeholder="Buscar por nombre, empresa o email..." style="width:100%" oninput="filterGroupMemberSearch(this.value)" onfocus="filterGroupMemberSearch(this.value)" autocomplete="off">
                    <div id="new-group-search-results" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--bg-secondary);border:1px solid var(--card-border);border-radius:12px;max-height:200px;overflow-y:auto;z-index:100;box-shadow:0 8px 24px rgba(0,0,0,0.3);margin-top:4px"></div>
                </div>
                <div id="new-group-members" style="display:flex;flex-wrap:wrap;gap:6px"></div>
                <button class="btn-primary" onclick="createChatGroup()" style="width:100%;padding:12px;border-radius:12px;font-weight:700;font-size:0.88rem;margin-top:6px;background:linear-gradient(135deg,#0ea5e9,#06b6d4)">Crear Grupo</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    document.getElementById('new-group-search')?.addEventListener('blur', () => {
        setTimeout(() => { const r = document.getElementById('new-group-search-results'); if(r) r.style.display='none'; }, 200);
    });
};

window.filterGroupMemberSearch = function(query) {
    const container = document.getElementById('new-group-search-results');
    if (!container) return;
    const q = query.toLowerCase().trim();
    if (!q) { container.style.display = 'none'; return; }
    const filtered = _chatLeadsCache.filter(l =>
        !_groupMembers.find(m => m.id === l.id) &&
        ((l.nombre || '').toLowerCase().includes(q) || (l.empresa || '').toLowerCase().includes(q) || (l.email || '').toLowerCase().includes(q))
    ).slice(0, 8);
    if (!filtered.length) {
        container.innerHTML = '<div style="padding:12px 16px;font-size:0.8rem;color:var(--text-grey)">Sin resultados</div>';
        container.style.display = 'block'; return;
    }
    container.innerHTML = filtered.map(l => `
        <div onclick="addGroupMember('${l.id}')" style="padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:10px;transition:background 0.15s;border-bottom:1px solid var(--border-color)" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">
            <div style="width:32px;height:32px;min-width:32px;border-radius:50%;background:var(--accent);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.75rem">${(l.nombre||'?')[0].toUpperCase()}</div>
            <div style="flex:1;min-width:0">
                <div style="font-size:0.82rem;font-weight:700;color:var(--text-main)">${l.nombre || 'Sin nombre'}</div>
                <div style="font-size:0.7rem;color:var(--text-grey)">${l.empresa || ''} ${l.email ? '· ' + l.email : ''}</div>
            </div>
        </div>
    `).join('');
    container.style.display = 'block';
};

window.addGroupMember = function(id) {
    const lead = _chatLeadsCache.find(l => l.id === id);
    if (!lead || _groupMembers.find(m => m.id === id)) return;
    _groupMembers.push(lead);
    _renderGroupPills();
    const s = document.getElementById('new-group-search'); if (s) s.value = '';
    const r = document.getElementById('new-group-search-results'); if (r) r.style.display = 'none';
};

window.removeGroupMember = function(id) {
    _groupMembers = _groupMembers.filter(m => m.id !== id);
    _renderGroupPills();
};

function _renderGroupPills() {
    const c = document.getElementById('new-group-members');
    if (!c) return;
    c.innerHTML = _groupMembers.map(m => `
        <span style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(14,165,233,0.12);border:1px solid rgba(14,165,233,0.25);border-radius:20px;font-size:0.78rem;font-weight:600;color:#0ea5e9">
            ${m.nombre}
            <span onclick="removeGroupMember('${m.id}')" style="cursor:pointer;font-size:0.9rem;opacity:0.7">✕</span>
        </span>
    `).join('');
}

window.createChatGroup = async function() {
    const name = document.getElementById('new-group-name')?.value.trim();
    if (!name) { showToast('El nombre del grupo es obligatorio', true); return; }
    if (_groupMembers.length < 1) { showToast('Añade al menos un miembro', true); return; }
    const desc = document.getElementById('new-group-desc')?.value.trim() || '';
    try {
        const { data, error } = await _supabase.from('chat_rooms').insert({
            lead_name: name,
            lead_company: desc,
            lead_email: _groupMembers.map(m => m.nombre).join(', '),
            is_group: true
        }).select().single();
        if (error) throw error;

        // Insert each member with their own access_token
        const memberInserts = _groupMembers.map(m => ({
            room_id: data.id,
            lead_id: m.id || null,
            lead_name: m.nombre,
            lead_email: m.email || ''
        }));
        const { data: members, error: memErr } = await _supabase.from('chat_room_members')
            .insert(memberInserts).select();
        if (memErr) console.warn('Error inserting members:', memErr.message);

        await _supabase.from('chat_messages').insert({
            room_id: data.id, sender_type: 'system', sender_name: 'Sistema',
            content: '👥 Grupo creado con: ' + _groupMembers.map(m => m.nombre).join(', ')
        });

        document.getElementById('create-group-modal')?.remove();

        if (members && members.length) {
            showToast('Grupo creado ✅');
            setTimeout(() => _showGroupLinksModal(name, members), 300);
        } else {
            showToast('Grupo "' + name + '" creado');
        }

        await loadChatRooms();
        openChatRoom(data.id);
    } catch(e) {
        console.error('[Chat] Error creating group:', e.message || e);
        showToast('Error: ' + (e.message || 'No se pudo crear'), true);
    }
};

function _showGroupLinksModal(groupName, members) {
    const origin = window.location.origin;
    let existing = document.getElementById('group-links-modal');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'group-links-modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-box" style="max-width:520px">
            <div class="modal-header">
                <h2 style="font-size:1.1rem;font-weight:800">🔗 Links del grupo: ${groupName}</h2>
                <button class="modal-close" onclick="document.getElementById('group-links-modal').remove()">✕</button>
            </div>
            <div class="modal-body" style="display:flex;flex-direction:column;gap:10px">
                <p style="font-size:0.8rem;color:var(--text-grey);margin:0">Cada miembro tiene su link personal. Haz clic para copiar:</p>
                ${members.map(m => `
                    <div style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:12px;background:var(--bg-card);border:1px solid var(--card-border);cursor:pointer;transition:border-color 0.15s"
                         onclick="navigator.clipboard.writeText('${origin}/chat?token=${m.access_token}').then(()=>{this.style.borderColor='#34c759';this.querySelector('.gl-status').textContent='✅ Copiado';setTimeout(()=>{this.style.borderColor='';this.querySelector('.gl-status').textContent='📋 Copiar'},1500)})">
                        <div style="width:36px;height:36px;border-radius:50%;background:var(--accent-blue);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;flex-shrink:0">${(m.lead_name||'?')[0].toUpperCase()}</div>
                        <div style="flex:1;min-width:0">
                            <div style="font-size:0.85rem;font-weight:700">${m.lead_name}</div>
                            <div style="font-size:0.68rem;color:var(--text-grey);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${origin}/chat?token=${m.access_token.substring(0,12)}...</div>
                        </div>
                        <span class="gl-status" style="font-size:0.72rem;color:var(--text-grey);white-space:nowrap;flex-shrink:0">📋 Copiar</span>
                    </div>
                `).join('')}
                <button class="btn-primary" onclick="_copyAllGroupLinks('${groupName.replace(/'/g,"\\'")}', '${members.map(m=>m.lead_name+'|'+m.access_token).join(';;')}')"
                    style="width:100%;padding:12px;border-radius:12px;font-weight:700;font-size:0.88rem;margin-top:6px">
                    📋 Copiar todos los links
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

window._copyAllGroupLinks = function(groupName, membersStr) {
    const origin = window.location.origin;
    let text = '👥 Grupo: ' + groupName + '\n\n';
    membersStr.split(';;').forEach(m => {
        const [name, token] = m.split('|');
        text += name + ': ' + origin + '/chat?token=' + token + '\n';
    });
    navigator.clipboard.writeText(text).then(() => showToast('Todos los links copiados ✅'));
};


window.copyChatLink = function() {
    if (!_chatCurrentRoom) return;
    const url = `${window.location.origin}/chat?token=${_chatCurrentRoom.link_token}`;
    navigator.clipboard.writeText(url).then(() => {
        showToast('Link copiado al portapapeles');
    }).catch(() => {
        prompt('Copia este link:', url);
    });
};

// --- Enviar recordatorio al lead (con modal editable + plantillas custom) ---
const _defaultReminderTemplates = [
    '👋 Hola {name}, te escribo para hacer seguimiento. ¿Has tenido oportunidad de revisar nuestro último mensaje? Estoy disponible para cualquier duda. ¡Gracias!',
    '📋 Hola {name}, quería recordarte que estamos pendientes de tu respuesta. Si necesitas más información, no dudes en escribirme.',
    '🕐 Hola {name}, solo un pequeño recordatorio. Me encantaría poder avanzar contigo. ¿Cuándo te viene bien?',
    '💡 {name}, te dejo un recordatorio amigable. Estamos preparados para empezar cuando tú lo estés. ¿Hablamos?'
];

function getCustomReminderTemplates() {
    try { return JSON.parse(localStorage.getItem('cc_reminder_templates') || '[]'); } catch { return []; }
}
function saveCustomReminderTemplates(arr) {
    localStorage.setItem('cc_reminder_templates', JSON.stringify(arr));
}

window.sendChatReminder = function() {
    if (!_chatCurrentRoom) return;
    const leadName = _chatCurrentRoom.lead_name || 'Lead';
    const customTemplates = getCustomReminderTemplates();
    const allTemplates = [..._defaultReminderTemplates, ...customTemplates];
    const resolved = allTemplates.map(t => t.replace(/\{name\}/g, leadName));
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'reminder-modal';
    modal.innerHTML = `
        <div class="modal-box" style="max-width:500px">
            <div class="modal-header">
                <h2 style="font-size:1.1rem;font-weight:800">🔔 Enviar Recordatorio</h2>
                <button class="modal-close" onclick="document.getElementById('reminder-modal').remove()">✕</button>
            </div>
            <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:14px">
                <div>
                    <label style="font-size:0.78rem;font-weight:700;color:var(--text-grey);margin-bottom:6px;display:block">Para: ${leadName}</label>
                </div>
                <div>
                    <label style="font-size:0.78rem;font-weight:700;color:var(--text-grey);margin-bottom:8px;display:block">Plantillas</label>
                    <div style="display:flex;flex-direction:column;gap:6px;max-height:180px;overflow-y:auto" id="reminder-templates-list">
                        ${resolved.map((t, i) => {
                            const isCustom = i >= _defaultReminderTemplates.length;
                            const deleteBtn = isCustom ? `<button onclick="event.stopPropagation();deleteReminderTemplate(${i - _defaultReminderTemplates.length})" style="position:absolute;top:6px;right:6px;background:rgba(255,59,48,0.15);color:#FF3B30;border:none;border-radius:6px;padding:2px 6px;font-size:0.65rem;cursor:pointer;font-weight:700">✕</button>` : '';
                            return `<button onclick="document.getElementById('reminder-text').value=this.dataset.msg" data-msg="${t.replace(/"/g,'&quot;')}" style="position:relative;text-align:left;padding:10px 12px;${isCustom?'padding-right:30px;':''}border-radius:10px;border:1px solid var(--card-border);background:var(--bg-main);color:var(--text-main);font-size:0.76rem;cursor:pointer;line-height:1.4;font-family:inherit;transition:border-color 0.15s" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--card-border)'">${t.length > 85 ? t.substring(0,85)+'...' : t}${deleteBtn}</button>`;
                        }).join('')}
                    </div>
                </div>
                <div>
                    <label style="font-size:0.78rem;font-weight:700;color:var(--text-grey);margin-bottom:6px;display:block">Mensaje (editable)</label>
                    <textarea id="reminder-text" class="modal-input" rows="4" style="width:100%;resize:vertical">${resolved[0]}</textarea>
                </div>
                <div style="display:flex;gap:8px">
                    <button class="btn-primary" onclick="sendReminderNow()" style="flex:1;padding:12px;border-radius:12px;font-weight:700">🔔 Enviar Ahora</button>
                    <button onclick="saveAsReminderTemplate()" style="padding:12px 16px;border-radius:12px;border:1px solid var(--card-border);background:var(--bg-main);color:var(--text-main);font-size:0.82rem;cursor:pointer;font-weight:700;font-family:inherit;transition:all 0.15s" title="Guardar como plantilla">💾 Guardar</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';
};

window.saveAsReminderTemplate = function() {
    const text = document.getElementById('reminder-text')?.value.trim();
    if (!text) { showToast('Escribe un mensaje primero', true); return; }
    // Replace lead name with {name} for reuse
    const leadName = _chatCurrentRoom?.lead_name || 'Lead';
    const template = text.replace(new RegExp(leadName, 'g'), '{name}');
    const customs = getCustomReminderTemplates();
    if (customs.includes(template) || _defaultReminderTemplates.includes(template)) {
        showToast('Esta plantilla ya existe'); return;
    }
    customs.push(template);
    saveCustomReminderTemplates(customs);
    showToast('Plantilla guardada ✅');
    // Refresh modal
    document.getElementById('reminder-modal')?.remove();
    window.sendChatReminder();
};

window.deleteReminderTemplate = function(index) {
    const customs = getCustomReminderTemplates();
    customs.splice(index, 1);
    saveCustomReminderTemplates(customs);
    showToast('Plantilla eliminada');
    document.getElementById('reminder-modal')?.remove();
    window.sendChatReminder();
};

window.sendReminderNow = async function() {
    const content = document.getElementById('reminder-text')?.value.trim();
    if (!content || !_chatCurrentRoom) return;
    try {
        await _supabase.from('chat_messages').insert({
            room_id: _chatCurrentRoom.id,
            sender_type: 'admin',
            sender_name: 'Gerard',
            content: content
        });
        await _supabase.from('chat_rooms').update({ last_message_at: new Date().toISOString() }).eq('id', _chatCurrentRoom.id);
        document.getElementById('reminder-modal')?.remove();
        showToast(`Recordatorio enviado a ${_chatCurrentRoom.lead_name}`);
    } catch(e) {
        console.error('Error sending reminder:', e);
        showToast('Error al enviar recordatorio', true);
    }
};

// --- Modal Programar Mensaje ---
const _defaultSchedTemplates = [
    'Buenos días {name}, ¿cómo va todo? Quería hacer un seguimiento rápido.',
    'Hola {name}, te recuerdo que tenemos pendiente confirmar los detalles. ¿Puedes revisarlo?',
    '{name}, te envío un recordatorio amigable. Estamos listos para empezar cuando tú digas.',
    'Hola {name}, ¿has podido revisar la propuesta que te envié? Quedo a la espera.'
];

function getCustomSchedTemplates() {
    try { return JSON.parse(localStorage.getItem('cc_sched_templates') || '[]'); } catch { return []; }
}
function saveCustomSchedTemplates(arr) {
    localStorage.setItem('cc_sched_templates', JSON.stringify(arr));
}

window.scheduleChatMessageModal = function() {
    if (!_chatCurrentRoom) return;
    const leadName = _chatCurrentRoom.lead_name || 'Lead';
    const customTpls = getCustomSchedTemplates();
    const allTpls = [..._defaultSchedTemplates, ...customTpls];
    const resolved = allTpls.map(t => t.replace(/\{name\}/g, leadName));

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'schedule-chat-modal';
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    const defaultDt = now.toISOString().slice(0,16);
    modal.innerHTML = `
        <div class="modal-box" style="max-width:500px">
            <div class="modal-header">
                <h2 style="font-size:1.1rem;font-weight:800">⏰ Programar Mensaje</h2>
                <button class="modal-close" onclick="document.getElementById('schedule-chat-modal').remove()">✕</button>
            </div>
            <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:14px">
                <div>
                    <label style="font-size:0.78rem;font-weight:700;color:var(--text-grey);margin-bottom:6px;display:block">Para: ${leadName}</label>
                </div>
                <div>
                    <label style="font-size:0.78rem;font-weight:700;color:var(--text-grey);margin-bottom:8px;display:block">Plantillas</label>
                    <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto" id="sched-templates-list">
                        ${resolved.map((t, i) => {
                            const isCustom = i >= _defaultSchedTemplates.length;
                            const deleteBtn = isCustom ? `<button onclick="event.stopPropagation();deleteSchedTemplate(${i - _defaultSchedTemplates.length})" style="position:absolute;top:6px;right:6px;background:rgba(255,59,48,0.15);color:#FF3B30;border:none;border-radius:6px;padding:2px 6px;font-size:0.65rem;cursor:pointer;font-weight:700">✕</button>` : '';
                            return `<button onclick="document.getElementById('sched-msg-content').value=this.dataset.msg" data-msg="${t.replace(/"/g,'&quot;')}" style="position:relative;text-align:left;padding:10px 12px;${isCustom?'padding-right:30px;':''}border-radius:10px;border:1px solid var(--card-border);background:var(--bg-main);color:var(--text-main);font-size:0.76rem;cursor:pointer;line-height:1.4;font-family:inherit;transition:border-color 0.15s" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--card-border)'">${t.length > 70 ? t.substring(0,70)+'...' : t}${deleteBtn}</button>`;
                        }).join('')}
                    </div>
                </div>
                <div>
                    <label style="font-size:0.78rem;font-weight:700;color:var(--text-grey);margin-bottom:6px;display:block">Mensaje</label>
                    <textarea id="sched-msg-content" class="modal-input" rows="3" placeholder="Escribe el mensaje..." style="width:100%;resize:vertical"></textarea>
                </div>
                <div>
                    <label style="font-size:0.78rem;font-weight:700;color:var(--text-grey);margin-bottom:6px;display:block">Fecha y hora de envío</label>
                    <input type="datetime-local" id="sched-msg-datetime" class="modal-input" value="${defaultDt}" style="width:100%">
                </div>
                <div style="display:flex;gap:8px">
                    <button class="btn-primary" onclick="saveScheduledMessage()" style="flex:1;padding:12px;border-radius:12px;font-weight:700">⏰ Programar Envío</button>
                    <button onclick="saveAsSchedTemplate()" style="padding:12px 16px;border-radius:12px;border:1px solid var(--card-border);background:var(--bg-main);color:var(--text-main);font-size:0.82rem;cursor:pointer;font-weight:700;font-family:inherit;transition:all 0.15s" title="Guardar como plantilla">💾 Guardar</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';
};

window.saveAsSchedTemplate = function() {
    const text = document.getElementById('sched-msg-content')?.value.trim();
    if (!text) { showToast('Escribe un mensaje primero', true); return; }
    const leadName = _chatCurrentRoom?.lead_name || 'Lead';
    const template = text.replace(new RegExp(leadName, 'g'), '{name}');
    const customs = getCustomSchedTemplates();
    if (customs.includes(template) || _defaultSchedTemplates.includes(template)) {
        showToast('Esta plantilla ya existe'); return;
    }
    customs.push(template);
    saveCustomSchedTemplates(customs);
    showToast('Plantilla guardada ✅');
    document.getElementById('schedule-chat-modal')?.remove();
    window.scheduleChatMessageModal();
};

window.deleteSchedTemplate = function(index) {
    const customs = getCustomSchedTemplates();
    customs.splice(index, 1);
    saveCustomSchedTemplates(customs);
    showToast('Plantilla eliminada');
    document.getElementById('schedule-chat-modal')?.remove();
    window.scheduleChatMessageModal();
};

window.saveScheduledMessage = async function() {
    const content = document.getElementById('sched-msg-content')?.value.trim();
    const dt = document.getElementById('sched-msg-datetime')?.value;
    if (!content || !dt || !_chatCurrentRoom) { showToast('Rellena todos los campos', true); return; }

    try {
        const { error } = await _supabase.from('chat_scheduled_messages').insert({
            room_id: _chatCurrentRoom.id,
            content: content,
            scheduled_at: new Date(dt).toISOString()
        });
        if (error) throw error;
        document.getElementById('schedule-chat-modal')?.remove();
        showToast('Mensaje programado ✅');
        loadScheduledMessages();
    } catch(e) {
        console.error('Error scheduling message:', e);
        showToast('Error al programar', true);
    }
};

// --- Cargar mensajes programados (con filtro de estado) ---
let _scheduledMessagesCache = [];
async function loadScheduledMessages() {
    const container = document.getElementById('chat-scheduled-list');
    if (!container) return;
    const statusFilter = document.getElementById('sched-filter-status')?.value || 'pending';
    try {
        let query = _supabase
            .from('chat_scheduled_messages')
            .select('*, chat_rooms(lead_name)')
            .order('scheduled_at', { ascending: false });
        
        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        _scheduledMessagesCache = data || [];
        renderScheduledMessages(_scheduledMessagesCache);
    } catch(e) {
        console.error('Error loading scheduled:', e);
    }
}

function renderScheduledMessages(data) {
    const container = document.getElementById('chat-scheduled-list');
    if (!container) return;
    
    if (!data || !data.length) {
        container.innerHTML = '<div style="text-align:center;padding:20px;font-size:0.8rem;color:var(--text-grey)">No hay mensajes en esta categoría</div>';
        return;
    }
    
    // Add "Cancel all pending" button if current room has pending messages
    let cancelAllBtn = '';
    if (_chatCurrentRoom) {
        const pendingCount = data.filter(s => s.room_id === _chatCurrentRoom.id && s.status === 'pending').length;
        if (pendingCount > 0) {
            cancelAllBtn = `<div style="padding:8px 14px;border-bottom:1px solid var(--border-color)"><button onclick="cancelAllPendingForRoom()" style="width:100%;padding:8px 14px;border-radius:8px;background:rgba(255,59,48,0.08);border:1px solid rgba(255,59,48,0.15);color:#FF3B30;font-size:0.76rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.15s" onmouseover="this.style.background='rgba(255,59,48,0.15)'" onmouseout="this.style.background='rgba(255,59,48,0.08)'">🛑 Cancelar ${pendingCount} pendiente(s) de ${_chatCurrentRoom.lead_name}</button></div>`;
        }
    }
    
    container.innerHTML = data.map(s => {
        const dt = new Date(s.scheduled_at);
        const dateStr = dt.toLocaleDateString('es-ES', {day:'2-digit',month:'short',year:'numeric'});
        const timeStr = dt.toLocaleTimeString('es-ES', {hour:'2-digit',minute:'2-digit'});
        const leadName = s.chat_rooms?.lead_name || 'Lead';
        
        const statusColors = {
            pending: { bg: 'rgba(255,149,0,0.1)', color: '#FF9500', label: '⏳ Pendiente' },
            sent: { bg: 'rgba(52,199,89,0.1)', color: '#34C759', label: '✅ Enviado' },
            cancelled: { bg: 'rgba(255,59,48,0.1)', color: '#FF3B30', label: '❌ Cancelado' }
        };
        const st = statusColors[s.status] || statusColors.pending;
        
        let actions = '';
        if (s.status === 'pending') {
            actions = `<button onclick="cancelScheduledMsg('${s.id}')" style="background:rgba(255,59,48,0.1);color:#FF3B30;border:1px solid rgba(255,59,48,0.15);border-radius:6px;padding:4px 8px;font-size:0.68rem;cursor:pointer;font-weight:600">Cancelar</button>`;
        }
        
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid var(--border-color);gap:12px">
            <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
                    <span style="font-size:0.82rem;font-weight:700;color:var(--text-main)">${leadName}</span>
                    <span style="font-size:0.65rem;padding:2px 8px;border-radius:6px;background:${st.bg};color:${st.color};font-weight:700">${st.label}</span>
                </div>
                <div style="font-size:0.75rem;color:var(--text-grey);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:350px">${s.content}</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
                <span style="font-size:0.72rem;color:var(--text-grey);font-weight:500">${dateStr} ${timeStr}</span>
                ${actions}
            </div>
        </div>`;
    }).join('');
    container.innerHTML = cancelAllBtn + container.innerHTML;
}

window.filterScheduledMessages = function() {
    const search = document.getElementById('sched-search')?.value.trim().toLowerCase() || '';
    if (!search) {
        renderScheduledMessages(_scheduledMessagesCache);
        return;
    }
    const filtered = _scheduledMessagesCache.filter(s => {
        const leadName = (s.chat_rooms?.lead_name || '').toLowerCase();
        const content = (s.content || '').toLowerCase();
        return leadName.includes(search) || content.includes(search);
    });
    renderScheduledMessages(filtered);
};

window.cancelScheduledMsg = async function(id) {
    try {
        await _supabase.from('chat_scheduled_messages').update({ status: 'cancelled' }).eq('id', id);
        showToast('Mensaje cancelado');
        loadScheduledMessages();
    } catch(e) {
        showToast('Error al cancelar', true);
    }
};

window.cancelAllPendingForRoom = async function() {
    if (!_chatCurrentRoom) { showToast('Selecciona un chat primero', true); return; }
    const pending = _scheduledMessagesCache.filter(s => s.room_id === _chatCurrentRoom.id && s.status === 'pending');
    if (!pending.length) { showToast('No hay mensajes pendientes para este lead'); return; }
    if (!confirm(`¿Cancelar ${pending.length} mensaje(s) pendiente(s) para ${_chatCurrentRoom.lead_name}?`)) return;
    try {
        await _supabase
            .from('chat_scheduled_messages')
            .update({ status: 'cancelled' })
            .eq('room_id', _chatCurrentRoom.id)
            .eq('status', 'pending');
        showToast(`${pending.length} mensajes cancelados ✅`);
        loadScheduledMessages();
    } catch(e) {
        showToast('Error al cancelar', true);
    }
};

// --- Emoji Picker ---
const EMOJI_CATEGORIES = {
    '😊': ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','😋','😛','😜','🤪','😝','🤗','🤭','🤫','🤔','😐','😏','😒','🙄','😬','😌','😔','😪','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁','😮','😲','😳','🥺','😢','😭','😱','😤','😡','🤬','😈','💀','💩','🤡','👻','👽','🤖'],
    '👋': ['👋','🤚','✋','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤝','🙏','💪','🤳','👀','👅','👄','🧑','👨','👩','👶','👦','👧','🧔','👱','👴','👵','🧑‍💼','👨‍💼','👩‍💼','🧑‍💻','👨‍💻','👩‍💻','🧑‍🎓','👨‍🎓','👩‍🎓'],
    '🐶': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🐢','🐍','🦎','🦂','🐙','🦑','🦐','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🐘','🦛','🦏','🐪','🐫','🦒','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🐓','🦃','🕊️','🐕','🐩','🦮','🐈','🐇','🐿️','🦔','🦡','🌵','🎄','🌲','🌳','🌴','🌱','🌿','☘️','🍀','🍁','🍂','🍃','🌺','🌻','🌹','🥀','🌷','🌸','💐','🍄','🌾','🌈','☀️','🌤️','⛅','🌧️','⛈️','🌩️','🌨️','❄️','☃️','⛄','🌬️','💨','🌪️','🌊','💧','💦','☔','🌙','🌛','🌜','⭐','🌟','✨','⚡','🔥','💥','☄️'],
    '🍕': ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🧄','🧅','🥔','🍠','🥐','🥖','🍞','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🥛','🍼','☕','🫖','🍵','🧃','🥤','🧋','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾','🧊'],
    '⚽': ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂','🏋️','🤸','🤺','⛹️','🤾','🏌️','🏇','🧘','🏄','🏊','🤽','🚣','🧗','🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎖️','🎗️','🎫','🎟️','🎪','🎭','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🪘','🎷','🎺','🪗','🎸','🪕','🎻','🎲','♟️','🎯','🎳','🎮','🕹️','🎰'],
    '🚗': ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🛵','🏍️','🛺','🚲','🛴','🛹','🚁','🛸','🚀','🛩️','✈️','🛫','🛬','⛵','🚤','🛥️','🛳️','🚢','🚂','🚆','🚇','🚈','🚉','🚊','🚝','🚞','🚋','🚃','🚎','⛽','🚧','🚦','🚥','🛑','🚏','🗺️','🗿','🗽','🗼','🏰','🏯','🏟️','🎡','🎢','🎠','⛲','⛱️','🏖️','🏝️','🏜️','🌋','⛰️','🏔️','🗻','🏕️','🛖','🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫','🏬','🏭','🏗️','🧱','🪨','⛪','🕌','🕍','⛩️','🕋','🛕'],
    '💡': ['💡','🔑','🗝️','🔨','🪓','⛏️','🔧','🪛','🔩','⚙️','🗜️','⚖️','🦯','🔗','⛓️','🪝','🧰','🧲','🪜','💊','🩹','🩺','🌡️','🧬','🔬','🔭','📡','🛰️','💉','🩸','💊','🛁','🪥','🧴','🧹','🧺','🧻','🪣','🧼','🫧','🪒','🧽','🧯','🛒','🚬','⚰️','⚱️','🏺','🔮','📿','🧿','💈','⚗️','🪬','📱','💻','⌨️','🖥️','🖨️','🖱️','💾','💿','📷','📹','🎥','📽️','📺','📻','🎙️','🎚️','🎛️','⏱️','⏲️','⏰','🕰️','⌛','📡','🔋','🔌','💡','🔦','🕯️','🪔','📧','📞','📟','📠','📬','📮','📦','📋','📁','📂','📅','📆','📇','📈','📉','📊','📌','📍','📎','📏','📐','✂️','🖊️','🖋️','✒️','📝','💼','📒','📕','📗','📘','📙','📓','📔','📚','📖','💰','💵','💴','💶','💷','💸','💳','🧾','💎','🏧','🪙','💲'],
    '❤️': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🅾️','🆑','🆘','⭕','🛑','⛔','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🔇','🔕','🚭','❗','❓','‼️','⁉️','💤','♻️','✅','❌','⚠️','🔰','⚜️','🔱','〽️','✳️','❇️','🔆','🔅','🏳️','🏴','🏁','🚩','🏳️‍🌈']
};
let _currentEmojiTab = '😊';

window.toggleEmojiPicker = function(e) {
    if (e) e.stopPropagation();
    const picker = document.getElementById('emoji-picker');
    if (!picker) return;
    const isVisible = picker.style.display !== 'none';
    picker.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
        renderEmojiCategory(_currentEmojiTab);
    }
};

window.renderEmojiCategory = function(cat, e) {
    if (e) e.stopPropagation();
    _currentEmojiTab = cat;
    const picker = document.getElementById('emoji-picker');
    const grid = document.getElementById('emoji-grid');
    if (!picker || !grid) return;
    
    // Render tabs
    let tabsEl = picker.querySelector('.emoji-tabs');
    if (!tabsEl) {
        tabsEl = document.createElement('div');
        tabsEl.className = 'emoji-tabs';
        tabsEl.style.cssText = 'display:flex;gap:2px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--card-border);overflow-x:auto';
        picker.insertBefore(tabsEl, grid);
    }
    tabsEl.innerHTML = Object.keys(EMOJI_CATEGORIES).map(k =>
        `<span onclick="event.stopPropagation();renderEmojiCategory('${k}')" style="cursor:pointer;padding:4px 6px;border-radius:6px;font-size:1.1rem;flex-shrink:0;transition:background 0.15s;${k===cat?'background:var(--accent-glow, rgba(108,92,231,0.25))':''}">${k}</span>`
    ).join('');
    
    // Render emojis
    const emojis = EMOJI_CATEGORIES[cat] || [];
    grid.innerHTML = emojis.map(e => 
        `<span style="cursor:pointer;padding:4px;border-radius:6px;transition:background 0.15s;display:flex;align-items:center;justify-content:center;font-size:1.3rem" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background=''" onclick="event.stopPropagation();insertEmoji('${e}')">${e}</span>`
    ).join('');
};

window.insertEmoji = function(emoji) {
    const input = document.getElementById('chat-msg-input');
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.value = input.value.substring(0, start) + emoji + input.value.substring(end);
    input.focus();
    input.selectionStart = input.selectionEnd = start + emoji.length;
    document.getElementById('emoji-picker').style.display = 'none';
};

// Close emoji picker on click outside
document.addEventListener('click', function(e) {
    const picker = document.getElementById('emoji-picker');
    if (picker && picker.style.display !== 'none') {
        if (!e.target.closest('#emoji-picker') && !e.target.closest('[onclick*="toggleEmojiPicker"]')) {
            picker.style.display = 'none';
        }
    }
});

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
    if (typeof loadBizData === 'function') loadBizData();
});

