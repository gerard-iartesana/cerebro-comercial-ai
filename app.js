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
        if (btn.dataset.section === 'calendar') loadMeetings();
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

// =============================================
// 11. MEETINGS MANAGEMENT
// =============================================

let _meetingsTableReady = false;

async function ensureMeetingsTable() {
    const { error } = await _supabase.from('meetings').select('id').limit(1);
    if (error && error.code === '42P01') {
        const list = document.getElementById('meetings-list');
        if (list) {
            list.innerHTML = `<div style="text-align:center;padding:30px">
                <p style="font-size:0.9rem;color:#ff9500;margin-bottom:12px">⚠️ La tabla <strong>meetings</strong> no existe en Supabase.</p>
                <p style="font-size:0.8rem;color:var(--text-grey)">Créala en Supabase con este SQL:</p>
                <pre style="font-size:0.7rem;text-align:left;background:rgba(0,0,0,0.04);padding:12px;border-radius:10px;margin-top:8px;overflow-x:auto;white-space:pre-wrap">CREATE TABLE meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  meeting_date TIMESTAMPTZ NOT NULL,
  meeting_type TEXT DEFAULT 'discovery',
  status TEXT DEFAULT 'pending',
  notes TEXT,
  source TEXT DEFAULT 'manual',
  gcal_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON meetings FOR ALL USING (true);</pre>
            </div>`;
        }
        return false;
    }
    _meetingsTableReady = true;
    return true;
}

async function loadMeetings() {
    const ready = await ensureMeetingsTable();
    if (!ready) return;

    tryRestoreGCalSession();

    const now = new Date().toISOString();
    const listEl = document.getElementById('meetings-list');
    const historyEl = document.getElementById('meetings-history');

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

        if (e1 || e2) throw (e1 || e2);

        if (!upcoming || upcoming.length === 0) {
            listEl.innerHTML = '<div style="text-align:center;padding:30px 0"><div style="font-size:2.5rem;margin-bottom:8px">📭</div><p style="color:var(--text-grey);font-size:0.85rem">No hay reuniones programadas</p></div>';
        } else {
            listEl.innerHTML = upcoming.map(m => renderMeetingCard(m, false)).join('');
        }

        if (!past || past.length === 0) {
            historyEl.innerHTML = '<p style="color:var(--text-grey);font-size:0.85rem;text-align:center;padding:20px 0">Sin reuniones anteriores</p>';
        } else {
            historyEl.innerHTML = past.map(m => renderMeetingCard(m, true)).join('');
        }

        // Load Google Calendar events if connected
        loadGCalEvents();

    } catch (err) {
        listEl.innerHTML = '<p style="color:#ff3b30;font-size:0.85rem">Error: ' + err.message + '</p>';
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
// 12. GOOGLE CALENDAR INTEGRATION
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
