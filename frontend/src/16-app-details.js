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

