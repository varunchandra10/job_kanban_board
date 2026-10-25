/**
 * Reusable Web Components for Job Application Tracker
 * Consolidates Navigation Headers and Auth Modals across all HTML pages.
 */

class AppHeader extends HTMLElement {
  connectedCallback() {
    const active = this.getAttribute('active') || 'board';
    const showSearch = this.getAttribute('show-search') === 'true';
    const searchPlaceholder = this.getAttribute('search-placeholder') || 
      (active === 'learnings' ? 'Search concepts, notes, topics, tags...' : 'Search company, role, notes...');

    this.innerHTML = `
      <header>
        <a href="/index.html" class="h-logo" style="text-decoration:none;color:inherit;">
          <img src="/logo.svg" alt="Job Tracker Logo" width="32" height="32" style="border-radius:9px;box-shadow:0 3px 10px rgba(99,102,241,0.3);">
          <h1>Job Tracker</h1>
        </a>

        <!-- Main Navigation: Mode Tabs (Job Applications & Learnings) -->
        <div class="mode-switcher-container" role="tablist" aria-label="View Modes">
          <a href="/board.html" class="mode-tab-btn ${active === 'board' ? 'active' : ''}" id="btnModeApps" role="tab" aria-selected="${active === 'board' ? 'true' : 'false'}" title="Kanban Board & Job Applications" style="text-decoration:none;">
            <span class="mode-tab-icon"><svg class="icon-inline" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></span>
            <span class="mode-tab-text">Job Applications</span>
            <span class="mode-tab-badge" id="appModeBadge">0</span>
          </a>
          <a href="/learnings.html" class="mode-tab-btn ${active === 'learnings' ? 'active' : ''}" id="btnModeLearnings" role="tab" aria-selected="${active === 'learnings' ? 'true' : 'false'}" title="Daily Learnings & Streak" style="text-decoration:none;">
            <span class="mode-tab-icon"><svg class="icon-inline" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></span>
            <span class="mode-tab-text">Learnings</span>
            <span class="mode-tab-badge streak-glow" id="learningModeBadge"><svg class="icon-inline flame-icon-svg" viewBox="0 0 24 24" width="15" height="15" stroke="#f97316" stroke-width="2" fill="none"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg> 0d</span>
          </a>
        </div>

        <span class="sp"></span>

        ${showSearch ? `
        <div class="search-wrap">
          <svg class="search-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input type="text" id="search" class="search-input" placeholder="${searchPlaceholder}" autocomplete="off">
          <kbd class="search-kbd" title="Press / or Ctrl+K to search">/</kbd>
          <button type="button" id="searchClear" class="search-clear" aria-label="Clear search">&times;</button>
        </div>` : ''}

        <!-- Streak Pill -->
        <a href="/learnings.html" class="gamify-hud-pill streak-pill-compact" id="gamifyHudPill" title="Daily Learning Streak (Click to view Learnings)" style="text-decoration:none;cursor:pointer;">
          <span class="hud-flame-icon"><svg class="icon-inline flame-icon-svg" viewBox="0 0 24 24" width="15" height="15" stroke="#f97316" stroke-width="2.2" fill="none"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg></span>
          <span class="hud-streak-count" id="hudStreakText">0d</span>
        </a>

        <!-- User Profile & Switcher Link -->
        <a href="/profile.html" class="btn icon-only ${active === 'profile' ? 'active' : ''}" id="profileBtn" title="User Profile & Settings" aria-label="User Profile" style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;position:relative;">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span id="headerUserDot" style="display:none;position:absolute;top:4px;right:4px;width:7px;height:7px;border-radius:50%;background:#6366f1;"></span>
        </a>

        <!-- Light/Dark Theme Toggle -->
        <button class="btn icon-only" id="tbtn" title="Toggle light/dark theme" aria-label="Toggle theme">
          <svg class="icon i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          <svg class="icon i-moon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>

        <!-- Topbar Auth Wrap -->
        <span id="topbarAuthWrap">
          <button class="btn icon-only" id="profLogoutBtn" onclick="if(typeof handleTopbarLogout==='function') handleTopbarLogout();" title="Log Out of Session" aria-label="Log Out" style="color: #ef4444;">
            <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </span>

        <!-- Server Shutdown Button -->
        <button class="btn icon-only" id="shutdownBtn" title="Shutdown Server" aria-label="Shutdown Server" style="color:var(--tx3);margin-left:2px;">
          <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
            <line x1="12" y1="2" x2="12" y2="12"></line>
          </svg>
        </button>
      </header>
    `;

    // Initialize theme toggle and auth state
    if (typeof window.bindThemeToggle === 'function') {
      window.bindThemeToggle();
    } else {
      const tBtn = this.querySelector('#tbtn');
      if (tBtn) {
        tBtn.onclick = () => {
          const isDark = document.body.classList.contains('dark-mode') || document.documentElement.getAttribute('data-theme') === 'dark';
          const next = isDark ? 'light' : 'dark';
          document.documentElement.setAttribute('data-theme', next);
          document.body.classList.toggle('dark-mode', next === 'dark');
          localStorage.setItem('job_tracker_theme', next);
        };
      }
    }

    if (typeof window.syncTopbarAuthUI === 'function') {
      window.syncTopbarAuthUI();
    }
    if (typeof window.syncGamifyHud === 'function') {
      window.syncGamifyHud();
    }
  }
}

if (!customElements.get('app-header')) {
  customElements.define('app-header', AppHeader);
}

// Auto-inject CSS for custom element layout and auto-ensure Auth Modal
const compStyle = document.createElement('style');
compStyle.textContent = 'app-header { display: contents; }';
document.head.appendChild(compStyle);

document.addEventListener('DOMContentLoaded', () => {
  if (typeof window.ensureAuthModal === 'function') {
    window.ensureAuthModal();
  }
});
