
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

