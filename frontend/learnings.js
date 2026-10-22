/* ===============================================================
   🧠 Gamified Score Streak & Daily Learnings Client Controller
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

  // Toggle tab buttons
  const btnApps = document.getElementById('btnModeApps');
  const btnLearnings = document.getElementById('btnModeLearnings');
  const btnCal = document.getElementById('btnModeCalendar');
  if (btnApps) {
    btnApps.classList.toggle('active', isApps);
    btnApps.setAttribute('aria-selected', isApps ? 'true' : 'false');
  }
  if (btnLearnings) {
    btnLearnings.classList.toggle('active', !isApps);
    btnLearnings.setAttribute('aria-selected', isLearnings ? 'true' : 'false');
  }
  if (btnCal) {
    btnCal.classList.toggle('active', isCal);
    btnCal.setAttribute('aria-selected', isCal ? 'true' : 'false');
  }

  // Toggle View Containers
  const boardEl = document.getElementById('board');
  const secBarEl = document.getElementById('secBar');
  const mobileNavEl = document.querySelector('.mobile-stage-nav');
  const mobileTabsEl = document.querySelector('.mobile-stage-tabs');
  const searchWrapEl = document.querySelector('.search-wrap');
  const learningsViewEl = document.getElementById('learningsView');

  if (isCal) {
    if (boardEl) boardEl.style.display = 'block';
    if (secBarEl) secBarEl.style.display = 'none';
    if (mobileNavEl) mobileNavEl.style.display = 'none';
    if (mobileTabsEl) mobileTabsEl.style.display = 'none';
    if (searchWrapEl) searchWrapEl.style.display = 'flex';
    if (learningsViewEl) learningsViewEl.style.display = 'none';
    if (typeof currentSec !== 'undefined') currentSec = 'Calendar';
    loadLearnings().then(() => { if (typeof render === 'function') render(); });
  } else if (isLearnings) {
    if (boardEl) boardEl.style.display = 'none';
    if (secBarEl) secBarEl.style.display = 'none';
    if (mobileNavEl) mobileNavEl.style.display = 'none';
    if (mobileTabsEl) mobileTabsEl.style.display = 'none';
    if (searchWrapEl) searchWrapEl.style.display = 'none';
    if (learningsViewEl) learningsViewEl.style.display = 'flex';
    loadGamificationStats();
    loadLearnings();
  } else {
    if (boardEl) boardEl.style.display = 'grid';
    if (secBarEl) secBarEl.style.display = 'flex';
    if (mobileNavEl) mobileNavEl.style.display = '';
    if (mobileTabsEl) mobileTabsEl.style.display = '';
    if (searchWrapEl) searchWrapEl.style.display = 'flex';
    if (learningsViewEl) learningsViewEl.style.display = 'none';
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
      addBtn.title = 'Log Daily Learning (+50 XP)';
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
    const res = await fetch('/api/gamification');
    if (!res.ok) return;
    const stats = await res.json();
    gamificationData = stats;

    // Header HUD Pill & Badges
    const hudStreak = document.getElementById('hudStreakCount');
    const hudLvlNum = document.getElementById('hudLevelNumber');
    const hudXp = document.getElementById('hudXpPoints');
    const modeBadge = document.getElementById('learningModeBadge');

    if (hudStreak) hudStreak.textContent = stats.streak;
    if (hudLvlNum) hudLvlNum.textContent = 'Lvl ' + stats.level;
    if (hudXp) hudXp.textContent = Number(stats.totalXP).toLocaleString() + ' XP';
    if (modeBadge) modeBadge.textContent = '🔥 ' + stats.streak + 'd';

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
        statusEl.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg> Today Logged';
      } else {
        statusEl.className = 'streak-status-badge pending';
        statusEl.innerHTML = '⚡ Log Today to Keep Streak';
      }
    }

    if (subtextEl) {
      if (stats.streak >= 7) subtextEl.textContent = '🔥 Master consistency! Over a full week unbroken streak!';
      else if (stats.streak >= 3) subtextEl.textContent = 'Awesome momentum! You are building deep technical mastery.';
      else if (stats.streak > 0) subtextEl.textContent = 'Great start! Log daily to build your habit and XP.';
      else subtextEl.textContent = 'Start your streak today! Log your key learnings and concepts.';
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
      punchRow.innerHTML = stats.weekPunchcard.map(day => 
        '<div class="punch-day-col">' +
          '<div class="punch-circle ' + (day.active ? 'active' : '') + ' ' + (day.isToday ? 'today-ring' : '') + '" title="' + day.date + ': ' + (day.active ? 'Activity Logged' : 'No activity') + '">' +
            (day.active ? '✓' : '·') +
          '</div>' +
          '<span class="punch-day-label">' + day.day + '</span>' +
        '</div>'
      ).join('');
    }
  } catch (err) {
    console.error('Failed to load gamification stats:', err);
  }
}

// Fetch & Render Daily Learnings
async function loadLearnings() {
  try {
    const res = await fetch('/api/learnings');
    if (!res.ok) return;
    const list = await res.json();
    learningsList = list || [];
    renderLearningsFeed();
  } catch (err) {
    console.error('Failed to load learnings:', err);
  }
}

function getCategoryClass(cat) {
  const norm = String(cat || '').toLowerCase().replace(/[^a-z]/g, '');
  if (norm.includes('system')) return 'cat-system-design';
  if (norm.includes('algo')) return 'cat-algorithms';
  if (norm.includes('web')) return 'cat-web-dev';
  if (norm.includes('cloud')) return 'cat-cloud';
  if (norm.includes('ai') || norm.includes('ml')) return 'cat-ai-ml';
  return 'cat-general';
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

function renderLearningsFeed() {
  const feed = document.getElementById('learningsFeed');
  if (!feed) return;

  let filtered = learningsList.filter(item => {
    if (activeLearningCategory !== 'All') {
      const c = String(item.category || '').toLowerCase();
      const target = activeLearningCategory.toLowerCase();
      if (!c.includes(target) && !target.includes(c)) return false;
    }
    if (learningSearchQuery) {
      const q = learningSearchQuery.toLowerCase();
      const combined = [item.title, item.topic, item.category, item.notes, item.tags].join(' ').toLowerCase();
      if (!combined.includes(q)) return false;
    }
    return true;
  });

  if (!filtered.length) {
    feed.innerHTML = 
      '<div class="learnings-empty-state">' +
        '<div class="empty-icon-giant">🧠</div>' +
        '<h4 class="empty-headline">No Learnings Found</h4>' +
        '<p class="empty-subtext">' +
          (learningSearchQuery ? 'No notes match your current search query.' : 'Capture what you practiced, watched, or read today to build your streak and level up!') +
        '</p>' +
        '<button type="button" class="btn primary add-learning-btn" onclick="openLearningModal()">' +
          '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>' +
          '<span>Log Your First Learning</span>' +
        '</button>' +
      '</div>';
    return;
  }

  feed.innerHTML = filtered.map(item => {
    const tags = (item.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    const catClass = getCategoryClass(item.category);
    const hasUrl = item.resource_url && /^https?:\/\//i.test(item.resource_url.trim());

    return (
      '<article class="learning-card" data-id="' + item.id + '">' +
        '<div class="learning-card-header">' +
          '<div class="learning-card-badges">' +
            '<span class="learning-cat-badge ' + catClass + '">' + escapeHtml(item.category || 'General') + '</span>' +
            '<span class="learning-duration-tag">⏱️ ' + (item.duration_minutes || 30) + 'm</span>' +
          '</div>' +
          '<span class="learning-card-date">' + (item.date_logged || 'Today') + '</span>' +
        '</div>' +

        '<h3 class="learning-card-title">' + escapeHtml(item.title) + '</h3>' +
        (item.topic ? '<span class="learning-card-topic">' + escapeHtml(item.topic) + '</span>' : '') +

        (item.notes ? '<div class="learning-card-notes">' + escapeHtml(item.notes) + '</div>' : '') +

        (tags.length ? (
          '<div class="learning-card-tags">' +
            tags.map(t => '<span class="learning-tag-chip">#' + escapeHtml(t) + '</span>').join('') +
          '</div>'
        ) : '') +

        '<div class="learning-card-footer">' +
          (hasUrl ? (
            '<a href="' + escapeHtml(item.resource_url) + '" target="_blank" rel="noopener noreferrer" class="learning-resource-link">' +
              '<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>' +
              '<span>Resource Link</span>' +
            '</a>'
          ) : '<span></span>') +

          '<div class="learning-card-actions">' +
            '<button type="button" class="learning-act-btn" onclick="openLearningModal(' + item.id + ')">Edit</button>' +
            '<button type="button" class="learning-act-btn del" onclick="deleteLearning(' + item.id + ')">Delete</button>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }).join('');
}

// Modal Handlers
window.openLearningModal = function(editId = null) {
  const modal = document.getElementById('learningModal');
  const titleEl = document.getElementById('learningModalTitle');
  const editIdEl = document.getElementById('learningEditId');
  const form = document.getElementById('learningForm');
  if (!modal || !form) return;

  const todayStr = new Date().toISOString().slice(0, 10);

  if (editId) {
    const item = learningsList.find(x => x.id === Number(editId));
    if (!item) return;
    titleEl.textContent = 'Edit Learning Log';
    editIdEl.value = item.id;
    document.getElementById('l_title').value = item.title || '';
    document.getElementById('l_topic').value = item.topic || '';
    document.getElementById('l_category').value = item.category || 'General';
    document.getElementById('l_date').value = item.date_logged || todayStr;
    document.getElementById('l_duration').value = item.duration_minutes || 45;
    document.getElementById('l_resource').value = item.resource_url || '';
    document.getElementById('l_notes').value = item.notes || '';
    document.getElementById('l_tags').value = item.tags || '';
    const btnSpan = document.querySelector('#submitLearningBtn span');
    if (btnSpan) btnSpan.textContent = 'Update Learning';
  } else {
    titleEl.textContent = 'Log Daily Learning';
    editIdEl.value = '';
    form.reset();
    document.getElementById('l_date').value = todayStr;
    document.getElementById('l_duration').value = 45;
    const btnSpan = document.querySelector('#submitLearningBtn span');
    if (btnSpan) btnSpan.textContent = '🚀 Log Learning (+50 XP)';
  }

  // Update preset buttons state
  const durVal = Number(document.getElementById('l_duration').value);
  document.querySelectorAll('#l_duration_presets .preset-pill').forEach(p => {
    p.classList.toggle('active', Number(p.dataset.m) === durVal);
  });

  modal.style.display = 'flex';
  setTimeout(() => document.getElementById('l_title').focus(), 100);
};

window.closeLearningModal = function() {
  const modal = document.getElementById('learningModal');
  if (modal) modal.style.display = 'none';
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
      if (typeof toast === 'function') toast('🎉 Awesome! +50 XP Earned! Streak Maintained!');
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
  document.getElementById('closeLearningModal')?.addEventListener('click', closeLearningModal);
  document.getElementById('cancelLearningModal')?.addEventListener('click', closeLearningModal);
  document.getElementById('submitLearningBtn')?.addEventListener('click', saveLearning);

  // Close modal on backdrop click
  const lModal = document.getElementById('learningModal');
  if (lModal) {
    lModal.addEventListener('click', e => {
      if (e.target === lModal) closeLearningModal();
    });
  }

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

  // Initial Gamification Load
  setTimeout(loadGamificationStats, 200);
});
