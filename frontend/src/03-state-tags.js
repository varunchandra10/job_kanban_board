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

