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

