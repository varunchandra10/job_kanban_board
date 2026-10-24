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

