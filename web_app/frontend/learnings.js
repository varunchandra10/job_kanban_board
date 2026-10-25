// Global fetch interceptor to inject Authorization header for multi-user support
(function() {
  if (window.__fetchAuthInjected) return;
  window.__fetchAuthInjected = true;
  const _origFetch = window.fetch;
  window.fetch = function(url, options = {}) {
    const token = localStorage.getItem('auth_token');
    if (token && typeof url === 'string' && (url.startsWith('/api') || url.includes('/api/'))) {
      options.headers = options.headers || {};
      if (options.headers instanceof Headers) {
        if (!options.headers.has('Authorization')) {
          options.headers.set('Authorization', 'Bearer ' + token);
        }
      } else if (Array.isArray(options.headers)) {
        if (!options.headers.some(([k]) => k.toLowerCase() === 'authorization')) {
          options.headers.push(['Authorization', 'Bearer ' + token]);
        }
      } else {
        if (!options.headers['Authorization'] && !options.headers['authorization']) {
          options.headers['Authorization'] = 'Bearer ' + token;
        }
      }
    }
    return _origFetch.call(this, url, options);
  };
})();

/* ===============================================================
   Gamified Score Streak & Daily Learnings Client Controller
   =============================================================== */
let currentViewMode = 'apps'; // 'apps' | 'learnings'
let learningsList = [];
let gamificationData = null;
let activeLearningCategory = 'All';
let learningSearchQuery = '';

// Particle Confetti Burst (Vanilla JS Canvas, zero external dependencies)
function burstConfetti() {
  try {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99999';
    document.body.appendChild(canvas);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    const colors = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316'];
    const particles = [];
    for (let i = 0; i < 90; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() * 200 - 100),
        y: canvas.height / 3 + (Math.random() * 100 - 50),
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.7) * 16,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10
      });
    }
    let frames = 0;
    function anim() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.38; // gravity
        p.rotation += p.vRot;
        p.alpha -= 0.012;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      frames++;
      if (frames < 90) {
        requestAnimationFrame(anim);
      } else {
        canvas.remove();
      }
    }
    requestAnimationFrame(anim);
  } catch (_) {}
}

// View Mode Switcher: 2 Main Buttons (Job Applications & Learnings)
window.switchViewMode = function(mode) {
  currentViewMode = mode;
  const isApps = mode === 'apps';
  const isLearnings = mode === 'learnings';
  const isCal = mode === 'calendar';
  const isProfile = mode === 'profile';

  // Toggle tab buttons
  const btnApps = document.getElementById('btnModeApps');
  const btnLearnings = document.getElementById('btnModeLearnings');
  const btnCal = document.getElementById('btnModeCalendar');
  const btnProf = document.getElementById('profileBtn');

  if (btnApps) {
    btnApps.classList.toggle('active', isApps);
    btnApps.setAttribute('aria-selected', isApps ? 'true' : 'false');
  }
  if (btnLearnings) {
    btnLearnings.classList.toggle('active', isLearnings);
    btnLearnings.setAttribute('aria-selected', isLearnings ? 'true' : 'false');
  }
  if (btnCal) {
    btnCal.classList.toggle('active', isCal);
    btnCal.setAttribute('aria-selected', isCal ? 'true' : 'false');
  }
  if (btnProf) {
    btnProf.classList.toggle('active', isProfile);
  }

  // Toggle View Containers
  const boardEl = document.getElementById('board');
  const secBarEl = document.getElementById('secBar');
  const learningsSecBarEl = document.getElementById('learningsSecBar');
  const mobileNavEl = document.querySelector('.mobile-stage-nav');
  const mobileTabsEl = document.querySelector('.mobile-stage-tabs');
  const searchWrapEl = document.querySelector('.search-wrap');
  const learningsViewEl = document.getElementById('learningsView');
  const profileViewEl = document.getElementById('profileView');

  if (isProfile) {
    if (boardEl) boardEl.style.display = 'none';
    if (secBarEl) secBarEl.style.display = 'none';
    if (learningsSecBarEl) learningsSecBarEl.style.display = 'none';
    if (mobileNavEl) mobileNavEl.style.display = 'none';
    if (mobileTabsEl) mobileTabsEl.style.display = 'none';
    if (searchWrapEl) searchWrapEl.style.display = 'none';
    if (learningsViewEl) learningsViewEl.style.display = 'none';
    if (profileViewEl) profileViewEl.style.display = 'block';
    renderProfileView();
  } else if (isCal) {
    if (profileViewEl) profileViewEl.style.display = 'none';
    if (boardEl) boardEl.style.display = 'block';
    if (secBarEl) secBarEl.style.display = 'none';
    if (learningsSecBarEl) learningsSecBarEl.style.display = 'none';
    if (mobileNavEl) mobileNavEl.style.display = 'none';
    if (mobileTabsEl) mobileTabsEl.style.display = 'none';
    if (searchWrapEl) searchWrapEl.style.display = 'flex';
    if (learningsViewEl) learningsViewEl.style.display = 'none';
    if (typeof currentSec !== 'undefined') currentSec = 'Calendar';
    loadLearnings().then(() => { if (typeof render === 'function') render(); });
  } else if (isLearnings) {
    if (profileViewEl) profileViewEl.style.display = 'none';
    if (boardEl) boardEl.style.display = 'none';
    if (secBarEl) secBarEl.style.display = 'none';
    if (learningsSecBarEl) learningsSecBarEl.style.display = 'flex';
    if (mobileNavEl) mobileNavEl.style.display = 'none';
    if (mobileTabsEl) mobileTabsEl.style.display = 'none';
    if (searchWrapEl) searchWrapEl.style.display = 'flex';
    if (learningsViewEl) learningsViewEl.style.display = 'grid';
    const sInp = document.getElementById('search');
    if (sInp) {
      sInp.placeholder = 'Search concepts, notes, topics, tags...';
      sInp.value = learningSearchQuery || '';
      searchWrapEl?.classList.toggle('has-val', !!sInp.value);
    }
    loadGamificationStats();
    loadLearnings();
  } else {
    if (profileViewEl) profileViewEl.style.display = 'none';
    if (boardEl) boardEl.style.display = 'grid';
    if (secBarEl) secBarEl.style.display = 'flex';
    if (learningsSecBarEl) learningsSecBarEl.style.display = 'none';
    if (mobileNavEl) mobileNavEl.style.display = '';
    if (mobileTabsEl) mobileTabsEl.style.display = '';
    if (searchWrapEl) searchWrapEl.style.display = 'flex';
    if (learningsViewEl) learningsViewEl.style.display = 'none';
    const sInp = document.getElementById('search');
    if (sInp) {
      sInp.placeholder = 'Search company, role, notes...';
      sInp.value = (typeof searchQuery !== 'undefined') ? searchQuery : '';
      searchWrapEl?.classList.toggle('has-val', !!sInp.value);
    }
    if (typeof currentSec !== 'undefined' && currentSec === 'Calendar') currentSec = 'All';
    if (typeof render === 'function') render();
  }

  // Adapt Add Button in Header
  const addBtn = document.getElementById('addBtn');
  if (addBtn) {
    if (isApps) {
      addBtn.title = 'Add Application';
      addBtn.onclick = () => { if (typeof adding !== 'undefined' && !adding) { adding = true; render(); } };
    } else {
      addBtn.title = 'Add';
      addBtn.onclick = () => openLearningModal();
    }
  }

  if (!isApps) {
    loadGamificationStats();
    loadLearnings();
  }
};

// Fetch & Update Gamification Stats
async function loadGamificationStats() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const res = await fetch(`/api/gamification?tz=${encodeURIComponent(tz)}`);
    if (!res.ok) return;
    const stats = await res.json();
    gamificationData = stats;

    // Header HUD Pill & Badges
    const hudStreak = document.getElementById('hudStreakCount');
    const hudLvlNum = document.getElementById('hudLevelNumber');
    const hudXp = document.getElementById('hudXpPoints');
    const modeBadge = document.getElementById('learningModeBadge');

    const isFrozen = stats.isFrozen || stats.todayFrozen;
    if (hudStreak) hudStreak.textContent = (stats.streak || 0) + (isFrozen ? ' ❄️' : '');
    if (hudLvlNum) hudLvlNum.textContent = 'Lvl ' + stats.level;
    if (hudXp) hudXp.textContent = Number(stats.totalXP).toLocaleString() + ' XP';
    if (modeBadge) modeBadge.textContent = (stats.streak || 0) + 'd' + (isFrozen ? ' ❄️' : '');

    // Hero Streak Card
    const daysEl = document.getElementById('gamifyStreakDays');
    const subtextEl = document.getElementById('gamifyStreakSubtext');
    const statusEl = document.getElementById('gamifyTodayStatus');
    const bestStreakEl = document.getElementById('gamifyLongestStreak');
    const totalHoursEl = document.getElementById('gamifyTotalHours');
    const notesCountEl = document.getElementById('gamifyLearningsCount');

    if (daysEl) daysEl.textContent = stats.streak;
    if (bestStreakEl) bestStreakEl.textContent = stats.longestStreak + ' Days';
    if (totalHoursEl) totalHoursEl.textContent = (stats.totalMinutes / 60).toFixed(1) + ' hrs';
    if (notesCountEl) notesCountEl.textContent = stats.learningCount + ' Notes';

    if (statusEl) {
      if (stats.todayCompleted) {
        statusEl.className = 'streak-status-badge';
        statusEl.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg> Today Completed (+1 Streak)';
      } else if (stats.todayFrozen) {
        statusEl.className = 'streak-status-badge frozen';
        statusEl.innerHTML = '&#10052; Streak Frozen Today (Add App to +1)';
      } else if (stats.todayAppOnly) {
        statusEl.className = 'streak-status-badge pending';
        statusEl.innerHTML = '&#9888; App Added (Add Learning to Keep Streak)';
      } else {
        statusEl.className = 'streak-status-badge pending';
        statusEl.innerHTML = 'Log Today to Keep Streak';
      }
    }

    if (subtextEl) {
      if (stats.isFrozen || stats.todayFrozen) {
        subtextEl.textContent = 'Streak is frozen! You logged learning. Add a job application to increment your streak.';
      } else if (stats.streak >= 7) {
        subtextEl.textContent = 'Master consistency! Over a full week unbroken streak!';
      } else if (stats.streak >= 3) {
        subtextEl.textContent = 'Awesome momentum! You are building deep technical mastery.';
      } else if (stats.streak > 0) {
        subtextEl.textContent = 'Great start! Log daily learnings + job applications to build your streak.';
      } else {
        subtextEl.textContent = 'Start your streak today! Log learnings and apply to jobs daily.';
      }
    }

    // Hero XP & Level Card
    const lvlTag = document.getElementById('gamifyLevelTag');
    const lvlTitle = document.getElementById('gamifyLevelTitle');
    const totalXp = document.getElementById('gamifyTotalXpDisplay');
    const xpFill = document.getElementById('gamifyXpBarFill');
    const xpCurrent = document.getElementById('gamifyXpCurrent');
    const xpTarget = document.getElementById('gamifyXpTarget');
    const xpPercent = document.getElementById('gamifyXpPercent');

    if (lvlTag) lvlTag.textContent = 'Level ' + stats.level;
    if (lvlTitle) lvlTitle.textContent = stats.title;
    if (totalXp) totalXp.textContent = Number(stats.totalXP).toLocaleString() + ' XP';
    if (xpFill) xpFill.style.width = Math.min(100, Math.max(0, stats.progressPercent)) + '%';
    if (xpCurrent) xpCurrent.textContent = Number(stats.currentLevelMin).toLocaleString() + ' XP';
    if (xpTarget) xpTarget.textContent = Number(stats.nextLevelXP).toLocaleString() + ' XP';
    if (xpPercent) xpPercent.textContent = stats.progressPercent + '% to Level ' + (stats.level + 1);

    // Punchcard
    const punchRow = document.getElementById('gamifyPunchcardRow');
    if (punchRow && Array.isArray(stats.weekPunchcard)) {
      punchRow.innerHTML = stats.weekPunchcard.map(day => {
        let cls = '';
        let icon = '&middot;';
        let desc = 'No activity (Streak breaks)';
        if (day.active) {
          cls = 'active';
          icon = '&#10003;';
          desc = 'Active (+1 Streak): Both App & Learning logged';
        } else if (day.frozen) {
          cls = 'frozen';
          icon = '&#10052;';
          desc = 'Frozen: Learning logged, no application';
        } else if (day.appOnly) {
          cls = 'app-only';
          icon = '&times;';
          desc = 'Break: Application logged without learning';
        }
        return '<div class="punch-day-col">' +
          '<div class="punch-circle ' + cls + ' ' + (day.isToday ? 'today-ring' : '') + '" title="' + day.date + ': ' + desc + '">' +
            icon +
          '</div>' +
          '<span class="punch-day-label">' + day.day + '</span>' +
        '</div>';
      }).join('');
    }
  } catch (err) {
    console.error('Failed to load gamification stats:', err);
  }
}

// Fetch & Render Daily Learnings

// Skeleton Loader for Learnings Board
function renderLearningSkeletons() {
  const container = document.getElementById('learningsView');
  if (!container) return;

  const cats = [
    { key: 'DSA', label: 'DSA', dot: 'var(--applied-clr, #3b82f6)', icon: '<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" fill="none" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>' },
    { key: 'AI/ML/NLP/CV', label: 'AI/ML/NLP/CV', dot: 'var(--offer-clr, #ec4899)', icon: '<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" fill="none" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/></svg>' },
    { key: 'CS SUBJECTS', label: 'CS SUBJECTS', dot: 'var(--interview-clr, #0ea5e9)', icon: '<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" fill="none" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/></svg>' },
    { key: 'GENERAL APTITUDE', label: 'GENERAL APTITUDE', dot: 'var(--rejected-clr, #f59e0b)', icon: '<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" fill="none" stroke-width="2"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/></svg>' }
  ];

  container.innerHTML = cats.map(cat => `
    <section class="col" data-cat="${cat.key}">
      <div class="col-header">
        <span class="col-stage-dot" style="background:${cat.dot}"></span>
        <h2>${cat.icon} ${cat.label}</h2>
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
window.renderLearningSkeletons = renderLearningSkeletons;

async function loadLearnings() {
  if (!learningsList || learningsList.length === 0) renderLearningSkeletons();
  try {
    const res = await fetch('/api/learnings');
    if (!res.ok) return;
    const list = await res.json();
    learningsList = list || [];
    renderLearningsFeed();
    updateLearningsBarBadges();
  } catch (err) {
    console.error('Failed to load learnings:', err);
  }
}

const APTITUDE_TOPICS = {
  'English': [
    'Reading Comprehension',
    'Sentence Correction & Grammar',
    'Vocabulary, Synonyms & Antonyms',
    'Para Jumbles & Sentence Rearrangement',
    'Spotting Errors',
    'Idioms & Phrases',
    'Fill in the Blanks / Cloze Test',
    'One Word Substitution',
    'Active & Passive Voice',
    'Direct & Indirect Speech'
  ],
  'Quants': [
    'Percentages, Profit & Loss',
    'Time, Speed & Distance',
    'Time & Work, Pipes & Cisterns',
    'Permutations, Combinations & Probability',
    'Ratio, Proportion & Averages',
    'Number Systems & Divisibility',
    'Simple & Compound Interest',
    'Algebra & Quadratic Equations',
    'Geometry & Mensuration',
    'Data Interpretation (Charts & Tables)',
    'Mixtures & Alligations'
  ],
  'Reasoning': [
    'Blood Relations & Family Tree',
    'Direction Sense Test',
    'Syllogisms & Venn Diagrams',
    'Coding-Decoding & Analogy',
    'Number & Letter Series',
    'Seating Arrangement (Linear & Circular)',
    'Puzzles & Order / Ranking',
    'Clocks & Calendars',
    'Statement & Assumptions / Arguments',
    'Input-Output & Machine Reasoning',
    'Dice, Cubes & Paper Folding'
  ]
};

let currentAptitudeStream = 'All'; // 'All' | 'English' | 'Quants' | 'Reasoning'
let currentAptitudeTopic = 'All';  // 'All' | string

window.setAptitudeStream = function(stream) {
  currentAptitudeStream = stream;
  currentAptitudeTopic = 'All';
  renderLearningsBoard();
};

window.setAptitudeTopic = function(topic) {
  currentAptitudeTopic = topic;
  renderLearningsBoard();
};

const LEARNING_CATEGORIES = [
  {
    key: 'DSA',
    label: 'DSA',
    dot: '#a855f7',
    icon: '<svg viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    match: c => c.includes('dsa') || c.includes('algo')
  },
  {
    key: 'AI/ML/NLP/CV',
    label: 'AI/ML/NLP/CV',
    dot: '#ec4899',
    icon: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>',
    match: c => c.includes('ai') || c.includes('ml') || c.includes('nlp') || c.includes('cv')
  },
  {
    key: 'CS SUBJECTS',
    label: 'CS SUBJECTS',
    dot: '#0284c7',
    icon: '<svg viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    match: c => c.includes('cs') || c.includes('subject') || c.includes('system') || c.includes('os') || c.includes('dbms') || c.includes('network')
  },
  {
    key: 'GENERAL APTITUDE',
    label: 'GENERAL APTITUDE',
    dot: '#f59e0b',
    icon: '<svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/><line x1="9" y1="21" x2="15" y2="21"/></svg>',
    match: c => c.includes('apt') || c.includes('reasoning') || c.includes('quant') || c.includes('math') || c.includes('english') || c.includes('verbal')
  }
];

function getCategoryForLearning(item) {
  const c = String(item.category || '').toLowerCase();
  for (const cat of LEARNING_CATEGORIES) {
    if (cat.match(c)) return cat.key;
  }
  return 'DSA';
}

function getAptitudeStreamForItem(item) {
  const text = (String(item.category || '') + ' ' + String(item.topic || '') + ' ' + String(item.title || '') + ' ' + String(item.notes || '')).toLowerCase();
  if (text.includes('english') || text.includes('verbal') || text.includes('reading comprehension') || text.includes('grammar') || text.includes('vocabulary') || text.includes('synonym') || text.includes('jumble')) {
    return 'English';
  }
  if (text.includes('quant') || text.includes('math') || text.includes('percent') || text.includes('profit') || text.includes('speed') || text.includes('time and work') || text.includes('probability') || text.includes('ratio') || text.includes('algebra') || text.includes('geometry') || text.includes('interest')) {
    return 'Quants';
  }
  if (text.includes('reasoning') || text.includes('logic') || text.includes('blood relation') || text.includes('direction') || text.includes('syllogism') || text.includes('puzzle') || text.includes('seating') || text.includes('series') || text.includes('analogy') || text.includes('coding-decod') || text.includes('clock')) {
    return 'Reasoning';
  }
  const cat = String(item.category || '').toLowerCase();
  if (cat.includes('english')) return 'English';
  if (cat.includes('quant')) return 'Quants';
  if (cat.includes('reasoning')) return 'Reasoning';
  return 'Quants';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function updateLearningsBarBadges() {
  const total = learningsList.length;
  const counts = { 'DSA': 0, 'AI/ML/NLP/CV': 0, 'CS SUBJECTS': 0, 'GENERAL APTITUDE': 0 };

  learningsList.forEach(l => {
    const k = getCategoryForLearning(l);
    if (counts[k] !== undefined) counts[k]++;
    else counts['DSA']++;
  });

  const setT = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setT('lc-All', total);
  setT('lc-DSA', counts['DSA']);
  setT('lc-AI', counts['AI/ML/NLP/CV']);
  setT('lc-CS', counts['CS SUBJECTS']);
  setT('lc-APTITUDE', counts['GENERAL APTITUDE']);

  // Also update mobile category tab badges
  setT('lmt-All', total);
  setT('lmt-DSA', counts['DSA']);
  setT('lmt-AI', counts['AI/ML/NLP/CV']);
  setT('lmt-CS', counts['CS SUBJECTS']);
  setT('lmt-APTITUDE', counts['GENERAL APTITUDE']);
}

window.openLearningModalWithCat = function(catKey, stream, topic) {
  openLearningModal();
  const targetCat = (catKey === 'GENERAL APTITUDE' ? 'GENERAL APTITUDE' : catKey);
  const sel = document.getElementById('l_category');
  if (sel) sel.value = targetCat;

  // Sync category chips in drawer immediately
  document.querySelectorAll("#learningCatChips .learning-cat-chip").forEach(c => {
    c.classList.toggle("active", c.dataset.cat === targetCat);
  });

  if (topic && topic !== 'All') {
    const topicInput = document.getElementById('l_topic');
    if (topicInput) topicInput.value = topic;
  } else if (stream && stream !== 'All') {
    const topicInput = document.getElementById('l_topic');
    if (topicInput && !topicInput.value) topicInput.value = stream;
  }
};


/* ============================================================================
   Learning & Study Calendar View Engine
   ============================================================================ */
let learnCalCurrent = new Date();

function renderLearningCalendar() {
  const container = document.getElementById('learningsView');
  if (!container) return;
  container.className = 'cal-mode';
  container.removeAttribute('data-active-cat');

  const yr = learnCalCurrent.getFullYear(), mo = learnCalCurrent.getMonth();
  const firstDay = new Date(yr, mo, 1).getDay();
  const daysInMo = new Date(yr, mo + 1, 0).getDate();
  const daysInPrev = new Date(yr, mo, 0).getDate();
  const moName = ['January','February','March','April','May','June','July','August','September','October','November','December'][mo];

  const now = new Date();
  const nowStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const toYMD = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const calBox = document.createElement('div');
  calBox.className = 'nordic-cal-box';
  calBox.innerHTML = `
    <div class="n-cal-head">
      <div class="n-cal-title-wrap">
        <div class="n-cal-title" style="display:flex;align-items:center;gap:8px;font-size:16px;font-weight:700;color:var(--tx);">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>${moName} ${yr} Learning Calendar</span>
        </div>
        <div class="n-cal-sub" style="font-size:12px;color:var(--tx3);margin-top:2px;">Track daily concepts, study duration, and revision history</div>
      </div>
      <div class="n-cal-controls" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
        <div class="n-cal-legend" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span class="n-cal-pill learning" style="cursor:default;background:rgba(59,130,246,0.12);color:#2563eb;border-color:rgba(59,130,246,0.3);"><span style="width:6px;height:6px;border-radius:50%;background:#3b82f6;"></span> DSA</span>
          <span class="n-cal-pill learning" style="cursor:default;background:rgba(236,72,153,0.12);color:#db2777;border-color:rgba(236,72,153,0.3);"><span style="width:6px;height:6px;border-radius:50%;background:#ec4899;"></span> AI/ML</span>
          <span class="n-cal-pill learning" style="cursor:default;background:rgba(14,165,233,0.12);color:#0284c7;border-color:rgba(14,165,233,0.3);"><span style="width:6px;height:6px;border-radius:50%;background:#0ea5e9;"></span> CS Core</span>
          <span class="n-cal-pill learning" style="cursor:default;background:rgba(245,158,11,0.12);color:#d97706;border-color:rgba(245,158,11,0.3);"><span style="width:6px;height:6px;border-radius:50%;background:#f59e0b;"></span> Aptitude</span>
        </div>
        <div class="cal-nav" style="display:flex;align-items:center;gap:6px;">
          <button type="button" class="btn icon-only" id="learnCalPrev" title="Previous Month" style="width:30px;height:30px;border-radius:6px;font-size:16px;">&lsaquo;</button>
          <button type="button" class="btn" id="learnCalToday" style="font-size:12px;padding:4px 10px;font-weight:600;border-radius:6px;">Today</button>
          <button type="button" class="btn icon-only" id="learnCalNext" title="Next Month" style="width:30px;height:30px;border-radius:6px;font-size:16px;">&rsaquo;</button>
        </div>
      </div>
    </div>
    <div class="n-cal-grid" id="learnCalGrid"></div>
  `;
  container.innerHTML = '';
  container.appendChild(calBox);

  const grid = calBox.querySelector('#learnCalGrid');
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
    const dh = document.createElement('div');
    dh.className = 'n-day-head';
    dh.textContent = d;
    grid.appendChild(dh);
  });

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const pday = daysInPrev - i;
    const cell = document.createElement('div');
    cell.className = 'n-cal-cell other-month';
    cell.style.opacity = '0.35';
    cell.innerHTML = `<div class="n-cell-top"><span class="n-cell-num">${pday}</span></div>`;
    grid.appendChild(cell);
  }

  // Days in current month
  for (let d = 1; d <= daysInMo; d++) {
    const dateStr = toYMD(yr, mo, d);
    const isToday = (dateStr === nowStr);
    const cell = document.createElement('div');
    cell.className = `n-cal-cell ${isToday ? 'is-today' : ''}`;

    const itemsOnDay = (learningsList || []).filter(l => (l.date_logged || '').slice(0, 10) === dateStr);
    const totalMin = itemsOnDay.reduce((acc, cur) => acc + (Number(cur.duration_minutes) || 0), 0);

    let pillsHtml = '';
    itemsOnDay.forEach(item => {
      const catKey = getCategoryForLearning(item);
      let catColor = '#3b82f6';
      let catBg = 'rgba(59,130,246,0.12)';
      if (catKey === 'AI/ML/NLP/CV') { catColor = '#ec4899'; catBg = 'rgba(236,72,153,0.12)'; }
      else if (catKey === 'CS SUBJECTS') { catColor = '#0ea5e9'; catBg = 'rgba(14,165,233,0.12)'; }
      else if (catKey === 'GENERAL APTITUDE') { catColor = '#f59e0b'; catBg = 'rgba(245,158,11,0.12)'; }

      pillsHtml += `
        <div class="n-cal-pill learning" data-id="${item.id}" style="background:${catBg};color:${catColor};border-color:${catColor}40;" title="${escapeHtml(item.title)} (${item.duration_minutes || 45}m)">
          <span style="width:5px;height:5px;border-radius:50%;background:${catColor};flex-shrink:0;"></span>
          <span style="font-weight:700;flex-shrink:0;">${item.duration_minutes || 45}m</span>
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(item.title)}</span>
        </div>
      `;
    });

    cell.innerHTML = `
      <div class="n-cell-top">
        <span class="n-cell-num">${d}</span>
        ${isToday ? '<span class="n-today-badge">TODAY</span>' : (totalMin > 0 ? `<span style="font-size:10.5px;font-weight:700;color:var(--tx2);">${totalMin}m</span>` : '')}
      </div>
      <div class="n-cal-pills-wrap">
        ${pillsHtml}
      </div>
    `;

    // Click on learning pill opens modal
    cell.querySelectorAll('.n-cal-pill.learning').forEach(pill => {
      pill.addEventListener('click', e => {
        e.stopPropagation();
        openLearningModal(+pill.dataset.id);
      });
    });

    // Click on empty space in cell opens add modal for this date
    cell.addEventListener('click', e => {
      if (e.target.closest('.n-cal-pill')) return;
      openLearningModal();
      const dateInp = document.getElementById('l_date');
      if (dateInp) dateInp.value = dateStr;
    });

    grid.appendChild(cell);
  }

  // Next month trailing days to complete 7-day grid
  const totalCellsSoFar = firstDay + daysInMo;
  const remaining = (7 - (totalCellsSoFar % 7)) % 7;
  for (let n = 1; n <= remaining; n++) {
    const cell = document.createElement('div');
    cell.className = 'n-cal-cell other-month';
    cell.style.opacity = '0.35';
    cell.innerHTML = `<div class="n-cell-top"><span class="n-cell-num">${n}</span></div>`;
    grid.appendChild(cell);
  }

  // Navigation handlers
  const prevBtn = calBox.querySelector('#learnCalPrev');
  const nextBtn = calBox.querySelector('#learnCalNext');
  const todayBtn = calBox.querySelector('#learnCalToday');

  if (prevBtn) prevBtn.onclick = () => { learnCalCurrent.setMonth(learnCalCurrent.getMonth() - 1); renderLearningCalendar(); };
  if (nextBtn) nextBtn.onclick = () => { learnCalCurrent.setMonth(learnCalCurrent.getMonth() + 1); renderLearningCalendar(); };
  if (todayBtn) todayBtn.onclick = () => { learnCalCurrent = new Date(); renderLearningCalendar(); };
}
window.renderLearningCalendar = renderLearningCalendar;

function renderLearningsBoard() {
  const container = document.getElementById('learningsView');
  if (!container) return;

  const isSingle = (activeLearningCategory && activeLearningCategory !== 'All');
  container.classList.toggle('single-col', isSingle);
  container.setAttribute('data-active-cat', activeLearningCategory || 'All');

  // Sync mobile category tabs active state
  document.querySelectorAll('#learningMobileTabs .stage-tab').forEach(t => {
    t.classList.toggle('active', (t.dataset.cat || 'All') === (activeLearningCategory || 'All'));
  });

  let colsToRender = LEARNING_CATEGORIES;
  if (isSingle) {
    colsToRender = LEARNING_CATEGORIES.filter(c => c.key === activeLearningCategory);
  }

  container.innerHTML = colsToRender.map(cat => {
    const isAptitudeCol = (cat.key === 'GENERAL APTITUDE');

    let catItems = learningsList.filter(item => {
      const itemCat = getCategoryForLearning(item);
      if (itemCat !== cat.key) return false;

      // Aptitude stream filter
      if (isAptitudeCol && currentAptitudeStream !== 'All') {
        const stream = getAptitudeStreamForItem(item);
        if (stream !== currentAptitudeStream) return false;
      }

      // Aptitude topic filter
      if (isAptitudeCol && currentAptitudeTopic !== 'All') {
        const topicQuery = currentAptitudeTopic.toLowerCase();
        const text = [item.title, item.topic, item.notes, item.tags].join(' ').toLowerCase();
        if (!text.includes(topicQuery)) return false;
      }

      // Global search filter
      if (learningSearchQuery) {
        const q = learningSearchQuery.toLowerCase();
        const combined = [item.title, item.topic, item.category, item.notes, item.tags].join(' ').toLowerCase();
        if (!combined.includes(q)) return false;
      }
      return true;
    });

    // Toolbar for General Aptitude column
    let toolbarHtml = '';
    if (isAptitudeCol) {
      let optionsHtml = '';
      if (currentAptitudeStream === 'English') {
        optionsHtml = `<option value="All" ${currentAptitudeTopic === 'All' ? 'selected' : ''}>All English Topics (${APTITUDE_TOPICS['English'].length})</option>` +
          APTITUDE_TOPICS['English'].map(t => `<option value="${escapeHtml(t)}" ${currentAptitudeTopic === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('');
      } else if (currentAptitudeStream === 'Quants') {
        optionsHtml = `<option value="All" ${currentAptitudeTopic === 'All' ? 'selected' : ''}>All Quants Topics (${APTITUDE_TOPICS['Quants'].length})</option>` +
          APTITUDE_TOPICS['Quants'].map(t => `<option value="${escapeHtml(t)}" ${currentAptitudeTopic === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('');
      } else if (currentAptitudeStream === 'Reasoning') {
        optionsHtml = `<option value="All" ${currentAptitudeTopic === 'All' ? 'selected' : ''}>All Reasoning Topics (${APTITUDE_TOPICS['Reasoning'].length})</option>` +
          APTITUDE_TOPICS['Reasoning'].map(t => `<option value="${escapeHtml(t)}" ${currentAptitudeTopic === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('');
      } else {
        optionsHtml = `<option value="All" ${currentAptitudeTopic === 'All' ? 'selected' : ''}>All Aptitude Topics</option>
          <optgroup label="English Topics">
            ${APTITUDE_TOPICS['English'].map(t => `<option value="${escapeHtml(t)}" ${currentAptitudeTopic === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('')}
          </optgroup>
          <optgroup label="Quants Topics">
            ${APTITUDE_TOPICS['Quants'].map(t => `<option value="${escapeHtml(t)}" ${currentAptitudeTopic === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('')}
          </optgroup>
          <optgroup label="Reasoning Topics">
            ${APTITUDE_TOPICS['Reasoning'].map(t => `<option value="${escapeHtml(t)}" ${currentAptitudeTopic === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('')}
          </optgroup>`;
      }

      toolbarHtml = `
        <div class="aptitude-filter-toolbar">
          <div class="apt-stream-pills">
            <button type="button" class="apt-pill ${currentAptitudeStream === 'All' ? 'active' : ''}" onclick="setAptitudeStream('All')">All</button>
            <button type="button" class="apt-pill ${currentAptitudeStream === 'English' ? 'active' : ''}" onclick="setAptitudeStream('English')">
              <span class="apt-pill-dot" style="background:#64748b;"></span>English
            </button>
            <button type="button" class="apt-pill ${currentAptitudeStream === 'Quants' ? 'active' : ''}" onclick="setAptitudeStream('Quants')">
              <span class="apt-pill-dot" style="background:#10b981;"></span>Quants
            </button>
            <button type="button" class="apt-pill ${currentAptitudeStream === 'Reasoning' ? 'active' : ''}" onclick="setAptitudeStream('Reasoning')">
              <span class="apt-pill-dot" style="background:#ea580c;"></span>Reasoning
            </button>
          </div>
          <div class="apt-topic-dropdown-wrap">
            <div class="apt-select-box">
              <svg viewBox="0 0 24 24" class="apt-filter-icon"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              <select id="aptTopicSelect" class="apt-topic-select" onchange="setAptitudeTopic(this.value)">
                ${optionsHtml}
              </select>
            </div>
          </div>
          ${currentAptitudeTopic !== 'All' ? `
            <div class="active-topic-chip">
              <span>Topic: <strong>${escapeHtml(currentAptitudeTopic)}</strong></span>
              <button type="button" title="Clear topic filter" onclick="setAptitudeTopic('All')">&times;</button>
            </div>
          ` : ''}
        </div>
      `;
    }

    const bodyHtml = catItems.length === 0 ? `
      <div class="empty-col-msg">
        <span>No ${escapeHtml(cat.label)} notes yet${currentAptitudeTopic !== 'All' ? ' for ' + escapeHtml(currentAptitudeTopic) : ''}</span>
        <button type="button" class="empty-add-btn" onclick="openLearningModalWithCat('${escapeHtml(cat.key)}', '${currentAptitudeStream}', '${currentAptitudeTopic}')">+ Add</button>
      </div>
    ` : catItems.map(item => {
      const tags = (item.tags || '').split(',').map(t => t.trim()).filter(Boolean);
      const hasUrl = Boolean(item.resource_url && /^https?:\/\//i.test(item.resource_url.trim()));
      const stream = isAptitudeCol ? getAptitudeStreamForItem(item) : '';

      return `
        <div class="card learning-kanban-card" onclick="openLearningModal(${item.id})">
          <button type="button" class="x" title="Delete Note" onclick="event.stopPropagation(); deleteLearning(${item.id})">×</button>
          <div class="top">
            <div class="logo" style="background:${cat.dot}15; color:${cat.dot}; border-color:${cat.dot}30;">
              ${cat.icon}
            </div>
            <div style="min-width:0;flex:1">
              <div class="co" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</div>
              <div class="role" title="${escapeHtml(item.topic || cat.label)}">
                ${stream ? `<span class="apt-stream-tag ${stream.toLowerCase()}">${stream}</span> ` : ''}
                ${escapeHtml(item.topic || cat.label)}
              </div>
            </div>
          </div>
          ${item.notes ? `<div class="card-notes-preview">${escapeHtml(item.notes)}</div>` : ''}
          <div class="meta">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>${item.duration_minutes || 45}m</span>
            <span>•</span>
            <span>${escapeHtml(item.date_logged || 'Today')}</span>
            ${hasUrl ? `<span>•</span><a href="${escapeHtml(item.resource_url)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" class="card-resource-link">Link ↗</a>` : ''}
          </div>
          ${tags.length ? `
            <div class="tags" style="margin-top:6px;">
              ${tags.map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    return `
      <section class="col" data-cat="${escapeHtml(cat.key)}">
        <div class="col-header">
          <span class="col-stage-dot" style="background:${cat.dot}"></span>
          <h2>${cat.icon} ${escapeHtml(cat.label)}</h2>
          <span class="col-count">${catItems.length}</span>
          <button type="button" class="col-quick-add" title="Add note in ${escapeHtml(cat.label)}" onclick="openLearningModalWithCat('${escapeHtml(cat.key)}', '${currentAptitudeStream}', '${currentAptitudeTopic}')">+</button>
        </div>
        ${toolbarHtml}
        <div class="body" data-cat="${escapeHtml(cat.key)}">
          ${bodyHtml}
        </div>
      </section>
    `;
  }).join('');
}

const renderLearningsFeed = renderLearningsBoard;
window.renderLearningsFeed = renderLearningsBoard;
window.renderLearningsBoard = renderLearningsBoard;


// Modal Handlers
// Side Slideout Drawer Handlers (Exact match to Job Applications drawer)
window.openLearningModal = function(editId = null) {
  const panel = document.getElementById("panel");
  const bd = document.getElementById("bd");
  const titleEl = document.getElementById("pt") || document.getElementById("learningModalTitle");
  const editIdEl = document.getElementById("learningEditId");
  const form = document.getElementById("learningForm");
  if (!panel || !form) return;

  const todayStr = new Date().toISOString().slice(0, 10);

  if (editId) {
    const item = learningsList.find(x => x.id === Number(editId));
    if (!item) return;
    if (titleEl) titleEl.textContent = "Edit Learning Log";
    editIdEl.value = item.id;
    document.getElementById("l_title").value = item.title || "";
    document.getElementById("l_topic").value = item.topic || "";
    document.getElementById("l_category").value = item.category || "General";
    document.getElementById("l_date").value = item.date_logged || todayStr;
    document.getElementById("l_duration").value = item.duration_minutes || 45;
    document.getElementById("l_resource").value = item.resource_url || "";
    document.getElementById("l_notes").value = item.notes || "";
    document.getElementById("l_tags").value = item.tags || "";
    const btnSpan = document.querySelector("#submitLearningBtn span");
    if (btnSpan) btnSpan.textContent = "Update Learning";
  } else {
    if (titleEl) titleEl.textContent = "Log Daily Learning";
    editIdEl.value = "";
    form.reset();
    document.getElementById("l_date").value = todayStr;
    document.getElementById("l_duration").value = 45;
    const btnSpan = document.querySelector("#submitLearningBtn span");
    if (btnSpan) btnSpan.innerHTML = "<span style=\"display:inline-flex;align-items:center;gap:6px;\">🔥 Log Learning</span>";
  }

  // Update category chips state in drawer
  const catVal = document.getElementById("l_category")?.value || "DSA";
  document.querySelectorAll("#learningCatChips .learning-cat-chip").forEach(c => {
    c.classList.toggle("active", c.dataset.cat === catVal);
  });

  // Update preset buttons state
  const durVal = Number(document.getElementById("l_duration").value);
  document.querySelectorAll("#l_duration_presets .preset-pill").forEach(p => {
    p.classList.toggle("active", Number(p.dataset.m) === durVal);
  });

  // Open side drawer with backdrop
  if (bd) bd.style.display = "block";
  requestAnimationFrame(() => panel.classList.add("open"));
  setTimeout(() => document.getElementById("l_title")?.focus(), 150);
};

window.closeLearningModal = function() {
  const panel = document.getElementById("panel");
  const bd = document.getElementById("bd");
  if (panel) panel.classList.remove("open");
  if (bd) bd.style.display = "none";
};

window.saveLearning = async function() {
  const titleInput = document.getElementById('l_title');
  const title = titleInput?.value.trim();
  if (!title) {
    if (typeof toast === 'function') toast('Please enter what you learned today', true);
    else alert('Please enter what you learned today');
    titleInput?.focus();
    return;
  }

  const editId = document.getElementById('learningEditId')?.value;
  const payload = {
    title,
    topic: document.getElementById('l_topic')?.value.trim() || '',
    category: document.getElementById('l_category')?.value || 'General',
    date_logged: document.getElementById('l_date')?.value || new Date().toISOString().slice(0, 10),
    duration_minutes: parseInt(document.getElementById('l_duration')?.value || '45', 10),
    resource_url: document.getElementById('l_resource')?.value.trim() || '',
    notes: document.getElementById('l_notes')?.value.trim() || '',
    tags: document.getElementById('l_tags')?.value.trim() || ''
  };

  const btn = document.getElementById('submitLearningBtn');
  const origHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-sm"></span> Saving...';

  try {
    const url = editId ? ('/api/learnings/' + editId) : '/api/learnings';
    const method = editId ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);

    if (!editId) {
      burstConfetti();
      if (typeof toast === 'function') {
        toast('Learning logged successfully! Streak Protected ❄️');
      }
    } else {
      if (typeof toast === 'function') toast('Learning updated successfully');
    }
    closeLearningModal();
    await Promise.all([loadGamificationStats(), loadLearnings()]);
  } catch (err) {
    if (typeof toast === 'function') toast('Failed to save learning: ' + err.message, true);
    else alert('Failed to save learning: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = origHtml;
  }
};

window.deleteLearning = async function(id) {
  if (!confirm('Are you sure you want to delete this learning entry?')) return;
  try {
    const res = await fetch('/api/learnings/' + id, { method: 'DELETE' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    if (typeof toast === 'function') toast('Learning entry removed');
    await Promise.all([loadGamificationStats(), loadLearnings()]);
  } catch (err) {
    if (typeof toast === 'function') toast('Failed to delete: ' + err.message, true);
  }
};

// Global Event Listeners for Gamification & Learnings
document.addEventListener('DOMContentLoaded', () => {
  // Mode Switcher Buttons
  document.getElementById('btnModeApps')?.addEventListener('click', () => switchViewMode('apps'));
  document.getElementById('btnModeLearnings')?.addEventListener('click', () => switchViewMode('learnings'));
  document.getElementById('btnModeCalendar')?.addEventListener('click', () => switchViewMode('calendar'));
  document.getElementById('gamifyHudPill')?.addEventListener('click', () => switchViewMode('learnings'));

  // Learning Modal Controls
  document.getElementById('openAddLearningBtn')?.addEventListener('click', () => openLearningModal());
  document.getElementById('secAddLearningBtn')?.addEventListener('click', () => openLearningModal());
  document.getElementById('mobileAddLearningBtn')?.addEventListener('click', () => openLearningModal());

  // Mobile Sub-Bar Learning Search Wiring
  const mLearnSearchInp = document.getElementById('mobileLearningSearch');
  const mLearnSearchWrap = document.querySelector('.mobile-utility-bar .mobile-search-wrap');
  const mLearnSearchClear = document.getElementById('mobileLearningSearchClear');
  if (mLearnSearchInp) {
    mLearnSearchInp.addEventListener('input', e => {
      learningSearchQuery = e.target.value.trim();
      mLearnSearchWrap?.classList.toggle('has-val', !!e.target.value);
      const topSearch = document.getElementById('search');
      if (topSearch) {
        topSearch.value = e.target.value;
        document.querySelector('header .search-wrap')?.classList.toggle('has-val', !!e.target.value);
      }
      renderLearningsBoard();
    });
  }
  if (mLearnSearchClear) {
    mLearnSearchClear.addEventListener('click', e => {
      e.stopPropagation();
      if (mLearnSearchInp) mLearnSearchInp.value = '';
      learningSearchQuery = '';
      mLearnSearchWrap?.classList.remove('has-val');
      const topSearch = document.getElementById('search');
      if (topSearch) {
        topSearch.value = '';
        document.querySelector('header .search-wrap')?.classList.remove('has-val');
      }
      renderLearningsBoard();
      mLearnSearchInp?.focus();
    });
  }
  document.getElementById('closeLearningModal')?.addEventListener('click', closeLearningModal);
  document.getElementById('pc')?.addEventListener('click', closeLearningModal);
  document.getElementById('bd')?.addEventListener('click', closeLearningModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLearningModal();
  });
  document.getElementById('cancelLearningModal')?.addEventListener('click', closeLearningModal);
  document.getElementById('submitLearningBtn')?.addEventListener('click', saveLearning);

  // Close modal on backdrop click
  const lModal = document.getElementById('learningModal');
  if (lModal) {
    lModal.addEventListener('click', e => {
      if (e.target === lModal) closeLearningModal();
    });
  }

  // Modal Category Chips
  document.querySelectorAll("#learningCatChips .learning-cat-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      const cat = btn.dataset.cat;
      const catSelect = document.getElementById("l_category");
      if (catSelect) catSelect.value = cat;
      document.querySelectorAll("#learningCatChips .learning-cat-chip").forEach(b => b.classList.toggle("active", b === btn));
    });
  });

  // Sync duration input changes with preset pills
  document.getElementById("l_duration")?.addEventListener("input", e => {
    const durVal = Number(e.target.value);
    document.querySelectorAll("#l_duration_presets .preset-pill").forEach(p => {
      p.classList.toggle("active", Number(p.dataset.m) === durVal);
    });
  });

  // Duration Presets
  document.querySelectorAll('#l_duration_presets .preset-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const m = btn.dataset.m;
      document.getElementById('l_duration').value = m;
      document.querySelectorAll('#l_duration_presets .preset-pill').forEach(b => b.classList.toggle('active', b === btn));
    });
  });

  // Category Filter Buttons
  document.querySelectorAll('#learningsCategoryFilters .category-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeLearningCategory = btn.dataset.cat;
      document.querySelectorAll('#learningsCategoryFilters .category-filter-btn').forEach(b => b.classList.toggle('active', b === btn));
      renderLearningsFeed();
    });
  });

  // Search Input for Learnings
  const lSearch = document.getElementById('learningsSearchInput');
  if (lSearch) {
    lSearch.addEventListener('input', e => {
      learningSearchQuery = e.target.value.trim();
      renderLearningsFeed();
    });
  }

  // Learnings Second Bar Category Filter Buttons
  // Mobile Stage/Category Picker Tabs for Learnings
  document.querySelectorAll('#learningMobileTabs .stage-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeLearningCategory = tab.dataset.cat || 'All';
      document.querySelectorAll('#learningMobileTabs .stage-tab').forEach(t => {
        t.classList.toggle('active', t === tab);
      });
      document.querySelectorAll('#learningsSecBar .sec-btn').forEach(b => {
        b.classList.toggle('active', (b.dataset.cat || 'All') === activeLearningCategory);
      });
      renderLearningsBoard();
    });
  });

  document.querySelectorAll('#learningsSecBar .sec-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeLearningCategory = btn.dataset.cat || 'All';
      document.querySelectorAll('#learningsSecBar .sec-btn').forEach(b => b.classList.toggle('active', b === btn));
      renderLearningsFeed();
    });
  });

  // Learnings Second Bar Search Input
  const lSecSearch = document.getElementById('learningsSecSearch');
  if (lSecSearch) {
    lSecSearch.addEventListener('input', e => {
      learningSearchQuery = e.target.value.trim();
      renderLearningsFeed();
    });
  }

  // Initial Gamification Load
  setTimeout(loadGamificationStats, 200);
});


/* ===============================================================
   USER PROFILE & CAREER HUB CONTROLLER
   =============================================================== */

// Default / cached quick links
const DEFAULT_QUICK_LINKS = [
  { id: 'portfolio', icon: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`, title: 'Portfolio Website', url: 'https://varunchandra.dev' },
  { id: 'github', icon: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>`, title: 'GitHub Profile', url: 'https://github.com/varunchandra10' },
  { id: 'linkedin', icon: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`, title: 'LinkedIn Profile', url: 'https://linkedin.com/in/varunchandra' },
  { id: 'leetcode', icon: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`, title: 'LeetCode / DSA', url: 'https://leetcode.com/varun_chandra' },
  { id: 'resume', icon: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`, title: 'Google Drive Master Resume', url: 'https://drive.google.com/drive/folders/1XvpikQzEKf2ggiolLcPYLeX_jWjL0_N_' },
  { id: 'email', icon: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`, title: 'Contact Email', url: 'varun.chandra@example.com' }
];

function getQuickLinks() {
  try {
    const saved = localStorage.getItem('user_quick_links');
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return DEFAULT_QUICK_LINKS;
}

function saveQuickLinks(links) {
  try {
    localStorage.setItem('user_quick_links', JSON.stringify(links));
  } catch (_) {}
}

window.renderProfileView = function() {
  const container = document.getElementById('profileView');
  if (!container) return;

  // 1. Sync User Info & Streak Badge
  const streak = gamificationData?.currentStreak || 0;
  const level = gamificationData?.level || 1;
  const levelTitle = gamificationData?.levelTitle || 'Novice Seeker';
  const totalXp = gamificationData?.totalXp || 0;

  const profUserRank = document.getElementById('profUserRank');
  if (profUserRank) profUserRank.textContent = `Level ${level} ${levelTitle}`;

  const profUserStreak = document.getElementById('profUserStreak');
  if (profUserStreak) profUserStreak.textContent = `${streak}-Day Focus Streak`;

  const profHeatmapStreak = document.getElementById('profHeatmapStreak');
  if (profHeatmapStreak) profHeatmapStreak.textContent = `${streak} Days`;

  // 2. Render GitHub-style Commit Heatmap
  renderProfileHeatmap();

  // 3. Render Quick Links
  renderProfileQuickLinks();

  // 4. Render Job Applications Stats
  renderProfileJobStats();

  // 5. Render Learnings Stats
  renderProfileLearningStats();
};

function renderProfileHeatmap() {
  const matrix = document.getElementById('profHeatmapMatrix');
  if (!matrix) return;
  matrix.innerHTML = '';

  // Gather real dates from job applications and learnings
  const activityCounts = {};

  const apps = (typeof S !== 'undefined' && S.apps) ? S.apps : [];
  apps.forEach(a => {
    const d = a.date_applied || (a.created_at ? a.created_at.slice(0, 10) : '');
    if (d) activityCounts[d] = (activityCounts[d] || 0) + 1;
  });

  learningsList.forEach(l => {
    const d = (l.date_logged || '').slice(0, 10);
    if (d) activityCounts[d] = (activityCounts[d] || 0) + 1;
  });

  // Calculate total contributions
  let totalContribs = 0;
  let activeDays = 0;
  Object.values(activityCounts).forEach(cnt => {
    totalContribs += cnt;
    if (cnt > 0) activeDays++;
  });

  const profTotalActivities = document.getElementById('profTotalActivities');
  if (profTotalActivities) profTotalActivities.textContent = totalContribs;

  const profHeatmapActiveDays = document.getElementById('profHeatmapActiveDays');
  if (profHeatmapActiveDays) profHeatmapActiveDays.textContent = `${activeDays} Days`;

  // Generate 52 weeks grid (364 days ending today)
  const todayDate = new Date();

  for (let w = 51; w >= 0; w--) {
    const col = document.createElement('div');
    col.className = 'gh-col-week';

    for (let d = 0; d < 7; d++) {
      const daysAgo = (w * 7) + (6 - d);
      const cellDate = new Date(todayDate);
      cellDate.setDate(todayDate.getDate() - daysAgo);

      const ymd = cellDate.toISOString().slice(0, 10);
      const count = activityCounts[ymd] || 0;

      let lvl = 0;
      if (count === 1) lvl = 1;
      else if (count === 2) lvl = 2;
      else if (count === 3) lvl = 3;
      else if (count >= 4) lvl = 4;

      const cell = document.createElement('div');
      cell.className = `gh-day-cell lvl-${lvl}`;
      const dateFmt = cellDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      cell.title = count 
        ? `${count} activities on ${dateFmt}` 
        : `No activity on ${dateFmt}`;

      col.appendChild(cell);
    }
    matrix.appendChild(col);
  }
}

function renderProfileQuickLinks() {
  const grid = document.getElementById('profQuickLinksGrid');
  if (!grid) return;
  const links = getQuickLinks();

  grid.innerHTML = links.map(link => {
    const isEmail = link.url.includes('@') && !link.url.startsWith('http');
    const href = isEmail ? `mailto:${link.url}` : link.url;
    return `
      <div class="quick-link-card">
        <div class="ql-head">
          <div class="ql-icon">${link.icon}</div>
          <div style="min-width:0;flex:1">
            <div class="ql-title">${escapeHtml(link.title)}</div>
            <div class="ql-url-preview" id="prof_url_${link.id}">${escapeHtml(link.url)}</div>
          </div>
        </div>
        <div class="ql-actions">
          <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="ql-btn primary">${isEmail ? 'Send ↗' : 'Open ↗'}</a>
          <button type="button" class="ql-btn" onclick="copyProfileQuickLink('${escapeHtml(link.url)}', this)">Copy</button>
          <button type="button" class="ql-btn" onclick="editProfileQuickLink('${link.id}')">Edit</button>
        </div>
      </div>
    `;
  }).join('');
}

window.copyProfileQuickLink = function(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const oldText = btn.textContent;
    btn.textContent = 'Copied!';
    btn.style.color = '#10b981';
    btn.style.borderColor = '#10b981';
    setTimeout(() => {
      btn.textContent = oldText;
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 2000);
  }).catch(() => {
    prompt('Copy link:', text);
  });
};

window.editProfileQuickLink = function(linkId) {
  const links = getQuickLinks();
  const item = links.find(l => l.id === linkId);
  if (!item) return;

  const newUrl = prompt(`Update URL for ${item.title}:`, item.url);
  if (newUrl !== null && newUrl.trim() !== '') {
    item.url = newUrl.trim();
    saveQuickLinks(links);
    renderProfileQuickLinks();
  }
};

function renderProfileJobStats() {
  const apps = (typeof S !== 'undefined' && S.apps) ? S.apps : [];
  const total = apps.length;
  const interviewing = apps.filter(a => a.stage === 'Interviewing').length;
  const offers = apps.filter(a => a.stage === 'Offer').length;
  const applied = apps.filter(a => a.stage === 'Applied').length;
  const rejected = apps.filter(a => a.stage === 'Rejected').length;

  const respRate = total > 0 ? (((interviewing + offers) / total) * 100).toFixed(1) : 0;

  const elTotal = document.getElementById('profStatTotalApps');
  if (elTotal) elTotal.textContent = total;
  const elBadge = document.getElementById('profTotalAppsBadge');
  if (elBadge) elBadge.textContent = `${total} TOTAL`;

  const elInt = document.getElementById('profStatInterviewing');
  if (elInt) elInt.textContent = interviewing;
  const elOff = document.getElementById('profStatOffers');
  if (elOff) elOff.textContent = offers;
  const elRate = document.getElementById('profStatResponseRate');
  if (elRate) elRate.textContent = `${respRate}%`;
  const elRej = document.getElementById('profStatRejected');
  if (elRej) elRej.textContent = rejected;

  // Funnel Bars
  const funnelWrap = document.getElementById('profJobFunnelWrap');
  if (funnelWrap) {
    const pct = val => total > 0 ? Math.round((val / total) * 100) : 0;
    funnelWrap.innerHTML = `
      <div style="font-size:11.5px;font-weight:700;color:var(--tx3);text-transform:uppercase;margin-bottom:2px">Stage Funnel Breakdown</div>
      <div class="funnel-row">
        <span class="funnel-lbl">Applied (${applied})</span>
        <div class="funnel-track"><div class="funnel-fill" style="width: ${pct(applied)}%; background: var(--applied-clr, #3b82f6);"></div></div>
        <span class="funnel-num">${pct(applied)}%</span>
      </div>
      <div class="funnel-row">
        <span class="funnel-lbl">Interviewing (${interviewing})</span>
        <div class="funnel-track"><div class="funnel-fill" style="width: ${pct(interviewing)}%; background: var(--interview-clr, #f59e0b);"></div></div>
        <span class="funnel-num">${pct(interviewing)}%</span>
      </div>
      <div class="funnel-row">
        <span class="funnel-lbl">Offers (${offers})</span>
        <div class="funnel-track"><div class="funnel-fill" style="width: ${pct(offers)}%; background: var(--offer-clr, #10b981);"></div></div>
        <span class="funnel-num">${pct(offers)}%</span>
      </div>
      <div class="funnel-row">
        <span class="funnel-lbl">Rejected (${rejected})</span>
        <div class="funnel-track"><div class="funnel-fill" style="width: ${pct(rejected)}%; background: var(--rejected-clr, #ef4444);"></div></div>
        <span class="funnel-num">${pct(rejected)}%</span>
      </div>
    `;
  }

  // Top Locations
  const countryCounts = {};
  apps.forEach(a => {
    const c = a.country || 'Remote';
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  });
  const topLocs = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c, n]) => `${c} (${n})`)
    .join(', ');
  const elLoc = document.getElementById('profTopLocations');
  if (elLoc) elLoc.textContent = topLocs || 'Various';
}

function renderProfileLearningStats() {
  const streak = gamificationData?.currentStreak || 0;
  const longest = gamificationData?.longestStreak || 0;
  const hours = gamificationData?.totalStudyHours || '0.0';
  const totalXp = gamificationData?.totalXp || 0;
  const level = gamificationData?.level || 1;
  const notesCount = learningsList.length;

  const elStreak = document.getElementById('profStatStreak');
  if (elStreak) elStreak.textContent = streak;
  const elStreakBadge = document.getElementById('profStreakBadge');
  if (elStreakBadge) elStreakBadge.textContent = `${streak}D STREAK`;

  const elHours = document.getElementById('profStatStudyHours');
  if (elHours) elHours.textContent = `${hours}h`;

  const elXp = document.getElementById('profStatTotalXp');
  if (elXp) elXp.textContent = totalXp;

  const elLvl = document.getElementById('profStatLevel');
  if (elLvl) elLvl.textContent = `Lvl ${level}`;

  const elLong = document.getElementById('profStatLongestStreak');
  if (elLong) elLong.textContent = `${longest} Days`;

  const elNotes = document.getElementById('profStatNotesCount');
  if (elNotes) elNotes.textContent = notesCount;

  // Topic Categories Breakdown
  const catWrap = document.getElementById('profLearningCategoryWrap');
  if (catWrap) {
    const catCounts = { 'System Design': 0, 'Algorithms': 0, 'Web Dev': 0, 'Cloud': 0 };
    learningsList.forEach(l => {
      const c = l.category || 'General';
      if (c.includes('System')) catCounts['System Design']++;
      else if (c.includes('Algo') || c.includes('DSA')) catCounts['Algorithms']++;
      else if (c.includes('Web')) catCounts['Web Dev']++;
      else if (c.includes('Cloud') || c.includes('DevOps')) catCounts['Cloud']++;
    });

    const totalNotes = notesCount || 1;
    const pct = val => Math.round((val / totalNotes) * 100);

    catWrap.innerHTML = `
      <div style="font-size:11.5px;font-weight:700;color:var(--tx3);text-transform:uppercase;margin-bottom:2px">Topic Category Breakdown</div>
      <div class="funnel-row">
        <span class="funnel-lbl">System Design</span>
        <div class="funnel-track"><div class="funnel-fill" style="width: ${pct(catCounts['System Design'])}%; background: #06b6d4;"></div></div>
        <span class="funnel-num">${pct(catCounts['System Design'])}%</span>
      </div>
      <div class="funnel-row">
        <span class="funnel-lbl">Algorithms / DSA</span>
        <div class="funnel-track"><div class="funnel-fill" style="width: ${pct(catCounts['Algorithms'])}%; background: #c084fc;"></div></div>
        <span class="funnel-num">${pct(catCounts['Algorithms'])}%</span>
      </div>
      <div class="funnel-row">
        <span class="funnel-lbl">Web Dev</span>
        <div class="funnel-track"><div class="funnel-fill" style="width: ${pct(catCounts['Web Dev'])}%; background: #10b981;"></div></div>
        <span class="funnel-num">${pct(catCounts['Web Dev'])}%</span>
      </div>
      <div class="funnel-row">
        <span class="funnel-lbl">Cloud & DevOps</span>
        <div class="funnel-track"><div class="funnel-fill" style="width: ${pct(catCounts['Cloud'])}%; background: #f97316;"></div></div>
        <span class="funnel-num">${pct(catCounts['Cloud'])}%</span>
      </div>
    `;
  }
}

// Standalone page initialization for learnings.html
document.addEventListener('DOMContentLoaded', () => {
  // Sync live application count from API
  fetch('/api/state')
    .then(r => r.json())
    .then(s => {
      const b = document.getElementById('appModeBadge');
      if (b && s && s.apps) b.textContent = s.apps.length;
    })
    .catch(() => {});

  // Header search input for learnings
  const searchInp = document.getElementById('search');
  const searchWrap = document.querySelector('.search-wrap');
  const searchClear = document.getElementById('searchClear');
  if (searchInp) {
    searchInp.addEventListener('input', e => {
      learningSearchQuery = e.target.value.trim();
      searchWrap?.classList.toggle('has-val', !!e.target.value);
      renderLearningsBoard();
    });
  }
  if (searchClear && searchInp) {
    searchClear.addEventListener('click', e => {
      e.stopPropagation();
      searchInp.value = '';
      learningSearchQuery = '';
      searchWrap?.classList.remove('has-val');
      renderLearningsBoard();
      searchInp.focus();
    });
  }

  // Standalone theme toggle
  const tbtn = document.getElementById('tbtn') || document.getElementById('themeToggleBtn');
  if (tbtn) {
    tbtn.onclick = () => {
      const isDark = document.body.classList.toggle('dark-mode');
      const theme = isDark ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      try {
        localStorage.setItem('theme', theme);
        localStorage.setItem('tracker_theme', theme);
      } catch (e) {}
    };
    const savedTheme = localStorage.getItem('theme') || localStorage.getItem('tracker_theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  // Load learnings & gamification
  loadGamificationStats();
  loadLearnings();
});
