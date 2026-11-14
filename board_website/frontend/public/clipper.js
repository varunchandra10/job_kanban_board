/**
 * Job Tracker - 1-Click In-Page Job Clipper
 * Injected into the host page within an isolated Shadow DOM.
 * Pops out in the top-right corner of the active page.
 */
(function () {
  var HOST_ID = '__job_tracker_clipper_host__';
  var existing = document.getElementById(HOST_ID);
  if (existing) {
    existing.remove();
    return;
  }

  var origin = window._JT_ORIGIN || 'https://kanban-board-job.vercel.app';
  var token = window._JT_TOKEN || '';

  // 1. EXTRACTION CASCADE (Schema.org -> OpenGraph -> DOM -> Selection)
  var role = '', company = '', location = '', salary = '', notes = '', currency = 'USD';
  try {
    notes = window.getSelection().toString().trim();
  } catch (_) {}

  // Tier 1: Schema.org
  try {
    var scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (var i = 0; i < scripts.length; i++) {
      var d = JSON.parse(scripts[i].textContent || '{}');
      if (Array.isArray(d)) d = d.find(function (x) { return x && x['@type'] === 'JobPosting'; }) || d[0];
      if (d && d['@graph']) d = d['@graph'].find(function (x) { return x && x['@type'] === 'JobPosting'; }) || d;
      if (d && (d['@type'] === 'JobPosting' || d.title || d.hiringOrganization)) {
        role = d.title || d.name || '';
        company = (d.hiringOrganization && (d.hiringOrganization.name || d.hiringOrganization.legalName || d.hiringOrganization)) || '';
        if (d.jobLocationType === 'TELECOMMUTE') location = 'Remote';
        else if (d.jobLocation && d.jobLocation.address) {
          var a = d.jobLocation.address;
          location = [a.addressLocality, a.addressRegion, a.addressCountry].filter(Boolean).join(', ');
        }
        if (d.baseSalary && d.baseSalary.value) {
          var bs = d.baseSalary;
          salary = (bs.currency || '') + ' ' + (bs.value.value || (bs.value.minValue ? bs.value.minValue + '-' + bs.value.maxValue : bs.value));
        }
        break;
      }
    }
  } catch (_) {}

  // Tier 2: OpenGraph / Twitter / Title
  if (!role || !company) {
    var ogTitle = (document.querySelector('meta[property="og:title"]') || {}).content || '';
    var twTitle = (document.querySelector('meta[name="twitter:title"]') || {}).content || '';
    var siteName = (document.querySelector('meta[property="og:site_name"]') || {}).content || '';
    var t = ogTitle || twTitle || document.title || '';
    var am = t.match(/^(.+?)\s+(?:at|@)\s+([^-|–—·]+)/i);
    var dm = t.match(/^([^-|–—·]+)\s*[-|–—·]\s*(.+)$/);
    if (am) {
      if (!role) role = am[1].trim();
      if (!company) company = am[2].trim();
    } else if (dm) {
      if (!company) company = dm[1].trim();
      if (!role) role = dm[2].trim();
    }
    if (!company && siteName) company = siteName.trim();
  }

  // Tier 3: DOM Fallback
  if (!role) {
    var h1 = document.querySelector('h1');
    if (h1) role = h1.textContent.trim().replace(/\s+/g, ' ');
  }
  if (!company) {
    var hostName = window.location.hostname.replace(/^www\./, '').split('.')[0];
    company = hostName.charAt(0).toUpperCase() + hostName.slice(1);
  }

  // Currency & country heuristics
  var country = 'US';
  if (salary.includes('₹') || salary.toUpperCase().includes('LPA') || location.toLowerCase().includes('india') || location.toLowerCase().includes('bengaluru')) {
    currency = 'INR';
    country = 'IN';
  } else if (location.toLowerCase().includes('remote')) {
    country = 'REMOTE';
  }

  // 2. SHADOW DOM INJECTION
  var host = document.createElement('div');
  host.id = HOST_ID;
  host.style.position = 'fixed';
  host.style.top = '16px';
  host.style.right = '16px';
  host.style.width = '420px';
  host.style.maxWidth = 'calc(100vw - 32px)';
  host.style.maxHeight = 'calc(100vh - 32px)';
  host.style.zIndex = '2147483647';
  document.body.appendChild(host);

  var shadow = host.attachShadow({ mode: 'open' });

  var style = document.createElement('style');
  style.textContent = [
    '* { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Outfit", sans-serif; }',
    '.jt-card { background: #ffffff; color: #0f172a; border-radius: 20px; box-shadow: 0 20px 45px -10px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.08); display: flex; flex-direction: column; max-height: calc(100vh - 32px); overflow: hidden; animation: jtIn 0.22s cubic-bezier(0.16, 1, 0.3, 1); }',
    '@keyframes jtIn { from { opacity: 0; transform: translateY(-8px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }',
    '.jt-header { display: flex; items-center; justify-content: space-between; padding: 12px 16px; background: #ffffff; border-bottom: 1px solid #f1f5f9; }',
    '.jt-header-left { display: flex; align-items: center; gap: 8px; }',
    '.jt-icon-badge { width: 30px; height: 30px; border-radius: 9px; background: linear-gradient(135deg, #f97316, #ea580c); color: white; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 14px; box-shadow: 0 4px 10px rgba(234,88,12,0.25); }',
    '.jt-title { font-size: 13px; font-weight: 800; color: #0f172a; letter-spacing: -0.2px; }',
    '.jt-tag { font-size: 9px; font-weight: 800; text-transform: uppercase; background: #fff7ed; color: #ea580c; border: 1px solid #fed7aa; padding: 1px 6px; border-radius: 999px; margin-left: 4px; }',
    '.jt-sub { font-size: 10px; color: #94a3b8; }',
    '.jt-close-btn { background: none; border: none; font-size: 15px; color: #94a3b8; cursor: pointer; padding: 4px 8px; border-radius: 8px; transition: background 0.1s; }',
    '.jt-close-btn:hover { background: #f1f5f9; color: #334155; }',
    '.jt-body { padding: 12px 14px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; flex: 1; }',
    '.jt-section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }',
    '.jt-sec-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; display: flex; align-items: center; justify-content: space-between; }',
    '.jt-required { font-size: 9px; color: #ef4444; background: #fef2f2; padding: 1px 5px; border-radius: 4px; font-weight: 700; }',
    '.jt-cat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }',
    '.jt-cat-pill { border: 1px solid #cbd5e1; background: #ffffff; border-radius: 10px; padding: 6px 4px; text-align: center; cursor: pointer; transition: all 0.15s; }',
    '.jt-cat-pill.active { background: #eff6ff; border-color: #3b82f6; color: #1d4ed8; font-weight: 700; box-shadow: 0 1px 3px rgba(59,130,246,0.15); }',
    '.jt-cat-name { font-size: 10.5px; font-weight: 700; display: block; }',
    '.jt-cat-sub { font-size: 8.5px; color: #94a3b8; display: block; margin-top: 1px; }',
    '.jt-field { display: flex; flex-direction: column; gap: 3px; }',
    '.jt-label { font-size: 10.5px; font-weight: 600; color: #475569; }',
    '.jt-input, .jt-select, .jt-textarea { width: 100%; border: 1px solid #cbd5e1; border-radius: 9px; padding: 6px 9px; font-size: 11.5px; background: #ffffff; color: #0f172a; outline: none; transition: border-color 0.12s, box-shadow 0.12s; }',
    '.jt-input:focus, .jt-select:focus, .jt-textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 2.5px rgba(59,130,246,0.15); }',
    '.jt-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }',
    '.jt-row-salary { display: grid; grid-template-columns: 2fr 1fr; gap: 8px; }',
    '.jt-footer { padding: 10px 14px; background: #ffffff; border-top: 1px solid #f1f5f9; display: flex; items-center; justify-content: space-between; gap: 8px; }',
    '.jt-btn-cancel { border: 1px solid #cbd5e1; background: #ffffff; color: #475569; font-weight: 700; font-size: 11.5px; padding: 7px 14px; border-radius: 10px; cursor: pointer; }',
    '.jt-btn-cancel:hover { background: #f8fafc; }',
    '.jt-btn-save { flex: 1; border: none; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; font-weight: 800; font-size: 12px; padding: 8px 16px; border-radius: 10px; cursor: pointer; box-shadow: 0 4px 12px rgba(234,88,12,0.3); transition: transform 0.1s, opacity 0.1s; display: flex; align-items: center; justify-content: center; gap: 5px; }',
    '.jt-btn-save:hover { opacity: 0.95; transform: scale(1.01); }',
    '.jt-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }',
    '.jt-upload-btn { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 7px 10px; background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 9px; font-size: 11px; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.15s; }',
    '.jt-upload-btn:hover { background: #f1f5f9; border-color: #94a3b8; color: #0f172a; }',
    '.jt-file-pill { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 10px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 9px; font-size: 11px; }',
    '.jt-file-name { color: #1d4ed8; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 300px; }',
    '.jt-remove-file { background: none; border: none; color: #ef4444; font-weight: bold; font-size: 13px; cursor: pointer; padding: 2px 5px; line-height: 1; border-radius: 4px; }',
    '.jt-remove-file:hover { background: #fee2e2; }'
  ].join('\n');
  shadow.appendChild(style);

  var card = document.createElement('div');
  card.className = 'jt-card';
  card.innerHTML = [
    '<div class="jt-header">',
    '  <div class="jt-header-left">',
    '    <div class="jt-icon-badge">⚡</div>',
    '    <div>',
    '      <div style="display:flex;align-items:center;">',
    '        <span class="jt-title">1-Click Job Clipper</span>',
    '        <span class="jt-tag">Popout</span>',
    '      </div>',
    '      <div class="jt-sub">Saving directly to Kanban pipeline</div>',
    '    </div>',
    '  </div>',
    '  <button class="jt-close-btn" id="jt-btn-close">✕</button>',
    '</div>',

    '<div class="jt-body">',
    '  <!-- Category -->',
    '  <div class="jt-section">',
    '    <div class="jt-sec-title"><span>💼 TARGET CATEGORY</span></div>',
    '    <div class="jt-cat-grid">',
    '      <div class="jt-cat-pill active" data-cat="Industry"><span class="jt-cat-name">💼 Industry</span><span class="jt-cat-sub">Tech & Corp</span></div>',
    '      <div class="jt-cat-pill" data-cat="Government"><span class="jt-cat-name">🏛️ Gov</span><span class="jt-cat-sub">Public</span></div>',
    '      <div class="jt-cat-pill" data-cat="Research"><span class="jt-cat-name">🔬 Research</span><span class="jt-cat-sub">Academia</span></div>',
    '    </div>',
    '  </div>',

    '  <!-- Org & Role -->',
    '  <div class="jt-section">',
    '    <div class="jt-sec-title"><span>📄 ORGANIZATION & ROLE</span><span class="jt-required">Required</span></div>',
    '    <div class="jt-field">',
    '      <label class="jt-label">Company / Institution *</label>',
    '      <input class="jt-input" id="jt-inp-comp" value="' + company.replace(/"/g, '&quot;') + '" placeholder="e.g. FDES Technologies, Stripe" />',
    '    </div>',
    '    <div class="jt-field">',
    '      <label class="jt-label">Role / Designation</label>',
    '      <input class="jt-input" id="jt-inp-role" value="' + role.replace(/"/g, '&quot;') + '" placeholder="e.g. AI Engineer | Careers" />',
    '    </div>',
    '  </div>',

    '  <!-- Stage & Timeline -->',
    '  <div class="jt-section">',
    '    <div class="jt-sec-title"><span>🕒 STAGE & TIMELINE</span></div>',
    '    <div class="jt-field">',
    '      <label class="jt-label">Pipeline Stage</label>',
    '      <select class="jt-select" id="jt-sel-stage">',
    '        <option value="Applied" selected>Applied</option>',
    '        <option value="Bookmarked">Wishlist (Bookmarked)</option>',
    '        <option value="Interviewing">Interviewing</option>',
    '        <option value="Offer">Offer</option>',
    '      </select>',
    '    </div>',
    '    <div class="jt-row">',
    '      <div class="jt-field">',
    '        <label class="jt-label">Date Applied</label>',
    '        <input type="date" class="jt-input" id="jt-inp-date" value="' + new Date().toISOString().slice(0, 10) + '" />',
    '      </div>',
    '      <div class="jt-field">',
    '        <label class="jt-label">Deadline (optional)</label>',
    '        <input type="date" class="jt-input" id="jt-inp-dead" />',
    '      </div>',
    '    </div>',
    '  </div>',

    '  <!-- Location & Compensation -->',
    '  <div class="jt-section">',
    '    <div class="jt-sec-title"><span>📍 LOCATION & COMPENSATION</span></div>',
    '    <div class="jt-row">',
    '      <div class="jt-field">',
    '        <label class="jt-label">Country</label>',
    '        <select class="jt-select" id="jt-sel-country">',
    '          <option value="IN"' + (country === 'IN' ? ' selected' : '') + '>India (IN)</option>',
    '          <option value="US"' + (country === 'US' ? ' selected' : '') + '>United States (US)</option>',
    '          <option value="REMOTE"' + (country === 'REMOTE' ? ' selected' : '') + '>Remote / Worldwide</option>',
    '          <option value="GB">United Kingdom (GB)</option>',
    '          <option value="DE">Germany (DE)</option>',
    '          <option value="CA">Canada (CA)</option>',
    '          <option value="SG">Singapore (SG)</option>',
    '        </select>',
    '      </div>',
    '      <div class="jt-field">',
    '        <label class="jt-label">City / Workplace</label>',
    '        <input class="jt-input" id="jt-inp-city" value="' + location.replace(/"/g, '&quot;') + '" placeholder="e.g. Bengaluru, Remote" />',
    '      </div>',
    '    </div>',
    '    <div class="jt-row-salary">',
    '      <div class="jt-field">',
    '        <label class="jt-label">Salary / Package</label>',
    '        <input class="jt-input" id="jt-inp-sal" value="' + salary.replace(/"/g, '&quot;') + '" placeholder="e.g. ₹30 - 45 LPA" />',
    '      </div>',
    '      <div class="jt-field">',
    '        <label class="jt-label">Currency</label>',
    '        <select class="jt-select" id="jt-sel-curr">',
    '          <option value="INR"' + (currency === 'INR' ? ' selected' : '') + '>INR (₹)</option>',
    '          <option value="USD"' + (currency === 'USD' ? ' selected' : '') + '>USD ($)</option>',
    '          <option value="EUR">EUR (€)</option>',
    '          <option value="GBP">GBP (£)</option>',
    '        </select>',
    '      </div>',
    '    </div>',
    '  </div>',

    '  <!-- Links & Notes -->',
    '  <div class="jt-section">',
    '    <div class="jt-sec-title"><span>🔗 LINKS & HIGHLIGHTS</span></div>',
    '    <div class="jt-field">',
    '      <label class="jt-label">Job Posting URL</label>',
    '      <input class="jt-input" id="jt-inp-url" value="' + window.location.href.replace(/"/g, '&quot;') + '" />',
    '    </div>',
    '    <div class="jt-field">',
    '      <label class="jt-label">Notes & Highlights</label>',
    '      <textarea class="jt-textarea" id="jt-inp-notes" rows="2" placeholder="Captured notes or requirements...">' + notes.replace(/</g, '&lt;') + '</textarea>',
    '    </div>',
    '  </div>',
    '',
    '  <!-- Documents & Attachments -->',
    '  <div class="jt-section">',
    '    <div class="jt-sec-title"><span>📎 DOCUMENTS & ATTACHMENTS</span></div>',
    '    <div class="jt-field">',
    '      <label class="jt-label">Resume Document (.pdf, .docx)</label>',
    '      <input type="file" id="jt-file-resume" accept=".pdf,.doc,.docx" style="display:none;" />',
    '      <button type="button" class="jt-upload-btn" id="jt-btn-upload-resume">📄 Attach Resume (.pdf, .docx)</button>',
    '      <div class="jt-file-pill" id="jt-pill-resume" style="display:none;">',
    '        <span class="jt-file-name" id="jt-name-resume"></span>',
    '        <button type="button" class="jt-remove-file" id="jt-remove-resume">✕</button>',
    '      </div>',
    '    </div>',
    '    <div class="jt-field">',
    '      <label class="jt-label">Cover Letter (.pdf, .docx, .txt)</label>',
    '      <input type="file" id="jt-file-cover" accept=".pdf,.doc,.docx,.txt" style="display:none;" />',
    '      <button type="button" class="jt-upload-btn" id="jt-btn-upload-cover">✉️ Attach Cover Letter (.pdf, .docx, .txt)</button>',
    '      <div class="jt-file-pill" id="jt-pill-cover" style="display:none;">',
    '        <span class="jt-file-name" id="jt-name-cover"></span>',
    '        <button type="button" class="jt-remove-file" id="jt-remove-cover">✕</button>',
    '      </div>',
    '    </div>',
    '  </div>',
    '</div>',

    '<div class="jt-footer">',
    '  <button class="jt-btn-cancel" id="jt-btn-cancel">Cancel</button>',
    '  <button class="jt-btn-save" id="jt-btn-save">⚡ Save to Board</button>',
    '</div>'
  ].join('\n');

  shadow.appendChild(card);

  // Wire events
  var activeCat = 'Industry';
  var catPills = shadow.querySelectorAll('.jt-cat-pill');
  catPills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      catPills.forEach(function (p) { p.classList.remove('active'); });
      pill.classList.add('active');
      activeCat = pill.getAttribute('data-cat') || 'Industry';
    });
  });

  var closeBtn = shadow.getElementById('jt-btn-close');
  var cancelBtn = shadow.getElementById('jt-btn-cancel');
  var saveBtn = shadow.getElementById('jt-btn-save');

  // Document upload state & handlers
  var resumeFileData = null;
  var coverFileData = null;

  var inpFileResume = shadow.getElementById('jt-file-resume');
  var btnUploadResume = shadow.getElementById('jt-btn-upload-resume');
  var pillResume = shadow.getElementById('jt-pill-resume');
  var nameResume = shadow.getElementById('jt-name-resume');
  var removeResume = shadow.getElementById('jt-remove-resume');

  btnUploadResume.addEventListener('click', function () {
    inpFileResume.click();
  });

  inpFileResume.addEventListener('change', function () {
    var file = inpFileResume.files && inpFileResume.files[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('File too large (maximum 15MB)');
      inpFileResume.value = '';
      return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      resumeFileData = {
        name: file.name,
        data: e.target.result,
        mimeType: file.type || 'application/pdf'
      };
      nameResume.textContent = '📄 ' + file.name + ' (' + Math.round(file.size / 1024) + ' KB)';
      btnUploadResume.style.display = 'none';
      pillResume.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  });

  removeResume.addEventListener('click', function () {
    resumeFileData = null;
    inpFileResume.value = '';
    pillResume.style.display = 'none';
    btnUploadResume.style.display = 'flex';
  });

  var inpFileCover = shadow.getElementById('jt-file-cover');
  var btnUploadCover = shadow.getElementById('jt-btn-upload-cover');
  var pillCover = shadow.getElementById('jt-pill-cover');
  var nameCover = shadow.getElementById('jt-name-cover');
  var removeCover = shadow.getElementById('jt-remove-cover');

  btnUploadCover.addEventListener('click', function () {
    inpFileCover.click();
  });

  inpFileCover.addEventListener('change', function () {
    var file = inpFileCover.files && inpFileCover.files[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('File too large (maximum 15MB)');
      inpFileCover.value = '';
      return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      coverFileData = {
        name: file.name,
        data: e.target.result,
        mimeType: file.type || 'application/pdf'
      };
      nameCover.textContent = '✉️ ' + file.name + ' (' + Math.round(file.size / 1024) + ' KB)';
      btnUploadCover.style.display = 'none';
      pillCover.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  });

  removeCover.addEventListener('click', function () {
    coverFileData = null;
    inpFileCover.value = '';
    pillCover.style.display = 'none';
    btnUploadCover.style.display = 'flex';
  });

  function removePopout() {
    host.remove();
  }

  closeBtn.addEventListener('click', removePopout);
  cancelBtn.addEventListener('click', removePopout);

  saveBtn.addEventListener('click', function () {
    var comp = shadow.getElementById('jt-inp-comp').value.trim();
    if (!comp) {
      alert('Company name is required');
      return;
    }

    saveBtn.disabled = true;
    saveBtn.innerText = 'Saving...';

    var payload = {
      company: comp,
      role: shadow.getElementById('jt-inp-role').value.trim() || 'Software Engineer',
      stage: shadow.getElementById('jt-sel-stage').value,
      category: activeCat,
      date_applied: shadow.getElementById('jt-inp-date').value,
      deadline: shadow.getElementById('jt-inp-dead').value,
      country: shadow.getElementById('jt-sel-country').value,
      city: shadow.getElementById('jt-inp-city').value.trim(),
      salary: shadow.getElementById('jt-inp-sal').value.trim(),
      currency: shadow.getElementById('jt-sel-curr').value,
      jd_url: shadow.getElementById('jt-inp-url').value.trim(),
      portal_notes: shadow.getElementById('jt-inp-notes').value.trim(),
      custom_tags: 'Clipped'
    };

    if (resumeFileData) payload.resume_file = resumeFileData;
    if (coverFileData) payload.cover_letter_file = coverFileData;

    fetch(origin + '/api/clipper/quick-add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(payload)
    })
    .then(function (res) {
      if (!res.ok) throw new Error('Status ' + res.status);
      return res.json();
    })
    .then(function () {
      card.innerHTML = [
        '<div style="padding:32px 20px;text-align:center;">',
        '  <div style="width:52px;height:52px;border-radius:50%;background:#10b981;color:white;display:flex;align-items:center;justify-content:center;font-size:26px;margin:0 auto 12px;box-shadow:0 8px 20px rgba(16,185,129,0.35);">✓</div>',
        '  <h3 style="margin:0 0 6px;font-size:17px;font-weight:800;color:#0f172a;">Clipped to Board!</h3>',
        '  <p style="margin:0 0 12px;font-size:12px;color:#64748b;">Added <b>' + (payload.role || 'Job') + '</b> at <b>' + payload.company + '</b> to your ' + payload.stage + ' column.</p>',
        '  <div style="display:inline-block;padding:4px 12px;border-radius:20px;background:#ecfdf5;color:#059669;font-size:11px;font-weight:700;border:1px solid #a7f3d0;">+25 XP & Streak Protected 🎯</div>',
        '  <p style="margin:14px 0 0;font-size:10px;color:#94a3b8;">Closing popout...</p>',
        '</div>'
      ].join('\n');

      setTimeout(removePopout, 1300);
    })
    .catch(function (err) {
      // If fetch fails or is blocked by CSP, seamlessly fall back to top-right popup window!
      var q = '?company=' + encodeURIComponent(payload.company) +
        '&role=' + encodeURIComponent(payload.role) +
        '&location=' + encodeURIComponent(payload.city) +
        '&salary=' + encodeURIComponent(payload.salary) +
        '&url=' + encodeURIComponent(payload.jd_url) +
        '&notes=' + encodeURIComponent(payload.portal_notes);
      var w = 460, h = 740;
      var x = Math.max(0, (window.screen.availWidth || window.screen.width) - w - 20);
      window.open(origin + '/clipper' + q, 'jt_clipper', 'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=' + w + ',height=' + h + ',top=20,left=' + x);
      removePopout();
    });
  });
})();
