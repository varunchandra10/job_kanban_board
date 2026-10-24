/* ----- Calendar View ----- */
let calCurrent = new Date();
let calLearningsList = [];
let isFetchingLearnings = false;

async function ensureCalLearnings() {
  if (calLearningsList.length === 0 && !isFetchingLearnings) {
    isFetchingLearnings = true;
    try {
      const data = await api('GET', '/learnings');
      if (Array.isArray(data)) calLearningsList = data;
    } catch (e) {
      console.warn('Could not load learnings for calendar', e);
    } finally {
      isFetchingLearnings = false;
    }
  }
}

async function renderCalendar() {
  const board = $('#board');
  board.className = 'cal-mode';
  board.innerHTML = '';

  ensureCalLearnings().then(() => {
    // If learnings came after initial sync, re-render once
    const pills = board.querySelectorAll('.n-cal-pill.learning');
    if (pills.length === 0 && calLearningsList.length > 0) {
      renderCalendar();
    }
  });

  const yr = calCurrent.getFullYear(), mo = calCurrent.getMonth();
  const firstDay = new Date(yr, mo, 1).getDay();
  const daysInMo = new Date(yr, mo + 1, 0).getDate();
  const daysInPrev = new Date(yr, mo, 0).getDate();
  const moName = ['January','February','March','April','May','June','July','August','September','October','November','December'][mo];

  const calBox = document.createElement('div');
  calBox.className = 'nordic-cal-box';
  calBox.innerHTML = `
    <div class="n-cal-head">
      <div class="n-cal-title-wrap">
        <div class="n-cal-title">
          ${ICON.calendar}
          <span>${moName} ${yr} Calendar</span>
        </div>
        <div class="n-cal-sub">Applied jobs, deadlines, and daily learnings mapped to each day</div>
      </div>
      <div class="n-cal-controls">
        <div class="n-cal-legend">
          <span class="n-cal-pill job" style="cursor:default">💼 Applied</span>
          <span class="n-cal-pill deadline" style="cursor:default">⏰ Deadline</span>
          <span class="n-cal-pill learning" style="cursor:default">⚡ Learning</span>
        </div>
        <div class="cal-nav">
          <button class="btn icon-only" id="calPrev" title="Previous Month">&lsaquo;</button>
          <button class="btn" id="calToday" style="font-size:12px;padding:4px 10px;font-weight:600">Today</button>
          <button class="btn icon-only" id="calNext" title="Next Month">&rsaquo;</button>
        </div>
      </div>
    </div>
    <div class="n-cal-grid" id="calGrid"></div>
  `;
  board.appendChild(calBox);

  const grid = calBox.querySelector('#calGrid');
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
    const dh = document.createElement('div');
    dh.className = 'n-day-head';
    dh.textContent = d;
    grid.appendChild(dh);
  });

  const nowStr = today();
  const toYMD = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const pday = daysInPrev - i;
    const cell = document.createElement('div');
    cell.className = 'n-cal-cell other-month';
    cell.style.opacity = '0.38';
    cell.innerHTML = `<div class="n-cell-top"><span class="n-cell-num">${pday}</span></div>`;
    grid.appendChild(cell);
  }

  const activeLearnings = (typeof learningsList !== 'undefined' && learningsList.length) ? learningsList : calLearningsList;

  // Days in current month
  for (let d = 1; d <= daysInMo; d++) {
    const dateStr = toYMD(yr, mo, d);
    const isToday = (dateStr === nowStr);
    const cell = document.createElement('div');
    cell.className = `n-cal-cell ${isToday ? 'is-today' : ''}`;

    const dueApps = S.apps.filter(a => a.deadline === dateStr);
    const appliedApps = S.apps.filter(a => a.date_applied === dateStr);
    const dayLearnings = activeLearnings.filter(l => (l.date_logged || '').slice(0, 10) === dateStr);

        let pillsHtml = '';
    appliedApps.forEach(a => {
      pillsHtml += `<div class="n-cal-pill job" data-id="${a.id}" title="Applied: ${esc(a.company)}${a.role ? ' - ' + esc(a.role) : ''}"><span class="n-cal-icon">💼</span><span class="n-cal-text">${esc(a.company)}${a.role ? ' · ' + esc(a.role) : ''}</span></div>`;
    });
    dueApps.forEach(a => {
      pillsHtml += `<div class="n-cal-pill deadline" data-id="${a.id}" title="Deadline: ${esc(a.company)}"><span class="n-cal-icon">⏰</span><span class="n-cal-text">${esc(a.company)} Due</span></div>`;
    });
    dayLearnings.forEach(l => {
      pillsHtml += `<div class="n-cal-pill learning" data-lid="${l.id}" title="Learning: ${esc(l.title)}"><span class="n-cal-icon">⚡</span><span class="n-cal-text">${esc(l.title)} (${l.duration_minutes || l.duration_mins || 30}m)</span></div>`;
    });

    cell.innerHTML = `
      <div class="n-cell-top">
        <span class="n-cell-num">${d}</span>
        ${isToday ? '<span class="n-today-badge">TODAY</span>' : ''}
      </div>
      <div class="n-cal-pills-wrap">
        ${pillsHtml}
      </div>
    `;

    // Clicking empty space in day cell prompts to add application with this date prefilled
    cell.addEventListener('click', (e) => {
      if (e.target.closest('.n-cal-pill')) return;
      openAddModal(dateStr);
    });

    grid.appendChild(cell);
  }

  // Next month leading days
  const totalCells = firstDay + daysInMo;
  const rem = (7 - (totalCells % 7)) % 7;
  for (let d = 1; d <= rem; d++) {
    const cell = document.createElement('div');
    cell.className = 'n-cal-cell other-month';
    cell.style.opacity = '0.38';
    cell.innerHTML = `<div class="n-cell-top"><span class="n-cell-num">${d}</span></div>`;
    grid.appendChild(cell);
  }

  $('#calPrev').onclick = () => { calCurrent.setMonth(calCurrent.getMonth() - 1); renderCalendar(); };
  $('#calNext').onclick = () => { calCurrent.setMonth(calCurrent.getMonth() + 1); renderCalendar(); };
  $('#calToday').onclick = () => { calCurrent = new Date(); renderCalendar(); };

  grid.querySelectorAll('.n-cal-pill.job, .n-cal-pill.deadline').forEach(pill => {
    pill.onclick = (e) => {
      e.stopPropagation();
      openApp(+pill.dataset.id);
    };
  });

  grid.querySelectorAll('.n-cal-pill.learning').forEach(pill => {
    pill.onclick = (e) => {
      e.stopPropagation();
      const lid = +pill.dataset.lid;
      if (typeof window.openLearningModal === 'function') {
        window.openLearningModal(lid);
      } else {
        window.location.href = `/learnings.html?edit=${lid}`;
      }
    };
  });
}


