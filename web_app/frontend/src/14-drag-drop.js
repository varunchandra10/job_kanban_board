/* ----- Drag & Drop ----- */
function locate(body, y) {
  for (const c of body.querySelectorAll('.card:not(.drag)')) {
    const r = c.getBoundingClientRect();
    if (y < r.top + r.height / 2) return +c.dataset.id;
  }
  return null;
}

const board = $('#board');
board.addEventListener('dragstart', e => {
  const c = e.target.closest('.card');
  if (!c) return;
  dragId = +c.dataset.id;
  c.classList.add('drag');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragId);
});
board.addEventListener('dragend', () => { dragId = null; render(); });
board.addEventListener('dragover', e => {
  const body = e.target.closest('.body');
  if (!body || dragId == null) return;
  e.preventDefault();
  board.querySelectorAll('.body.over').forEach(b => b !== body && b.classList.remove('over'));
  body.classList.add('over');
  $('.drop')?.remove();
  const before = locate(body, e.clientY);
  const ind = document.createElement('div');
  ind.className = 'drop';
  const ref = before && body.querySelector(`.card[data-id="${before}"]`);
  ref ? body.insertBefore(ind, ref) : body.appendChild(ind);
});
board.addEventListener('drop', e => {
  const body = e.target.closest('.body');
  if (!body || dragId == null) return;
  e.preventDefault();
  const stage = body.dataset.stage, vBefore = locate(body, e.clientY), id = dragId;
  const full = stageApps(stage).filter(a => a.id !== id);
  let before = null;
  if (vBefore != null) before = vBefore;
  else {
    const lastVis = [...full].reverse().find(vis);
    if (lastVis) {
      const i = full.indexOf(lastVis);
      before = full[i+1]?.id ?? null;
    }
  }
  doMove(id, stage, before);
});

function doMove(id, stage, before) {
  const ids = stageApps(stage).filter(a => a.id !== id).map(a => a.id);
  let i = before != null ? ids.indexOf(before) : -1;
  if (i < 0) i = ids.length;
  ids.splice(i, 0, id);
  ids.forEach((x, p) => {
    const a = S.apps.find(a => a.id === x);
    a.stage = stage;
    a.position = p;
  });
  dragId = null;
  render();
  api('POST', `/applications/${id}/move`, { stage, before });
}

/* ----- Mobile Card Actions & Touch Support ----- */
function openCardActionsModal(id) {
  const a = S.apps.find(x => x.id === id);
  if (!a) return;

  let overlay = document.getElementById('mobileCardSheetOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'mobileCardSheetOverlay';
    overlay.className = 'mobile-card-sheet-overlay';
    document.body.appendChild(overlay);
  }

  const currentStage = a.stage || 'Applied';
  const roleHtml = a.role ? `<div class="sheet-role-title">${esc(a.role)}</div>` : '';
  const stagesHtml = STAGES.map(st => {
    const isCurrent = st === currentStage;
    return `
      <button type="button" class="sheet-stage-btn ${isCurrent ? 'current' : ''}" data-stage="${st}">
        <span class="sheet-stage-dot" style="background:${DOT[st] || 'var(--applied-clr)'}"></span>
        <span>${st}</span>
        ${isCurrent ? '<span style="margin-left:auto;font-size:11px;opacity:0.75;font-weight:400;">(Current)</span>' : ''}
      </button>
    `;
  }).join('');

  overlay.innerHTML = `
    <div class="mobile-card-sheet">
      <div class="sheet-drag-handle"></div>
      <div class="sheet-header">
        <div class="sheet-app-info">
          ${logo(a.company)}
          <div>
            <div class="sheet-co-title">${esc(a.company)}</div>
            ${roleHtml}
          </div>
        </div>
        <button type="button" class="x" id="sheetCloseX" style="position:static;font-size:20px;padding:4px 8px;cursor:pointer;">&times;</button>
      </div>
      <div class="sheet-section-title" style="margin-top:14px;">Move to Stage</div>
      <div class="sheet-stages-grid">
        ${stagesHtml}
      </div>
      <div class="sheet-section-title" style="margin-top:16px;">Quick Actions</div>
      <div class="sheet-actions-list">
        <button type="button" class="sheet-action-item" id="sheetDetailsBtn">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          <span>View & Edit Full Details</span>
        </button>
        <button type="button" class="sheet-action-item danger" id="sheetDeleteBtn">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          <span>Delete Application</span>
        </button>
      </div>
    </div>
  `;

  overlay.onclick = (e) => {
    if (e.target === overlay) closeCardActionsModal();
  };

  overlay.querySelector('#sheetCloseX')?.addEventListener('click', closeCardActionsModal);

  overlay.querySelectorAll('.sheet-stage-btn').forEach(btn => {
    btn.onclick = () => {
      const targetStage = btn.dataset.stage;
      if (targetStage && targetStage !== currentStage) {
        closeCardActionsModal();
        doMove(id, targetStage, null);
        if (typeof toast === 'function') toast(`Moved ${a.company} to ${targetStage}`);
      }
    };
  });

  overlay.querySelector('#sheetDetailsBtn')?.addEventListener('click', () => {
    closeCardActionsModal();
    if (typeof openApp === 'function') openApp(id);
  });

  overlay.querySelector('#sheetDeleteBtn')?.addEventListener('click', () => {
    closeCardActionsModal();
    const deleteBtn = document.querySelector(`.card[data-id="${id}"] .x`);
    if (deleteBtn) {
      deleteBtn.click();
    }
  });

  requestAnimationFrame(() => {
    overlay.classList.add('active');
  });
}

function closeCardActionsModal() {
  const overlay = document.getElementById('mobileCardSheetOverlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
}

window.openCardActionsModal = openCardActionsModal;
window.closeCardActionsModal = closeCardActionsModal;
window.doMove = doMove;

// Mobile Long-Press Support for Cards
let touchTimer = null;
let touchMoved = false;

board.addEventListener('touchstart', e => {
  const c = e.target.closest('.card');
  if (!c) return;
  if (e.target.closest('.x') || e.target.closest('.card-action-menu-btn') || e.target.closest('.resume-tag') || e.target.closest('.cl-tag')) return;
  touchMoved = false;
  clearTimeout(touchTimer);
  touchTimer = setTimeout(() => {
    if (!touchMoved) {
      if (navigator.vibrate) navigator.vibrate(40);
      openCardActionsModal(+c.dataset.id);
    }
  }, 450);
}, { passive: true });

board.addEventListener('touchmove', () => {
  touchMoved = true;
  clearTimeout(touchTimer);
}, { passive: true });

board.addEventListener('touchend', () => {
  clearTimeout(touchTimer);
}, { passive: true });


