/**
 * Job Tracker - Universal 1-Click Job Clipper
 * Injected via bookmarklet on ANY job board or career page.
 * Uses isolated Shadow DOM to prevent style leaks.
 */
(function () {
  // Prevent duplicate instances
  const EXISTING_ID = '__job_tracker_clipper_host__';
  const existingHost = document.getElementById(EXISTING_ID);
  if (existingHost) {
    existingHost.remove();
    return;
  }

  // ---------------------------------------------------------------------------
  // 1. TIER 1-4 UNIVERSAL EXTRACTION ENGINE
  // ---------------------------------------------------------------------------

  function cleanString(str) {
    if (!str) return '';
    return String(str)
      .replace(/[\n\r\t]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function cleanHtml(html) {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return cleanString(tmp.textContent || tmp.innerText || '');
  }

  // Tier 1: Search Schema.org JobPosting in JSON-LD scripts
  function extractFromSchema() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        let data = JSON.parse(script.textContent || '{}');
        if (Array.isArray(data)) {
          data = data.find((item) => item?.['@type'] === 'JobPosting') || data[0];
        } else if (data['@graph'] && Array.isArray(data['@graph'])) {
          data = data['@graph'].find((item) => item?.['@type'] === 'JobPosting') || data;
        }

        if (data && (data['@type'] === 'JobPosting' || data.title || data.hiringOrganization)) {
          const role = cleanString(data.title || data.name || '');
          const company = cleanString(
            data.hiringOrganization?.name ||
            data.hiringOrganization?.legalName ||
            data.hiringOrganization ||
            ''
          );

          let location = '';
          if (data.jobLocationType === 'TELECOMMUTE' || data.applicantLocationRequirements) {
            location = 'Remote';
          }
          const addr = data.jobLocation?.address;
          if (addr) {
            const parts = [
              addr.addressLocality,
              addr.addressRegion,
              addr.addressCountry
            ].filter(Boolean);
            if (parts.length) {
              location = location ? `${parts.join(', ')} (${location})` : parts.join(', ');
            }
          }

          let salary = '';
          if (data.baseSalary) {
            const s = data.baseSalary;
            const currency = s.currency || 'USD';
            if (s.value?.minValue && s.value?.maxValue) {
              salary = `${currency} ${s.value.minValue} - ${s.value.maxValue}`;
            } else if (s.value?.value) {
              salary = `${currency} ${s.value.value}`;
            } else if (typeof s.value === 'string' || typeof s.value === 'number') {
              salary = `${currency} ${s.value}`;
            }
          }

          const description = cleanHtml(data.description || '').slice(0, 500);

          if (role || company) {
            return { role, company, location, salary, description, tier: 1 };
          }
        }
      } catch (_) {}
    }
    return null;
  }

  // Tier 2: OpenGraph, Meta Tags, and document.title Regex
  function extractFromMeta() {
    const ogTitle = document.querySelector('meta[property="og:title"]')?.content;
    const twTitle = document.querySelector('meta[name="twitter:title"]')?.content;
    const docTitle = document.title;
    const rawTitle = cleanString(ogTitle || twTitle || docTitle || '');

    const siteName = cleanString(
      document.querySelector('meta[property="og:site_name"]')?.content ||
      document.querySelector('meta[name="author"]')?.content ||
      ''
    );

    let company = '';
    let role = '';

    // Common job posting title patterns:
    // "Senior Backend Engineer at Stripe"
    // "Google is hiring Software Engineer"
    // "Frontend Developer - Airbnb - San Francisco, CA"
    // "Product Manager | Uber"
    const atMatch = rawTitle.match(/^(.+?)\s+at\s+([^-|•·]+)/i);
    const dashMatch = rawTitle.match(/^([^-|•·]+)\s*[-|•·]\s*([^-|•·]+)/);
    const hiringMatch = rawTitle.match(/^(.+?)\s+(?:is\s+)?hiring\s+(?:a\s+)?(.+)/i);

    if (atMatch) {
      role = cleanString(atMatch[1]);
      company = cleanString(atMatch[2]);
    } else if (hiringMatch) {
      company = cleanString(hiringMatch[1]);
      role = cleanString(hiringMatch[2]);
    } else if (dashMatch) {
      role = cleanString(dashMatch[1]);
      company = cleanString(dashMatch[2]);
    } else {
      role = rawTitle;
    }

    if (!company && siteName && !siteName.toLowerCase().includes('job')) {
      company = siteName;
    }

    const description = cleanString(
      document.querySelector('meta[property="og:description"]')?.content ||
      document.querySelector('meta[name="description"]')?.content ||
      ''
    ).slice(0, 500);

    return { role, company, description, tier: 2 };
  }

  // Tier 3: Universal DOM Fallbacks & Heuristics (Any website)
  function extractFromDOM() {
    // 1. Role from primary <h1>
    const h1 = document.querySelector('h1');
    const role = cleanString(h1?.innerText || document.title || 'Software Engineer');

    // 2. Company from Hostname / URL Path
    let company = '';
    const host = window.location.hostname.toLowerCase();
    const pathParts = window.location.pathname.split('/').filter(Boolean);

    if (host.includes('lever.co') && pathParts.length >= 1) {
      company = pathParts[0];
    } else if (host.includes('greenhouse.io') && pathParts.length >= 1) {
      company = pathParts[0];
    } else if (host.includes('workday.com')) {
      const match = host.match(/([^.]+)\.wd\d+\.myworkdayjobs\.com/);
      company = match ? match[1] : '';
    }

    if (!company) {
      const cleanHost = host.replace(/^(careers|jobs|boards|www|app)\./, '');
      const domainName = cleanHost.split('.')[0] || '';
      company = domainName ? domainName.charAt(0).toUpperCase() + domainName.slice(1) : '';
    }

    // 3. Scan for salary currency formats in text
    let salary = '';
    const text = document.body ? document.body.innerText.slice(0, 10000) : '';
    const inrMatch = text.match(/(?:₹|INR)\s*([0-9]+(?:\.[0-9]+)?\s*(?:-|to)\s*[0-9]+(?:\.[0-9]+)?\s*(?:LPA|L|lakhs?)?)/i) ||
                     text.match(/([0-9]+(?:\.[0-9]+)?\s*(?:-|to)\s*[0-9]+(?:\.[0-9]+)?\s*LPA)/i);
    const usdMatch = text.match(/(\$\s*[0-9,]+(?:\s*-\s*\$?\s*[0-9,]+)?(?:\s*(?:k|K|\/yr|per year))?)/);
    const eurMatch = text.match(/(€\s*[0-9,]+(?:\s*-\s*€?\s*[0-9,]+)?)/);

    if (inrMatch) {
      salary = inrMatch[0].trim();
    } else if (usdMatch) {
      salary = usdMatch[0].trim();
    } else if (eurMatch) {
      salary = eurMatch[0].trim();
    }

    return { role, company, salary, tier: 3 };
  }

  // Tier 4: User-selected text on the page
  function getSelectedText() {
    const sel = window.getSelection();
    return sel ? cleanString(sel.toString()).slice(0, 1000) : '';
  }

  // Combine All Tiers
  const t1 = extractFromSchema();
  const t2 = extractFromMeta();
  const t3 = extractFromDOM();
  const selectedText = getSelectedText();

  const finalJob = {
    role: t1?.role || t2?.role || t3?.role || 'Software Engineer',
    company: t1?.company || t2?.company || t3?.company || 'Company',
    location: t1?.location || '',
    salary: t1?.salary || t3?.salary || '',
    notes: selectedText || t1?.description || t2?.description || '',
    url: window.location.href
  };

  // ---------------------------------------------------------------------------
  // 2. ISOLATED SHADOW-DOM FLOATING UI
  // ---------------------------------------------------------------------------

  const host = document.createElement('div');
  host.id = EXISTING_ID;
  host.style.all = 'initial';
  host.style.position = 'fixed';
  host.style.top = '16px';
  host.style.right = '16px';
  host.style.zIndex = '2147483647';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .card {
      width: 350px;
      background: #0f1117;
      color: #f1f5f9;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 20px;
      padding: 18px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.05);
      animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes slideIn {
      from { transform: translateY(-20px) scale(0.96); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: -0.2px;
      color: #ffffff;
    }
    .brand-badge {
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: white;
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 6px;
      font-weight: 900;
      letter-spacing: 0.5px;
    }
    .close-btn {
      background: rgba(255, 255, 255, 0.08);
      border: none;
      color: #94a3b8;
      width: 24px;
      height: 24px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      transition: all 0.15s;
    }
    .close-btn:hover {
      background: rgba(255, 255, 255, 0.18);
      color: #ffffff;
    }
    .field {
      margin-bottom: 11px;
    }
    .label {
      display: block;
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #94a3b8;
      margin-bottom: 4px;
    }
    input, textarea, select {
      width: 100%;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      padding: 8px 11px;
      color: #ffffff;
      font-size: 12.5px;
      font-weight: 500;
      outline: none;
      transition: all 0.15s;
    }
    input:focus, textarea:focus {
      border-color: #f97316;
      background: rgba(255, 255, 255, 0.08);
      box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2);
    }
    textarea {
      resize: vertical;
      min-height: 48px;
      max-height: 90px;
      font-size: 11.5px;
      line-height: 1.4;
    }
    .row {
      display: flex;
      gap: 8px;
    }
    .row .field {
      flex: 1;
      margin-bottom: 11px;
    }
    .stage-group {
      display: flex;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 3px;
      gap: 3px;
      margin-bottom: 14px;
    }
    .stage-btn {
      flex: 1;
      padding: 6px 0;
      text-align: center;
      font-size: 11.5px;
      font-weight: 700;
      border-radius: 7px;
      border: none;
      background: transparent;
      color: #94a3b8;
      cursor: pointer;
      transition: all 0.15s;
    }
    .stage-btn.active {
      background: #f97316;
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(249, 115, 22, 0.35);
    }
    .save-btn {
      width: 100%;
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: #ffffff;
      border: none;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.15s;
      box-shadow: 0 4px 15px rgba(249, 115, 22, 0.35);
    }
    .save-btn:hover {
      filter: brightness(1.08);
      transform: translateY(-1px);
    }
    .save-btn:active {
      transform: translateY(0);
    }
    .save-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    .status-msg {
      margin-top: 10px;
      padding: 8px 10px;
      border-radius: 8px;
      font-size: 11.5px;
      font-weight: 600;
      text-align: center;
      display: none;
    }
    .status-success {
      display: block;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      animation: fadeIn 0.2s;
    }
    .status-error {
      display: block;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
      animation: fadeIn 0.2s;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

  const container = document.createElement('div');
  container.className = 'card';
  container.innerHTML = `
    <div class="header">
      <div class="brand">
        <span>⚡ Job Tracker</span>
        <span class="brand-badge">CLIPPER</span>
      </div>
      <button type="button" class="close-btn" id="jt_close" title="Close">✕</button>
    </div>

    <div class="field">
      <label class="label">Company</label>
      <input type="text" id="jt_company" value="${finalJob.company.replace(/"/g, '&quot;')}" placeholder="e.g. Stripe" />
    </div>

    <div class="field">
      <label class="label">Job Title / Role</label>
      <input type="text" id="jt_role" value="${finalJob.role.replace(/"/g, '&quot;')}" placeholder="e.g. Software Engineer" />
    </div>

    <div class="row">
      <div class="field">
        <label class="label">Location</label>
        <input type="text" id="jt_location" value="${finalJob.location.replace(/"/g, '&quot;')}" placeholder="e.g. Remote / Bengaluru" />
      </div>
      <div class="field">
        <label class="label">Salary</label>
        <input type="text" id="jt_salary" value="${finalJob.salary.replace(/"/g, '&quot;')}" placeholder="e.g. ₹25 LPA" />
      </div>
    </div>

    <label class="label">Kanban Column</label>
    <div class="stage-group" id="jt_stage_group">
      <button type="button" class="stage-btn active" data-stage="Applied">Applied (Streak +1)</button>
      <button type="button" class="stage-btn" data-stage="Wishlist">Wishlist / To Apply</button>
    </div>

    <div class="field">
      <label class="label">Notes / Highlighted Snippet</label>
      <textarea id="jt_notes" placeholder="Highlighted text or personal notes...">${finalJob.notes}</textarea>
    </div>

    <button type="button" class="save-btn" id="jt_save">
      <span>💾 Save to Kanban Board</span>
    </button>

    <div class="status-msg" id="jt_status"></div>
  `;

  shadow.appendChild(style);
  shadow.appendChild(container);

  // ---------------------------------------------------------------------------
  // 3. INTERACTIVE LOGIC & BACKEND DISPATCH
  // ---------------------------------------------------------------------------

  let selectedStage = 'Applied';
  const stageButtons = shadow.querySelectorAll('.stage-btn');
  stageButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      stageButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedStage = btn.dataset.stage || 'Applied';
    });
  });

  // Close handler
  const closeBtn = shadow.getElementById('jt_close');
  closeBtn.addEventListener('click', () => {
    host.remove();
  });

  // Save handler
  const saveBtn = shadow.getElementById('jt_save');
  const statusEl = shadow.getElementById('jt_status');

  saveBtn.addEventListener('click', async () => {
    const company = shadow.getElementById('jt_company').value.trim();
    const role = shadow.getElementById('jt_role').value.trim();
    const location = shadow.getElementById('jt_location').value.trim();
    const salary = shadow.getElementById('jt_salary').value.trim();
    const notes = shadow.getElementById('jt_notes').value.trim();

    if (!company) {
      statusEl.className = 'status-msg status-error';
      statusEl.textContent = 'Please enter a company name.';
      return;
    }

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span>⏳ Saving to Board...</span>';
    statusEl.className = 'status-msg';
    statusEl.style.display = 'none';

    // Retrieve server target & token from bookmarklet wrapper
    const targetOrigin = window._JT_ORIGIN || 'https://kanban-board-job.vercel.app';
    const authToken = window._JT_TOKEN || localStorage.getItem('job_tracker_token') || '';

    const payload = {
      company,
      role: role || 'Software Engineer',
      stage: selectedStage,
      salary,
      city: location,
      jd_url: window.location.href,
      jd: notes.slice(0, 500),
      portal_notes: notes,
      custom_tags: 'Clipped'
    };

    try {
      const res = await fetch(`${targetOrigin}/api/clipper/quick-add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        statusEl.className = 'status-msg status-success';
        const streakText = data.gamification?.streak ? ` • 🔥 Streak: ${data.gamification.streak}d` : '';
        statusEl.innerHTML = `✓ Saved to ${selectedStage}!${streakText}`;
        saveBtn.innerHTML = '<span>✓ Saved Successfully!</span>';

        setTimeout(() => {
          host.style.transition = 'all 0.3s ease';
          host.style.opacity = '0';
          host.style.transform = 'translateY(-15px)';
          setTimeout(() => host.remove(), 300);
        }, 1800);
      } else if (res.status === 401 || data.loggedOut) {
        statusEl.className = 'status-msg status-error';
        statusEl.innerHTML = `⚠️ Sign in to Job Tracker to save cards.<br><a href="${targetOrigin}" target="_blank" style="color: #60a5fa; text-decoration: underline; font-weight: 700;">Click here to sign in</a>`;
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<span>Retry Save</span>';
      } else {
        throw new Error(data.error || 'Failed to save application');
      }
    } catch (err) {
      statusEl.className = 'status-msg status-error';
      statusEl.textContent = `Error: ${err.message || 'Could not connect to server'}`;
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<span>💾 Try Again</span>';
    }
  });
})();

