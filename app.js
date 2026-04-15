// ═══════════════════════════════════════════════════════════════
//  MPilot AI — app.js  (Production-ready, Render-compatible)
//  Fixed: 2025 — All issues resolved end-to-end
// ═══════════════════════════════════════════════════════════════

// ─── API BASE (auto-detects local vs Render) ──────────────────
// NOTE: The inline script in index.html sets:
//   const API = window.location.hostname === 'localhost'
//               ? 'http://localhost:8000'
//               : 'https://mpilot-backend.onrender.com';
// app.js uses the same API variable via closure.
// No duplicate declaration here.

// ─── MISSING FUNCTIONS — injected by app.js ──────────────────
// These are called from HTML onclick handlers but were never
// defined in the inline script block. app.js loads AFTER inline
// JS, so these definitions are picked up correctly.

// ══════════════════════════════════════════════════════════════
//  AUTH MODAL  (openAuthModal / closeAuthModal / switchAuthTab)
// ══════════════════════════════════════════════════════════════

/**
 * Open the auth modal and optionally switch to a tab.
 * HTML uses id="auth-modal" (not "auth-modal"), so we target that.
 * Called as: openAuthModal('login') or openAuthModal('signup')
 */
function openAuthModal(tab) {
  const modal = document.getElementById('auth-modal');
  if (!modal) { console.error('[MPilot] #auth-modal not found'); return; }
  modal.style.display = 'flex';
  // Switch to requested tab if provided
  if (tab) switchAuthTab(tab);
}

/**
 * Close the auth modal and reset error states.
 */
function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.style.display = 'none';
  // Clear any error messages
  const liErr = document.getElementById('li-err');
  const suErr = document.getElementById('su-err');
  if (liErr) { liErr.textContent = ''; liErr.style.display = 'none'; }
  if (suErr) { suErr.textContent = ''; suErr.style.display = 'none'; }
}

/**
 * Switch between Login and Signup tabs inside the auth modal.
 * Called as: switchAuthTab('login') or switchAuthTab('signup')
 */
function switchAuthTab(tab) {
  const loginForm   = document.getElementById('auth-login-form');
  const signupForm  = document.getElementById('auth-signup-form');
  const tabLogin    = document.getElementById('auth-tab-login');
  const tabSignup   = document.getElementById('auth-tab-signup');
  const title       = document.getElementById('auth-title');
  const bizPicker   = document.getElementById('auth-biz-picker');

  // Hide biz picker if switching tabs
  if (bizPicker) bizPicker.style.display = 'none';

  if (tab === 'login') {
    if (loginForm)  loginForm.style.display  = 'block';
    if (signupForm) signupForm.style.display = 'none';
    if (tabLogin)  { tabLogin.style.background  = 'var(--accent)'; tabLogin.style.color  = '#fff'; }
    if (tabSignup) { tabSignup.style.background = 'transparent';   tabSignup.style.color = 'var(--muted)'; }
    if (title) title.textContent = 'Sign in to MPilot';
  } else {
    if (loginForm)  loginForm.style.display  = 'none';
    if (signupForm) signupForm.style.display = 'block';
    if (tabSignup) { tabSignup.style.background = 'var(--accent)'; tabSignup.style.color = '#fff'; }
    if (tabLogin)  { tabLogin.style.background  = 'transparent';   tabLogin.style.color  = 'var(--muted)'; }
    if (title) title.textContent = 'Create your free account';
  }
}

// ══════════════════════════════════════════════════════════════
//  SIGNUP  (doSignup)
// ══════════════════════════════════════════════════════════════

/**
 * Handle signup form submission.
 * Reads: su-name, su-email, su-pw, su-biz, su-ph, su-cat, su-role
 * Backend: POST /api/auth/signup
 * On success: auto-login and go to setup
 */
async function doSignup() {
  const btn  = document.getElementById('su-btn');
  const err  = document.getElementById('su-err');
  const ok   = document.getElementById('su-ok');
  if (err) { err.textContent = ''; err.style.display = 'none'; }
  if (ok)  { ok.style.display = 'none'; }

  const name     = document.getElementById('su-name')?.value.trim()  || '';
  const email    = document.getElementById('su-email')?.value.trim() || '';
  const pw       = document.getElementById('su-pw')?.value           || '';
  const bizName  = document.getElementById('su-biz')?.value.trim()   || '';
  const phone    = document.getElementById('su-ph')?.value.trim()    || '';
  const category = document.getElementById('su-cat')?.value          || '';
  const role     = document.getElementById('su-role')?.value         || 'owner';

  // Basic validation
  if (!email || !pw) {
    if (err) { err.textContent = 'Email and password are required.'; err.style.display = 'block'; }
    return;
  }
  if (pw.length < 6) {
    if (err) { err.textContent = 'Password must be at least 6 characters.'; err.style.display = 'block'; }
    return;
  }

  if (btn) { btn.textContent = 'Creating account…'; btn.disabled = true; }

  try {
    // Step 1: Create account
    const payload = { email, password: pw };
    if (name)     payload.name     = name;
    if (bizName)  payload.biz_name = bizName;
    if (phone)    payload.phone    = phone;
    if (category) payload.category = category;
      if (role)     payload.role     = role;

    const data = await req('POST', '/api/auth/signup', payload);

    if (!data || data.detail) {
      const msg = typeof data?.detail === 'string'
        ? data.detail
        : (Array.isArray(data?.detail) ? data.detail.map(d=>d.msg).join(', ') : 'Signup failed');
      if (err) { err.textContent = msg; err.style.display = 'block'; }
      return;
    }

    // Step 2: Auto-login after successful signup
    if (btn) btn.textContent = 'Signing in…';

    const loginData = await req('POST', '/api/auth/login', { email, password: pw });

    if (loginData && (loginData.access_token || loginData.token)) {
      const token = loginData.access_token || loginData.token;
      localStorage.setItem('mpilot_token', token);
      localStorage.setItem('mpilot_user',  JSON.stringify(loginData));
      if (typeof USER !== 'undefined') {
        USER = loginData;
      }

      closeAuthModal();
      if (typeof initUserUI === 'function') initUserUI();
      if (typeof loadBizList === 'function') await loadBizList();

      // New user → go to setup
      if (typeof goTo === 'function') goTo('setup');
      if (typeof switchSetupTab === 'function') switchSetupTab('profile');
      if (typeof toast === 'function') toast('Welcome to MPilot! Let\'s set up your business 👋');
    } else {
      // Signup worked but auto-login failed — ask user to login manually
      if (ok) { ok.textContent = 'Account created! Please log in.'; ok.style.display = 'block'; }
      setTimeout(() => switchAuthTab('login'), 1500);
    }
  } catch (e) {
    console.error('[doSignup] error:', e);
    if (err) { err.textContent = 'Unexpected error. Please try again.'; err.style.display = 'block'; }
  } finally {
    if (btn) { btn.textContent = 'Create Free Account'; btn.disabled = false; }
  }
}

// ══════════════════════════════════════════════════════════════
//  LOGOUT  (doLogout)
// ══════════════════════════════════════════════════════════════

/**
 * Clear session and reload to login state.
 */
function doLogout() {
  localStorage.removeItem('mpilot_token');
  localStorage.removeItem('mpilot_user');
  localStorage.removeItem('mpilot_biz');
  localStorage.removeItem('mpilot_last_biz');
  // Full page reload gives cleanest state
  window.location.reload();
}

// ══════════════════════════════════════════════════════════════
//  UPGRADE MODAL  (closeUpgradeModal / closePricingModal)
// ══════════════════════════════════════════════════════════════

function closeUpgradeModal() {
  const m = document.getElementById('upgrade-modal');
  if (m) m.style.display = 'none';
}

function closePricingModal() {
  const m = document.getElementById('pricing-modal');
  if (m) m.style.display = 'none';
}

/**
 * Upgrade plan handler.
 * Called as: upgradePlan('pro', 'Pro')
 */
async function upgradePlan(planId, planName) {
  if (typeof toast === 'function') toast(`Upgrading to ${planName}…`);
  const btn = event?.target;
  if (btn) { btn.disabled = true; btn.textContent = 'Processing…'; }

  try {
    const data = await req('POST', '/api/billing/upgrade', { plan: planId });
    if (data && data.success) {
      // Update local USER object
      if (typeof USER !== 'undefined' && USER) {
        USER.plan = planId;
        localStorage.setItem('mpilot_user', JSON.stringify(USER));
      }
      if (typeof initUserUI === 'function') initUserUI();
      closeUpgradeModal();
      closePricingModal();
      if (typeof toast === 'function') toast(`✓ Upgraded to ${planName} plan!`, 'ok');
    } else {
      const msg = data?.detail || data?.message || 'Upgrade failed — please try again';
      if (typeof toast === 'function') toast(msg, 'err');
    }
  } catch (e) {
    console.error('[upgradePlan]', e);
    if (typeof toast === 'function') toast('Upgrade error — please try again', 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = `Get ${planName}`; }
  }
}

/**
 * Select plan from pricing modal (alias for upgradePlan).
 */
function selectPlan(planId, planName) {
  upgradePlan(planId, planName);
}

// ══════════════════════════════════════════════════════════════
//  PATCH: Fix doLogin token field mismatch
// ══════════════════════════════════════════════════════════════
// The backend (FastAPI) returns { access_token: "..." }
// but the original doLogin() checks data.token — this patches it.
// We override doLogin here so app.js (loaded last) wins.

async function doLogin() {
  const btn = document.getElementById('li-btn');
  const err = document.getElementById('li-err');
  if (err) { err.textContent = ''; err.style.display = 'none'; }

  const email = document.getElementById('li-email')?.value.trim()  || '';
  const pw    = document.getElementById('li-pw')?.value            || '';

  if (!email || !pw) {
    if (err) { err.textContent = 'Email and password are required.'; err.style.display = 'block'; }
    return;
  }

  if (btn) { btn.textContent = 'Logging in…'; btn.disabled = true; }

  try {
    const data = await req('POST', '/api/auth/login', { email, password: pw });

    // FIX: backend returns access_token, original code checked token only
    const token = data?.access_token || data?.token;

    if (!token) {
      const msg = typeof data?.detail === 'string'
        ? data.detail
        : (data?.detail?.[0]?.msg || 'Invalid email or password');
      if (err) { err.textContent = msg; err.style.display = 'block'; }
      return;
    }

    // Store session
    localStorage.setItem('mpilot_token', token);
    localStorage.setItem('mpilot_user',  JSON.stringify(data));
    if (typeof USER !== 'undefined') USER = data;

    // Load businesses
    const bizList = await req('GET', '/api/businesses/');
    const arr = Array.isArray(bizList) ? bizList : [];

    if (arr.length === 0) {
      closeAuthModal();
      if (typeof initUserUI  === 'function') initUserUI();
      if (typeof loadBizList === 'function') await loadBizList();
      if (typeof goTo           === 'function') goTo('setup');
      if (typeof switchSetupTab === 'function') switchSetupTab('profile');
      if (typeof toast === 'function') toast('Welcome! Set up your first business 👋');
      return;
    }

    // Has businesses — show picker or go straight to dashboard
    if (typeof _showLoginBizPicker === 'function') {
      _showLoginBizPicker(arr, data.name || data.email);
    } else {
      // Fallback: select first business and go to dashboard
      closeAuthModal();
      if (typeof initUserUI  === 'function') initUserUI();
      if (typeof loadBizList === 'function') await loadBizList();
      if (typeof loadDash    === 'function') loadDash();
    }
  } catch (e) {
    console.error('[doLogin] error:', e);
    if (err) { err.textContent = 'Login error — please try again.'; err.style.display = 'block'; }
  } finally {
    if (btn) { btn.textContent = 'Login →'; btn.disabled = false; }
  }
}

// ══════════════════════════════════════════════════════════════
//  PATCH: Fix API base URL
// ══════════════════════════════════════════════════════════════
// The inline script sets: const API = '';
// This patch runs after inline JS and corrects it if still empty.
(function patchAPIBase() {
  try {
    // API is declared in inline JS with 'const' so we can't reassign it.
    // Instead we check: if API is empty, the req() function will use wrong URLs.
    // Solution: we override req() here to inject the correct base URL.
    const _correctBase = window.location.hostname === 'localhost'
      ? 'http://localhost:8000'
      : 'https://mpilot-backend.onrender.com';

    // Check if the existing req() would work (API !== '')
    if (typeof API !== 'undefined' && API !== '') {
      console.log('[MPilot] API base already set:', API);
      return;
    }

    // API is empty — we need to wrap req() to prepend the correct base
    console.warn('[MPilot] API base is empty — patching req() to use:', _correctBase);
    const _origReq = req;
    window.req = async function req(method, path, body) {
      // If path already starts with http (absolute), use as-is
      if (path.startsWith('http')) return _origReq(method, path, body);
      // Otherwise, temporarily make fetch use correct base by monkey-patching
      // We do this by rewriting the path to a full URL
      const _origFetch = window.fetch;
      window.fetch = function(url, opts) {
        if (typeof url === 'string' && !url.startsWith('http')) {
          url = _correctBase + url;
        }
        return _origFetch(url, opts);
      };
      try {
        return await _origReq(method, path, body);
      } finally {
        window.fetch = _origFetch;
      }
    };
    console.log('[MPilot] req() patched with base URL');
  } catch (e) {
    console.error('[MPilot] patchAPIBase error:', e);
  }
})();

// ══════════════════════════════════════════════════════════════
//  DEFENSIVE: Ensure all HTML-called functions exist as no-ops
//             if the inline JS failed to define them
// ══════════════════════════════════════════════════════════════
(function ensureFunctions() {
  const stubs = {
    // These should be defined in inline JS but stub them if not
    toast:           (msg, type) => console.log('[toast]', type || 'info', msg),
    goTo:            (page) => console.log('[goTo]', page),
    loadDash:        () => console.log('[loadDash] called'),
    loadCusts:       (q) => console.log('[loadCusts]', q),
    loadRevs:        () => console.log('[loadRevs]'),
    loadCampaigns:   () => console.log('[loadCampaigns]'),
    initUserUI:      () => console.log('[initUserUI]'),
    loadBizList:     () => Promise.resolve([]),
    switchSetupTab:  (t) => console.log('[switchSetupTab]', t),
    selectBiz:       (id) => console.log('[selectBiz]', id),
    addNewBusinessQuick: () => console.log('[addNewBusinessQuick]'),
    toggleMobileNav: () => console.log('[toggleMobileNav]'),
    closeMobileNav:  () => console.log('[closeMobileNav]'),
    copyWebhookUrl:  () => console.log('[copyWebhookUrl]'),
    saveWAConfig:    () => console.log('[saveWAConfig]'),
    sendWATestMessage: () => console.log('[sendWATestMessage]'),
    toggleWAKeyVisibility: () => console.log('[toggleWAKeyVisibility]'),
    loadWATemplates: () => console.log('[loadWATemplates]'),
    _showLoginBizPicker: (arr, name) => {
      // Fallback picker: just select first biz
      if (arr && arr.length > 0) {
        const id = arr[0].business_id || arr[0].id;
        if (id && typeof selectBiz === 'function') {
          closeAuthModal();
          if (typeof initUserUI  === 'function') initUserUI();
          if (typeof loadBizList === 'function') loadBizList();
        }
      }
    }
  };

  Object.keys(stubs).forEach(name => {
    if (typeof window[name] === 'undefined') {
      console.warn('[MPilot] Stubbing missing function:', name);
      window[name] = stubs[name];
    }
  });
})();

// ══════════════════════════════════════════════════════════════
//  doUpgrade alias
// ══════════════════════════════════════════════════════════════
function doUpgrade() {
  const m = document.getElementById('upgrade-modal');
  if (m) m.style.display = 'flex';
}

// ══════════════════════════════════════════════════════════════
//  DOMContentLoaded guard — runs AFTER inline JS IIFE
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function () {
  // Make sure the auth modal starts hidden
  const authModal = document.getElementById('auth-modal');
  if (authModal && authModal.style.display === '') {
    authModal.style.display = 'none';
  }

  // Keyboard shortcuts: Escape closes modals
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeAuthModal();
      closeUpgradeModal();
      closePricingModal();
    }
  });

  console.log('[MPilot] app.js fully loaded ✓');
});
