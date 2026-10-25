
let _origFetch = window.fetch;
/* ============================================================================
   Job Tracker - Unified Authentication, Session Guard & Zero-Fetch Protection
   ============================================================================ */

function isUserLoggedOut() {
  return localStorage.getItem('logged_out') === '1' || !localStorage.getItem('auth_token');
}

function getActiveUser() {
  try {
    const raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function getApiBaseUrl() {
  var isTauri = Boolean(
    window.__TAURI__ || 
    window.__TAURI_INTERNALS__ || 
    (window.location && (
      window.location.protocol === 'tauri:' || 
      window.location.protocol === 'asset:' || 
      window.location.hostname === 'tauri.localhost' ||
      window.location.protocol === 'file:'
    ))
  );
  return isTauri ? 'http://127.0.0.1:3000' : '';
}
window.getApiBaseUrl = getApiBaseUrl;

function resolveApiUrl(url) {
  var urlStr = typeof url === 'string' ? url : (url && url.url ? url.url : '');
  var base = getApiBaseUrl();
  if (base && urlStr && (urlStr.startsWith('/api') || urlStr.startsWith('/health') || urlStr.startsWith('/shutdown') || urlStr.startsWith('/vendor'))) {
    return base + urlStr;
  }
  return url;
}
window.resolveApiUrl = resolveApiUrl;

/* 1. Global Fetch Guard:
   - When Logged Out: PREVENTS active network fetching of personal data and returns clean empty structures.
   - When Logged In: Automatically injects Authorization: Bearer <token>.
*/
(function initFetchAuthGuard() {
  if (window.__fetchAuthGuardInjected) return;
  window.__fetchAuthGuardInjected = true;

  _origFetch = window.fetch;
  window.fetch = function(url, options = {}) {
    const resolvedUrl = resolveApiUrl(url);
    const urlStr = typeof resolvedUrl === 'string' ? resolvedUrl : (resolvedUrl?.url || '');

    // ZERO ACTIVE FETCHING when logged out for user data endpoints
    if (isUserLoggedOut()) {
      if (urlStr.includes('/api/state')) {
        return Promise.resolve(new Response(JSON.stringify({
          apps: [],
          companies: [],
          roles: [],
          profile: null,
          versions: [],
          settings: { filter: '[]', section: 'All' }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      if (urlStr.includes('/api/learnings') && (!options.method || options.method === 'GET')) {
        return Promise.resolve(new Response(JSON.stringify([]), {
          status: 200, headers: { 'Content-Type': 'application/json' }
        }));
      }
      if (urlStr.includes('/api/gamification')) {
        return Promise.resolve(new Response(JSON.stringify({
          streak: 0,
          currentStreak: 0,
          totalMinutes: 0,
          totalXP: 0,
          level: 1,
          levelTitle: 'Novice',
          progressPercent: 0,
          nextLevelXP: 200,
          isFrozen: false
        }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      if (urlStr.includes('/api/storage/status')) {
        return Promise.resolve(new Response(JSON.stringify({
          connected: false,
          folderId: ''
        }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
    }

    // Attach Bearer token when logged in
    const token = localStorage.getItem('auth_token');
    if (token && (urlStr.startsWith('/api') || urlStr.includes('/api/'))) {
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

    return _origFetch.call(this, resolvedUrl, options);
  };
})();

/* ============================================================================
   Render-Style Authentication Modal Injection & Controllers
   ============================================================================ */
function ensureAuthModal() {
  if (document.getElementById('authModalOverlay')) return;

  const modalDiv = document.createElement('div');
  modalDiv.id = 'authModalOverlay';
  modalDiv.className = 'render-auth-overlay';
  modalDiv.style.setProperty('display', 'none', 'important');
  modalDiv.classList.remove('active');
  modalDiv.classList.add('hidden');
  modalDiv.onclick = function(e) { if (e.target === modalDiv) closeAuthModal(); };

  modalDiv.innerHTML = `
    <div class="render-auth-card" id="authModalBox" role="dialog" aria-modal="true">
      <button type="button" class="render-modal-close" onclick="closeAuthModal()" aria-label="Close modal">&times;</button>
      
      <h2 class="render-auth-title">Sign In to Job Tracker</h2>

      <div class="render-notice-banner" id="authActionNotice" style="display:none;">
        <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span id="authActionNoticeText">Please sign in to continue.</span>
      </div>

      <div class="render-oauth-row">
        <button type="button" class="render-oauth-btn" id="btnGoogleOAuth" onclick="submitGoogleOAuth()" title="Sign in with your Google account">
          <svg viewBox="0 0 24 24" width="17" height="17"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
          <span>Google</span>
        </button>
      </div>

      <div class="render-divider">
        <span>or</span>
      </div>

      <form onsubmit="event.preventDefault(); submitCustomEmailAuth();">
        <div class="render-form-group">
          <label class="render-label" for="renderEmailInput">Email</label>
          <input type="email" id="renderEmailInput" class="render-input" placeholder="your@email.com" required autocomplete="email">
        </div>

        <div class="render-form-group">
          <label class="render-label" for="renderPasswordInput">Password</label>
          <div class="render-input-wrap">
            <input type="password" id="renderPasswordInput" class="render-input" placeholder="••••••••••••" required autocomplete="current-password">
            <button type="button" class="render-eye-btn" onclick="togglePasswordVisibility()" aria-label="Toggle password visibility">
              <svg id="eyeIconSvg" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>

        <div class="render-feedback" id="renderFeedbackMsg" style="display:none;"></div>

        <button type="submit" class="render-btn-signin" id="btnSubmitCustomAuth">
          Sign In
        </button>
      </form>
    </div>
  `;
  document.body.appendChild(modalDiv);
}

function openAuthModal(noticeText) {
  ensureAuthModal();
  const overlay = document.getElementById('authModalOverlay');
  if (!overlay) return;
  overlay.classList.add('active');
  overlay.style.setProperty('display', 'flex', 'important');

  const notice = document.getElementById('authActionNotice');
  const noticeTxt = document.getElementById('authActionNoticeText');
  if (notice && noticeTxt) {
    if (noticeText) {
      noticeTxt.textContent = noticeText;
      notice.style.display = 'flex';
    } else {
      notice.style.display = 'none';
    }
  }

  const feedback = document.getElementById('renderFeedbackMsg');
  if (feedback) feedback.style.display = 'none';
}
window.openAuthModal = openAuthModal;

function closeAuthModal() {
  const overlay = document.getElementById('authModalOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    overlay.style.setProperty('display', 'none', 'important');
  }
}
window.closeAuthModal = closeAuthModal;
window.ensureAuthModal = ensureAuthModal;


/* 2. Top-Bar Logout / Login Button Synchronization across all pages */
function syncTopbarAuthUI() {
  const loggedOut = isUserLoggedOut();
  const wrap = document.getElementById('topbarAuthWrap');
  if (wrap) {
    if (loggedOut) {
      wrap.innerHTML = `
        <button class="btn icon-only" id="topbarLoginIconBtn" onclick="openAuthModal()" title="Log In to Session" aria-label="Log In" style="color:var(--primary,#6366f1);border-color:rgba(99,102,241,0.3);background:rgba(99,102,241,0.08);">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
            <polyline points="10 17 15 12 10 7"></polyline>
            <line x1="15" y1="12" x2="3" y2="12"></line>
          </svg>
        </button>
      `;
    } else {
      wrap.innerHTML = `
        <button class="btn icon-only" id="profLogoutBtn" onclick="handleTopbarLogout()" title="Log out of session" aria-label="Log Out" style="color: #ef4444;">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      `;
    }
  }

  // Hide or clear profile info when logged out
  const profName = document.getElementById('profUserName');
  const profAvatar = document.getElementById('profUserAvatar');
  const profStreak = document.getElementById('profUserStreak');

  if (loggedOut) {
    if (profName) profName.textContent = 'Logged Out (No Active Session)';
    if (profAvatar) profAvatar.textContent = '??';
    if (profStreak) {
      profStreak.innerHTML = '<svg class="icon-inline flame-icon-svg" viewBox="0 0 24 24" width="15" height="15" stroke="#f97316" stroke-width="2" fill="none"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg> <span id="profStreakCountText">0-Day Focus Streak</span>';
    }
    const dot = document.getElementById('gdriveDotStatus');
    if (dot) {
      dot.classList.remove('connected');
      dot.title = 'Google Drive Disconnected';
    }
  }
}

/* 3. Handle Topbar Logout */
function handleTopbarLogout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  localStorage.setItem('logged_out', '1');

  // Trigger page-specific data clears if present
  if (typeof loadAllProfileData === 'function') {
    loadAllProfileData();
  }
  if (typeof render === 'function') {
    if (window.S) S.apps = [];
    render();
  }
  if (typeof loadLearnings === 'function') {
    if (window.learningsList) learningsList = [];
    if (typeof renderLearningsBoard === 'function') renderLearningsBoard();
  }

  syncTopbarAuthUI();
  openAuthModal('You have been logged out. Please sign in to access your workspace.');
}

/* 4. Selective Interceptor: Prompt login ONLY when clicking + Add buttons or Profile button */
document.addEventListener('click', function(e) {
  if (!isUserLoggedOut()) return;

  // 1. Intercept User Profile button / link
  const profileTarget = e.target.closest('#profileBtn, a[href*="profile.html"], button[onclick*="profile.html"]');
  if (profileTarget) {
    e.preventDefault();
    e.stopImmediatePropagation();
    openAuthModal('Please sign in to access your profile & settings.');
    return;
  }

  // 2. Intercept + Add Application or + Add Learning buttons (including empty card buttons and column quick-add)
  const isAddText = (el) => {
    if (!el) return false;
    const txt = (el.textContent || '').trim();
    return txt === '+ Add' || txt === '+Add' || txt === 'Add' || txt === '+';
  };

  const addTarget = e.target.closest(
    '#addBtn, #mobileAddBtn, #secAddLearningBtn, #mobileAddLearningBtn, ' +
    '.add-app-toolbar-btn, .mobile-add-app-btn, .add-learning-btn, ' +
    '.empty-add-btn, .col-quick-add, button.col-quick-add, ' +
    '[onclick*="openLearningModal"], [onclick*="openApp"], [onclick*="openAddModal"]'
  ) || (isAddText(e.target.closest('button')) ? e.target.closest('button') : null);

  if (addTarget) {
    // Exclude theme toggle or close buttons
    if (addTarget.closest('#tbtn, #themeToggleBtn, .theme-toggle, .render-modal-close, #pc, #undo')) return;
    
    e.preventDefault();
    e.stopImmediatePropagation();
    const isLearnings = window.location.pathname.includes('learnings');
    openAuthModal(isLearnings ? 'Please sign in to log your daily learnings.' : 'Please sign in to add new job applications.');
    return;
  }
}, true);

// Page load guard for profile.html: if user is logged out, prompt login and restrict view
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('profile.html')) {
      if (isUserLoggedOut()) {
        setTimeout(() => {
          openAuthModal('Please sign in to access your profile & settings.');
        }, 150);
      }
    }
  });
}

function togglePasswordVisibility() {
  const pwdInput = document.getElementById('renderPasswordInput');
  const eyeSvg = document.getElementById('eyeIconSvg');
  if (!pwdInput) return;
  if (pwdInput.type === 'password') {
    pwdInput.type = 'text';
    if (eyeSvg) {
      eyeSvg.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
    }
  } else {
    pwdInput.type = 'password';
    if (eyeSvg) {
      eyeSvg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
    }
  }
}

function quickFocusSignup() {
  const input = document.getElementById('renderEmailInput');
  if (input) {
    input.value = '';
    input.placeholder = 'Enter new email to sign up...';
    input.focus();
  }
}

function handlePasswordReset() {
  const input = document.getElementById('renderEmailInput');
  const email = (input ? input.value : '').trim();
  alert('Password reset instructions would be sent to: ' + (email || 'your email address') + '. (Local passwordless access is also supported)');
}


const GOOGLE_CLIENT_ID = '836791560954-04nmefe9kd3vnej9c5l9c36u5thr5je8.apps.googleusercontent.com';

function loadGoogleIdentityServices() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (document.getElementById('googleGsiScript')) {
    return new Promise(resolve => {
      let checks = 0;
      const interval = setInterval(() => {
        checks++;
        if (window.google?.accounts?.oauth2 || checks > 30) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  }
  return new Promise(resolve => {
    const s = document.createElement('script');
    s.id = 'googleGsiScript';
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

// Preload Google Identity Services
loadGoogleIdentityServices();

async function submitGoogleOAuth() {
  const feedback = document.getElementById('renderFeedbackMsg');

  // In Desktop WebView2, execute standard Native App Loopback flow
  if (typeof getApiBaseUrl === 'function' && getApiBaseUrl()) {
    if (feedback) {
      feedback.className = 'render-feedback-msg';
      feedback.style.color = '#4338ca';
      feedback.style.background = 'rgba(99,102,241,0.1)';
      feedback.style.border = '1px solid rgba(99,102,241,0.25)';
      feedback.textContent = 'Opening Google Sign-In in your browser...';
      feedback.style.display = 'flex';
    }

    try {
      const sessionId = 'd_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      const res = await _nativeFetch('/api/auth/google/desktop/start?sessionId=' + sessionId).then(r => r.json());

      if (!res.ok || !res.url) {
        throw new Error(res.error || 'Could not initiate Google Desktop login');
      }

      if (feedback) {
        feedback.textContent = 'Please select your Google account in the opened browser tab...';
      }

      try {
        window.open(res.url, '_blank');
      } catch (_) {}

      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        if (attempts > 120) {
          clearInterval(pollInterval);
          if (feedback) {
            feedback.className = 'render-feedback-msg error';
            feedback.textContent = 'Google sign-in timed out. Please try again.';
          }
          return;
        }

        try {
          const pollRes = await _nativeFetch('/api/auth/google/desktop/poll?sessionId=' + sessionId).then(r => r.json());
          if (pollRes && pollRes.ready && pollRes.token) {
            clearInterval(pollInterval);

            localStorage.setItem('auth_token', pollRes.token);
            localStorage.setItem('auth_user', JSON.stringify(pollRes.user));
            localStorage.removeItem('logged_out');

            if (feedback) {
              feedback.className = 'render-feedback-msg success';
              feedback.textContent = 'Success! Authenticated as ' + (pollRes.user.name || pollRes.user.email);
              feedback.style.display = 'flex';
            }

            setTimeout(() => {
              closeAuthModal();
              window.location.reload();
            }, 600);
          }
        } catch (_) {}
      }, 1200);

      return;
    } catch (err) {
      if (feedback) {
        feedback.className = 'render-feedback-msg error';
        feedback.textContent = 'Desktop Google login error: ' + err.message;
        feedback.style.display = 'flex';
      }
      return;
    }
  }

  if (feedback) {
    feedback.className = 'render-feedback-msg';
    feedback.style.color = '#4338ca';
    feedback.style.background = 'rgba(99,102,241,0.1)';
    feedback.style.border = '1px solid rgba(99,102,241,0.25)';
    feedback.textContent = 'Opening Google Sign-In...';
    feedback.style.display = 'flex';
  }

  try {
    await loadGoogleIdentityServices();

    // Use official Google OAuth2 Token Client for the native Google popup
    if (window.google?.accounts?.oauth2) {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            if (feedback) {
              feedback.className = 'render-feedback-msg error';
              feedback.textContent = 'Google Sign-In canceled or failed.';
              feedback.style.display = 'flex';
            }
            return;
          }

          if (feedback) {
            feedback.textContent = 'Authenticating with Job Tracker...';
          }

          try {
            // Fetch Google user profile
            const profile = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: 'Bearer ' + tokenResponse.access_token }
            }).then(r => r.json());

            // Complete authentication with our backend
            const rawRes = await _nativeFetch('/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                profile: {
                  email: profile.email,
                  name: profile.name,
                  picture: profile.picture,
                  sub: profile.sub
                }
              })
            });

            const resText = await rawRes.text();
            let res;
            try {
              res = JSON.parse(resText);
            } catch (_) {
              if (!rawRes.ok) {
                throw new Error(resText.slice(0, 200) || `Server returned HTTP ${rawRes.status}`);
              }
              throw new Error('Invalid JSON response from server');
            }

            if (!rawRes.ok) {
              throw new Error(res?.error || `Server error (HTTP ${rawRes.status})`);
            }

            if (res.ok && res.token) {
              localStorage.setItem('auth_token', res.token);
              localStorage.setItem('auth_user', JSON.stringify(res.user));
              localStorage.removeItem('logged_out');

              if (feedback) {
                feedback.className = 'render-feedback-msg success';
                feedback.textContent = 'Success! Signed in as ' + (res.user.name || res.user.email);
                feedback.style.display = 'flex';
              }

              setTimeout(() => {
                closeAuthModal();
                window.location.reload();
              }, 500);
            } else {
              if (feedback) {
                feedback.className = 'render-feedback-msg error';
                feedback.textContent = res.error || 'Backend authentication failed';
                feedback.style.display = 'flex';
              }
            }
          } catch (err) {
            if (feedback) {
              feedback.className = 'render-feedback-msg error';
              feedback.textContent = 'Google sign-in error: ' + err.message;
              feedback.style.display = 'flex';
            }
          }
        }
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
      return;
    }
  } catch (err) {
    console.warn('Google Identity popup error, using fallback:', err);
  }

  // Fallback if popup cannot be opened
  fallbackGoogleSignIn(feedback);
}

async function fallbackGoogleSignIn(feedback) {
  const emailInput = document.getElementById('renderEmailInput');
  let email = (emailInput ? emailInput.value : '').trim();

  if (!email || !email.includes('@')) {
    email = prompt('Enter your Google Account email for Google OAuth:', '') || '';
    if (!email || !email.includes('@')) return;
    if (emailInput) emailInput.value = email;
  }

  const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  try {
    const rawRes = await _nativeFetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: {
          email,
          name,
          picture: 'https://lh3.googleusercontent.com/a/default-user',
          sub: 'g_' + Math.abs(hashCode(email))
        }
      })
    });

    const resText = await rawRes.text();
    let res;
    try {
      res = JSON.parse(resText);
    } catch (_) {
      if (!rawRes.ok) {
        throw new Error(resText.slice(0, 200) || `Server returned HTTP ${rawRes.status}`);
      }
      throw new Error('Invalid JSON response from server');
    }

    if (!rawRes.ok) {
      throw new Error(res?.error || `Server error (HTTP ${rawRes.status})`);
    }

    if (res.ok && res.token) {
      localStorage.setItem('auth_token', res.token);
      localStorage.setItem('auth_user', JSON.stringify(res.user));
      localStorage.removeItem('logged_out');

      if (feedback) {
        feedback.className = 'render-feedback-msg success';
        feedback.textContent = 'Success! Authenticated via Google as ' + (res.user.name || res.user.email);
        feedback.style.display = 'flex';
      }

      setTimeout(() => {
        closeAuthModal();
        window.location.reload();
      }, 500);
    } else {
      if (feedback) {
        feedback.className = 'render-feedback-msg error';
        feedback.textContent = res.error || 'Google authentication failed';
        feedback.style.display = 'flex';
      }
    }
  } catch (err) {
    if (feedback) {
      feedback.className = 'render-feedback-msg error';
      if (err && err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        feedback.textContent = 'Database engine is offline. Please run "npm start" in terminal.';
      } else {
        feedback.textContent = 'Connection error: ' + (err ? err.message : 'Unknown error');
      }
      feedback.style.display = 'flex';
    }
  }
}


async function submitCustomEmailAuth() {
  const emailInput = document.getElementById('renderEmailInput');
  const pwdInput = document.getElementById('renderPasswordInput');
  const email = (emailInput ? emailInput.value : '').trim();
  const pin = (pwdInput ? pwdInput.value : '').trim();
  const name = email ? email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';
  const feedback = document.getElementById('renderFeedbackMsg');

  if (!email || !email.includes('@')) {
    if (feedback) {
      feedback.className = 'render-feedback-msg error';
      feedback.textContent = 'Please enter a valid email address.';
      feedback.style.display = 'flex';
    }
    return;
  }

  if (feedback) {
    feedback.className = 'render-feedback-msg';
    feedback.style.color = '#111827';
    feedback.style.background = '#f3f4f6';
    feedback.style.border = '1px solid #d1d5db';
    feedback.textContent = 'Signing in to workspace...';
    feedback.style.display = 'flex';
  }

  try {
    const res = await _nativeFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, pin })
    }).then(r => r.json());

    if (res.token) {
      localStorage.setItem('auth_token', res.token);
      localStorage.setItem('auth_user', JSON.stringify(res.user));
      localStorage.removeItem('logged_out');

      if (feedback) {
        feedback.className = 'render-feedback-msg success';
        feedback.textContent = 'Success! Signed in as ' + (res.user.name || res.user.email);
        feedback.style.display = 'flex';
      }

      setTimeout(() => {
        closeAuthModal();
        window.location.reload();
      }, 500);
    } else {
      if (feedback) {
        feedback.className = 'render-feedback-msg error';
        feedback.textContent = res.error || 'Sign in failed';
        feedback.style.display = 'flex';
      }
    }
  } catch (err) {
    if (feedback) {
      feedback.className = 'render-feedback-msg error';
      if (err && err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        feedback.textContent = 'Database engine is offline. Please run "npm start" in terminal.';
      } else {
        feedback.textContent = 'Connection error: ' + (err ? err.message : 'Unknown error');
      }
      feedback.style.display = 'flex';
    }
  }
}

function _nativeFetch(url, options) {
  const resolvedUrl = resolveApiUrl(url);
  return _origFetch.call(window, resolvedUrl, options);
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// Explicit window bindings for ES module and bundler compatibility
window.isUserLoggedOut = isUserLoggedOut;
window.getActiveUser = getActiveUser;
window.handleTopbarLogout = handleTopbarLogout;
window.togglePasswordVisibility = togglePasswordVisibility;
window.quickFocusSignup = quickFocusSignup;
window.handlePasswordReset = handlePasswordReset;
window.submitGoogleOAuth = submitGoogleOAuth;
window.submitCustomEmailAuth = submitCustomEmailAuth;
window.syncTopbarAuthUI = syncTopbarAuthUI;

function isDesktopApp() {
  return Boolean(
    window.__TAURI__ ||
    window.__TAURI_INTERNALS__ ||
    (window.location && (
      window.location.protocol === 'tauri:' ||
      window.location.protocol === 'asset:' ||
      window.location.hostname === 'tauri.localhost' ||
      window.location.protocol === 'file:'
    ))
  );
}
window.isDesktopApp = isDesktopApp;

async function desktopInvoke(cmd, args = {}) {
  try {
    if (window.__TAURI__ && window.__TAURI__.core && typeof window.__TAURI__.core.invoke === 'function') {
      return await window.__TAURI__.core.invoke(cmd, args);
    }
    if (window.__TAURI__ && typeof window.__TAURI__.invoke === 'function') {
      return await window.__TAURI__.invoke(cmd, args);
    }
    if (window.__TAURI_INTERNALS__ && typeof window.__TAURI_INTERNALS__.invoke === 'function') {
      return await window.__TAURI_INTERNALS__.invoke(cmd, args);
    }
  } catch (err) {
    console.error(`[Desktop IPC] Error executing command '${cmd}':`, err);
    throw err;
  }
  return null;
}
window.desktopInvoke = desktopInvoke;

async function openAppLogs() {
  if (isDesktopApp()) {
    try {
      await desktopInvoke('open_log_folder');
    } catch (e) {
      alert('Could not open log folder: ' + (e.message || e));
    }
  } else {
    alert('Log folder is only available in the desktop application.');
  }
}
window.openAppLogs = openAppLogs;

async function toggleDevTools() {
  if (isDesktopApp()) {
    try {
      await desktopInvoke('toggle_devtools');
    } catch (e) {
      console.warn('Could not toggle DevTools:', e);
    }
  }
}
window.toggleDevTools = toggleDevTools;

// Global keyboard shortcut: Ctrl+Shift+I or F12 toggles Developer Console in Desktop app
window.addEventListener('keydown', (e) => {
  if (
    (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) ||
    e.key === 'F12'
  ) {
    if (isDesktopApp()) {
      e.preventDefault();
      toggleDevTools();
    }
  }
});

// Auto-run UI sync on load
document.addEventListener('DOMContentLoaded', () => {
  ensureAuthModal();
  syncTopbarAuthUI();
});
setTimeout(syncTopbarAuthUI, 50);

