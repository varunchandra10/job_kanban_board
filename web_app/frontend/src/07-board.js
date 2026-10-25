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
        <button type="button" class="card-action-menu-btn" title="Actions" aria-label="Quick Move & Actions" onclick="event.stopPropagation(); if (window.openCardActionsModal) window.openCardActionsModal(${a.id});">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><circle cx="12" cy="12" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
        </button>
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
      body.appendChild(d);
    });

    board.appendChild(col);
  });
}

