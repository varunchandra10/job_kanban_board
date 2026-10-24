// Global fetch interceptor to inject Authorization header for multi-user support
(function() {
  if (window.__fetchAuthInjected) return;
  window.__fetchAuthInjected = true;
  const _origFetch = window.fetch;
  window.fetch = function(url, options = {}) {
    const token = localStorage.getItem('auth_token');
    if (token && typeof url === 'string' && (url.startsWith('/api') || url.includes('/api/'))) {
      options.headers = options.headers || {};
      if (options.headers instanceof Headers) {
        if (!options.headers.has('Authorization')) {
          options.headers.set('Authorization', 'Bearer ' + token);
        }
      } else if (Array.isArray(options.headers)) {
        if (!options.headers.some(([k]) => k.toLowerCase() === 'authorization')) {
          options.headers.push(['Authorization', 'Bearer ' + token]);
        }
      } else {
        if (!options.headers['Authorization'] && !options.headers['authorization']) {
          options.headers['Authorization'] = 'Bearer ' + token;
        }
      }
    }
    return _origFetch.call(this, url, options);
  };
})();


function showConfirmDialog({ title, text, icon, confirmText = 'Confirm', confirmCls = 'primary', cancelText = 'Cancel', onConfirm }) {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-modal-overlay';
  overlay.style.zIndex = '99999';
  overlay.innerHTML = `
    <div class="confirm-modal-box">
      ${icon ? `<div class="confirm-modal-icon ${confirmCls === 'danger' ? '' : 'info-icon'}">${icon}</div>` : ''}
      <h3>${esc(title)}</h3>
      <p>${esc(text)}</p>
      <div class="confirm-modal-actions">
        <button type="button" class="btn sm" id="dialogCancelBtn">${esc(cancelText)}</button>
        <button type="button" class="btn sm ${confirmCls}" id="dialogConfirmBtn">${esc(confirmText)}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector('#dialogCancelBtn').onclick = close;
  overlay.onclick = e => { if (e.target === overlay) close(); };
  overlay.querySelector('#dialogConfirmBtn').onclick = () => {
    close();
    if (onConfirm) onConfirm();
  };
}

/* ----- Clean Inline SVG Icon Dictionary ----- */
const ICON = {
  briefcase: `<svg class="icon" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  landmark:  `<svg class="icon" viewBox="0 0 24 24"><path d="M2 20h20M4 20v-7M8 20v-7M12 20v-7M16 20v-7M20 20v-7M12 4L2 9h20l-10-5z"/></svg>`,
  beaker:    `<svg class="icon" viewBox="0 0 24 24"><path d="M10 2v7.31L4.65 19.3A2 2 0 0 0 6.4 22h11.2a2 2 0 0 0 1.75-2.7L14 9.31V2M8.5 2h7M7 16h10"/></svg>`,
  calendar:  `<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
  pin:       `<svg class="icon" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  applied:   `<svg class="icon" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>`,
  interview: `<svg class="icon" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  offer:     `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>`,
  rejected:  `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>`,
  clock:     `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  alert:     `<svg class="icon" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/></svg>`,
  key:       `<svg class="icon" viewBox="0 0 24 24"><path d="M21 2l-2 2m-1.5 1.5L14 9a5 5 0 1 1-2.5-2.5l3.5-3.5 2 2 1.5-1.5 2 2z"/></svg>`,
  lock:      `<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  copy:      `<svg class="icon" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  mail:      `<svg class="icon" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  document:  `<svg class="icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>`,
  check:     `<svg class="icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
  eye:       `<svg class="icon" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeOff:    `<svg class="icon" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
  note:      `<svg class="icon" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  upload:    `<svg class="icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>`,
  external:  `<svg class="icon" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>`,
  folder:    `<svg class="icon" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  maximize:  `<svg class="icon" viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>`,
  minimize:  `<svg class="icon" viewBox="0 0 24 24"><path d="M4 14h6m0 0v6m0-6L3 21M20 10h-6m0 0V4m0 6l7-7"/></svg>`,
  zoomIn:    `<svg class="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`,
  zoomOut:   `<svg class="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`,
  gdrive:   `<svg class="icon gdrive-icon" viewBox="0 0 87.3 78"><path d="m6.6 66.85 3.85 6.65c.8 1.4 1.9 2.5 3.2 3.3l16.3-28.25-8.25-14.3-15.1 26.1c-1.3 2.25-1.3 5 0 7.25z" fill="#0066da"/><path d="m43.65 25-16.3 28.25h32.6l16.3-28.25-8.25-14.3h-24.35z" fill="#00ac47"/><path d="m73.55 76.8c1.3-.8 2.4-1.9 3.2-3.3l3.85-6.65c1.3-2.25 1.3-5 0-7.25l-15.1-26.1-8.25 14.3 16.3 28.25z" fill="#ea4335"/><path d="m43.65 25-16.3 28.25-16.3 23.55c1.3.8 2.7 1.2 4.2 1.2h56.8c1.5 0 2.9-.4 4.2-1.2z" fill="#ffba00"/></svg>`,
  filePdf:   `<svg class="icon" viewBox="0 0 24 24" style="color:#dc2626"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>`,
  fileWord:  `<svg class="icon" viewBox="0 0 24 24" style="color:#2563eb"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 13 10.5 17 12 14 13.5 17 15 13"/></svg>`,
  refresh:   `<svg class="icon" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`
};

const STAGES = ['Applied', 'Interviewing', 'Offer', 'Rejected'];
const DOT = { Applied: '#2563eb', Interviewing: '#d97706', Offer: '#059669', Rejected: '#dc2626' };
const STAGE_ICON = { Applied: ICON.applied, Interviewing: ICON.interview, Offer: ICON.offer, Rejected: ICON.rejected };
const STAGE_ACCENT = { Applied: 'var(--applied-clr)', Interviewing: 'var(--interview-clr)', Offer: 'var(--offer-clr)', Rejected: 'var(--rejected-clr)' };

const COUNTRIES = `US|United States,GB|United Kingdom,SG|Singapore,DE|Germany,IN|India,CA|Canada,AU|Australia,NL|Netherlands,CH|Switzerland,SE|Sweden,FR|France,IE|Ireland,JP|Japan,KR|South Korea,CN|China,HK|Hong Kong,AE|United Arab Emirates,ES|Spain,IT|Italy,PL|Poland,NO|Norway,DK|Denmark,FI|Finland,BE|Belgium,AT|Austria,PT|Portugal,IL|Israel,BR|Brazil,MX|Mexico,NZ|New Zealand,ZA|South Africa,TW|Taiwan,MY|Malaysia,ID|Indonesia,TH|Thailand,VN|Vietnam,PH|Philippines,SA|Saudi Arabia,TR|Turkey,AR|Argentina,CL|Chile,CZ|Czechia`.split(',').map(x=>x.split('|'));
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const cname = c => (COUNTRIES.find(x => x[0] === c) || [c, c])[1];
const ccode = c => c === 'GB' ? 'UK' : (c || '');
const cbadge = c => c ? `<span class="cc-badge">${ccode(c)}</span>` : '';
const clabel = c => c ? `${cbadge(c)} ${cname(c)}` : '';

const fmt = d => { const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(d || ''); return m ? `${MON[+m[2]-1]} ${+m[3]}, ${m[1]}` : ''; };
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $ = (s, r = document) => r.querySelector(s);
const api = (m, u, b) => fetch('/api' + u, { method: m, headers: { 'content-type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }).then(r => r.json());

let S = { apps: [], roles: [], companies: [], settings: {} }, LOGOS = {}, openId = null, adding = false, dragId = null, currentSec = 'All', searchQuery = '';

/* ----- Tags Palette (Clean Muted Light Hues) ----- */
const TAG_PALETTE = [
  { id: 'blue',   color: '#2563eb', bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  { id: 'emerald',color: '#059669', bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
  { id: 'amber',  color: '#d97706', bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  { id: 'rose',   color: '#dc2626', bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  { id: 'purple', color: '#7c3aed', bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' },
  { id: 'slate',  color: '#475569', bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' },
];

function parseTag(raw) {
  const parts = String(raw || '').trim().split(/[:|]/);
  const name = parts[0].trim();
  if (!name) return null;
  const clr = parts[1]?.trim();
  let item = TAG_PALETTE.find(p => p.color.toLowerCase() === clr?.toLowerCase() || p.id === clr?.toLowerCase());
  if (!item) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash << 5) - hash + name.charCodeAt(i);
    item = TAG_PALETTE[Math.abs(hash) % TAG_PALETTE.length];
  }
  return { name, color: item.color, bg: item.bg, text: item.text, border: item.border, raw: `${name}:${item.color}` };
}

function getAppTags(a) {
  if (!a.custom_tags) return [];
  return a.custom_tags.split(',').map(parseTag).filter(Boolean);
}

/* ----- Company Logos ----- */
const GOOGLE = `<svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.8 3.6-4.9 6.7-4.9z"/></svg>`;
const MSFT = `<svg width="15" height="15" viewBox="0 0 24 24"><path fill="#F25022" d="M1 1h10.5v10.5H1z"/><path fill="#7FBA00" d="M12.5 1H23v10.5H12.5z"/><path fill="#00A4EF" d="M1 12.5h10.5V23H1z"/><path fill="#FFB900" d="M12.5 12.5H23V23H12.5z"/></svg>`;

function logo(name, sz = 32) {
  const s = String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
  let inner;
  if (s === 'google') inner = GOOGLE;
  else if (s === 'microsoft') inner = MSFT;
  else if (LOGOS[s]) inner = `<svg width="16" height="16" viewBox="0 0 24 24"><path fill="#${LOGOS[s].h}" d="${LOGOS[s].p}"/></svg>`;
  else return `<div class="logo fb" style="width:${sz}px;height:${sz}px">${esc((name || '?')[0].toUpperCase())}</div>`;
  return `<div class="logo" style="width:${sz}px;height:${sz}px">${inner}</div>`;
}

/* ----- Autosave ----- */
const pending = {};
let savedT;
function queue(key, fn, ms = 500) {
  clearTimeout(pending[key]?.t);
  $('#saved').classList.remove('on');
  pending[key] = { fn, t: setTimeout(() => run(key), ms) };
}
async function run(key) {
  const p = pending[key];
  if (!p) return;
  delete pending[key];
  clearTimeout(p.t);
  await p.fn();
  if (!Object.keys(pending).length) {
    $('#saved').classList.add('on');
    clearTimeout(savedT);
    savedT = setTimeout(() => $('#saved').classList.remove('on'), 1500);
  }
}
const flush = () => Promise.all(Object.keys(pending).map(run));
addEventListener('beforeunload', () => { Object.values(pending).forEach(p => p.fn()); });

/* ----- Combobox ----- */
function combo(input, items, pick) {
  const box = document.createElement('div');
  box.className = 'dd';
  input.parentNode.style.position = 'relative';
  input.parentNode.appendChild(box);

  const show = () => {
    const it = items(input.value);
    box._it = it;
    box.innerHTML = it.map((x, i) => `<div class="opt" data-i="${i}">${x.html}</div>`).join('');
    box.style.display = it.length ? 'block' : 'none';
  };
  input.addEventListener('input', show);
  input.addEventListener('focus', () => { input.select?.(); show(); });
  input.addEventListener('blur', () => setTimeout(() => box.style.display = 'none', 140));
  box.addEventListener('mousedown', e => {
    const o = e.target.closest('.opt');
    if (!o) return;
    e.preventDefault();
    pick(box._it[o.dataset.i]);
    box.style.display = 'none';
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && box.style.display === 'block') {
      e.preventDefault();
      pick(box._it[0]);
      box.style.display = 'none';
    }
  });
}

function countryField(input, get, set) {
  input.value = cname(get()) || '';
  combo(input, q => {
    const cur = get();
    const all = cur && q === cname(cur);
    const n = q.toLowerCase().replace(/[^\p{L}]/gu, '');
    return COUNTRIES.filter(c => all || !n || c[1].toLowerCase().includes(n) || c[0].toLowerCase() === n).slice(0, 12).map(c => ({
      c: c[0],
      html: `${cbadge(c[0])} <span style="font-weight:500">${esc(c[1])}</span>`
    }));
  }, it => {
    set(it.c);
    input.value = cname(it.c);
  });
  input.addEventListener('blur', () => { setTimeout(() => input.value = cname(get()) || '', 150); });
}

function companyField(input, onPick) {
  combo(input, q => {
    const n = q.trim().toLowerCase();
    if (!n) return [];
    const m = S.companies.filter(c => c.name.toLowerCase().includes(n))
      .sort((a,b) => a.name.toLowerCase().startsWith(n) ? -1 : b.name.toLowerCase().startsWith(n) ? 1 : 0)
      .slice(0, 7)
      .map(c => ({ c, html: `${logo(c.name, 22)}<span>${esc(c.name)}</span><small>${esc(c.city)}, ${ccode(c.country)}</small>` }));
    if (!S.companies.some(c => c.name.toLowerCase() === n)) {
      m.push({ c: { name: q.trim() }, html: `<span>Use &ldquo;${esc(q.trim())}&rdquo;</span>` });
    }
    return m;
  }, it => onPick(it.c));
}

/* ----- State & Visibility ----- */
const secApps = () => (currentSec === 'All' || currentSec === 'Calendar') ? S.apps : S.apps.filter(a => (a.category || 'Industry') === currentSec);
const present = () => {
  const m = {};
  secApps().forEach(a => { if (a.country) m[a.country] = (m[a.country] || 0) + 1; });
  return m;
};
const activeFilter = () => {
  const p = present();
  return S.filter.filter(c => p[c]);
};
const vis = a => {
  if (currentSec !== 'All' && currentSec !== 'Calendar' && (a.category || 'Industry') !== currentSec) return false;
  const f = activeFilter();
  if (f.length && !f.includes(a.country)) return false;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    const str = `${a.company || ''} ${a.role || ''} ${a.city || ''} ${a.recruiter_notes || ''} ${a.portal_notes || ''} ${a.looking_for || ''} ${a.jd || ''} ${a.custom_tags || ''}`.toLowerCase();
    if (!str.includes(q)) return false;
  }
  return true;
};
const stageApps = s => S.apps.filter(a => a.stage === s).sort((a,b) => a.position - b.position);

/* ----- Calendar View ----- */
let calCurrent = new Date();
let calLearningsList = [];
let isFetchingLearnings = false;

async function ensureCalLearnings() {
  if (calLearningsList.length === 0 && !isFetchingLearnings) {
    isFetchingLearnings = true;
    try {
      const data = await api('GET', '/learnings');
      if (Array.isArray(data)) calLearningsList = data;
    } catch (e) {
      console.warn('Could not load learnings for calendar', e);
    } finally {
      isFetchingLearnings = false;
    }
  }
}

async function renderCalendar() {
  const board = $('#board');
  board.className = 'cal-mode';
  board.innerHTML = '';

  ensureCalLearnings().then(() => {
    // If learnings came after initial sync, re-render once
    const pills = board.querySelectorAll('.n-cal-pill.learning');
    if (pills.length === 0 && calLearningsList.length > 0) {
      renderCalendar();
    }
  });

  const yr = calCurrent.getFullYear(), mo = calCurrent.getMonth();
  const firstDay = new Date(yr, mo, 1).getDay();
  const daysInMo = new Date(yr, mo + 1, 0).getDate();
  const daysInPrev = new Date(yr, mo, 0).getDate();
  const moName = ['January','February','March','April','May','June','July','August','September','October','November','December'][mo];

  const calBox = document.createElement('div');
  calBox.className = 'nordic-cal-box';
  calBox.innerHTML = `
    <div class="n-cal-head">
      <div class="n-cal-title-wrap">
        <div class="n-cal-title">
          ${ICON.calendar}
          <span>${moName} ${yr} Calendar</span>
        </div>
        <div class="n-cal-sub">Applied jobs, deadlines, and daily learnings mapped to each day</div>
      </div>
      <div class="n-cal-controls">
        <div class="n-cal-legend">
          <span class="n-cal-pill job" style="cursor:default">💼 Applied</span>
          <span class="n-cal-pill deadline" style="cursor:default">⏰ Deadline</span>
          <span class="n-cal-pill learning" style="cursor:default">⚡ Learning</span>
        </div>
        <div class="cal-nav">
          <button class="btn icon-only" id="calPrev" title="Previous Month">&lsaquo;</button>
          <button class="btn" id="calToday" style="font-size:12px;padding:4px 10px;font-weight:600">Today</button>
          <button class="btn icon-only" id="calNext" title="Next Month">&rsaquo;</button>
        </div>
      </div>
    </div>
    <div class="n-cal-grid" id="calGrid"></div>
  `;
  board.appendChild(calBox);

  const grid = calBox.querySelector('#calGrid');
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
    const dh = document.createElement('div');
    dh.className = 'n-day-head';
    dh.textContent = d;
    grid.appendChild(dh);
  });

  const nowStr = today();
  const toYMD = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const pday = daysInPrev - i;
    const cell = document.createElement('div');
    cell.className = 'n-cal-cell other-month';
    cell.style.opacity = '0.38';
    cell.innerHTML = `<div class="n-cell-top"><span class="n-cell-num">${pday}</span></div>`;
    grid.appendChild(cell);
  }

  const activeLearnings = (typeof learningsList !== 'undefined' && learningsList.length) ? learningsList : calLearningsList;

  // Days in current month
  for (let d = 1; d <= daysInMo; d++) {
    const dateStr = toYMD(yr, mo, d);
    const isToday = (dateStr === nowStr);
    const cell = document.createElement('div');
    cell.className = `n-cal-cell ${isToday ? 'is-today' : ''}`;

    const dueApps = S.apps.filter(a => a.deadline === dateStr);
    const appliedApps = S.apps.filter(a => a.date_applied === dateStr);
    const dayLearnings = activeLearnings.filter(l => (l.date_logged || '').slice(0, 10) === dateStr);

        let pillsHtml = '';
    appliedApps.forEach(a => {
      pillsHtml += `<div class="n-cal-pill job" data-id="${a.id}" title="Applied: ${esc(a.company)}${a.role ? ' - ' + esc(a.role) : ''}"><span class="n-cal-icon">💼</span><span class="n-cal-text">${esc(a.company)}${a.role ? ' · ' + esc(a.role) : ''}</span></div>`;
    });
    dueApps.forEach(a => {
      pillsHtml += `<div class="n-cal-pill deadline" data-id="${a.id}" title="Deadline: ${esc(a.company)}"><span class="n-cal-icon">⏰</span><span class="n-cal-text">${esc(a.company)} Due</span></div>`;
    });
    dayLearnings.forEach(l => {
      pillsHtml += `<div class="n-cal-pill learning" data-lid="${l.id}" title="Learning: ${esc(l.title)}"><span class="n-cal-icon">⚡</span><span class="n-cal-text">${esc(l.title)} (${l.duration_minutes || l.duration_mins || 30}m)</span></div>`;
    });

    cell.innerHTML = `
      <div class="n-cell-top">
        <span class="n-cell-num">${d}</span>
        ${isToday ? '<span class="n-today-badge">TODAY</span>' : ''}
      </div>
      <div class="n-cal-pills-wrap">
        ${pillsHtml}
      </div>
    `;

    // Clicking empty space in day cell prompts to add application with this date prefilled
    cell.addEventListener('click', (e) => {
      if (e.target.closest('.n-cal-pill')) return;
      openAddModal(dateStr);
    });

    grid.appendChild(cell);
  }

  // Next month leading days
  const totalCells = firstDay + daysInMo;
  const rem = (7 - (totalCells % 7)) % 7;
  for (let d = 1; d <= rem; d++) {
    const cell = document.createElement('div');
    cell.className = 'n-cal-cell other-month';
    cell.style.opacity = '0.38';
    cell.innerHTML = `<div class="n-cell-top"><span class="n-cell-num">${d}</span></div>`;
    grid.appendChild(cell);
  }

  $('#calPrev').onclick = () => { calCurrent.setMonth(calCurrent.getMonth() - 1); renderCalendar(); };
  $('#calNext').onclick = () => { calCurrent.setMonth(calCurrent.getMonth() + 1); renderCalendar(); };
  $('#calToday').onclick = () => { calCurrent = new Date(); renderCalendar(); };

  grid.querySelectorAll('.n-cal-pill.job, .n-cal-pill.deadline').forEach(pill => {
    pill.onclick = (e) => {
      e.stopPropagation();
      openApp(+pill.dataset.id);
    };
  });

  grid.querySelectorAll('.n-cal-pill.learning').forEach(pill => {
    pill.onclick = (e) => {
      e.stopPropagation();
      const lid = +pill.dataset.lid;
      if (typeof window.openLearningModal === 'function') {
        window.openLearningModal(lid);
      } else {
        window.location.href = `/learnings.html?edit=${lid}`;
      }
    };
  });
}


/* ----- Stats Dashboard ----- */
function openStatsPanel() {
  const apps = S.apps;
  const total = apps.length;
  const appliedCount = apps.filter(a => a.stage === 'Applied').length;
  const interviewCount = apps.filter(a => a.stage === 'Interviewing').length;
  const offerCount = apps.filter(a => a.stage === 'Offer').length;
  const rejectCount = apps.filter(a => a.stage === 'Rejected').length;
  const activePipeline = appliedCount + interviewCount;

  const offerRate = total ? ((offerCount / total) * 100).toFixed(1) : '0.0';
  const rejectRate = total ? ((rejectCount / total) * 100).toFixed(1) : '0.0';

  const weekMap = {};
  apps.forEach(a => {
    if (!a.date_applied) return;
    const d = new Date(a.date_applied);
    if (isNaN(d)) return;
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const wkLabel = `${MON[monday.getMonth()]} ${monday.getDate()}`;
    weekMap[wkLabel] = (weekMap[wkLabel] || 0) + 1;
  });
  const weekEntries = Object.entries(weekMap).slice(-6);
  const maxWk = Math.max(...Object.values(weekMap), 1);

  const countryMap = {};
  apps.forEach(a => { if (a.country) countryMap[a.country] = (countryMap[a.country] || 0) + 1; });
  const sortedCountries = Object.entries(countryMap).sort((a,b) => b[1] - a[1]).slice(0, 6);
  const maxCountry = Math.max(...Object.values(countryMap), 1);

  const catMap = { Industry: 0, Government: 0, Research: 0 };
  apps.forEach(a => { const c = a.category || 'Industry'; catMap[c] = (catMap[c] || 0) + 1; });

  const roleMap = {};
  apps.forEach(a => { if (a.role) roleMap[a.role] = (roleMap[a.role] || 0) + 1; });
  const sortedRoles = Object.entries(roleMap).sort((a,b) => b[1] - a[1]).slice(0, 5);
  const maxRole = Math.max(...Object.values(roleMap), 1);

  const html = `
    <h4>Overview & Funnel</h4>
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">Total Applications</span>
        <span class="stat-num">${total}</span>
      </div>
      <div class="stat-card accent">
        <span class="stat-label">Active Pipeline</span>
        <span class="stat-num" style="color:var(--accent)">${activePipeline}<small>in progress</small></span>
      </div>
      <div class="stat-card offer">
        <span class="stat-label">Offer Rate</span>
        <span class="stat-num" style="color:var(--offer-clr)">${offerRate}%<small>(${offerCount})</small></span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Rejection Rate</span>
        <span class="stat-num" style="color:var(--rejected-clr)">${rejectRate}%<small>(${rejectCount})</small></span>
      </div>
    </div>

    <div class="chart-box">
      <h5>Stage Breakdown <span>${total} total</span></h5>
      <div class="chart-row">
        <span class="chart-lbl">${ICON.applied} Applied</span>
        <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:${total ? (appliedCount/total*100) : 0}%;background:var(--applied-clr)"></div></div>
        <span class="chart-val">${appliedCount}</span>
      </div>
      <div class="chart-row">
        <span class="chart-lbl">${ICON.interview} Interviewing</span>
        <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:${total ? (interviewCount/total*100) : 0}%;background:var(--interview-clr)"></div></div>
        <span class="chart-val">${interviewCount}</span>
      </div>
      <div class="chart-row">
        <span class="chart-lbl">${ICON.offer} Offer</span>
        <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:${total ? (offerCount/total*100) : 0}%;background:var(--offer-clr)"></div></div>
        <span class="chart-val">${offerCount}</span>
      </div>
      <div class="chart-row">
        <span class="chart-lbl">${ICON.rejected} Rejected</span>
        <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:${total ? (rejectCount/total*100) : 0}%;background:var(--rejected-clr)"></div></div>
        <span class="chart-val">${rejectCount}</span>
      </div>
    </div>

    ${weekEntries.length ? `
    <div class="chart-box">
      <h5>Weekly Velocity</h5>
      ${weekEntries.map(([wk, cnt]) => `
        <div class="chart-row">
          <span class="chart-lbl">${wk}</span>
          <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:${(cnt/maxWk*100)}%;background:var(--accent)"></div></div>
          <span class="chart-val">${cnt}</span>
        </div>
      `).join('')}
    </div>` : ''}

    ${sortedCountries.length ? `
    <div class="chart-box">
      <h5>Top Locations</h5>
      ${sortedCountries.map(([c, cnt]) => `
        <div class="chart-row">
          <span class="chart-lbl">${cbadge(c)} ${cname(c)}</span>
          <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:${(cnt/maxCountry*100)}%;background:#0284c7"></div></div>
          <span class="chart-val">${cnt}</span>
        </div>
      `).join('')}
    </div>` : ''}

    ${sortedRoles.length ? `
    <div class="chart-box">
      <h5>Top Target Roles</h5>
      ${sortedRoles.map(([r, cnt]) => `
        <div class="chart-row">
          <span class="chart-lbl" title="${esc(r)}">${esc(r)}</span>
          <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:${(cnt/maxRole*100)}%;background:var(--offer-clr)"></div></div>
          <span class="chart-val">${cnt}</span>
        </div>
      `).join('')}
    </div>` : ''}

    <div class="chart-box">
      <h5>Sector Distribution</h5>
      <div class="chart-row">
        <span class="chart-lbl">${ICON.briefcase} Industry</span>
        <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:${total ? (catMap.Industry/total*100) : 0}%;background:var(--accent)"></div></div>
        <span class="chart-val">${catMap.Industry}</span>
      </div>
      <div class="chart-row">
        <span class="chart-lbl">${ICON.landmark} Government</span>
        <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:${total ? (catMap.Government/total*100) : 0}%;background:#0891b2"></div></div>
        <span class="chart-val">${catMap.Government}</span>
      </div>
      <div class="chart-row">
        <span class="chart-lbl">${ICON.beaker} Research</span>
        <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:${total ? (catMap.Research/total*100) : 0}%;background:#7c3aed"></div></div>
        <span class="chart-val">${catMap.Research}</span>
      </div>
    </div>
  `;

  openPanel('Applications Analytics', html);
}

/* ----- Email Outreach Templates ----- */
function generateEmailTemplates(a, P) {
  const myName = P?.full_name || 'Candidate';
  const myEmail = P?.email || '';
  const mySchool = P?.school ? ` at ${P.school}` : '';
  const myDegree = P?.degree ? `${P.degree} student${mySchool}` : `student${mySchool}`;
  const company = a.company || 'your organization';
  const role = a.role || 'Internship';
  const recruiter = a.recruiter_name || 'Hiring Team';
  const dateApplied = fmt(a.date_applied) || 'recently';

  return {
    cold: {
      title: 'Cold Outreach',
      subject: `Application for ${role} position - ${myName}`,
      body: `Dear ${recruiter},

I hope this email finds you well.

I am writing to express my strong interest in the ${role} position at ${company}. As a ${myDegree}, I have closely followed ${company}'s work and admire your team's technical impact.

My background aligns well with the key requirements of the role, and I would welcome the opportunity to bring my skills to your projects. I have submitted my formal application through your portal and attached my resume here for your review.

Thank you very much for your time and consideration.

Best regards,
${myName}
${myEmail}`
    },
    followup: {
      title: '14-Day Follow-Up',
      subject: `Following up on ${role} Application - ${myName}`,
      body: `Dear ${recruiter},

I hope you are having a productive week.

I am following up on my application for the ${role} role at ${company}, which I submitted on ${dateApplied}.

I remain enthusiastically interested in the opportunity to join ${company}. Please let me know if there are any additional portfolio links, project samples, or details I can provide to support my application review.

Thank you for your continued time and consideration.

Warm regards,
${myName}
${myEmail}`
    },
    thankyou: {
      title: 'Interview Thank-You',
      subject: `Thank you - ${role} Interview - ${myName}`,
      body: `Dear ${recruiter},

Thank you very much for taking the time to speak with me today regarding the ${role} opportunity at ${company}.

I truly enjoyed learning more about the team's ongoing initiatives and upcoming roadmap. Our discussion further reinforced my excitement about joining ${company} and contributing to these goals.

Please feel free to reach out if you need any additional references or follow-up details. I look forward to the next steps!

Best regards,
${myName}
${myEmail}`
    },
    offer: {
      title: 'Offer Negotiation',
      subject: `${role} Offer Details - ${myName}`,
      body: `Dear ${recruiter},

Thank you so much for extending the offer to join ${company} as a ${role}! I am thrilled about the opportunity to work with the team.

I am currently reviewing the terms of the offer. Before finalizing my decision, I would appreciate the opportunity to discuss a few details regarding the compensation structure and start date flexibility.

Would you be open to a brief 10-minute call this week to review?

Thank you once again for your support throughout this process.

Best regards,
${myName}
${myEmail}`
    }
  };
}

let activeMobileStage = 'Applied';

/* ----- Main Render ----- */
function render() {
  const stageBar = $('#stagePickerBar');
  if (stageBar) {
    stageBar.style.display = (currentSec === 'Calendar') ? 'none' : '';
  }
  const stageSel = $('#stageSelect');
  if (stageSel) {
    stageSel.innerHTML = STAGES.map(st => `<option value="${st}" ${st === activeMobileStage ? 'selected' : ''}>${st}</option>`).join('');
    stageSel.value = activeMobileStage;
    const dot = $('#stagePickerDot');
    if (dot) dot.style.background = DOT[activeMobileStage] || 'var(--applied-clr)';
    const badge = $('#stageCountBadge');
    if (badge) {
      const curCnt = stageApps(activeMobileStage).filter(vis).length;
      badge.textContent = curCnt;
    }
  }

  // Synchronize Mobile Segmented Tabs
  document.querySelectorAll('.mobile-stage-tabs .stage-tab').forEach(t => {
    const st = t.dataset.stage;
    const cnt = stageApps(st).filter(vis).length;
    t.classList.toggle('active', st === activeMobileStage);
    const badge = t.querySelector('.tab-count');
    if (badge) badge.textContent = cnt;
  });
  const cAll = S.apps.length;
  const cInd = S.apps.filter(a => (a.category || 'Industry') === 'Industry').length;
  const cGov = S.apps.filter(a => a.category === 'Government').length;
  const cRes = S.apps.filter(a => a.category === 'Research').length;

  $('#sc-All').textContent = cAll;
  $('#sc-Industry').textContent = cInd;
  $('#sc-Government').textContent = cGov;
  $('#sc-Research').textContent = cRes;
  document.querySelectorAll('#secBar .sec-btn').forEach(b => b.classList.toggle('active', b.dataset.s === currentSec));

  const f = activeFilter();
  const shown = S.apps.filter(vis).length;
  const inSec = secApps().length;
  const totalEl = $('#total'); if (totalEl) totalEl.textContent = (f.length || searchQuery) ? `${shown} of ${inSec}` : `${inSec}`;
    const appModeBadge = $('#appModeBadge');
    if (appModeBadge) appModeBadge.textContent = S.apps.length;
  const countryLabelText = (f.length ? (f.length === 1 ? clabel(f[0]) : `${f.length} countries`) : 'All countries');
  const mobileCountryLabel = (f.length ? (f.length === 1 ? clabel(f[0]) : `${f.length} ctry`) : 'All');
  if ($('#fbtn')) $('#fbtn').innerHTML = countryLabelText + ' &#9662;';
  if ($('#mobileFbtnText')) $('#mobileFbtnText').textContent = mobileCountryLabel;

  const p = present();
  const fpopContent = `<label><input type="checkbox" data-c="" ${f.length ? '' : 'checked'}> All countries<b>${inSec}</b></label>` +
    Object.keys(p).sort((a,b) => cname(a).localeCompare(cname(b))).map(c => `<label><input type="checkbox" data-c="${c}" ${f.includes(c) ? 'checked' : ''}> ${clabel(c)}<b>${p[c]}</b></label>`).join('');
  if ($('#fpop')) $('#fpop').innerHTML = fpopContent;
  if ($('#mobileFpop')) $('#mobileFpop').innerHTML = fpopContent;

  if (currentSec === 'Calendar') {
    renderCalendar();
    return;
  }
  $('#board').classList.remove('cal-mode');

  const board = $('#board');
  board.dataset.activeStage = activeMobileStage;
  board.innerHTML = '';

  STAGES.forEach(st => {
    const list = stageApps(st).filter(vis);
    const col = document.createElement('section');
    col.className = 'col';
    col.dataset.stage = st;
    col.innerHTML = `
      <div class="col-header">
        <span class="col-stage-dot" style="background:${DOT[st]}"></span>
        <h2>${STAGE_ICON[st]} ${st}</h2>
        <span class="col-count">${list.length}</span>
      </div>
      <div class="body" data-stage="${st}"></div>`;

    const body = $('.body', col);

    if (!list.length) {
      body.innerHTML = `
        <div class="empty">
          <svg viewBox="0 0 24 24"><path d="M22 12h-6l-2 3h-4l-2-3H2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8z"/><path d="M5.45 5.11L2 12v0h20v0l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
          <div style="font-weight:600">No applications in ${esc(st)}</div>
          <div style="font-size:11px;opacity:0.75">Drag cards here or click + Add</div>
        </div>`;
    }

    list.forEach(a => {
      const tags = [];
      const cat = a.category || 'Industry';
      if (cat === 'Government') tags.push(`<span class="tag gov">${ICON.landmark} Gov</span>`);
      else if (cat === 'Research') tags.push(`<span class="tag res">${ICON.beaker} Research</span>`);
      if (a.portal_user || a.portal_pass) tags.push(`<span class="tag cred" title="Portal credentials saved">${ICON.key} Creds</span>`);

      // Urgency check (Blinking dots: orange for urgent, red for overdue)
      let dotHtml = '';
      if (a.deadline) {
        const target = new Date(a.deadline + 'T23:59:59');
        const diffDays = Math.ceil((target - new Date()) / 86400000);
        if (diffDays < 0) {
          dotHtml = `<span class="card-status-dot dot-overdue" title="Overdue (${Math.abs(diffDays)}d)"><span class="dot-ping"></span><span class="dot-core"></span></span>`;
          tags.push(`<span class="tag overdue-tag" title="Deadline was ${fmt(a.deadline)}">${ICON.alert} Overdue (${Math.abs(diffDays)}d)</span>`);
        } else if (diffDays <= 7) {
          const label = diffDays === 0 ? 'Due today' : `${diffDays}d left`;
          dotHtml = `<span class="card-status-dot dot-urgent" title="Deadline: ${label}"><span class="dot-ping"></span><span class="dot-core"></span></span>`;
          tags.push(`<span class="tag urgent-tag" title="Deadline is ${fmt(a.deadline)}">${ICON.clock} ${label}</span>`);
        }
      }

      // Custom color tags
      getAppTags(a).forEach(t => {
        tags.push(`<span class="tag custom-tag" style="background:${t.bg};color:${t.text};border-color:${t.border}"><span class="tag-dot" style="background:${t.color}"></span>${esc(t.name)}</span>`);
      });

      if (a.jd) tags.push('<span class="tag">JD</span>');
      if (a.resume_path && a.resume_path.trim() && a.resume_path.trim().toUpperCase() !== 'NA') {
        const cleanP = cleanFilePath(a.resume_path);
        tags.push(`<span class="tag resume-tag" title="resume: Click to open in Google Drive" onclick="event.stopPropagation(); openDoc('${esc(cleanP)}');">resume</span>`);
      }

      if (a.cover_letter_path && a.cover_letter_path.trim() && a.cover_letter_path.trim().toUpperCase() !== 'NA') {
        const cleanP = cleanFilePath(a.cover_letter_path);
        tags.push(`<span class="tag cl-tag" title="cover_letter: Click to open in Google Drive" onclick="event.stopPropagation(); openDoc('${esc(cleanP)}');">cover_letter</span>`);
      }
      const d = document.createElement('div');
      d.className = 'card';
      d.draggable = true;
      d.dataset.id = a.id;
      d.innerHTML = `
        <button class="x" title="Delete" aria-label="Delete">&times;</button>
        ${dotHtml}
        <div class="top">
          ${logo(a.company)}
          <div>
            <div class="co">${esc(a.company)}</div>
            <div class="role">${esc(a.role) || '&nbsp;'}</div>
          </div>
        </div>
        <div class="meta">${ICON.pin}<span>${esc([a.city, ccode(a.country)].filter(Boolean).join(', '))} ${cbadge(a.country)}</span></div>
        <div class="meta">${ICON.calendar}<span>${fmt(a.date_applied) || '-'}${a.deadline ? ` &middot; Due ${fmt(a.deadline)}` : ''}</span></div>
        <div class="tags">${tags.join('')}</div>
      `;
      d.onclick = e => { if (!e.target.closest('.x')) openPanel(a.id); };
      d.querySelector('.x').onclick = e => { e.stopPropagation(); delApp(a.id); };
      d.ondragstart = e => { dragId = a.id; d.classList.add('dragging'); };
      d.ondragend = () => d.classList.remove('dragging');
      body.appendChild(d);
    });

    board.appendChild(col);
  });
}

/* ----- Enhanced Document Upload UI System ----- */
const DOC_CACHE = window._DOC_CACHE || (window._DOC_CACHE = {});

function renderDocSlotHtml(type, label, iconSvg, rawPath, appId = null) {
  const p = cleanFilePath(rawPath);
  const hasFile = p && p.toUpperCase() !== 'NA';
  const prefix = appId ? `p_${type}` : `af_${type}`;
  const key = type === 'resume' ? 'resume_path' : 'cover_letter_path';

  if (hasFile) {
    const isGdrive = isGoogleDriveLink(p);
    let fn = p.split(/[\\/]/).pop() || p;
    let badgeCls, badgeIcon;

    if (isGdrive) {
      if (DOC_CACHE[p] && DOC_CACHE[p].name) {
        fn = DOC_CACHE[p].name;
      } else {
        fn = `${label} (Google Drive Document)`;
      }
      badgeCls = 'gdrive';
      badgeIcon = ICON.gdrive;
    } else {
      const ext = (fn.split('.').pop() || '').toLowerCase();
      const isDoc = ext === 'doc' || ext === 'docx';
      const isPdf = ext === 'pdf';
      badgeCls = isPdf ? 'pdf' : (isDoc ? 'docx' : 'other');
      badgeIcon = isPdf ? ICON.filePdf : (isDoc ? ICON.fileWord : ICON.document);
    }

    return `
      <div class="doc-slot-container" id="${prefix}_slot">
        <div class="doc-card-box">
          <div class="doc-type-icon-badge ${badgeCls}" title="${isGdrive ? 'Google Drive Document' : label}">
            ${badgeIcon}
          </div>
          <div class="doc-card-details">
            <div class="doc-card-header-row">
              <span class="doc-type-pill">${label}</span>
              <span class="doc-status-pill ${isGdrive ? 'gdrive' : 'local'}">
                <span class="doc-status-dot"></span>
                <span>${isGdrive ? 'Google Drive' : 'Attached'}</span>
              </span>
            </div>
            <div class="doc-card-filename" id="${prefix}_filename" title="${esc(fn)}">${esc(fn)}</div>
            <div class="doc-card-meta">
              ${isGdrive ? `
                <span class="doc-meta-hint">
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  <span>Cloud Synced &bull; Click Open to view</span>
                </span>
              ` : `
                <span class="doc-meta-hint" title="${esc(p)}">
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                  <span>${esc(p)}</span>
                </span>
              `}
            </div>
          </div>
          <div class="doc-card-actions">
            ${appId ? `
              <button type="button" class="btn sm doc-btn-open" id="${prefix}_btn_prev" title="Open document in Google Drive">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                <span>Open</span>
              </button>
            ` : ''}
            <button type="button" class="btn sm doc-btn-upload" id="${prefix}_btn_rep" title="Upload new ${label.toLowerCase()} to replace existing">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              <span>Upload</span>
            </button>
            <button type="button" class="btn sm doc-action-btn doc-action-delete" id="${prefix}_btn_rem" title="Delete ${label.toLowerCase()}">
              &times;
            </button>
          </div>
        </div>
        <input type="file" id="${prefix}_file_inp" accept=".pdf,.docx,.doc,.txt" style="display:none">
        <input type="hidden" ${appId ? `data-k="${key}"` : ''} id="${prefix}_hidden_path" value="${esc(p)}">
      </div>
    `;
  } else {
    return `
      <div class="doc-slot-container" id="${prefix}_slot">
        <div class="doc-modern-slot" id="${prefix}_dropzone">
          <div class="doc-modern-slot-left">
            <div class="doc-modern-icon-badge ${type}">
              ${iconSvg}
            </div>
            <div class="doc-modern-text">
              <div class="doc-modern-label-row">
                <span class="doc-modern-label">${label}</span>
                <span class="doc-empty-badge">Empty</span>
              </div>
              <div class="doc-modern-sub">Drop file here, or click to upload</div>
            </div>
          </div>
          <div class="doc-modern-action" onclick="event.stopPropagation();">
            <button type="button" class="btn sm doc-btn-upload-pick" id="${prefix}_btn_upload_pick_btn" title="Upload ${label.toLowerCase()}">
              <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" fill="none" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              <span>Upload</span>
            </button>
          </div>
          <input type="file" id="${prefix}_file_inp" accept=".pdf,.docx,.doc,.txt" style="display:none">
          <input type="hidden" ${appId ? `data-k="${key}"` : ''} id="${prefix}_hidden_path" value="">
        </div>
      </div>
    `;
  }
}

function wireDocSlot(prefix, type, label, iconSvg, appId, getPath, setPath) {
  const slot = $(`#${prefix}_slot`);
  if (!slot) return;
  const fileInp = $(`#${prefix}_file_inp`);
  const dropzone = $(`#${prefix}_dropzone`);
  const btnPrev = $(`#${prefix}_btn_prev`);
  const btnRep = $(`#${prefix}_btn_rep`);
  const btnRem = $(`#${prefix}_btn_rem`);
  const btnUploadPick = $(`#${prefix}_btn_upload_pick_btn`);
  const key = type === 'resume' ? 'resume_path' : 'cover_letter_path';

  // Async name resolution for Google Drive links
  const curP = getPath();
  if (curP && isGoogleDriveLink(curP)) {
    if (DOC_CACHE[curP] && DOC_CACHE[curP].name) {
      const fnEl = $(`#${prefix}_filename`);
      if (fnEl) {
        fnEl.textContent = DOC_CACHE[curP].name;
        fnEl.title = DOC_CACHE[curP].name;
      }
    } else {
      fetch('/api/file-info', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path: curP })
      }).then(r => r.json()).then(info => {
        if (info && info.name) {
          DOC_CACHE[curP] = info;
          const fnEl = $(`#${prefix}_filename`);
          if (fnEl) {
            fnEl.textContent = info.name;
            fnEl.title = info.name;
          }
        }
      }).catch(() => {});
    }
  }

  function readFileAsBase64(f) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = err => reject(err);
      reader.readAsDataURL(f);
    });
  }

  const uploadFile = async (file) => {
    if (!file) return;
    const currentSlot = $(`#${prefix}_slot`);
    if (currentSlot) {
      currentSlot.innerHTML = `
        <div class="doc-uploading-box">
          <span class="spinner-sm"></span>
          <span>Uploading <strong>${esc(file.name)}</strong>...</span>
        </div>
      `;
    }
    try {
      const docType = type === 'resume' ? 'resume' : 'cover_letter';
      const base64Data = await readFileAsBase64(file);
      const savedFolder = localStorage.getItem('user_gdrive_folder_id');

      const resp = await fetch('/api/upload-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          data: base64Data,
          type: docType,
          appId: appId || undefined,
          folderId: savedFolder || undefined
        })
      });
      const res = await resp.json();
      if (res && res.ok) {
        const savedPath = res.fullPath || res.path;
        DOC_CACHE[savedPath] = { name: file.name, exists: true };
        setPath(savedPath);
        if (appId) {
          const app = (S.apps || []).find(x => x.id === Number(appId));
          if (app) {
            app[key] = savedPath;
            render();
          }
        }
        toast(`Upload completed: ${file.name}`);
        const liveSlot = $(`#${prefix}_slot`);
        if (liveSlot) {
          liveSlot.outerHTML = renderDocSlotHtml(type, label, iconSvg, savedPath, appId);
          wireDocSlot(prefix, type, label, iconSvg, appId, () => savedPath, setPath);
          $(`#${prefix}_slot .doc-card-box`)?.classList.add('doc-upload-success-anim');
        }
      } else {
        toast('Upload failed: ' + ((res && res.error) || 'Server error'), true);
        const liveSlot = $(`#${prefix}_slot`);
        if (liveSlot) {
          liveSlot.outerHTML = renderDocSlotHtml(type, label, iconSvg, getPath(), appId);
          wireDocSlot(prefix, type, label, iconSvg, appId, getPath, setPath);
        }
      }
    } catch (err) {
      toast('Upload failed: ' + err.message, true);
      const liveSlot = $(`#${prefix}_slot`);
      if (liveSlot) {
        liveSlot.outerHTML = renderDocSlotHtml(type, label, iconSvg, getPath(), appId);
        wireDocSlot(prefix, type, label, iconSvg, appId, getPath, setPath);
      }
    }
  };

  // Drag and drop or click on empty dropzone
  if (dropzone && fileInp) {
    dropzone.onclick = () => fileInp.click();
    fileInp.onchange = () => { uploadFile(fileInp.files?.[0]); fileInp.value = ''; };
    dropzone.ondragover = e => { e.preventDefault(); dropzone.classList.add('dragover'); };
    dropzone.ondragleave = () => dropzone.classList.remove('dragover');
    dropzone.ondrop = e => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      const f = e.dataTransfer?.files?.[0];
      if (f) uploadFile(f);
    };
  }

  // Upload button on empty slot
  if (btnUploadPick && fileInp) {
    btnUploadPick.onclick = (e) => {
      e.stopPropagation();
      fileInp.click();
    };
  }

  // Upload button on already attached slot: ASK confirmation to replace
  if (btnRep && fileInp) {
    btnRep.onclick = () => {
      showConfirmDialog({
        title: `Replace existing ${label}?`,
        text: `A ${label.toLowerCase()} is already attached to this application. Do you want to replace it with a new file?`,
        icon: `<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>`,
        confirmText: 'Replace',
        confirmCls: 'primary',
        cancelText: 'Cancel',
        onConfirm: () => {
          fileInp.click();
        }
      });
    };
    fileInp.onchange = () => { uploadFile(fileInp.files?.[0]); fileInp.value = ''; };
  }

  // Open button
  if (btnPrev && appId) {
    btnPrev.onclick = () => openDocPreviewForApp(appId, type);
  }

  // Delete button: ASK confirmation to delete, then delete from Google Drive
  if (btnRem) {
    btnRem.onclick = () => {
      const pathToDelete = getPath();
      showConfirmDialog({
        title: `Delete ${label}?`,
        text: `Are you sure you want to delete this ${label.toLowerCase()}? It will be permanently removed from Google Drive.`,
        icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
        confirmText: 'Yes, Delete',
        confirmCls: 'danger',
        cancelText: 'No, Cancel',
        onConfirm: async () => {
          toast(`Deleting ${label.toLowerCase()} from Drive...`);
          try {
            await api('POST', '/delete-document', {
              path: pathToDelete,
              appId: appId || null,
              type: type
            });
          } catch (delErr) {
            console.warn('Delete document error:', delErr);
          }
          setPath('');
          delete DOC_CACHE[pathToDelete];
          if (appId) {
            const app = (S.apps || []).find(x => x.id === Number(appId));
            if (app) {
              app[key] = '';
              render();
            }
          }
          toast(`Deleted ${label} from Google Drive`);
          const liveSlot = $(`#${prefix}_slot`);
          if (liveSlot) {
            liveSlot.outerHTML = renderDocSlotHtml(type, label, iconSvg, '', appId);
            wireDocSlot(prefix, type, label, iconSvg, appId, () => '', setPath);
          }
        }
      });
    };
  }
}

/* ----- Add Application Panel ----- */
function openAddPanel(defaultStage = null) {
  openId = null;
  const initialStage = defaultStage || (typeof activeMobileStage !== 'undefined' && STAGES.includes(activeMobileStage) ? activeMobileStage : 'Applied');
  const initialCat = (currentSec && currentSec !== 'All' && currentSec !== 'Calendar') ? currentSec : 'Industry';
  const st = { country: '', category: initialCat };

  const roles = [...new Set([...(S?.roles || []), ...(S?.apps || []).map(a => a.role).filter(Boolean)])].sort();

  const formHtml = `
    <!-- Track Selection Card -->
    <div class="panel-section-card">
      <div class="panel-card-header">
        <span class="panel-card-title">${ICON.briefcase} Target Category</span>
        <span class="panel-card-subtitle">Choose track</span>
      </div>
      <div class="add-app-category-grid" id="af_secs">
        <label class="sec-pill ${initialCat === 'Industry' ? 'active' : ''}" data-c="Industry">
          <input type="radio" name="af_cat" value="Industry" ${initialCat === 'Industry' ? 'checked' : ''}>
          <span class="cat-pill-icon">${ICON.briefcase}</span>
          <span class="cat-pill-text">
            <strong>Industry</strong>
            <small>Corporate & Tech</small>
          </span>
        </label>
        <label class="sec-pill ${initialCat === 'Government' ? 'active' : ''}" data-c="Government">
          <input type="radio" name="af_cat" value="Government" ${initialCat === 'Government' ? 'checked' : ''}>
          <span class="cat-pill-icon">${ICON.landmark}</span>
          <span class="cat-pill-text">
            <strong>Government</strong>
            <small>Public Sector</small>
          </span>
        </label>
        <label class="sec-pill ${initialCat === 'Research' ? 'active' : ''}" data-c="Research">
          <input type="radio" name="af_cat" value="Research" ${initialCat === 'Research' ? 'checked' : ''}>
          <span class="cat-pill-icon">${ICON.beaker}</span>
          <span class="cat-pill-text">
            <strong>Research</strong>
            <small>Labs & Academia</small>
          </span>
        </label>
      </div>
    </div>

    <!-- Company & Role Card -->
    <div class="panel-section-card">
      <div class="panel-card-header">
        <span class="panel-card-title">${ICON.document} Organization & Role</span>
        <span class="panel-card-badge required-badge">Required</span>
      </div>
      <div class="panel-field-group">
        <label class="f" for="afc">Company / Institution <span style="color:var(--rejected-clr)">*</span></label>
        <div><input type="text" id="afc" placeholder="e.g. Google, ISRO, Microsoft, IISc" autocomplete="off" required></div>
      </div>
      <div class="panel-field-group">
        <label class="f" for="afr">Role / Designation</label>
        <div>
          <input type="text" id="afr" placeholder="e.g. Senior Software Engineer, Data Scientist" list="af_roleList" autocomplete="off">
          <datalist id="af_roleList">
            ${roles.filter(x => x !== '__new').map(x => `<option value="${esc(x)}">`).join('')}
          </datalist>
        </div>
      </div>
    </div>

    <!-- Stage & Timeline Card -->
    <div class="panel-section-card">
      <div class="panel-card-header">
        <span class="panel-card-title">${ICON.clock} Stage & Timeline</span>
      </div>
      <div class="row">
        <div>
          <label class="f" for="af_stage">Pipeline Stage</label>
          <select id="af_stage">
            ${STAGES.map(s => `<option value="${s}" ${s === initialStage ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="f" for="afd">Date Applied</label>
          <input type="date" id="afd" value="${today()}">
        </div>
      </div>
      <div class="panel-field-group" style="margin-top:6px;">
        <label class="f" for="af_deadline">Application Deadline <span class="f-hint">(optional)</span></label>
        <input type="date" id="af_deadline">
      </div>
    </div>

    <!-- Work Location Card -->
    <div class="panel-section-card">
      <div class="panel-card-header">
        <span class="panel-card-title">${ICON.pin} Location & Workplace</span>
      </div>
      <div class="row">
        <div>
          <label class="f" for="afk">Country</label>
          <div><input type="text" id="afk" placeholder="Search countries..." autocomplete="off"></div>
        </div>
        <div>
          <label class="f" for="afcity">City / Workplace</label>
          <input type="text" id="afcity" placeholder="e.g. Bengaluru, Remote, London">
        </div>
      </div>
    </div>

    <!-- Documents Card -->
    <div class="panel-section-card">
      <div class="panel-card-header">
        <span class="panel-card-title">${ICON.filePdf} Application Documents</span>
        <span class="panel-card-badge">Optional</span>
      </div>
      <div class="doc-slots-grid">
        ${renderDocSlotHtml('resume', 'Resume', ICON.filePdf, '', null)}
        ${renderDocSlotHtml('cover', 'Cover Letter', ICON.fileWord, '', null)}
      </div>
    </div>

    <!-- Portal Credentials Card -->
    <div id="af_cred_box" class="cred-card" style="${(initialCat === 'Government' || initialCat === 'Research') ? '' : 'display:none'}">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
        <h4 style="margin:0;border:0;padding:0;font-size:12px;font-weight:700">Portal Credentials</h4>
        <span class="cred-badge">${ICON.key} Login info</span>
      </div>
      <div class="cred-sub">Store login credentials for government or research portals</div>
      <label class="f">Portal Login URL</label>
      <input type="url" id="af_purl" placeholder="https://portal.example.gov/login">
      <div class="row">
        <div>
          <label class="f">User ID / Username</label>
          <input type="text" id="af_puser" placeholder="e.g. applicant_user42">
        </div>
        <div>
          <label class="f">Password / PIN</label>
          <div class="input-act">
            <input type="password" id="af_ppass" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;">
            <button type="button" class="btn" id="af_tpass" title="Show/Hide">${ICON.eye}</button>
          </div>
        </div>
      </div>
      <label class="f">Portal Notes</label>
      <input type="text" id="af_pnotes" placeholder="Confirmation PIN, security question answer...">
    </div>

    <!-- Pinned Sticky Footer -->
    <div class="panel-sticky-footer">
      <button type="button" class="btn" id="afx">Cancel</button>
      <button type="button" class="btn primary add-app-submit-btn" id="afs">
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>Add Application</span>
      </button>
    </div>
  `;

  openPanel('Add Application', formHtml);

  setTimeout(() => { $('#afc')?.focus(); }, 150);

  const pbody = $('#pbody');
  const q = s => $(s, pbody);

  const setCat = cat => {
    st.category = cat;
    pbody.querySelectorAll('#af_secs .sec-pill').forEach(p => p.classList.toggle('active', p.dataset.c === cat));
    const cb = q('#af_cred_box');
    if (cb) cb.style.display = (cat === 'Government' || cat === 'Research') ? 'block' : 'none';
  };
  pbody.querySelectorAll('#af_secs .sec-pill').forEach(p => {
    p.onclick = () => setCat(p.dataset.c);
  });

  q('#af_tpass').onclick = () => {
    const inp = q('#af_ppass');
    const isPass = inp.type === 'password';
    inp.type = isPass ? 'text' : 'password';
    q('#af_tpass').innerHTML = isPass ? ICON.eyeOff : ICON.eye;
  };

  countryField(q('#afk'), () => st.country, c => st.country = c);

  // Wire up modern interactive document upload slots
  st.resume_path = '';
  st.cover_letter_path = '';
  wireDocSlot('af_resume', 'resume', 'Resume', ICON.filePdf, null, () => st.resume_path, p => st.resume_path = p);
  wireDocSlot('af_cover', 'cover', 'Cover Letter', ICON.fileWord, null, () => st.cover_letter_path, p => st.cover_letter_path = p);

  q('#afx').onclick = closePanel;

  q('#afs').onclick = async () => {
    const company = q('#afc').value.trim();
    if (!company) {
      q('#afc').focus();
      q('#afc').style.borderColor = 'var(--rejected-clr)';
      return;
    }
    const targetStage = q('#af_stage').value || 'Applied';
    const role = q('#afr').value.trim();
    const city = q('#afcity').value.trim();
    const date_applied = q('#afd').value || today();
    const deadline = q('#af_deadline')?.value || null;
    const jd_url = q('#af_jd_url')?.value.trim() || '';
    const jd = q('#af_jd')?.value.trim() || '';
    const resume_path = st.resume_path || q('#af_resume_hidden_path')?.value || '';
    const cover_letter_path = st.cover_letter_path || q('#af_cover_hidden_path')?.value || '';
    const portal_url = q('#af_purl')?.value.trim() || '';
    const portal_user = q('#af_puser')?.value.trim() || '';
    const portal_pass = q('#af_ppass')?.value || '';
    const portal_notes = q('#af_pnotes')?.value.trim() || '';

    const a = await api('POST', '/applications', {
      company, role, country: st.country, city, date_applied, deadline,
      stage: targetStage,
      category: st.category || 'Industry',
      jd, jd_url,
      resume_path, cover_letter_path, portal_url, portal_user, portal_pass, portal_notes
    });

    if (role && !S.roles.includes(role)) S.roles.push(role);
    if (!S.companies.some(c => c.name.toLowerCase() === company.toLowerCase())) {
      const c = { name: company, city: a.city, country: a.country };
      S.companies.push(c);
      api('POST', '/companies', c);
    }
    S.apps.push(a);

    activeMobileStage = targetStage;
    const b = $('#board');
    if (b) b.dataset.activeStage = activeMobileStage;
    const dot = $('#stagePickerDot');
    if (dot) dot.style.background = DOT[activeMobileStage] || 'var(--applied-clr)';

    await closePanel();
  };
}

if ($('#addBtn')) $('#addBtn').onclick = () => openAddPanel();
if ($('#mobileAddBtn')) $('#mobileAddBtn').onclick = () => openAddPanel();

/* Mobile Sub-Bar Search Wiring */
const mSearchInp = $('#mobileSearch');
const mSearchWrap = $('.mobile-search-wrap');
const mSearchClear = $('#mobileSearchClear');
if (mSearchInp) {
  mSearchInp.oninput = e => {
    const val = e.target.value.trim();
    if (mSearchWrap) mSearchWrap.classList.toggle('has-val', !!e.target.value);
    const mainSearch = $('#search');
    if (mainSearch) {
      mainSearch.value = e.target.value;
      const mainWrap = $('.search-wrap:not(.mobile-search-wrap)');
      if (mainWrap) mainWrap.classList.toggle('has-val', !!e.target.value);
    }
    searchQuery = val;
    render();
  };
}
if (mSearchClear) {
  mSearchClear.onclick = e => {
    e.stopPropagation();
    if (mSearchInp) mSearchInp.value = '';
    if (mSearchWrap) mSearchWrap.classList.remove('has-val');
    const mainSearch = $('#search');
    if (mainSearch) {
      mainSearch.value = '';
      const mainWrap = $('.search-wrap:not(.mobile-search-wrap)');
      if (mainWrap) mainWrap.classList.remove('has-val');
    }
    searchQuery = '';
    render();
    if (mSearchInp) mSearchInp.focus();
  };
}
/* ----- Quick Links & Profiles Hub ----- */
function openQuickLinksPanel() {
  openId = null;
  const s = S.settings || {};

  const items = [
    {
      key: 'link_github',
      name: 'GitHub Profile',
      icon: '<svg viewBox="0 0 24 24"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>',
      placeholder: 'https://github.com/your-username',
      val: s.link_github || s.github || ''
    },
    {
      key: 'link_linkedin',
      name: 'LinkedIn Profile',
      icon: '<svg viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>',
      placeholder: 'https://linkedin.com/in/your-profile',
      val: s.link_linkedin || s.linkedin || ''
    },
    {
      key: 'link_portfolio',
      name: 'Portfolio / Website',
      icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
      placeholder: 'https://yourportfolio.dev',
      val: s.link_portfolio || ''
    },
    {
      key: 'link_orcid',
      name: 'ORCID Profile',
      icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 8v8M12 8v8M12 8h2.5a2.5 2.5 0 0 1 0 5H12M8 5h.01"/></svg>',
      placeholder: 'https://orcid.org/0000-0002-XXXX-XXXX',
      val: s.link_orcid || ''
    },
    {
      key: 'link_scholar',
      name: 'Google Scholar',
      icon: '<svg viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
      placeholder: 'https://scholar.google.com/citations?user=...',
      val: s.link_scholar || ''
    }
  ];

  const html = `
    <div style="margin-bottom:16px;">
      <div style="font-size:12.5px;color:var(--tx2);line-height:1.5;">
        Quick 1-click copy for your profile URLs when applying to internships and jobs. Values auto-save instantly.
      </div>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <button type="button" class="btn" id="ql_copy_all" style="font-size:11.5px;padding:5px 12px;">
          ${ICON.copy} Copy All Profile Links
        </button>
      </div>
    </div>

    ${items.map(it => `
      <div class="ql-card" data-key="${it.key}">
        <div class="ql-header">
          <span class="ql-title">${it.icon} ${it.name}</span>
          <span class="ql-status" id="st_${it.key}">Saved</span>
        </div>
        <div class="ql-box">
          <input type="url" class="ql-input" id="inp_${it.key}" value="${esc(it.val)}" placeholder="${esc(it.placeholder)}" autocomplete="off">
          <div class="ql-actions">
            <a href="${esc(it.val || '#')}" target="_blank" rel="noopener noreferrer" class="ql-btn ql-open" id="op_${it.key}" title="Open link in new tab" style="${it.val ? '' : 'display:none'}">
              <svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
            </a>
            <button type="button" class="ql-btn ql-copy" id="cp_${it.key}" title="Copy to clipboard">
              <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              <span>Copy</span>
            </button>
          </div>
        </div>
      </div>
    `).join('')}
  `;

  openPanel('Quick Links & Profiles', html);

  const pbody = $('#pbody');

  items.forEach(it => {
    const inp = $(`#inp_${it.key}`, pbody);
    const cpBtn = $(`#cp_${it.key}`, pbody);
    const opBtn = $(`#op_${it.key}`, pbody);
    const stSpan = $(`#st_${it.key}`, pbody);

    const saveVal = () => {
      const val = inp.value.trim();
      S.settings[it.key] = val;
      api('PUT', '/settings/' + it.key, { value: val });
      if (opBtn) {
        opBtn.href = val || '#';
        opBtn.style.display = val ? 'inline-flex' : 'none';
      }
      if (stSpan) {
        stSpan.classList.add('visible');
        setTimeout(() => { if (stSpan) stSpan.classList.remove('visible'); }, 1200);
      }
    };

    inp.addEventListener('input', () => {
      if (opBtn) {
        const val = inp.value.trim();
        opBtn.href = val || '#';
        opBtn.style.display = val ? 'inline-flex' : 'none';
      }
      debounce('ql_' + it.key, saveVal, 400);
    });
    inp.addEventListener('blur', saveVal);

    cpBtn.onclick = async () => {
      const val = inp.value.trim();
      if (!val) {
        inp.focus();
        inp.style.borderColor = 'var(--rejected-clr)';
        setTimeout(() => { inp.style.borderColor = ''; }, 1200);
        return;
      }
      try {
        await navigator.clipboard.writeText(val);
      } catch (e) {
        inp.select();
        document.execCommand('copy');
      }
      cpBtn.classList.add('copied');
      cpBtn.innerHTML = '<svg viewBox="0 0 24 24" style="stroke:#059669"><polyline points="20 6 9 17 4 12"/></svg> <span>Copied!</span>';
      setTimeout(() => {
        cpBtn.classList.remove('copied');
        cpBtn.innerHTML = '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> <span>Copy</span>';
      }, 1600);
    };
  });

  const cpAllBtn = $('#ql_copy_all', pbody);
  if (cpAllBtn) {
    cpAllBtn.onclick = async () => {
      const lines = items
        .map(it => {
          const val = $(`#inp_${it.key}`, pbody)?.value.trim();
          return val ? `${it.name}: ${val}` : null;
        })
        .filter(Boolean);

      if (!lines.length) {
        alert('Please enter at least one link first.');
        return;
      }
      try {
        await navigator.clipboard.writeText(lines.join('\n'));
      } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = lines.join('\n');
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      cpAllBtn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Copied All!';
      setTimeout(() => {
        cpAllBtn.innerHTML = `${ICON.copy} Copy All Profile Links`;
      }, 1800);
    };
  }
}

if ($('#linksBtn')) $('#linksBtn').onclick = openQuickLinksPanel;
if ($('#statsBtn')) $('#statsBtn').onclick = openStatsPanel;
const shutdownModal = $('#shutdownModal');
const closeBtn = $('#shutdownBtn') || $('#closeBtn');
if (closeBtn) {
  closeBtn.onclick = () => {
    if (shutdownModal) shutdownModal.style.display = 'flex';
  };
}
const cancelBtn = $('#cancelShutdownBtn') || $('#cancelShutdown');
if (cancelBtn) {
  cancelBtn.onclick = () => {
    if (shutdownModal) shutdownModal.style.display = 'none';
  };
}
if (shutdownModal) {
  shutdownModal.onclick = e => {
    if (e.target === shutdownModal) shutdownModal.style.display = 'none';
  };
}

const confirmBtn = $('#confirmShutdownBtn') || $('#confirmShutdown');
if (confirmBtn) {
  confirmBtn.onclick = async () => {
    const btn = confirmBtn;
  btn.textContent = 'Stopping...';
  btn.disabled = true;

  try {
    await fetch('/api/shutdown', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  } catch (e) {
    try { await fetch('/shutdown'); } catch (e2) {}
  }

  document.body.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:Inter,sans-serif;color:#0f172a;background:#f8fafc;text-align:center;padding:24px;">
      <div style="width:58px;height:58px;border-radius:16px;background:#ecfdf5;border:1.5px solid #a7f3d0;display:flex;align-items:center;justify-content:center;margin-bottom:16px;color:#059669;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <h2 style="font-size:22px;font-weight:700;margin:0 0 8px;color:#0f172a;">Server Stopped Successfully</h2>
      <p style="font-size:14px;color:#64748b;margin:0 0 20px;max-width:440px;line-height:1.6;">
        The background Node.js server on port 3000 has been stopped. To restart the board anytime, run <code>start.bat</code>.
      </p>
      <div style="font-size:12.5px;color:#64748b;background:#f1f5f9;padding:9px 18px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:20px;">
        Port 3000 is now free. You can safely close this browser tab.
      </div>
      <button onclick="window.close()" class="btn primary" style="font-size:13px;padding:8px 24px;">Close Tab</button>
    </div>
  `;
  try { window.close(); } catch (e) {}
  };
}

/* ----- Section Tabs ----- */
document.querySelectorAll('#secBar .sec-btn').forEach(btn => {
  btn.onclick = () => {
    currentSec = btn.dataset.s;
    if (currentSec !== 'Calendar') api('PUT', '/settings/section', { value: currentSec });
    render();
  };
});

/* ----- Country Filter ----- */
const fBtn = $('#fbtn');
const fPop = $('#fpop');
const fWrap = $('#fwrap');
if (fBtn && fPop) {
  fBtn.onclick = e => {
    e.stopPropagation();
    const isBlock = fPop.style.display === 'block';
    fPop.style.display = isBlock ? 'none' : 'block';
    if (fWrap) fWrap.classList.toggle('open', !isBlock);
    fBtn.setAttribute('aria-expanded', !isBlock);
  };
  fPop.onclick = e => e.stopPropagation();
  fPop.onchange = e => {
    const c = e.target.dataset.c;
    let f = activeFilter();
    f = c === '' ? [] : e.target.checked ? [...f, c] : f.filter(x => x !== c);
    S.filter = f;
    api('PUT', '/settings/filter', { value: JSON.stringify(f) });
    render();
  };
  document.addEventListener('click', () => {
    if (fPop.style.display === 'block') {
      fPop.style.display = 'none';
      if (fWrap) fWrap.classList.remove('open');
      fBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

/* Mobile Country Filter Wiring */
const mFBtn = $('#mobileFbtn');
const mFPop = $('#mobileFpop');
const mFWrap = $('#mobileFwrap');
if (mFBtn && mFPop) {
  mFBtn.onclick = e => {
    e.stopPropagation();
    const isBlock = mFPop.style.display === 'block';
    mFPop.style.display = isBlock ? 'none' : 'block';
    if (mFWrap) mFWrap.classList.toggle('open', !isBlock);
    mFBtn.setAttribute('aria-expanded', !isBlock);
  };
  mFPop.onclick = e => e.stopPropagation();
  mFPop.onchange = e => {
    const c = e.target.dataset.c;
    let f = activeFilter();
    f = c === '' ? [] : e.target.checked ? [...f, c] : f.filter(x => x !== c);
    S.filter = f;
    api('PUT', '/settings/filter', { value: JSON.stringify(f) });
    render();
  };
  document.addEventListener('click', () => {
    if (mFPop.style.display === 'block') {
      mFPop.style.display = 'none';
      if (mFWrap) mFWrap.classList.remove('open');
      mFBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ----- Small Screen Stage Dropdown ----- */
const stageSelectEl = $('#stageSelect');
if (stageSelectEl) {
  stageSelectEl.onchange = e => {
    activeMobileStage = e.target.value;
    const b = $('#board');
    if (b) b.dataset.activeStage = activeMobileStage;
    const dot = $('#stagePickerDot');
    if (dot) dot.style.background = DOT[activeMobileStage] || 'var(--applied-clr)';
    const badge = $('#stageCountBadge');
    if (badge) {
      const curCnt = stageApps(activeMobileStage).filter(vis).length;
      badge.textContent = curCnt;
    }
  };
}

/* ----- Search & Export ----- */
const searchWrap = $('.search-wrap');
const searchInp = $('#search');
if (searchWrap && searchInp) {
  searchWrap.onclick = e => {
    if (e.target !== $('#searchClear')) searchInp.focus();
  };
  searchInp.oninput = e => {
    const val = e.target.value.trim();
    searchWrap.classList.toggle('has-val', !!e.target.value);
    if (typeof currentViewMode !== 'undefined' && currentViewMode === 'learnings') {
      learningSearchQuery = val;
      if (typeof renderLearningsBoard === 'function') renderLearningsBoard();
      return;
    }
    searchQuery = val;
    render();
  };
  $('#searchClear').onclick = e => {
    e.stopPropagation();
    searchInp.value = '';
    searchWrap.classList.remove('has-val');
    if (typeof currentViewMode !== 'undefined' && currentViewMode === 'learnings') {
      learningSearchQuery = '';
      if (typeof renderLearningsBoard === 'function') renderLearningsBoard();
      searchInp.focus();
      return;
    }
    searchQuery = '';
    render();
    searchInp.focus();
  };
}

function exportCSV() {
  const visible = S.apps.filter(vis);
  if (!visible.length) { alert('No visible applications to export.'); return; }
  const headers = ['Company','Role','Country','City','Stage','Date Applied','Deadline','Salary','Currency','Category','Resume','Cover Letter','Custom Tags','Portal URL','Portal User','Recruiter Name','Recruiter Email','Recruiter Notes'];
  const escCSV = val => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const rows = visible.map(a => [
    a.company,
    a.role,
    cname(a.country) || a.country,
    a.city,
    a.stage,
    a.date_applied,
    a.deadline,
    a.salary,
    a.currency,
    a.category || 'Industry',
    a.resume_path || '', a.cover_letter_path || '',
    (getAppTags(a).map(t => t.name).join('; ')),
    a.portal_url || '',
    a.portal_user || '',
    a.recruiter_name || '',
    a.recruiter_email || '',
    a.recruiter_notes || ''
  ].map(escCSV).join(','));

  const csvContent = '\uFEFF' + [headers.map(escCSV).join(','), ...rows].join('\r\n');
  const secName = currentSec.toLowerCase();
  const defaultFilename = `applications_${secName}_${today()}.csv`;

  if (typeof desktopInvoke === 'function' && typeof isDesktopApp === 'function' && isDesktopApp()) {
    desktopInvoke('export_csv', { content: csvContent, defaultFilename })
      .then(savedPath => {
        if (savedPath) {
          toast(`Exported CSV successfully to: ${savedPath}`);
        }
      })
      .catch(err => {
        console.error('Desktop CSV export error:', err);
        fallbackDownload();
      });
    return;
  }

  function fallbackDownload() {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  fallbackDownload();
}
if ($('#expBtn')) $('#expBtn').onclick = exportCSV;
if ($('#backupZipBtn')) $('#backupZipBtn').onclick = () => {
  toast('Preparing full ZIP archive (Database + Documents)...');
  window.location.href = (typeof getApiBaseUrl === 'function' ? getApiBaseUrl() : '') + '/api/backup/export';
};


/* ----- Phase 2 UI/UX Engine: Theme, Skeletons & Mobile Bottom Sheet ----- */
function initTheme() {
  const saved = localStorage.getItem('theme') || localStorage.getItem('tracker_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  setTheme(theme);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.body.classList.toggle('dark-mode', theme === 'dark');
  try {
    localStorage.setItem('theme', theme);
    localStorage.setItem('tracker_theme', theme);
  } catch (e) {}
}

function bindThemeToggle() {
  const tBtn = document.getElementById('tbtn') || document.getElementById('themeToggleBtn');
  if (tBtn) {
    tBtn.onclick = () => {
      const isDark = document.body.classList.contains('dark-mode') || document.documentElement.getAttribute('data-theme') === 'dark';
      setTheme(isDark ? 'light' : 'dark');
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  bindThemeToggle();
});

// Skeleton Loader Shimmer for instant perception of performance
function renderSkeletons() {
  const board = $('#board');
  if (!board) return;
  board.innerHTML = STAGES.map(st => `
    <section class="col" data-stage="${st}">
      <div class="col-header">
        <span class="col-stage-dot" style="background:${DOT[st]}"></span>
        <h2>${STAGE_ICON[st]} ${st}</h2>
        <span class="col-count">...</span>
      </div>
      <div class="body">
        ${[1, 2, 3].map(() => `
          <div class="skeleton-card">
            <div class="skeleton-top">
              <div class="skeleton-avatar skeleton-shimmer"></div>
              <div class="skeleton-text-group">
                <div class="skeleton-line w-70 skeleton-shimmer"></div>
                <div class="skeleton-line w-45 skeleton-shimmer"></div>
              </div>
            </div>
            <div class="skeleton-line w-85 skeleton-shimmer"></div>
            <div class="skeleton-tags-row">
              <div class="skeleton-pill skeleton-shimmer"></div>
              <div class="skeleton-pill skeleton-shimmer"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `).join('');
}

// Touch & Stage Tabs Controller
function initMobileNavigation() {
  const tabs = document.querySelectorAll('.mobile-stage-tabs .stage-tab');
  tabs.forEach(tab => {
    tab.onclick = () => {
      const st = tab.dataset.stage;
      if (st) {
        activeMobileStage = st;
        tabs.forEach(t => t.classList.toggle('active', t.dataset.stage === st));
        const board = $('#board');
        if (board) board.dataset.activeStage = st;
        render();
      }
    };
  });

  // Touch swipe support for kanban board on mobile
  const board = $('#board');
  if (board) {
    let startX = 0, startY = 0;
    board.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    board.addEventListener('touchend', e => {
      const diffX = e.changedTouches[0].clientX - startX;
      const diffY = e.changedTouches[0].clientY - startY;
      if (Math.abs(diffX) > 60 && Math.abs(diffY) < 50) {
        const curIdx = STAGES.indexOf(activeMobileStage);
        if (diffX < 0 && curIdx < STAGES.length - 1) {
          // Swipe Left -> Next stage
          activeMobileStage = STAGES[curIdx + 1];
          render();
        } else if (diffX > 0 && curIdx > 0) {
          // Swipe Right -> Prev stage
          activeMobileStage = STAGES[curIdx - 1];
          render();
        }
      }
    }, { passive: true });
  }

  // Mobile Bottom Sheet Pull-to-Dismiss
  const sheetHandle = $('#sheetPullHandle');
  const panel = $('#panel');
  if (sheetHandle && panel) {
    sheetHandle.onclick = closePanel;
  }
}


function isGoogleDriveLink(str) {
  if (!str || typeof str !== 'string') return false;
  return /drive\.google\.com|docs\.google\.com/i.test(str) || /^gdrive:[a-zA-Z0-9_-]{20,}/i.test(str);
}
function extractGoogleDriveFileId(str) {
  if (!str || typeof str !== 'string') return null;
  const match = str.match(/(?:\/d\/|id=|file\/d\/|gdrive:)([a-zA-Z0-9_-]{20,})/i);
  return match ? match[1] : null;
}

/* ----- Drag & Drop ----- */
function locate(body, y) {
  for (const c of body.querySelectorAll('.card:not(.drag)')) {
    const r = c.getBoundingClientRect();
    if (y < r.top + r.height / 2) return +c.dataset.id;
  }
  return null;
}

const board = $('#board');
board.addEventListener('dragstart', e => {
  const c = e.target.closest('.card');
  if (!c) return;
  dragId = +c.dataset.id;
  c.classList.add('drag');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragId);
});
board.addEventListener('dragend', () => { dragId = null; render(); });
board.addEventListener('dragover', e => {
  const body = e.target.closest('.body');
  if (!body || dragId == null) return;
  e.preventDefault();
  board.querySelectorAll('.body.over').forEach(b => b !== body && b.classList.remove('over'));
  body.classList.add('over');
  $('.drop')?.remove();
  const before = locate(body, e.clientY);
  const ind = document.createElement('div');
  ind.className = 'drop';
  const ref = before && body.querySelector(`.card[data-id="${before}"]`);
  ref ? body.insertBefore(ind, ref) : body.appendChild(ind);
});
board.addEventListener('drop', e => {
  const body = e.target.closest('.body');
  if (!body || dragId == null) return;
  e.preventDefault();
  const stage = body.dataset.stage, vBefore = locate(body, e.clientY), id = dragId;
  const full = stageApps(stage).filter(a => a.id !== id);
  let before = null;
  if (vBefore != null) before = vBefore;
  else {
    const lastVis = [...full].reverse().find(vis);
    if (lastVis) {
      const i = full.indexOf(lastVis);
      before = full[i+1]?.id ?? null;
    }
  }
  doMove(id, stage, before);
});

function doMove(id, stage, before) {
  const ids = stageApps(stage).filter(a => a.id !== id).map(a => a.id);
  let i = before != null ? ids.indexOf(before) : -1;
  if (i < 0) i = ids.length;
  ids.splice(i, 0, id);
  ids.forEach((x, p) => {
    const a = S.apps.find(a => a.id === x);
    a.stage = stage;
    a.position = p;
  });
  dragId = null;
  render();
  api('POST', `/applications/${id}/move`, { stage, before });
}

/* ----- Delete with Undo ----- */
let toastT, lastDel;
function toast(msg, isError = false) {
  const t = $('#toast');
  const m = $('#tmsg');
  const u = $('#undo');
  if (!t || !m) return;
  m.textContent = msg;
  if (u) u.style.display = 'none';
  t.classList.remove('error', 'success');
  t.classList.add(isError ? 'error' : 'success');
  t.style.display = 'flex';
  clearTimeout(toastT);
  toastT = setTimeout(() => {
    t.style.display = 'none';
    t.classList.remove('error', 'success');
    if (u) u.style.display = '';
  }, 4000);
}
board.addEventListener('click', e => {
  const c = e.target.closest('.card');
  if (!c) return;
  const id = +c.dataset.id;
  if (e.target.closest('.x')) {
    const a = S.apps.find(a => a.id === id);
    lastDel = { ...a };
    S.apps = S.apps.filter(x => x.id !== id);
    render();
    api('DELETE', '/applications/' + id);
    $('#tmsg').textContent = `Deleted ${a.company}`;
    $('#toast').style.display = 'flex';
    clearTimeout(toastT);
    toastT = setTimeout(() => $('#toast').style.display = 'none', 6000);
  } else {
    openApp(id);
  }
});

$('#undo').onclick = async () => {
  if (!lastDel) return;
  const d = lastDel;
  lastDel = null;
  $('#toast').style.display = 'none';
  const n = await api('POST', '/applications', d);
  if (d.stage !== 'Applied') await api('POST', `/applications/${n.id}/move`, { stage: d.stage, before: null });
  S.apps = (await api('GET', '/state')).apps;
  render();
};

/* ----- Detail Slideout Panel ----- */
function openPanel(title, html) {
  $('#pt').textContent = title;
  $('#pbody').innerHTML = html;
  $('#bd').style.display = 'block';
  $('#saved').classList.remove('on');
  requestAnimationFrame(() => $('#panel').classList.add('open'));
}

async function closePanel() {
  $('#panel').classList.remove('open');
  $('#bd').style.display = 'none';
  openId = null;
  await flush();
  render();
}

$('#bd').onclick = closePanel;
$('#pc').onclick = closePanel;

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if ($('#search') === document.activeElement || searchQuery) {
      $('#search').value = '';
      searchQuery = '';
      searchWrap?.classList.remove('has-val');
      $('#search').blur();
      render();
      return;
    }
    if ($('#panel').classList.contains('open')) closePanel();
    else if (adding) { adding = false; render(); }
  } else if (e.key && (e.key === '/' || (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey))) && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
    e.preventDefault();
    $('#search').focus();
    $('#search').select?.();
  }
});

const fld = (k, label, type = 'text', extra = '') => `<label class="f">${label}</label><input type="${type}" data-k="${k}" ${extra}>`;
const area = (k, label, h) => `<label class="f">${label}</label><textarea data-k="${k}" style="min-height:${h}px"></textarea>`;

function openApp(id) {
  const a = S.apps.find(a => a.id === id);
  openId = id;
  const cat = a.category || 'Industry';

  openPanel(a.company, `
    <h4>Basics</h4>
    <label class="f">Section / Category</label>
    <div class="sec-pills" id="p_secs">
      <label class="sec-pill ${cat === 'Industry' ? 'active' : ''}" data-c="Industry"><input type="radio" name="p_cat" value="Industry" ${cat === 'Industry' ? 'checked' : ''}>${ICON.briefcase} Industry</label>
      <label class="sec-pill ${cat === 'Government' ? 'active' : ''}" data-c="Government"><input type="radio" name="p_cat" value="Government" ${cat === 'Government' ? 'checked' : ''}>${ICON.landmark} Government</label>
      <label class="sec-pill ${cat === 'Research' ? 'active' : ''}" data-c="Research"><input type="radio" name="p_cat" value="Research" ${cat === 'Research' ? 'checked' : ''}>${ICON.beaker} Research</label>
    </div>
    ${fld('company', 'Company / Organization')}
    ${fld('role', 'Role', 'text', 'list="roleList"')}
    <datalist id="roleList">${S.roles.map(r => `<option value="${esc(r)}">`).join('')}</datalist>
    <label class="f">Country</label>
    <div><input type="text" id="pc-country" autocomplete="off"></div>
    <div class="row">
      <div>${fld('city', 'City')}</div>
      <div>${fld('date_applied', 'Date applied', 'date')}</div>
    </div>
    <label class="f">Stage</label>
    <select data-k="stage">${STAGES.map(s => `<option>${s}</option>`).join('')}</select>

    <h4>Tags & Labels</h4>
    <div id="p_tags_wrap">
      <div id="p_tag_list" class="tag-list"></div>
      <div class="quick-tags">
        <span style="font-size:11px;color:var(--tx3);margin-right:2px">Suggestions:</span>
        <button type="button" class="quick-tag-btn" data-t="Referral">+ Referral</button>
        <button type="button" class="quick-tag-btn" data-t="Dream Job">+ Dream Job</button>
        <button type="button" class="quick-tag-btn" data-t="Cold Apply">+ Cold Apply</button>
        <button type="button" class="quick-tag-btn" data-t="Follow-up">+ Follow-up</button>
        <button type="button" class="quick-tag-btn" data-t="OA Pending">+ OA Pending</button>
      </div>
      <div class="tag-creator">
        <input type="text" id="p_new_tag" placeholder="Add custom tag (press Enter)" autocomplete="off">
        <button type="button" class="btn" id="p_add_tag_btn">Add</button>
      </div>
    </div>

    <h4>${ICON.clock} Activity Timeline</h4>
    <div id="p_timeline" class="timeline"><span style="font-size:11px;color:var(--tx3)">Loading timeline...</span></div>
    <div class="timeline-add">
      <input type="text" id="p_new_note" placeholder="Log milestone or note (press Enter)..." style="flex:1" autocomplete="off">
      <button type="button" class="btn" id="p_add_note_btn">Log</button>
    </div>

    <div class="email-box">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <h4 style="margin:0;border:0;padding:0;font-size:12px;font-weight:700;display:flex;align-items:center;gap:6px">${ICON.mail} Outreach Templates</h4>
        <button type="button" class="btn" id="p_cp_email" style="font-size:11px;padding:3px 9px">${ICON.copy} Copy Email</button>
      </div>
      <div class="cred-sub">One-click tailored templates matching current application status</div>
      <div class="template-pills" id="p_tpl_pills">
        <button type="button" class="tpl-btn" data-tpl="cold">Cold Outreach</button>
        <button type="button" class="tpl-btn" data-tpl="followup">14-Day Follow-Up</button>
        <button type="button" class="tpl-btn" data-tpl="thankyou">Interview Thank-You</button>
        <button type="button" class="tpl-btn" data-tpl="offer">Offer Negotiation</button>
      </div>
      <label class="f" style="margin-top:4px">Subject Line</label>
      <input type="text" id="p_email_subj" style="font-weight:500">
      <label class="f">Message Body</label>
      <textarea id="p_email_body" style="min-height:160px;font-size:12px;line-height:1.45"></textarea>
    </div>

    <div class="cred-card">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
        <h4 style="margin:0;border:0;padding:0;font-size:12px;font-weight:700">Portal Credentials</h4>
        <span class="cred-badge">${ICON.lock} Saved login</span>
      </div>
      <div class="cred-sub">Login & applicant account details for portals</div>
      <label class="f">Portal Login URL</label>
      <div class="input-act">
        <input type="url" data-k="portal_url" id="p_purl" placeholder="https://portal.example.gov/login">
        <a id="p_visit" class="btn" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:${a.portal_url ? 'inline-flex' : 'none'};align-items:center;gap:3px;white-space:nowrap">Visit ?</a>
      </div>
      <label class="f">User ID / Applicant Username</label>
      <div class="input-act">
        <input type="text" data-k="portal_user" id="p_puser" placeholder="e.g. app_user42 or email">
        <button type="button" class="btn" id="p_cp_user" title="Copy User ID">${ICON.copy} Copy</button>
      </div>
      <label class="f">Password / PIN</label>
      <div class="input-act">
        <input type="password" data-k="portal_pass" id="p_ppass" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;">
        <button type="button" class="btn" id="p_tpass" title="Show/Hide password">${ICON.eye} Show</button>
        <button type="button" class="btn" id="p_cp_pass" title="Copy password">${ICON.copy} Copy</button>
      </div>
      <label class="f">Portal Notes & Security Info</label>
      <textarea data-k="portal_notes" placeholder="Security questions/answers, confirmation PIN, applicant reference numbers..." style="min-height:55px"></textarea>
    </div>

    <h4>Job Description</h4>
    ${fld('jd_url', 'Job posting URL', 'url', 'placeholder="https://"')}
    ${area('jd', 'Full job description', 180)}

    <h4>What they're looking for</h4>
    ${area('looking_for', 'Key skills, requirements, takeaways', 130)}

    <h4>Documents</h4>
    ${renderDocSlotHtml('resume', 'Resume', ICON.filePdf, a.resume_path, a.id)}
    ${renderDocSlotHtml('cover', 'Cover Letter', ICON.fileWord, a.cover_letter_path, a.id)}

    <h4>Recruiter Contact</h4>
    ${fld('recruiter_name', 'Name')}
    ${fld('recruiter_email', 'Email', 'email')}
    ${area('recruiter_notes', 'Notes', 60)}

    <h4>Country & Compensation</h4>
    <label class="f">Visa / work authorization</label>
    <select data-k="visa">
      ${['','Not needed','Required','Sponsored','In progress'].map(v => `<option value="${v}">${v || '-'}</option>`).join('')}
    </select>
    <div class="row">
      <div>${fld('deadline', 'Application deadline', 'date')}</div>
      <div>${fld('salary', 'Salary / stipend', 'text', 'placeholder="e.g. 8,000 / month"')}</div>
      <div style="flex:.6">${fld('currency', 'Currency', 'text', 'placeholder="USD" list="curList"')}</div>
    </div>
    <datalist id="curList">${['USD','GBP','EUR','SGD','INR','CHF','CAD','AUD','JPY'].map(c => `<option>${c}</option>`).join('')}</datalist>
  `);

  const pb = $('#pbody');

  // ---------- Tags Manager ----------
  const renderPanelTags = () => {
    const listEl = pb.querySelector('#p_tag_list');
    const tags = getAppTags(a);
    if (!tags.length) {
      listEl.innerHTML = `<span style="font-size:11.5px;color:var(--tx3);font-style:italic">No tags added yet</span>`;
      return;
    }
    listEl.innerHTML = tags.map((t, idx) => `
      <span class="tag-chip" style="background:${t.bg};color:${t.text};border-color:${t.border}">
        <span class="tag-dot" style="background:${t.color}"></span>
        ${esc(t.name)}
        <button type="button" class="tag-chip-del" data-idx="${idx}" title="Remove tag">&times;</button>
      </span>
    `).join('');

    listEl.querySelectorAll('.tag-chip-del').forEach(btn => {
      btn.onclick = () => {
        const idx = +btn.dataset.idx;
        const curTags = getAppTags(a);
        curTags.splice(idx, 1);
        a.custom_tags = curTags.map(t => t.raw).join(',');
        queue(`a${id}custom_tags`, () => api('PATCH', '/applications/' + id, { custom_tags: a.custom_tags }));
        renderPanelTags();
        render();
      };
    });
  };

  const addTag = name => {
    const trimmed = (name || '').trim().replace(/[,:|]/g, ' ');
    if (!trimmed) return;
    const curTags = getAppTags(a);
    if (curTags.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) return;
    const item = parseTag(trimmed);
    curTags.push(item);
    a.custom_tags = curTags.map(t => t.raw).join(',');
    queue(`a${id}custom_tags`, () => api('PATCH', '/applications/' + id, { custom_tags: a.custom_tags }));
    renderPanelTags();
    render();
  };

  pb.querySelectorAll('.quick-tag-btn').forEach(btn => {
    btn.onclick = () => addTag(btn.dataset.t);
  });

  const tagInput = pb.querySelector('#p_new_tag');
  pb.querySelector('#p_add_tag_btn').onclick = () => {
    addTag(tagInput.value);
    tagInput.value = '';
    tagInput.focus();
  };
  tagInput.onkeydown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput.value);
      tagInput.value = '';
    }
  };
  renderPanelTags();

  // ---------- Activity Timeline ----------
  const loadTimeline = async () => {
    const tEl = pb.querySelector('#p_timeline');
    try {
      const entries = await api('GET', `/activity/${id}`);
      if (!entries || !entries.length) {
        tEl.innerHTML = `<span style="font-size:11.5px;color:var(--tx3);font-style:italic">No activity logged yet</span>`;
        return;
      }
      tEl.innerHTML = entries.map(e => {
        let nodeIcon = ICON.note;
        if (e.type === 'created') nodeIcon = ICON.applied;
        else if (e.type === 'stage_change') {
          if (e.detail.includes('Offer')) nodeIcon = ICON.offer;
          else if (e.detail.includes('Interview')) nodeIcon = ICON.interview;
          else if (e.detail.includes('Rejected')) nodeIcon = ICON.rejected;
          else nodeIcon = ICON.refresh;
        }
        let dStr = e.ts || '';
        try {
          const d = new Date(e.ts.includes('T') ? e.ts : e.ts.replace(' ', 'T') + 'Z');
          if (!isNaN(d)) dStr = `${MON[d.getMonth()]} ${d.getDate()} &middot; ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } catch (_) {}
        return `
          <div class="timeline-item">
            <div class="timeline-node">${nodeIcon}</div>
            <div class="timeline-date">${esc(dStr)}</div>
            <div class="timeline-text">${esc(e.detail)}</div>
          </div>
        `;
      }).join('');
    } catch (_) {
      tEl.innerHTML = `<span style="font-size:11px;color:var(--tx3)">Could not load timeline</span>`;
    }
  };
  loadTimeline();

  const addTimelineNote = async () => {
    const nInp = pb.querySelector('#p_new_note');
    const txt = nInp.value.trim();
    if (!txt) return;
    await api('POST', '/activity', { app_id: id, type: 'note', detail: txt });
    nInp.value = '';
    loadTimeline();
  };
  pb.querySelector('#p_add_note_btn').onclick = addTimelineNote;
  pb.querySelector('#p_new_note').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); addTimelineNote(); } };

  // ---------- Email Templates ----------
  const tpls = generateEmailTemplates(a, S.profile);
  let activeTplKey = 'cold';
  if (a.stage === 'Offer') activeTplKey = 'offer';
  else if (a.stage === 'Interviewing') activeTplKey = 'thankyou';
  else if (a.stage === 'Applied' && a.date_applied) {
    const days = (Date.now() - new Date(a.date_applied).getTime()) / 86400000;
    if (days >= 14) activeTplKey = 'followup';
  }

  const setTemplate = k => {
    activeTplKey = k;
    pb.querySelectorAll('#p_tpl_pills .tpl-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tpl === k));
    const tpl = tpls[k] || tpls.cold;
    pb.querySelector('#p_email_subj').value = tpl.subject;
    pb.querySelector('#p_email_body').value = tpl.body;
  };

  pb.querySelectorAll('#p_tpl_pills .tpl-btn').forEach(btn => {
    btn.onclick = () => setTemplate(btn.dataset.tpl);
  });
  setTemplate(activeTplKey);

  pb.querySelector('#p_cp_email').onclick = e => {
    const subj = pb.querySelector('#p_email_subj').value;
    const body = pb.querySelector('#p_email_body').value;
    const full = `Subject: ${subj}\n\n${body}`;
    navigator.clipboard?.writeText(full);
    const orig = e.currentTarget.innerHTML;
    e.currentTarget.innerHTML = `${ICON.check} Copied!`;
    setTimeout(() => e.currentTarget.innerHTML = orig, 1500);
  };

  pb.querySelectorAll('#p_secs .sec-pill').forEach(p => {
    p.onclick = () => {
      const c = p.dataset.c;
      a.category = c;
      pb.querySelectorAll('#p_secs .sec-pill').forEach(x => x.classList.toggle('active', x.dataset.c === c));
      queue(`a${id}category`, () => api('PATCH', '/applications/' + id, { category: c }));
      render();
    };
  });

  const purl = pb.querySelector('#p_purl'), pvisit = pb.querySelector('#p_visit');
  const updateVisit = () => {
    const u = purl.value.trim();
    if (u) {
      pvisit.href = /^https?:\/\//i.test(u) ? u : 'https://' + u;
      pvisit.style.display = 'inline-flex';
    } else {
      pvisit.style.display = 'none';
    }
  };
  purl.addEventListener('input', updateVisit);

  const copyVal = (val, btn) => {
    if (!val) return;
    navigator.clipboard?.writeText(val);
    const orig = btn.innerHTML;
    btn.innerHTML = `${ICON.check} Copied!`;
    setTimeout(() => btn.innerHTML = orig, 1500);
  };

  pb.querySelector('#p_cp_user').onclick = e => copyVal(pb.querySelector('#p_puser').value, e.currentTarget);
  pb.querySelector('#p_cp_pass').onclick = e => copyVal(pb.querySelector('#p_ppass').value, e.currentTarget);
    // Wire up modern interactive document upload slots for Edit Panel
  wireDocSlot('p_resume', 'resume', 'Resume', ICON.filePdf, id, () => a.resume_path, p => {
    a.resume_path = p;
    queue('a' + id + 'resume_path', () => api('PATCH', '/applications/' + id, { resume_path: p }));
    render();
  });
  wireDocSlot('p_cover', 'cover', 'Cover Letter', ICON.fileWord, id, () => a.cover_letter_path, p => {
    a.cover_letter_path = p;
    queue('a' + id + 'cover_letter_path', () => api('PATCH', '/applications/' + id, { cover_letter_path: p }));
    render();
  });
  pb.querySelector('#p_tpass').onclick = e => {
    const inp = pb.querySelector('#p_ppass');
    const isPass = inp.type === 'password';
    inp.type = isPass ? 'text' : 'password';
    e.currentTarget.innerHTML = isPass ? `${ICON.eyeOff} Hide` : `${ICON.eye} Show`;
  };

  pb.querySelectorAll('[data-k]').forEach(el => {
    const k = el.dataset.k;
    el.value = a[k] ?? '';
    el.addEventListener('input', () => {
      let v = el.value;
      if (k === 'stage') {
        a.stage = v;
        a.position = 1e9;
        flush().then(() => api('POST', `/applications/${id}/move`, { stage: v, before: null }));
        doMove(id, v, null);
        api('POST', '/activity', { app_id: id, type: 'stage_change', detail: `Stage updated to ${v}` }).then(loadTimeline);
        openId = id;
        return;
      }
      a[k] = v;
      $('#pt').textContent = a.company;
      queue(`a${id}${k}`, () => api('PATCH', '/applications/' + id, { [k]: v }));
      if (k === 'role' && v.trim() && !S.roles.includes(v.trim())) {
        queue('role' + id, () => {
          S.roles.push(v.trim());
          return api('POST', '/roles', { name: v.trim() });
        }, 900);
      }
      render();
    });
  });

  countryField($('#pc-country'), () => a.country, c => {
    a.country = c;
    queue(`a${id}country`, () => api('PATCH', '/applications/' + id, { country: c }));
    render();
  });
}

/* ----- Boot Initialization ----- */
(async () => {
  renderSkeletons();
  initTheme();
  bindThemeToggle();
  initMobileNavigation();
  [S, LOGOS] = await Promise.all([
    api('GET', '/state'),
    fetch('/logos.json').then(r => r.json()).catch(() => ({}))
  ]);
  try { S.filter = JSON.parse(S.settings.filter || '[]'); } catch { S.filter = []; }
  currentSec = S.settings.section || 'All';
  render();
})();
/* ---------------------------------------------------------------
   ?? Word Doc (.docx) & PDF Previewer Controller
   --------------------------------------------------------------- */
function cleanFilePath(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let p = raw.trim();
  p = p.replace(/^["'\s]+|["'\s]+$/g, '');
  if (p.startsWith('file:///')) p = decodeURIComponent(p.replace(/^file:\/\/\/?/, ''));
  p = p.replace(/^["'\s]+|["'\s]+$/g, '');
  return p;
}

window.openDoc = function(url) {
  if (!url || url.trim().toUpperCase() === 'NA') {
    toast('No document attached');
    return;
  }
  const cleanP = cleanFilePath(url);
  window.open(cleanP, '_blank');
};

window.openDocPreviewForApp = function(appId, type) {
  const app = (S.apps || []).find(x => x.id === Number(appId));
  if (!app) return;
  const rawPath = type === 'resume' ? app.resume_path : app.cover_letter_path;
  openDoc(rawPath);
};

window.copyDocPathForApp = function(appId, type, el) {
  const app = (S.apps || []).find(x => x.id === Number(appId));
  if (!app) return;
  const rawPath = type === 'resume' ? app.resume_path : app.cover_letter_path;
  const cleanP = cleanFilePath(rawPath);
  if (!cleanP || cleanP.toUpperCase() === 'NA') {
    toast('No path to copy');
    return;
  }
  copyVal(cleanP, el);
};

async function handleDocumentUpload(file, key, appId, targetInputEl, triggerBtn) {
  if (!file) return;
  const originalBtnHtml = triggerBtn ? triggerBtn.innerHTML : null;
  if (triggerBtn) {
    triggerBtn.disabled = true;
    triggerBtn.innerHTML = '<span class="spinner-sm"></span> Uploading...';
  }
  toast(`Uploading ${file.name}...`);
  try {
    const docType = key === 'cover_letter_path' ? 'cover_letter' : 'resume';
    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = err => reject(err);
      reader.readAsDataURL(file);
    });
    const savedFolder2 = localStorage.getItem('user_gdrive_folder_id');

    const resp = await fetch('/api/upload-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: file.name,
        data: base64Data,
        type: docType,
        appId: appId || undefined,
        folderId: savedFolder2 || undefined
      })
    });
    const res = await resp.json();
    if (res && res.ok) {
      const savedPath = res.fullPath || res.path;
      if (targetInputEl) {
        targetInputEl.value = savedPath;
        targetInputEl.dispatchEvent(new Event('input'));
      }
      const panelInput = $(`#panel [data-k="${key}"]`);
      if (panelInput && panelInput !== targetInputEl) {
        panelInput.value = savedPath;
        panelInput.dispatchEvent(new Event('input'));
      }
      if (appId) {
        const app = (S.apps || []).find(x => x.id === Number(appId));
        if (app) {
          app[key] = savedPath;
          render();
        }
      }
      toast(`Attached: ${file.name}`);
    } else {
      toast('Upload failed: ' + ((res && res.error) || 'Server error'), true);
    }
  } catch (err) {
    toast('Upload failed: ' + err.message, true);
  } finally {
    if (triggerBtn) {
      triggerBtn.disabled = false;
      triggerBtn.innerHTML = originalBtnHtml || 'Upload';
    }
  }
}

// Sync streak HUD in index.html
window.syncGamifyHud = function() {
  fetch('/api/gamification')
    .then(r => r.json())
    .then(stats => {
      const isFrozen = stats.isFrozen || stats.todayFrozen;
      const streak = stats.streak || 0;
      const el = document.getElementById('hudStreakText');
      if (el) {
        el.textContent = streak + 'd' + (isFrozen ? ' ❄️' : '');
        if (isFrozen) el.title = 'Streak Frozen: ' + streak + ' days';
      }
      const badge = document.getElementById('learningModeBadge');
      if (badge) {
        const iconSvg = isFrozen
          ? '❄️ '
          : '<svg class="icon-inline flame-icon-svg" viewBox="0 0 24 24" width="15" height="15" stroke="#f97316" stroke-width="2" fill="none"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg> ';
        badge.innerHTML = iconSvg + streak + 'd';
      }
    })
    .catch(() => {});
};
document.addEventListener('DOMContentLoaded', () => {
  if (typeof window.syncGamifyHud === 'function') window.syncGamifyHud();
});

async function openDriveFilePicker(type, onSelect) {
  toast('Loading files from Google Drive...');
  try {
    const res = await api('GET', '/gdrive-files?type=' + encodeURIComponent(type));
    if (!res || !res.files || !res.files.length) {
      toast('No files found in your Google Drive ' + type + ' folder', true);
      return;
    }
    const overlay = document.createElement('div');
    overlay.className = 'confirm-modal-overlay';
    overlay.style.zIndex = '9999';
    overlay.innerHTML = `
      <div class="confirm-modal-box" style="max-width:540px;width:95%;">
        <div class="confirm-modal-header">
          <div class="confirm-modal-icon" style="background:#eff6ff;color:#2563eb;">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M19 18H6a4 4 0 0 1-4-4 4 4 0 0 1 4-4 5.5 5.5 0 0 1 10.7-1.5A4 4 0 0 1 20 14a4 4 0 0 1-1 4z"/></svg>
          </div>
          <div>
            <h3 class="confirm-modal-title">Select ${type === 'cover' || type === 'cover_letter' ? 'Cover Letter' : 'Resume'} from Google Drive</h3>
            <p class="confirm-modal-text">Files in your job_kanban_board/${type} Drive folder</p>
          </div>
          <button type="button" class="btn icon-only" id="closeGdrivePicker">&times;</button>
        </div>
        <div style="max-height:360px;overflow-y:auto;margin:16px 0;display:flex;flex-direction:column;gap:8px;">
          ${res.files.map(f => `
            <div class="gdrive-file-item" data-url="${f.url}" data-name="${f.name}" style="padding:10px 14px;border:1px solid var(--bd);border-radius:8px;background:var(--surface);cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:all 0.15s ease;">
              <div style="display:flex;align-items:center;gap:10px;min-width:0;">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#2563eb"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                <span style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:320px;">${esc(f.name)}</span>
              </div>
              <button type="button" class="btn sm primary select-gdrive-btn">Select</button>
            </div>
          `).join('')}
        </div>
        <div class="confirm-modal-actions" style="justify-content:space-between;">
          <a href="https://drive.google.com/drive/folders/${res.folderId}" target="_blank" class="btn sm" style="text-decoration:none;">📂 Open Drive Folder</a>
          <button type="button" class="btn sm" id="cancelGdrivePicker">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => { overlay.remove(); };
    overlay.querySelector('#closeGdrivePicker').onclick = close;
    overlay.querySelector('#cancelGdrivePicker').onclick = close;
    overlay.onclick = e => { if (e.target === overlay) close(); };

    overlay.querySelectorAll('.gdrive-file-item').forEach(item => {
      item.onclick = () => {
        const u = item.dataset.url;
        const n = item.dataset.name;
        close();
        if (onSelect) onSelect(u, n);
      };
    });
  } catch (err) {
    toast('Error connecting to Google Drive: ' + err.message, true);
  }
}


function handleIndexLogout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  localStorage.setItem('logged_out', '1');
  window.location.href = '/profile.html';
}
