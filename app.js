// 🧠 CerebroComercial AI — Frontend Orchestrator (app.js)

// 1. Supabase Initialization
const SUPABASE_URL = 'https://lmozoetpehmdxxremtqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtb3pvZXRwZWhtZHh4cmVtdHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTA2NDUsImV4cCI6MjA5NTgyNjY0NX0.1xkCCw7q9CDvVbqGswCeFwXpgYfMtb0wcl7lHWlKQ8U';
let _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State management
let leadsList = [];
let brainChatHistory = [];

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

// 2. Lock Screen Authentication
async function validateLock() {
    const pwdInput = document.getElementById('lock-password');
    const pwd = pwdInput.value;
    const errorText = document.getElementById('lock-error');

    if (!pwd) return;

    try {
        const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pwd })
        });

        const data = await res.json();

        if (res.ok && data.success) {
            sessionStorage.setItem('cc_unlocked', 'true');
            sessionStorage.setItem('cc_token', pwd); // guardamos de forma segura localmente
            unlockDashboard();
        } else {
            errorText.textContent = data.error || 'Clave incorrecta';
            errorText.classList.add('active');
            pwdInput.value = '';
            shakeElement(document.querySelector('.macos-lock-card'));
        }
    } catch (e) {
        errorText.textContent = 'Error de red al autenticar';
        errorText.classList.add('active');
    }
}

function shakeElement(el) {
    el.style.transform = 'translateX(-10px)';
    setTimeout(() => el.style.transform = 'translateX(10px)', 80);
    setTimeout(() => el.style.transform = 'translateX(-8px)', 160);
    setTimeout(() => el.style.transform = 'translateX(8px)', 240);
    setTimeout(() => el.style.transform = 'translateX(0)', 320);
}

async function unlockDashboard() {
    try {
        const configRes = await fetch('/api/config');
        if (configRes.ok) {
            const config = await configRes.json();
            _supabase = supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
            console.log('Supabase client initialized dynamically with URL:', config.supabaseUrl);
        }
    } catch (configErr) {
        console.error('Error initializing dynamic Supabase client, using fallback:', configErr);
    }

    document.getElementById('lock-screen').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('lock-screen').style.display = 'none';
        document.getElementById('dashboard-wrapper').style.display = 'flex';
        initializeDashboard();
    }, 400);
}

function lockPanel() {
    sessionStorage.removeItem('cc_unlocked');
    sessionStorage.removeItem('cc_token');
    window.location.reload();
}

// Check session on load
(function() {
    const isUnlocked = sessionStorage.getItem('cc_unlocked') === 'true';
    window.addEventListener('DOMContentLoaded', () => {
        if (isUnlocked) {
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
    });
});

// 5. Initialize Dashboard Metrics
async function initializeDashboard() {
    try {
        // Fetch raw leads count
        const { data: leads, error } = await _supabase
            .from('outreach_leads')
            .select('status');
        
        if (error) throw error;
        leadsList = leads || [];

        // Count metrics
        const total = leadsList.length;
        const enriched = leadsList.filter(l => l.status === 'enriched' || l.status.startsWith('sent_') || l.status.startsWith('followup_')).length;
        const replied = leadsList.filter(l => l.status === 'replied').length;
        const booked = leadsList.filter(l => l.status === 'booked').length;

        document.getElementById('metrics-total').textContent = total;
        document.getElementById('metrics-enriched').textContent = enriched;
        document.getElementById('metrics-replied').textContent = replied;
        document.getElementById('metrics-booked').textContent = booked;
    } catch (e) {
        console.error('Error cargando métricas:', e);
        showAlert('Error de Base de Datos', `Error al cargar métricas del dashboard: ${e.message || JSON.stringify(e)}`);
    }
}

// 6. Spreadsheet Module
async function loadLeadsGrid() {
    try {
        const { data: leads, error } = await _supabase
            .from('outreach_leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('leads-table-body');
        tbody.innerHTML = '';

        leads.forEach(lead => {
            const cargo = (lead.scraped_data && lead.scraped_data.position) || '';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="editable-cell" contenteditable="true" onblur="updateLeadField('${lead.id}', 'first_name', this.textContent)">${lead.first_name || ''}</td>
                <td class="lead-email-cell">${lead.email}</td>
                <td class="editable-cell" contenteditable="true" onblur="updateLeadField('${lead.id}', 'company_name', this.textContent)">${lead.company_name || ''}</td>
                <td class="lead-cargo-cell">${cargo}</td>
                <td><span class="badge-status status-${lead.status}">${lead.status}</span></td>
                <td class="lead-actions-cell">
                    <button class="lead-action-btn" title="Editar" onclick="editLeadModal('${lead.id}')">✏️</button>
                    <button class="lead-action-btn action-delete" title="Borrar" onclick="deleteLead('${lead.id}')">🗑️</button>
                    <button class="lead-action-btn" title="Enviar Email" onclick="quickEmailLead('${lead.email}', '${lead.first_name || ''}')">📧</button>
                    <button class="lead-action-btn" title="WhatsApp" onclick="openWhatsApp('${lead.email}', '${lead.first_name || ''}', '${lead.company_name || ''}')">💬</button>
                    <button class="lead-action-btn" title="Formulario de alta" onclick="sendSignupForm('${lead.email}', '${lead.first_name || ''}')">📋</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Error in loadLeadsGrid:', e);
        showAlert('Error', `No se pudieron cargar los leads: ${e.message || JSON.stringify(e)}`);
    }
}

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
            if (col.startsWith('sent_') || col.startsWith('followup_') || col === 'enriching') {
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
    event.dataTransfer.setData('text/plain', event.target.id);
};

window.allowDrop = function(event) {
    event.preventDefault();
};

window.handleDrop = async function(event, targetStatus) {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain').replace('lead-', '');
    
    try {
        // Actualizar el estado en Supabase
        const { error } = await _supabase
            .from('outreach_leads')
            .update({ status: targetStatus })
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

// 10. Chat interactivo con "El Cerebro" (Multi-Agent Orchestrator)
async function sendToBrain() {
    const input = document.getElementById('brain-chat-input');
    const msg = input.value.trim();
    if (!msg) return;

    input.value = '';

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

                // Save to agent history
                saveAgentHistory(data.agentUsed, actionName, msg, true);

                // Auto-reset agent to idle after 8 seconds
                setTimeout(() => {
                    setAgentStatus(data.agentUsed, 'idle');
                    setAgentStatus('orchestrator', 'idle');
                }, 8000);
            } else {
                setAgentStatus('orchestrator', 'done', 'Respuesta directa generada');
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
                initializeDashboard();
                loadLeadsGrid(); // Auto-refresh leads table!
            }
        } else {
            throw new Error(data.error || 'Error del Orquestador');
        }
    } catch (e) {
        clearInterval(progressInterval);
        setAgentStatus('orchestrator', 'error', `Error: ${e.message}`);
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
async function loadEmailsLog() {
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

        // Load first email detail by default
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
