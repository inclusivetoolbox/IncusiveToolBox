const STORAGE_KEY = 'cajah_utb_v3';
const CLOUDINARY_CLOUD  = 'dtxp7zvja';
const CLOUDINARY_PRESET = 'jrrd4gry';
let allResources = [];
let activeType = 'all';
let searchTerm = '';
let demoMode = false;
let loggedIn = false;
let currentTab = 'add';

document.getElementById('banner-date').textContent =
  new Date().toLocaleDateString('es-CO', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

function getConfig() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; } }
function setConfig(o) { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...getConfig(), ...o })); }

// ── DEMO ──────────────────────────────────────────────────
const DEMO_DATA = [
  { modulo:'Módulo 1 — Fundamentos de la Educación Inclusiva', titulo:'Introducción a la educación inclusiva', tipo:'PDF', link:'#', descripcion:'Conceptos base, historia y marcos normativos de la inclusión educativa en Colombia.' },
  { modulo:'Módulo 1 — Fundamentos de la Educación Inclusiva', titulo:'Política de inclusión MEN 2024', tipo:'Enlace', link:'#', descripcion:'Documento oficial del Ministerio de Educación Nacional sobre lineamientos de inclusión.' },
  { modulo:'Módulo 1 — Fundamentos de la Educación Inclusiva', titulo:'Clase inaugural — Bienvenida al diplomado', tipo:'Video', link:'#', descripcion:'Grabación de la sesión de apertura con presentación del equipo docente.' },
  { modulo:'Módulo 2 — Diseño Universal para el Aprendizaje', titulo:'Guía DUA — Pautas y principios', tipo:'PDF', link:'#', descripcion:'Guía completa sobre las tres pautas del Diseño Universal para el Aprendizaje.' },
  { modulo:'Módulo 2 — Diseño Universal para el Aprendizaje', titulo:'Plantilla de planeación inclusiva', tipo:'Plantilla', link:'#', descripcion:'Formato editable para diseñar clases aplicando los principios del DUA.' },
  { modulo:'Módulo 2 — Diseño Universal para el Aprendizaje', titulo:'Sesión 3 — Medios de representación', tipo:'Presentación', link:'#', descripcion:'Diapositivas de la tercera sesión sincrónica del módulo.' },
  { modulo:'Módulo 3 — Barreras y Apoyos en el Aprendizaje', titulo:'Identificación de barreras de aprendizaje', tipo:'PDF', link:'#', descripcion:'Tipos de barreras y estrategias de remoción.' },
  { modulo:'Módulo 3 — Barreras y Apoyos en el Aprendizaje', titulo:'Rúbrica de evaluación inclusiva', tipo:'Plantilla', link:'#', descripcion:'Instrumento para evaluar procesos sin sesgo.' },
  { modulo:'Módulo 4 — Evaluación y Seguimiento Inclusivo', titulo:'Diseño de evaluaciones flexibles', tipo:'Presentación', link:'#', descripcion:'Estrategias para construir evaluaciones accesibles y diferenciadas.' },
  { modulo:'Módulo 4 — Evaluación y Seguimiento Inclusivo', titulo:'Portafolio del estudiante — guía de uso', tipo:'PDF', link:'#', descripcion:'Metodología de portafolio como alternativa de evaluación formativa inclusiva.' },
];

function toggleDemo() {
  demoMode = !demoMode;
  const btn = document.getElementById('demo-btn');
  const ribbon = document.getElementById('demo-ribbon');
  if (demoMode) {
    btn.textContent = '✕ Salir del demo'; btn.classList.add('on');
    ribbon.classList.add('visible');
    allResources = DEMO_DATA;
    document.getElementById('stats-bar').style.display = 'flex';
    renderAll();
    document.getElementById('last-updated').textContent = 'Vista previa — datos de ejemplo';
  } else {
    btn.textContent = '👁 Ver demo'; btn.classList.remove('on');
    ribbon.classList.remove('visible');
    const cfg = getConfig();
    if (cfg.sheetUrl) loadData(cfg.sheetUrl);
    else {
      allResources = [];
      document.getElementById('stats-bar').style.display = 'none';
      document.getElementById('last-updated').textContent = '';
      document.getElementById('main-content').innerHTML = emptyState();
    }
  }
}

// ── CONFIG MODAL ──────────────────────────────────────────
function openConfigModal() {
  const pw = prompt('Contraseña para acceder a la configuración:');
  if (pw !== MASTER_PASSWORD) {
    if (pw !== null) alert('Contraseña incorrecta.');
    return;
  }
  const c = getConfig();
  document.getElementById('cfg-sheet-url').value = c.sheetUrl || '';
  document.getElementById('cfg-script-url').value = c.scriptUrl || '';
  document.getElementById('cfg-password').value = c.password || '';
  document.getElementById('config-modal').classList.add('open');
}
function closeConfigModal() { document.getElementById('config-modal').classList.remove('open'); }
function saveConfig() {
  const sheetUrl  = document.getElementById('cfg-sheet-url').value.trim();
  const scriptUrl = document.getElementById('cfg-script-url').value.trim();
  const password  = document.getElementById('cfg-password').value.trim();
  setConfig({ sheetUrl, scriptUrl, password });
  closeConfigModal();
  demoMode = false;
  document.getElementById('demo-btn').textContent = '👁 Ver demo';
  document.getElementById('demo-btn').classList.remove('on');
  document.getElementById('demo-ribbon').classList.remove('visible');
  if (sheetUrl) loadData(sheetUrl);
}

// ── DRAWER ────────────────────────────────────────────────
function openDrawer() {
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawer-overlay').classList.add('open');
  document.getElementById('upload-btn').classList.add('active');
  if (loggedIn) showForm();
}
function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawer-overlay').classList.remove('open');
  document.getElementById('upload-btn').classList.remove('active');
}

// ── CONTRASEÑA MAESTRA ────────────────────────────────────
const MASTER_PASSWORD = 'admin2026';

// ── LOGIN ─────────────────────────────────────────────────
function doLogin() {
  const val = document.getElementById('pw-input').value;
  if (val === MASTER_PASSWORD) {
    loggedIn = true;
    document.getElementById('pw-error').classList.remove('visible');
    showForm();
  } else {
    document.getElementById('pw-error').classList.add('visible');
    document.getElementById('pw-input').focus();
  }
}
function doLogout() {
  loggedIn = false;
  document.getElementById('pw-input').value = '';
  document.getElementById('login-panel').style.display = 'block';
  document.getElementById('upload-form').classList.remove('visible');
  document.getElementById('drawer-footer-login').style.display = 'flex';
  document.getElementById('drawer-footer-form').style.display = 'none';
  document.getElementById('drawer-subtitle').textContent = 'Acceso restringido';
}
function showForm() {
  document.getElementById('login-panel').style.display = 'none';
  document.getElementById('upload-form').classList.add('visible');
  document.getElementById('drawer-footer-login').style.display = 'none';
  document.getElementById('drawer-footer-form').style.display = 'flex';
  document.getElementById('drawer-subtitle').textContent = 'Sesión activa';
  const cfg = getConfig();
  document.getElementById('script-note').style.display = cfg.scriptUrl ? 'none' : 'block';
  switchTab(currentTab);
}

// ── TABS ──────────────────────────────────────────────────
function switchTab(tab) {
  currentTab = tab;
  document.getElementById('panel-add').style.display    = tab === 'add'    ? 'block' : 'none';
  document.getElementById('panel-delete').style.display = tab === 'delete' ? 'block' : 'none';
  document.getElementById('tab-add').className    = 'dtab' + (tab === 'add'    ? ' active' : '');
  document.getElementById('tab-delete').className = 'dtab' + (tab === 'delete' ? ' active danger' : '');
  document.getElementById('submit-btn').style.display = tab === 'add' ? 'flex' : 'none';
  if (tab === 'delete') renderDeleteList();
}

// ── CLOUDINARY UPLOAD ─────────────────────────────────────
async function uploadFile() {
  const input = document.getElementById('f-file');
  const file = input.files[0];
  if (!file) return;

  const btn = document.getElementById('upload-file-btn');
  const status = document.getElementById('upload-status');
  btn.disabled = true;
  btn.textContent = 'Subiendo...';
  status.textContent = '';
  status.className = '';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_PRESET);
  formData.append('folder', 'inclusive-toolbox');

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.secure_url) {
      document.getElementById('f-link').value = data.secure_url;
      // Auto-detectar tipo por extensión
      const ext = file.name.split('.').pop().toLowerCase();
      const tipoMap = { pdf:'PDF', mp4:'Video', mov:'Video', avi:'Video', pptx:'Presentación', ppt:'Presentación', docx:'Enlace', doc:'Enlace' };
      if (tipoMap[ext]) document.getElementById('f-tipo').value = tipoMap[ext];
      // Auto-rellenar título si está vacío
      if (!document.getElementById('f-titulo').value) {
        document.getElementById('f-titulo').value = file.name.replace(/\.[^/.]+$/, '');
      }
      status.textContent = '✓ Archivo subido — URL lista';
      status.className = 'upload-ok';
    } else {
      throw new Error(data.error?.message || 'Error desconocido');
    }
  } catch(e) {
    status.textContent = '✗ Error al subir: ' + e.message;
    status.className = 'upload-err';
  }
  btn.disabled = false;
  btn.textContent = '📎 Subir archivo';
  input.value = '';
}

// ── AGREGAR ───────────────────────────────────────────────
async function submitResource() {
  const modulo = document.getElementById('f-modulo').value.trim();
  const titulo = document.getElementById('f-titulo').value.trim();
  const tipo   = document.getElementById('f-tipo').value;
  const link   = document.getElementById('f-link').value.trim();
  const desc   = document.getElementById('f-desc').value.trim();

  if (!modulo || !titulo || !tipo || !link) {
    document.getElementById('form-error').textContent = 'Completa los campos obligatorios (*)';
    document.getElementById('form-error').classList.add('visible');
    return;
  }
  const cfg = getConfig();
  if (!cfg.scriptUrl) {
    document.getElementById('form-error').textContent = 'Falta configurar la URL del Apps Script en ⚙ Configurar.';
    document.getElementById('form-error').classList.add('visible');
    return;
  }
  document.getElementById('form-error').classList.remove('visible');
  document.getElementById('form-success').classList.remove('visible');
  const btn = document.getElementById('submit-btn');
  btn.disabled = true; btn.textContent = 'Enviando...';

  try {
    await fetch(cfg.scriptUrl, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action:'add', modulo, titulo, tipo, link, descripcion: desc })
    });
    document.getElementById('form-success').classList.add('visible');
    ['f-modulo','f-titulo','f-link','f-desc'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('f-tipo').value = '';
    if (cfg.sheetUrl && !demoMode) setTimeout(() => loadData(cfg.sheetUrl), 1800);
  } catch(e) {
    document.getElementById('form-error').textContent = 'Error de red. Verifica la URL del script.';
    document.getElementById('form-error').classList.add('visible');
  }
  btn.disabled = false; btn.textContent = '＋ Agregar recurso';
}

// ── ELIMINAR ──────────────────────────────────────────────
function renderDeleteList() {
  const q = (document.getElementById('del-search').value || '').toLowerCase();
  const source = demoMode ? DEMO_DATA : allResources;
  const el = document.getElementById('delete-list');

  if (!source.length) {
    el.innerHTML = '<p style="font-size:.8rem;color:var(--muted);text-align:center;padding:2rem 0">No hay recursos cargados todavía.</p>';
    return;
  }
  const filtered = source.filter(r =>
    !q || (r.titulo||'').toLowerCase().includes(q) || (r.modulo||'').toLowerCase().includes(q)
  );
  if (!filtered.length) {
    el.innerHTML = '<p style="font-size:.8rem;color:var(--muted);text-align:center;padding:1rem 0">Sin resultados.</p>';
    return;
  }
  const icons = { PDF:'📄', Video:'▶', Presentación:'📊', Enlace:'🔗', Plantilla:'📝' };
  el.innerHTML = filtered.map(r => {
    const idx = source.indexOf(r);
    const rowNum = idx + 2; // fila 1 = encabezado, datos desde fila 2
    return `<div class="delete-item" id="ditem-${idx}">
      <div class="delete-item-info">
        <div class="delete-item-title">${icons[r.tipo]||''} ${r.titulo}</div>
        <div class="delete-item-meta">${r.tipo} · ${r.modulo}</div>
      </div>
      <button class="btn-del" id="dbtn-${idx}" onclick="deleteResource(${idx},${rowNum})">Eliminar</button>
    </div>`;
  }).join('');
}

async function deleteResource(idx, rowNum) {
  if (!confirm('¿Eliminar este recurso? Esta acción no se puede deshacer.')) return;
  const cfg = getConfig();
  if (!cfg.scriptUrl) {
    document.getElementById('del-error').textContent = 'Falta configurar la URL del Apps Script en ⚙ Configurar.';
    document.getElementById('del-error').classList.add('visible');
    return;
  }
  document.getElementById('del-error').classList.remove('visible');
  document.getElementById('del-success').classList.remove('visible');
  const btn = document.getElementById('dbtn-' + idx);
  if (btn) { btn.disabled = true; btn.textContent = '...'; }

  try {
    await fetch(cfg.scriptUrl, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', row: rowNum })
    });
    document.getElementById('del-success').classList.add('visible');
    allResources.splice(idx, 1);
    renderDeleteList();
    if (cfg.sheetUrl && !demoMode) setTimeout(() => loadData(cfg.sheetUrl), 1800);
  } catch(e) {
    document.getElementById('del-error').textContent = 'Error de red al eliminar. Verifica la URL del script.';
    document.getElementById('del-error').classList.add('visible');
    if (btn) { btn.disabled = false; btn.textContent = 'Eliminar'; }
  }
}

// ── CARGA DE DATOS ────────────────────────────────────────
async function loadData(url) {
  const main = document.getElementById('main-content');
  main.innerHTML = '<div class="state-msg"><p style="font-size:1.5rem;margin-bottom:.75rem;opacity:.3">⟳</p><p>Cargando recursos...</p></div>';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const csv = await res.text();
    allResources = parseCSV(csv);
    renderAll();
    document.getElementById('last-updated').textContent =
      'Actualizado: ' + new Date().toLocaleString('es-CO', { dateStyle:'short', timeStyle:'short' });
  } catch(e) {
    main.innerHTML = '<div class="state-msg"><div class="icon">⚠</div><p>No se pudo cargar la hoja de recursos</p><p class="sub">Verifica la URL en ⚙ Configurar.</p><button class="empty-cta" onclick="openConfigModal()">Revisar configuración</button></div>';
  }
}

function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  return lines.slice(1).map(line => {
    const vals = parseCSVLine(line); const obj = {};
    headers.forEach((h, i) => obj[h] = (vals[i] || '').trim().replace(/^"|"$/g, ''));
    return obj;
  }).filter(r => r.titulo && r.link);
}
function parseCSVLine(line) {
  const result = []; let cur = ''; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; }
    else if (c === ',' && !inQ) { result.push(cur); cur = ''; }
    else { cur += c; }
  }
  result.push(cur); return result;
}

// ── RENDER ────────────────────────────────────────────────
function renderAll() {
  const filtered = allResources.filter(r => {
    const mt = activeType === 'all' || r.tipo === activeType;
    const ms = !searchTerm ||
      (r.titulo||'').toLowerCase().includes(searchTerm) ||
      (r.descripcion||'').toLowerCase().includes(searchTerm) ||
      (r.modulo||'').toLowerCase().includes(searchTerm);
    return mt && ms;
  });

  document.getElementById('stats-bar').style.display = 'flex';
  document.getElementById('stat-total').textContent = allResources.length;
  document.getElementById('stat-modules').textContent = [...new Set(allResources.map(r => r.modulo).filter(Boolean))].length;
  document.getElementById('stat-pdfs').textContent   = allResources.filter(r => r.tipo === 'PDF').length;
  document.getElementById('stat-videos').textContent = allResources.filter(r => r.tipo === 'Video').length;
  document.getElementById('stat-otros').textContent  = allResources.filter(r => !['PDF','Video'].includes(r.tipo)).length;

  const main = document.getElementById('main-content');
  if (!filtered.length) { main.innerHTML = '<div class="no-results">No se encontraron recursos con ese filtro.</div>'; return; }

  const byModule = {};
  filtered.forEach(r => { const m = r.modulo || 'Sin módulo'; if (!byModule[m]) byModule[m] = []; byModule[m].push(r); });
  let n = 1;
  main.innerHTML = Object.entries(byModule).map(([mod, items]) => `
    <div class="module-section">
      <div class="module-header">
        <span class="module-pill">${String(n++).padStart(2,'0')}</span>
        <span class="module-name">${mod}</span>
        <div class="module-line"></div>
        <span class="module-count">${items.length} recurso${items.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="cards-grid">${items.map(cardHTML).join('')}</div>
    </div>`).join('');
}

function cardHTML(r) {
  const tipo = r.tipo || 'Enlace';
  const link = (r.link || '#').replace(/"/g, '');
  const icons = { PDF:'📄', Video:'▶', Presentación:'📊', Enlace:'🔗', Plantilla:'📝' };
  const isDemo = link === '#';
  return `<a class="card" href="${link}" ${isDemo ? '' : 'target="_blank" rel="noopener"'} data-type="${tipo}">
    <div class="card-accent"></div>
    <div class="card-top">
      <span class="type-pill ${tipo}">${icons[tipo]||''} ${tipo}</span>
      <span class="card-arrow">↗</span>
    </div>
    <div class="card-title">${r.titulo||''}</div>
    ${r.descripcion ? `<div class="card-desc">${r.descripcion}</div>` : ''}
    <div class="card-footer"><span class="open-btn">${isDemo ? 'Ejemplo de recurso' : 'Abrir recurso →'}</span></div>
  </a>`;
}

function emptyState() {
  return '<div class="state-msg"><div class="icon">📦</div><p>Conecta tu Google Sheet para cargar los recursos</p><p class="sub">Haz clic en "Configurar" para comenzar</p><button class="empty-cta" onclick="openConfigModal()">Conectar Google Sheet →</button></div>';
}

// ── EVENTOS ───────────────────────────────────────────────
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeType = btn.dataset.type;
    if (allResources.length) renderAll();
  });
});
document.getElementById('search').addEventListener('input', e => {
  searchTerm = e.target.value.toLowerCase();
  if (allResources.length) renderAll();
});
document.getElementById('config-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('config-modal')) closeConfigModal();
});

// ── INIT ──────────────────────────────────────────────────
const DEFAULT_SHEET  = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRmjIRZ29CazcflZEESEjA1Z-qqEV5je3u5nTL_lUO4aa4nR3j-JUEquR9rSD2gfpSbeZkZkNrnM5lm/pub?gid=0&single=true&output=csv';
const DEFAULT_SCRIPT = 'https://script.google.com/macros/s/AKfycbzDasfteBeG521tlxKiFOKVQ8j2M7vvK-7nnSgqJ7Q1ptg9ppU3aTZnELh-E2Bwd5MOYA/exec';

const _cfg = getConfig();
loadData(_cfg.sheetUrl || DEFAULT_SHEET);
if (!_cfg.scriptUrl) setConfig({ scriptUrl: DEFAULT_SCRIPT });