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

