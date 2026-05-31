// 🧠 CerebroComercial AI — Frontend Orchestrator (app.js)

// 1. Supabase Initialization
const SUPABASE_URL = 'https://uidilhuybmtuokunutgz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpZGlsaHV5Ym10dW9rdW51dGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDU0NTAsImV4cCI6MjA5MTQyMTQ1MH0.ir9FnuHhW_1i4OslE_SNbOCIgLUEWakScP71WYqnfJM';
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

// 6. Spreadsheet Datagrid Module
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
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="editable-cell" contenteditable="true" onblur="updateLeadField('${lead.id}', 'first_name', this.textContent)">${lead.first_name || ''}</td>
                <td class="editable-cell" contenteditable="true" onblur="updateLeadField('${lead.id}', 'email', this.textContent)">${lead.email}</td>
                <td class="editable-cell" contenteditable="true" onblur="updateLeadField('${lead.id}', 'company_name', this.textContent)">${lead.company_name || ''}</td>
                <td class="editable-cell" contenteditable="true" onblur="updateLeadField('${lead.id}', 'website', this.textContent)">${lead.website || ''}</td>
                <td class="editable-cell" contenteditable="true" onblur="updateLeadField('${lead.id}', 'linkedin_url', this.textContent)">${lead.linkedin_url || ''}</td>
                <td><span class="badge-status status-${lead.status}">${lead.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Error in loadLeadsGrid:', e);
        showAlert('Error', `No se pudieron cargar los leads en la rejilla: ${e.message || JSON.stringify(e)}`);
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

// 7. CRM Kanban Drag & Drop Module
async function loadKanbanCRM() {
    try {
        const { data: leads, error } = await _supabase
            .from('outreach_leads')
            .select('id, first_name, company_name, status, website');

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
            if (col === 'lost' || col === 'unsubscribed') return; // Skip in Kanban for cleanliness

            if (counts[col] !== undefined) {
                counts[col]++;
                const card = document.createElement('div');
                card.className = 'kanban-card';
                card.draggable = true;
                card.id = `lead-${lead.id}`;
                card.setAttribute('ondragstart', 'handleDragStart(event)');
                card.innerHTML = `
                    <h4>${lead.first_name || 'Prospecto'}</h4>
                    <p>${lead.company_name || 'Desconocido'}</p>
                    <span class="card-badge status-${lead.status}">${lead.status}</span>
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

// 8. Chat interactivo con "El Cerebro"
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

    // Render loading indicator
    const loadDiv = document.createElement('div');
    loadDiv.className = 'chat-bubble model';
    loadDiv.innerHTML = '✦ El Cerebro está pensando...';
    chatMessages.appendChild(loadDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const res = await fetch('/api/brain-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: msg,
                history: brainChatHistory
            })
        });

        const data = await res.json();

        if (res.ok && data.text) {
            const brainDiv = document.createElement('div');
            brainDiv.className = 'chat-bubble model';
            brainDiv.innerHTML = data.text.replace(/\n/g, '<br>');
            chatMessages.appendChild(brainDiv);
            
            // Save to history
            brainChatHistory.push({ role: 'user', text: msg });
            brainChatHistory.push({ role: 'model', text: data.text });
        } else {
            throw new Error(data.error || 'Error del Orquestador');
        }
    } catch (e) {
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
