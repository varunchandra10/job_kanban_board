/* ----- Delete with Undo ----- */
let toastT, lastDel;
function toast(msg, isError = false) {
  const t = $('#toast');
  const m = $('#tmsg');
  const u = $('#undo');
  if (!t || !m) return;
  m.textContent = msg;
  if (u) u.style.display = 'none';
  t.classList.remove('error', 'success');
  t.classList.add(isError ? 'error' : 'success');
  t.style.display = 'flex';
  clearTimeout(toastT);
  toastT = setTimeout(() => {
    t.style.display = 'none';
    t.classList.remove('error', 'success');
    if (u) u.style.display = '';
  }, 4000);
}
board.addEventListener('click', e => {
  const c = e.target.closest('.card');
  if (!c) return;
  const id = +c.dataset.id;
  if (e.target.closest('.x')) {
    e.stopPropagation();
    const a = S.apps.find(a => a.id === id);
    if (!a) return;

    showConfirmDialog({
      title: 'Delete Application?',
      text: `Are you sure you want to remove ${a.company}${a.role ? ' - ' + a.role : ''}?`,
      icon: `<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      confirmText: 'Delete',
      confirmCls: 'danger',
      cancelText: 'Cancel',
      onConfirm: () => {
        lastDel = { ...a };
        S.apps = S.apps.filter(x => x.id !== id);
        render();
        api('DELETE', '/applications/' + id);

        const t = $('#toast');
        const m = $('#tmsg');
        const u = $('#undo');
        if (m) m.textContent = `Deleted ${a.company}`;
        if (u) u.style.display = 'inline-block';
        if (t) {
          t.classList.remove('error');
          t.classList.add('success');
          t.style.display = 'flex';
        }
        clearTimeout(toastT);
        toastT = setTimeout(() => {
          if (t) t.style.display = 'none';
        }, 8000);
      }
    });
  } else if (e.target.closest('.card-action-menu-btn')) {
    e.stopPropagation();
    if (typeof openCardActionsModal === 'function') {
      openCardActionsModal(id);
    }
  } else {
    openApp(id);
  }
});

$('#undo').onclick = async () => {
  if (!lastDel) return;
  const d = lastDel;
  lastDel = null;
  const t = $('#toast');
  const u = $('#undo');
  if (u) u.style.display = 'none';
  if (t) t.style.display = 'none';
  const n = await api('POST', '/applications', d);
  if (d.stage && d.stage !== 'Applied') await api('POST', `/applications/${n.id}/move`, { stage: d.stage, before: null });
  const st = await api('GET', '/state');
  if (st && st.apps) S.apps = st.apps;
  render();
  toast(`Restored ${d.company}`);
};

