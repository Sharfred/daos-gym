const API = window.location.origin + '/api';
let dashboardChart;

// ─── AUTHENTICATION ──────────────────────────────
function getToken() { return sessionStorage.getItem('gym_token'); }
function setToken(t) { sessionStorage.setItem('gym_token', t); }

async function fetchAPI(url, options = {}) {
    const token = getToken();
    if (!options.headers) options.headers = {};
    if (token) options.headers['Authorization'] = 'Bearer ' + token;
    
    const res = await fetch(url, options);
    if (res.status === 401) {
        document.getElementById('loginOverlay').style.display = 'flex';
        document.getElementById('navbar').style.display = 'none';
        showToast('Sesión expirada o no autorizada', 'error');
        throw new Error('No autorizado');
    }
    return res;
}

// Login link click
document.getElementById('linkGestion').addEventListener('click', (e) => {
    e.preventDefault();
    if (getToken()) {
        document.getElementById('gestion').style.display = 'block';
        document.getElementById('gestion').scrollIntoView({ behavior: 'smooth' });
        loadDashboard();
    } else {
        document.getElementById('loginOverlay').style.display = 'flex';
    }
});

document.getElementById('btnCloseLogin').addEventListener('click', () => {
    document.getElementById('loginOverlay').style.display = 'none';
});

document.getElementById('btnLogin').addEventListener('click', async () => {
    const btn = document.getElementById('btnLogin');
    const u = document.getElementById('loginUser').value.trim();
    const p = document.getElementById('loginPass').value.trim();
    if(!u || !p) return showToast('Llena todos los campos', 'error');
    btn.disabled = true; btn.textContent = 'Verificando...';
    try {
        const res = await fetch(API + '/auth/login', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({usuario:u, password:p}) });
        const data = await res.json();
        if(res.ok) {
            setToken(data.token);
            document.getElementById('loginOverlay').style.display = 'none';
            document.getElementById('btnLogout').style.display = 'inline-block';
            document.getElementById('gestion').style.display = 'block';
            document.getElementById('gestion').scrollIntoView({ behavior: 'smooth' });
            showToast('¡Bienvenido!');
            loadDashboard(); // Initial load after login
        } else { showToast(data.mensaje, 'error'); }
    } catch(e) { showToast('Error de conexión', 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Ingresar'; }
});

document.getElementById('btnLogout').addEventListener('click', () => {
    sessionStorage.removeItem('gym_token');
    document.getElementById('gestion').style.display = 'none';
    document.getElementById('btnLogout').style.display = 'none';
    showToast('Sesión cerrada');
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Check auth on load
sessionStorage.removeItem('gym_token');
document.getElementById('gestion').style.display = 'none';
document.getElementById('btnLogout').style.display = 'none';

// ─── REGISTRO PÚBLICO (manejado por PHP) ─────────────────
// Detectar mensaje de respuesta de PHP en la URL (?msg=...&tipo=...)
(function() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('msg')) {
        const msg = decodeURIComponent(params.get('msg'));
        const tipo = params.get('tipo') || 'exito';
        // Esperar a que showToast esté disponible
        setTimeout(() => showToast(msg, tipo), 500);
        // Limpiar la URL sin recargar
        window.history.replaceState({}, '', window.location.pathname + window.location.hash);
    }
})();

// ─── UI & UTILS ─────────────────────────────────
const esc = str => { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; };

function showToast(msg, tipo = 'exito') {
    const c = document.getElementById('toastContainer');
    const t = document.createElement('div'); t.className = 'toast ' + tipo; t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(120%)'; setTimeout(() => t.remove(), 300); }, 3500);
}

// ─── THEME & MENU & SCROLL ──────────────────────
document.getElementById('themeToggle').addEventListener('click', () => {
    const isLight = document.body.parentElement.getAttribute('data-theme') === 'light';
    document.body.parentElement.setAttribute('data-theme', isLight ? 'dark' : 'light');
    document.getElementById('themeToggle').textContent = isLight ? '☀️' : '🌙';
});

document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('show');
});

const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-in, .section, .membership-card').forEach(el => {
    el.classList.add('fade-in'); observer.observe(el);
});

// ─── MARKETING COUNTERS ANIMATION ────────────────
const countersObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.getAttribute('data-target'));
            const prefix = el.getAttribute('data-prefix') || '';
            let current = 0;
            const increment = Math.max(1, Math.ceil(target / 40));
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                el.textContent = prefix + current;
            }, 40);
            
            countersObserver.unobserve(el);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.counter-number').forEach(el => {
    countersObserver.observe(el);
});

// ─── TABS ───────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
        if (btn.dataset.tab === 'tab-dashboard') loadDashboard();
        if (btn.dataset.tab === 'tab-clientes') cargarClientes();
        if (btn.dataset.tab === 'tab-membresias') cargarMembresias();
        if (btn.dataset.tab === 'tab-inscripciones') cargarInscripciones();
        if (btn.dataset.tab === 'tab-pagos') cargarPagos();
    });
});

// ─── EXPORT CSV ─────────────────────────────────
function exportToCSV(filename, headers, rows) {
    let csv = headers.join(',') + '\n';
    rows.forEach(row => { csv += row.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',') + '\n'; });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename); document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

// ─── DASHBOARD ──────────────────────────────────
async function loadDashboard() {
    if (!getToken()) return;
    try {
        const res = await fetchAPI(API + '/stats');
        const data = await res.json();
        animarNumero('statClientes', data.totalClientes);
        animarNumero('statActivas', data.membresiasActivas);
        animarNumero('statIngresos', data.ingresosMes, true);
        
        if (dashboardChart) dashboardChart.destroy();
        const ctx = document.getElementById('dashboardChart').getContext('2d');
        const labels = data.ultimosPagos.map(p => new Date(p.fecha_pago).toLocaleDateString('es-MX')).reverse();
        const amounts = data.ultimosPagos.map(p => p.monto).reverse();
        
        dashboardChart = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets: [{ label: 'Ingresos ($)', data: amounts, borderColor: '#C5A55A', backgroundColor: 'rgba(197, 165, 90, 0.2)', tension: 0.4, fill: true }] },
            options: { responsive: true, scales: { y: { beginAtZero: true, grid: { color: '#2a2e3b' } }, x: { grid: { color: '#2a2e3b' } } }, plugins: { legend: { labels: { color: '#8b8fa3' } } } }
        });
    } catch(e) { console.error(e); }
}

function animarNumero(id, target, isCurrency=false) {
    const el = document.getElementById(id);
    let current = 0; const increment = target / 20; const timer = setInterval(() => {
        current += increment;
        if (current >= target) { current = target; clearInterval(timer); }
        el.textContent = isCurrency ? '$' + Math.floor(current) : Math.floor(current);
    }, 30);
}

// ─── SELECT POPULATORS ──────────────────────────
async function populateSelect(url, selectId, textProp, idProp) {
    try {
        const res = await fetchAPI(API + url); const data = await res.json();
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">Seleccione...</option>' + data.map(i => `<option value="${i[idProp]}">${i[textProp]}</option>`).join('');
    } catch(e) { console.error(e); }
}

// ─── GENERIC CRUD LOGIC ─────────────────────────
function setupCrud(prefix, urlPath, renderFunc, getBodyFunc, setFormFunc, clearFunc) {
    let cache = []; let selectedId = null;

    window['cargar' + prefix] = async () => {
        try {
            const res = await fetchAPI(API + urlPath); cache = await res.json();
            renderFunc(cache);
            // Populate dropdowns specifically if opening related tabs
            if(prefix==='Inscripciones' || prefix==='Pagos') populateSelect('/clientes', prefix==='Inscripciones'?'i_cliente':'p_cliente', 'nombre', 'id_cliente');
            if(prefix==='Inscripciones') populateSelect('/membresias', 'i_membresia', 'tipo', 'id_membresia');
        } catch(e) { document.getElementById('tabla_'+prefix.toLowerCase()).innerHTML = '<tr><td colspan="10">Error de conexión</td></tr>'; }
    };

    const searchInput = document.getElementById('searchTable_' + prefix.toLowerCase());
    if(searchInput) searchInput.addEventListener('input', e => {
        const q = e.target.value.toLowerCase();
        renderFunc(cache.filter(item => Object.values(item).some(val => String(val).toLowerCase().includes(q))));
    });

    document.getElementById('tabla_' + prefix.toLowerCase()).addEventListener('click', e => {
        const row = e.target.closest('tr[data-id]'); if(!row) return;
        const item = cache.find(i => String(i['id_' + urlPath.replace('/','').slice(0,-1)]) === String(row.dataset.id) || String(i['id_cliente']) === String(row.dataset.id));
        if(item) {
            selectedId = item['id_' + urlPath.replace('/','').slice(0,-1)] || item.id_cliente;
            document.querySelectorAll('#tabla_' + prefix.toLowerCase() + ' tr').forEach(r => r.classList.remove('selected'));
            row.classList.add('selected');
            document.getElementById('selectionInfo_'+prefix.toLowerCase()).textContent = 'Seleccionado ID: #' + selectedId;
            document.getElementById('selectionInfo_'+prefix.toLowerCase()).classList.add('show');
            document.getElementById('crudActions_'+prefix.toLowerCase()).classList.add('show');
        }
    });

    document.getElementById('btnEdit_'+prefix.toLowerCase()).addEventListener('click', () => {
        const item = cache.find(i => String(i['id_' + urlPath.replace('/','').slice(0,-1)]) === String(selectedId) || String(i['id_cliente']) === String(selectedId));
        if(!item) return;
        document.getElementById('editId_'+prefix.toLowerCase()).value = selectedId;
        setFormFunc(item);
        document.getElementById('formTitle_'+prefix.toLowerCase()).textContent = 'Editando #' + selectedId;
        document.getElementById('btnSubmit_'+prefix.toLowerCase()).textContent = 'Actualizar';
        document.getElementById('btnCancel_'+prefix.toLowerCase()).style.display = 'inline-block';
    });

    document.getElementById('btnCancel_'+prefix.toLowerCase()).addEventListener('click', () => {
        clearFunc();
        selectedId = null;
        document.querySelectorAll('#tabla_' + prefix.toLowerCase() + ' tr').forEach(r => r.classList.remove('selected'));
        document.getElementById('selectionInfo_'+prefix.toLowerCase()).classList.remove('show');
        document.getElementById('crudActions_'+prefix.toLowerCase()).classList.remove('show');
        document.getElementById('editId_'+prefix.toLowerCase()).value = '';
        document.getElementById('formTitle_'+prefix.toLowerCase()).textContent = 'Nuevo';
        document.getElementById('btnSubmit_'+prefix.toLowerCase()).textContent = 'Registrar';
        document.getElementById('btnCancel_'+prefix.toLowerCase()).style.display = 'none';
    });

    document.getElementById('btnSubmit_'+prefix.toLowerCase()).addEventListener('click', async () => {
        const body = await getBodyFunc(); if(!body) return; // Note: added await in case body func is async
        const editId = document.getElementById('editId_'+prefix.toLowerCase()).value;
        const btn = document.getElementById('btnSubmit_'+prefix.toLowerCase());
        btn.disabled = true; btn.textContent = 'Procesando...';
        try {
            const res = await fetchAPI(API + (editId ? urlPath + '/' + editId : (urlPath==='/clientes'?'/registrar':urlPath)), {
                method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
            });
            const data = await res.json();
            if(!res.ok) { showToast(data.mensaje, 'error'); return; }
            showToast(data.mensaje);
            document.getElementById('btnCancel_'+prefix.toLowerCase()).click();
            window['cargar' + prefix]();
        } catch(e) { showToast('Error de red', 'error'); }
        finally { btn.disabled = false; btn.textContent = editId ? 'Actualizar' : 'Registrar'; }
    });

    document.getElementById('btnDelete_'+prefix.toLowerCase()).addEventListener('click', async () => {
        if(!confirm('¿Seguro de eliminar este registro?')) return;
        try {
            const res = await fetchAPI(API + urlPath + '/' + selectedId, { method: 'DELETE' });
            const data = await res.json();
            if(!res.ok) { showToast(data.mensaje, 'error'); return; }
            showToast(data.mensaje);
            document.getElementById('btnCancel_'+prefix.toLowerCase()).click();
            window['cargar' + prefix]();
        } catch(e) { showToast('Error de red', 'error'); }
    });

    const btnExport = document.getElementById('btnExport_'+prefix.toLowerCase());
    if(btnExport) btnExport.addEventListener('click', () => {
        if(!cache.length) return showToast('No hay datos', 'error');
        const headers = Object.keys(cache[0]);
        const rows = cache.map(item => headers.map(h => item[h]));
        exportToCSV(prefix + '.csv', headers, rows);
    });
}

// ─── IMPLEMENTATIONS ────────────────────────────

// 1. Clientes
setupCrud('Clientes', '/clientes', 
    (lista) => {
        document.getElementById('recordCount_clientes').textContent = lista.length + ' registros';
        document.getElementById('tabla_clientes').innerHTML = lista.map(c => 
            `<tr data-id="${c.id_cliente}"><td>${c.id_cliente}</td><td>${esc(c.nombre)}</td><td>${esc(c.apellido_p)}</td><td>${esc(c.apellido_m)}</td><td>${c.edad}</td></tr>`
        ).join('') || '<tr><td colspan="5" class="empty-state">Sin datos</td></tr>';
    },
    () => {
        const n = document.getElementById('c_nombre').value.trim();
        const ap = document.getElementById('c_ap').value.trim();
        const am = document.getElementById('c_am').value.trim();
        const e = document.getElementById('c_edad').value.trim();
        if(!n || !ap || !am || !e) { showToast('Todos los campos son requeridos', 'error'); return null; }
        return { nombre: n, apellido_p: ap, apellido_m: am, edad: e };
    },
    (item) => {
        document.getElementById('c_nombre').value = item.nombre;
        document.getElementById('c_ap').value = item.apellido_p;
        document.getElementById('c_am').value = item.apellido_m;
        document.getElementById('c_edad').value = item.edad;
    },
    () => { document.getElementById('c_nombre').value=''; document.getElementById('c_ap').value=''; document.getElementById('c_am').value=''; document.getElementById('c_edad').value=''; }
);

// 2. Membresías
setupCrud('Membresias', '/membresias', 
    (lista) => {
        document.getElementById('tabla_membresias').innerHTML = lista.map(m => 
            `<tr data-id="${m.id_membresia}"><td>${m.id_membresia}</td><td>${esc(m.tipo)}</td><td>${esc(m.duracion)}</td><td>$${m.costo}</td></tr>`
        ).join('') || '<tr><td colspan="4" class="empty-state">Sin datos</td></tr>';
    },
    () => {
        const t = document.getElementById('m_tipo').value.trim();
        const d = document.getElementById('m_duracion').value.trim();
        const c = document.getElementById('m_costo').value.trim();
        if(!t || !d || !c) { showToast('Todos los campos son requeridos', 'error'); return null; }
        return { tipo: t, duracion: d, costo: c };
    },
    (item) => {
        document.getElementById('m_tipo').value = item.tipo;
        document.getElementById('m_duracion').value = item.duracion;
        document.getElementById('m_costo').value = item.costo;
    },
    () => { document.getElementById('m_tipo').value=''; document.getElementById('m_duracion').value=''; document.getElementById('m_costo').value=''; }
);

// 3. Inscripciones
setupCrud('Inscripciones', '/inscripciones', 
    (lista) => {
        const hoy = new Date();
        document.getElementById('tabla_inscripciones').innerHTML = lista.map(i => {
            const fFin = new Date(i.fecha_fin);
            const isVencida = fFin < hoy;
            const diffDays = Math.ceil((fFin - hoy) / (1000 * 60 * 60 * 24));
            const estado = isVencida ? '<span style="color:var(--danger)">Vencida</span>' : (diffDays <= 5 ? `<span style="color:var(--warning)">Vence en ${diffDays}d</span>` : '<span style="color:var(--success)">Activa</span>');
            return `<tr data-id="${i.id_inscripcion}"><td>${i.id_inscripcion}</td><td>${esc(i.cliente_nombre)}</td><td>${esc(i.membresia_tipo)}</td><td>${new Date(i.fecha_inicio).toLocaleDateString('es-MX')}</td><td style="${isVencida?'color:var(--danger);font-weight:bold':''}">${new Date(i.fecha_fin).toLocaleDateString('es-MX')}</td><td>${estado}</td></tr>`
        }).join('') || '<tr><td colspan="6" class="empty-state">Sin datos</td></tr>';
    },
    () => {
        const cl = document.getElementById('i_cliente').value;
        const me = document.getElementById('i_membresia').value;
        const ini = document.getElementById('i_inicio').value;
        const fin = document.getElementById('i_fin').value;
        if(!cl || !me || !ini || !fin) { showToast('Todos los campos son requeridos', 'error'); return null; }
        return { id_cliente: cl, id_membresia: me, fecha_inicio: ini, fecha_fin: fin };
    },
    (item) => {
        document.getElementById('i_cliente').value = item.id_cliente;
        document.getElementById('i_membresia').value = item.id_membresia;
        document.getElementById('i_inicio').value = item.fecha_inicio.split('T')[0];
        document.getElementById('i_fin').value = item.fecha_fin.split('T')[0];
    },
    () => { document.getElementById('i_cliente').value=''; document.getElementById('i_membresia').value=''; document.getElementById('i_inicio').value=''; document.getElementById('i_fin').value=''; }
);

// 4. Pagos
setupCrud('Pagos', '/pagos', 
    (lista) => {
        document.getElementById('tabla_pagos').innerHTML = lista.map(p => 
            `<tr data-id="${p.id_pago}"><td>${p.id_pago}</td><td>${esc(p.cliente_nombre)}</td><td>$${p.monto}</td><td>${new Date(p.fecha_pago).toLocaleDateString('es-MX')}</td></tr>`
        ).join('') || '<tr><td colspan="4" class="empty-state">Sin datos</td></tr>';
    },
    async () => {
        const cl = document.getElementById('p_cliente').value;
        const mo = document.getElementById('p_monto').value;
        const fe = document.getElementById('p_fecha').value;
        if(!cl || !mo || !fe) { showToast('Todos los campos son requeridos', 'error'); return null; }
        
        let renovar = false;
        if (!document.getElementById('editId_pagos').value) {
            // Check if client has active/expired membership
            try {
                const res = await fetchAPI(API + '/inscripciones');
                const inscripciones = await res.json();
                const ins = inscripciones.find(i => i.id_cliente == cl);
                if (ins && new Date(ins.fecha_fin) < new Date()) {
                    renovar = confirm("La membresía de este cliente está vencida. ¿Deseas renovarla automáticamente junto con este pago?");
                }
            } catch(e) {}
        }
        
        return { id_cliente: cl, monto: mo, fecha_pago: fe, renovar };
    },
    (item) => {
        document.getElementById('p_cliente').value = item.id_cliente;
        document.getElementById('p_monto').value = item.monto;
        document.getElementById('p_fecha').value = item.fecha_pago.split('T')[0];
    },
    () => { document.getElementById('p_cliente').value=''; document.getElementById('p_monto').value=''; document.getElementById('p_fecha').value=''; }
);

// INIT
if (getToken()) {
    loadDashboard();
}

// Registro Público Intercept
document.addEventListener('DOMContentLoaded', () => {
    const formRegistro = document.getElementById('formRegistroPublico');
    if (formRegistro) {
        formRegistro.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btnRegistroPublico');
            const originalText = btn.innerText;
            btn.innerText = 'Registrando...';
            btn.disabled = true;
            
            const payload = {
                nombre: document.getElementById('regPublicoNombre').value,
                apellido_p: document.getElementById('regPublicoApP').value,
                apellido_m: document.getElementById('regPublicoApM').value,
                edad: document.getElementById('regPublicoEdad').value
            };
            
            try {
                const res = await fetch(API + '/publico/registro-cliente', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if (res.ok) {
                    showToast('¡Registro exitoso! Te esperamos en el gimnasio.', 'success');
                    formRegistro.reset();
                } else {
                    const data = await res.json();
                    showToast(data.error || 'Error al registrar', 'error');
                }
            } catch(error) {
                showToast('Error de conexión', 'error');
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    }
});
