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
    const a = S.apps.find(a => a.id === id);
    lastDel = { ...a };
    S.apps = S.apps.filter(x => x.id !== id);
    render();
    api('DELETE', '/applications/' + id);
    $('#tmsg').textContent = `Deleted ${a.company}`;
    $('#toast').style.display = 'flex';
    clearTimeout(toastT);
    toastT = setTimeout(() => $('#toast').style.display = 'none', 6000);
  } else {
    openApp(id);
  }
});

$('#undo').onclick = async () => {
  if (!lastDel) return;
  const d = lastDel;
  lastDel = null;
  $('#toast').style.display = 'none';
  const n = await api('POST', '/applications', d);
  if (d.stage !== 'Applied') await api('POST', `/applications/${n.id}/move`, { stage: d.stage, before: null });
  S.apps = (await api('GET', '/state')).apps;
  render();
};

