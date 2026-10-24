/* Mobile Sub-Bar Search Wiring */
const mSearchInp = $('#mobileSearch');
const mSearchWrap = $('.mobile-search-wrap');
const mSearchClear = $('#mobileSearchClear');
if (mSearchInp) {
  mSearchInp.oninput = e => {
    const val = e.target.value.trim();
    if (mSearchWrap) mSearchWrap.classList.toggle('has-val', !!e.target.value);
    const mainSearch = $('#search');
    if (mainSearch) {
      mainSearch.value = e.target.value;
      const mainWrap = $('.search-wrap:not(.mobile-search-wrap)');
      if (mainWrap) mainWrap.classList.toggle('has-val', !!e.target.value);
    }
    searchQuery = val;
    render();
  };
}
if (mSearchClear) {
  mSearchClear.onclick = e => {
    e.stopPropagation();
    if (mSearchInp) mSearchInp.value = '';
    if (mSearchWrap) mSearchWrap.classList.remove('has-val');
    const mainSearch = $('#search');
    if (mainSearch) {
      mainSearch.value = '';
      const mainWrap = $('.search-wrap:not(.mobile-search-wrap)');
      if (mainWrap) mainWrap.classList.remove('has-val');
    }
    searchQuery = '';
    render();
    if (mSearchInp) mSearchInp.focus();
  };
}

/* ----- Section Tabs ----- */
document.querySelectorAll('#secBar .sec-btn').forEach(btn => {
  btn.onclick = () => {
    currentSec = btn.dataset.s;
    if (currentSec !== 'Calendar') api('PUT', '/settings/section', { value: currentSec });
    render();
  };
});

/* ----- Country Filter ----- */
const fBtn = $('#fbtn');
const fPop = $('#fpop');
const fWrap = $('#fwrap');
if (fBtn && fPop) {
  fBtn.onclick = e => {
    e.stopPropagation();
    const isBlock = fPop.style.display === 'block';
    fPop.style.display = isBlock ? 'none' : 'block';
    if (fWrap) fWrap.classList.toggle('open', !isBlock);
    fBtn.setAttribute('aria-expanded', !isBlock);
  };
  fPop.onclick = e => e.stopPropagation();
  fPop.onchange = e => {
    const c = e.target.dataset.c;
    let f = activeFilter();
    f = c === '' ? [] : e.target.checked ? [...f, c] : f.filter(x => x !== c);
    S.filter = f;
    api('PUT', '/settings/filter', { value: JSON.stringify(f) });
    render();
  };
  document.addEventListener('click', () => {
    if (fPop.style.display === 'block') {
      fPop.style.display = 'none';
      if (fWrap) fWrap.classList.remove('open');
      fBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

/* Mobile Country Filter Wiring */
const mFBtn = $('#mobileFbtn');
const mFPop = $('#mobileFpop');
const mFWrap = $('#mobileFwrap');
if (mFBtn && mFPop) {
  mFBtn.onclick = e => {
    e.stopPropagation();
    const isBlock = mFPop.style.display === 'block';
    mFPop.style.display = isBlock ? 'none' : 'block';
    if (mFWrap) mFWrap.classList.toggle('open', !isBlock);
    mFBtn.setAttribute('aria-expanded', !isBlock);
  };
  mFPop.onclick = e => e.stopPropagation();
  mFPop.onchange = e => {
    const c = e.target.dataset.c;
    let f = activeFilter();
    f = c === '' ? [] : e.target.checked ? [...f, c] : f.filter(x => x !== c);
    S.filter = f;
    api('PUT', '/settings/filter', { value: JSON.stringify(f) });
    render();
  };
  document.addEventListener('click', () => {
    if (mFPop.style.display === 'block') {
      mFPop.style.display = 'none';
      if (mFWrap) mFWrap.classList.remove('open');
      mFBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ----- Small Screen Stage Dropdown ----- */
const stageSelectEl = $('#stageSelect');
if (stageSelectEl) {
  stageSelectEl.onchange = e => {
    activeMobileStage = e.target.value;
    const b = $('#board');
    if (b) b.dataset.activeStage = activeMobileStage;
    const dot = $('#stagePickerDot');
    if (dot) dot.style.background = DOT[activeMobileStage] || 'var(--applied-clr)';
    const badge = $('#stageCountBadge');
    if (badge) {
      const curCnt = stageApps(activeMobileStage).filter(vis).length;
      badge.textContent = curCnt;
    }
  };
}

/* ----- Search & Export ----- */
const searchWrap = $('.search-wrap');
const searchInp = $('#search');
if (searchWrap && searchInp) {
  searchWrap.onclick = e => {
    if (e.target !== $('#searchClear')) searchInp.focus();
  };
  searchInp.oninput = e => {
    const val = e.target.value.trim();
    searchWrap.classList.toggle('has-val', !!e.target.value);
    if (typeof currentViewMode !== 'undefined' && currentViewMode === 'learnings') {
      learningSearchQuery = val;
      if (typeof renderLearningsBoard === 'function') renderLearningsBoard();
      return;
    }
    searchQuery = val;
    render();
  };
  $('#searchClear').onclick = e => {
    e.stopPropagation();
    searchInp.value = '';
    searchWrap.classList.remove('has-val');
    if (typeof currentViewMode !== 'undefined' && currentViewMode === 'learnings') {
      learningSearchQuery = '';
      if (typeof renderLearningsBoard === 'function') renderLearningsBoard();
      searchInp.focus();
      return;
    }
    searchQuery = '';
    render();
    searchInp.focus();
  };
}

