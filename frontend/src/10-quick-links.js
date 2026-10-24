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

