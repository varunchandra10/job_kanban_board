/* ----- Phase 2 UI/UX Engine: Theme, Skeletons & Mobile Bottom Sheet ----- */
function initTheme() {
  const saved = localStorage.getItem('theme') || localStorage.getItem('tracker_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  setTheme(theme);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.body.classList.toggle('dark-mode', theme === 'dark');
  try {
    localStorage.setItem('theme', theme);
    localStorage.setItem('tracker_theme', theme);
  } catch (e) {}
}

function bindThemeToggle() {
  const tBtn = document.getElementById('tbtn') || document.getElementById('themeToggleBtn');
  if (tBtn) {
    tBtn.onclick = () => {
      const isDark = document.body.classList.contains('dark-mode') || document.documentElement.getAttribute('data-theme') === 'dark';
      setTheme(isDark ? 'light' : 'dark');
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  bindThemeToggle();
});

// Skeleton Loader Shimmer for instant perception of performance
function renderSkeletons() {
  const board = $('#board');
  if (!board) return;
  board.innerHTML = STAGES.map(st => `
    <section class="col" data-stage="${st}">
      <div class="col-header">
        <span class="col-stage-dot" style="background:${DOT[st]}"></span>
        <h2>${STAGE_ICON[st]} ${st}</h2>
        <span class="col-count">...</span>
      </div>
      <div class="body">
        ${[1, 2, 3].map(() => `
          <div class="skeleton-card">
            <div class="skeleton-top">
              <div class="skeleton-avatar skeleton-shimmer"></div>
              <div class="skeleton-text-group">
                <div class="skeleton-line w-70 skeleton-shimmer"></div>
                <div class="skeleton-line w-45 skeleton-shimmer"></div>
              </div>
            </div>
            <div class="skeleton-line w-85 skeleton-shimmer"></div>
            <div class="skeleton-tags-row">
              <div class="skeleton-pill skeleton-shimmer"></div>
              <div class="skeleton-pill skeleton-shimmer"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `).join('');
}

// Touch & Stage Tabs Controller
function initMobileNavigation() {
  const tabs = document.querySelectorAll('.mobile-stage-tabs .stage-tab');
  tabs.forEach(tab => {
    tab.onclick = () => {
      const st = tab.dataset.stage;
      if (st) {
        activeMobileStage = st;
        tabs.forEach(t => t.classList.toggle('active', t.dataset.stage === st));
        const board = $('#board');
        if (board) board.dataset.activeStage = st;
        render();
      }
    };
  });

  // Touch swipe support for kanban board on mobile
  const board = $('#board');
  if (board) {
    let startX = 0, startY = 0;
    board.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    board.addEventListener('touchend', e => {
      const diffX = e.changedTouches[0].clientX - startX;
      const diffY = e.changedTouches[0].clientY - startY;
      if (Math.abs(diffX) > 60 && Math.abs(diffY) < 50) {
        const curIdx = STAGES.indexOf(activeMobileStage);
        if (diffX < 0 && curIdx < STAGES.length - 1) {
          // Swipe Left -> Next stage
          activeMobileStage = STAGES[curIdx + 1];
          render();
        } else if (diffX > 0 && curIdx > 0) {
          // Swipe Right -> Prev stage
          activeMobileStage = STAGES[curIdx - 1];
          render();
        }
      }
    }, { passive: true });
  }

  // Mobile Bottom Sheet Pull-to-Dismiss
  const sheetHandle = $('#sheetPullHandle');
  const panel = $('#panel');
  if (sheetHandle && panel) {
    sheetHandle.onclick = closePanel;
  }
}


