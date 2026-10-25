// Sync streak HUD in index.html
window.syncGamifyHud = function() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  fetch(`/api/gamification?tz=${encodeURIComponent(tz)}`)
    .then(r => r.json())
    .then(stats => {
      const isFrozen = stats.isFrozen || stats.todayFrozen;
      const streak = stats.streak || 0;
      const el = document.getElementById('hudStreakText');
      if (el) {
        el.textContent = streak + 'd' + (isFrozen ? ' ❄️' : '');
        if (isFrozen) el.title = 'Streak Frozen: ' + streak + ' days';
      }
      const badge = document.getElementById('learningModeBadge');
      if (badge) {
        const iconSvg = isFrozen
          ? '❄️ '
          : '<svg class="icon-inline flame-icon-svg" viewBox="0 0 24 24" width="15" height="15" stroke="#f97316" stroke-width="2" fill="none"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg> ';
        badge.innerHTML = iconSvg + streak + 'd';
      }
    })
    .catch(() => {});
};
document.addEventListener('DOMContentLoaded', () => {
  if (typeof window.syncGamifyHud === 'function') window.syncGamifyHud();
});


function handleIndexLogout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  localStorage.setItem('logged_out', '1');
  window.location.href = '/profile.html';
}


/* ----- Boot Initialization ----- */
(async () => {
  renderSkeletons();
  initTheme();
  bindThemeToggle();
  initMobileNavigation();
  [S, LOGOS] = await Promise.all([
    api('GET', '/state'),
    fetch('/logos.json').then(r => r.json()).catch(() => ({}))
  ]);
  try { S.filter = JSON.parse(S.settings.filter || '[]'); } catch { S.filter = []; }
  currentSec = S.settings.section || 'All';
  window.render = render;
  window.S = S;
  window.openApp = openApp;
  window.openAddPanel = openAddPanel;
  render();
})();
