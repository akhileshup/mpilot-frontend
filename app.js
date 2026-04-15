// ═══════════════════════════════════════════════════════════════════════
//  MPilot AI — app.js
//  Loaded AFTER the inline <script> block in index.html.
//  Provides: missing modal functions, patched doLogin/doSignup,
//            loadMyProfile, changePassword, upgrade modal rendering,
//            and API base URL safety net.
// ═══════════════════════════════════════════════════════════════════════

// ─── Shared Plan Data (single source of truth) ──────────────────────────────
// Also defined in landing.html as MPILOT_PLANS — keep in sync.
const MPILOT_PLANS = [
  {
    id: 'free', name: 'Free', monthlyPrice: 0, annualPrice: 0,
    desc: 'Get started. No credit card.',
    limits: '100 contacts · 50 WA msgs/mo · 1 QR',
    popular: false,
    features: [
      { on: true,  text: '1 QR code (WhatsApp capture)' },
      { on: true,  text: 'Up to 100 contacts' },
      { on: true,  text: 'Google Business connection' },
      { on: true,  text: 'Manual review replies' },
      { on: true,  text: 'Basic CRM' },
      { on: false, text: 'AI auto-replies' },
      { on: false, text: 'WhatsApp campaigns' },
      { on: false, text: 'Win-back automation' },
      { on: false, text: 'Footfall AI' },
    ]
  },
  {
    id: 'starter', name: 'Starter', monthlyPrice: 299, annualPrice: 239,
    desc: 'For single-location businesses.',
    limits: '2,000 contacts · 1,000 WA msgs/mo · 5 QR',
    popular: false,
    features: [
      { on: true,  text: '5 QR codes' },
      { on: true,  text: 'Up to 2,000 contacts' },
      { on: true,  text: 'AI Google review replies' },
      { on: true,  text: 'Review request automation' },
      { on: true,  text: 'Win-back campaigns' },
      { on: true,  text: 'AI content & social posts' },
      { on: true,  text: '10 campaigns/month' },
      { on: false, text: 'Footfall AI & peak hours' },
      { on: false, text: 'Ads Manager' },
    ]
  },
  {
    id: 'growth', name: 'Growth', monthlyPrice: 799, annualPrice: 639,
    desc: 'Scale your customer base fast.',
    limits: '10,000 contacts · 5,000 WA msgs/mo · 20 QR',
    popular: true, badge: 'Most Popular',
    features: [
      { on: true, text: '20 QR codes' },
      { on: true, text: 'Up to 10,000 contacts' },
      { on: true, text: 'Footfall AI & peak hours' },
      { on: true, text: 'Ads Manager (Meta + Google)' },
      { on: true, text: '50 campaigns/month' },
      { on: true, text: 'Instagram & Facebook posts' },
      { on: true, text: 'Competitor analysis' },
      { on: true, text: 'AI Reels scripts' },
      { on: false, text: 'Multi-branch management' },
    ]
  },
  {
    id: 'pro', name: 'Pro', monthlyPrice: 1499, annualPrice: 1199,
    desc: 'Multi-location power for chains.',
    limits: '50,000 contacts · 20,000 WA msgs/mo · 100 QR',
    popular: false,
    features: [
      { on: true, text: '100 QR codes' },
      { on: true, text: 'Up to 50,000 contacts' },
      { on: true, text: 'Multi-branch management' },
      { on: true, text: '₹499/mo per extra branch' },
      { on: true, text: '200 campaigns/month' },
      { on: true, text: '5 staff logins' },
      { on: true, text: 'Priority support' },
      { on: true, text: 'All Growth features' },
      { on: true, text: 'Custom AI persona' },
    ]
  },
  {
    id: 'agency', name: 'Agency', monthlyPrice: 2999, annualPrice: 2399,
    desc: 'Manage 25+ businesses from one account.',
    limits: 'Unlimited contacts · 20,000 WA msgs/mo',
    popular: false,
    features: [
      { on: true, text: 'Up to 25 businesses' },
      { on: true, text: 'Unlimited contacts' },
      { on: true, text: 'White-label reports' },
      { on: true, text: 'Bulk campaign scheduling' },
      { on: true, text: 'Agency dashboard' },
      { on: true, text: '20 staff logins' },
      { on: true, text: 'Dedicated account manager' },
      { on: true, text: 'All Pro features' },
      { on: true, text: 'API access' },
    ]
  }
];

// ─── Upgrade modal period state ──────────────────────────────────────────────
let _upgradePeriod = 'monthly';

/**
 * Render plan cards into any container element.
 * Used by: upgrade modal, pricing modal (index.html)
 *
 * @param {string}   containerId - target element id
 * @param {object}   opts
 *   period      - 'monthly' | 'annual'
 *   currentPlan - plan id of user's current plan (highlights it)
 *   onSelect    - function(planId, planName) called on button click
 */
function renderPlanGrid(containerId, opts = {}) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const { period = 'monthly', currentPlan = null, onSelect = null } = opts;

  el.innerHTML = MPILOT_PLANS.map(plan => {
    const price   = period === 'annual' ? plan.annualPrice : plan.monthlyPrice;
    const isCurr  = currentPlan === plan.id;
    const isFree  = plan.monthlyPrice === 0;

    const btnClass = isCurr
      ? 'plan-btn plan-btn-current'
      : (plan.popular ? 'plan-btn plan-btn-primary' : 'plan-btn plan-btn-secondary');

    const btnLabel = isCurr
      ? '✓ Current Plan'
      : (isFree ? 'Get Started Free' : `Upgrade to ${plan.name}`);

    const onClickAttr = isCurr ? '' : `onclick="handlePlanSelect('${plan.id}','${plan.name}')"`;

    return `
      <div class="plan-card ${plan.popular ? 'popular' : ''}">
        ${plan.badge ? `<div class="plan-hot-badge">${plan.badge}</div>` : ''}
        <div class="plan-name">${plan.name}</div>
        <div class="plan-price">
          ${isFree
            ? '<span style="font-size:20px;font-weight:700">Free</span>'
            : `<sup>₹</sup>${price.toLocaleString('en-IN')}<sub>/mo</sub>`}
        </div>
        ${!isFree && period === 'annual'
          ? `<div class="plan-period" style="color:var(--a2)">billed annually · 20% off</div>`
          : `<div class="plan-period">&nbsp;</div>`}
        <div class="plan-desc">${plan.desc}</div>
        <div class="plan-limits-bar">${plan.limits}</div>
        <div class="plan-divider"></div>
        <ul class="plan-feats">
          ${plan.features.map(f => `
            <li class="${f.on ? 'on' : ''}">
              <span class="${f.on ? 'ck' : 'cx'}">${f.on ? '✓' : '✗'}</span>
              <span>${f.text}</span>
            </li>`).join('')}
        </ul>
        <button class="${btnClass}" ${onClickAttr}>${btnLabel}</button>
      </div>`;
  }).join('');
}

/**
 * Called when user clicks a plan button in the upgrade modal.
 * Stored as window-level so it's reachable from inline onclick attrs.
 */
window.handlePlanSelect = async function(planId, planName) {
  await upgradePlan(planId, planName);
};

function toggleUpgradePeriod() {
  setUpgradePeriod(_upgradePeriod === 'monthly' ? 'annual' : 'monthly');
}

function setUpgradePeriod(period) {
  _upgradePeriod = period;
  const thumb = document.getElementById('um-thumb');
  const lblM  = document.getElementById('um-lbl-m');
  const lblA  = document.getElementById('um-lbl-a');
  if (thumb) thumb.style.transform = period === 'annual' ? 'translateX(20px)' : 'translateX(0)';
  if (lblM)  { lblM.style.fontWeight = period === 'monthly' ? '600' : '400'; lblM.style.color = period === 'monthly' ? 'var(--text)' : 'var(--muted)'; }
  if (lblA)  { lblA.style.fontWeight = period === 'annual'  ? '600' : '400'; lblA.style.color = period === 'annual'  ? 'var(--text)' : 'var(--muted)'; }
  _renderUpgradeGrid();
}

function _renderUpgradeGrid() {
  const currentPlan = (typeof USER !== 'undefined' && USER) ? (USER.plan || 'free') : null;
  renderPlanGrid('upgrade-plan-grid', {
    period:      _upgradePeriod,
    currentPlan: currentPlan,
    onSelect:    window.handlePlanSelect,
  });
}

// ══════════════════════════════════════════════════════════════════════════════
//  AUTH MODAL — openAuthModal / closeAuthModal / switchAuthTab
//  Defined here as overrides so app.js (loaded last) always wins.
// ══════════════════════════════════════════════════════════════════════════════

function openAuthModal(tab) {
  const m = document.getElementById('auth-modal');
  if (!m) { console.error('[MPilot] #auth-modal not found'); return; }
  m.style.display = 'flex';
  switchAuthTab(tab || 'login');
}

function closeAuthModal() {
  const m = document.getElementById('auth-modal');
  if (m) m.style.display = 'none';
  ['li-err','su-err','fp-err','fp-ok'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.style.display = 'none'; }
  });
  // If closed without logging in, return to landing page
  if (!localStorage.getItem('mpilot_token')) {
    window.location.replace('landing.html');
  }
}

function switchAuthTab(tab) {
  const lf = document.getElementById('auth-login-form');
  const sf = document.getElementById('auth-signup-form');
  const ff = document.getElementById('auth-forgot-form');
  const rf = document.getElementById('auth-reset-form');
  const bp = document.getElementById('auth-biz-picker');
  const tl = document.getElementById('auth-tab-login');
  const ts = document.getElementById('auth-tab-signup');
  const tt = document.getElementById('auth-title');

  // Hide all panels
  [lf, sf, ff, rf, bp].forEach(el => { if (el) el.style.display = 'none'; });

  // Reset tab styles
  [tl, ts].forEach(el => {
    if (el) { el.style.background = 'transparent'; el.style.color = 'var(--muted)'; }
  });

  if (tab === 'login') {
    if (lf) lf.style.display = 'block';
    if (tl) { tl.style.background = 'var(--accent)'; tl.style.color = '#fff'; }
    if (tt) tt.textContent = 'Sign in to MPilot';
  } else if (tab === 'signup') {
    if (sf) sf.style.display = 'block';
    if (ts) { ts.style.background = 'var(--accent)'; ts.style.color = '#fff'; }
    if (tt) tt.textContent = 'Create your free account';
  } else if (tab === 'forgot') {
    if (ff) ff.style.display = 'block';
    if (tt) tt.textContent = 'Reset your password';
  } else if (tab === 'reset') {
    if (rf) rf.style.display = 'block';
    if (tt) tt.textContent = 'Set new password';
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  LOGIN — patched to handle both access_token and token field names
// ══════════════════════════════════════════════════════════════════════════════

async function doLogin() {
  const btn = document.getElementById('li-btn');
  const err = document.getElementById('li-err');
  if (err) { err.textContent = ''; err.style.display = 'none'; }

  const email = (document.getElementById('li-email')?.value || '').trim();
  const pw    = document.getElementById('li-pw')?.value || '';

  if (!email || !pw) {
    if (err) { err.textContent = 'Email and password are required.'; err.style.display = 'block'; }
    return;
  }

  if (btn) { btn.textContent = 'Logging in…'; btn.disabled = true; }

  try {
    const data = await req('POST', '/api/auth/login', { email, password: pw });

    // Backend returns 'token' (not 'access_token') — handle both for safety
    const token = data?.access_token || data?.token;

    if (!token) {
      const msg = typeof data?.detail === 'string'
        ? data.detail
        : (data?.detail?.[0]?.msg || 'Invalid email or password');
      if (err) { err.textContent = msg; err.style.display = 'block'; }
      return;
    }

    // Clear previous session's business selection on login (prevents cross-account data bleed)
    localStorage.removeItem('mpilot_biz');
    localStorage.removeItem('mpilot_last_biz');
    localStorage.setItem('mpilot_token', token);
    localStorage.setItem('mpilot_user',  JSON.stringify(data));
    if (typeof USER !== 'undefined') USER = data;

    const bizList = await req('GET', '/api/businesses/');
    const arr = Array.isArray(bizList) ? bizList : [];

    closeAuthModal();
    if (typeof initUserUI  === 'function') initUserUI();

    if (arr.length === 0) {
      if (typeof loadBizList    === 'function') await loadBizList();
      if (typeof goTo           === 'function') goTo('setup');
      if (typeof switchSetupTab === 'function') switchSetupTab('profile');
      if (typeof toast          === 'function') toast('Welcome! Set up your first business 👋');
      return;
    }

    if (typeof _showLoginBizPicker === 'function') {
      _showLoginBizPicker(arr, data.name || data.email);
    } else {
      if (typeof loadBizList === 'function') await loadBizList();
      if (typeof loadDash    === 'function') loadDash();
    }
  } catch (e) {
    console.error('[doLogin]', e);
    if (err) { err.textContent = 'Login error — please try again.'; err.style.display = 'block'; }
  } finally {
    if (btn) { btn.textContent = 'Login →'; btn.disabled = false; }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  SIGNUP
// ══════════════════════════════════════════════════════════════════════════════

async function doSignup() {
  const btn = document.getElementById('su-btn');
  const err = document.getElementById('su-err');
  if (err) { err.textContent = ''; err.style.display = 'none'; }

  const name  = (document.getElementById('su-name')?.value  || '').trim();
  const email = (document.getElementById('su-email')?.value || '').trim();
  const pw    =  document.getElementById('su-pw')?.value    || '';
  const biz   = (document.getElementById('su-biz')?.value   || '').trim();
  const phone = (document.getElementById('su-ph')?.value    || '').trim();
  const cat   =  document.getElementById('su-cat')?.value   || '';
  const role  =  document.getElementById('su-role')?.value  || 'owner';

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
    const payload = { email, password: pw };
    if (name)  payload.name     = name;
    if (biz)   payload.biz_name = biz;
    if (phone) payload.phone    = phone;
    if (cat)   payload.category = cat;
    if (role)  payload.role     = role;

    const data = await req('POST', '/api/auth/signup', payload);

    if (data?.detail) {
      const msg = typeof data.detail === 'string'
        ? data.detail
        : (Array.isArray(data.detail) ? data.detail.map(d => d.msg).join(', ') : 'Signup failed');
      if (err) { err.textContent = msg; err.style.display = 'block'; }
      return;
    }

    // Auto-login
    if (btn) btn.textContent = 'Signing in…';
    const ld  = await req('POST', '/api/auth/login', { email, password: pw });
    const tok = ld?.access_token || ld?.token;

    if (tok) {
      localStorage.removeItem('mpilot_biz');
      localStorage.removeItem('mpilot_last_biz');
      localStorage.setItem('mpilot_token', tok);
      localStorage.setItem('mpilot_user',  JSON.stringify(ld));
      if (typeof USER !== 'undefined') USER = ld;
      closeAuthModal();
      if (typeof initUserUI  === 'function') initUserUI();
      if (typeof loadBizList === 'function') await loadBizList();
      if (typeof goTo        === 'function') goTo('setup');
      if (typeof switchSetupTab === 'function') switchSetupTab('profile');
      if (typeof toast       === 'function') toast('Welcome to MPilot! 👋');
    } else {
      if (err) { err.textContent = 'Account created! Please log in.'; err.style.display = 'block'; }
      setTimeout(() => switchAuthTab('login'), 1500);
    }
  } catch (e) {
    console.error('[doSignup]', e);
    if (err) { err.textContent = 'Unexpected error. Please try again.'; err.style.display = 'block'; }
  } finally {
    if (btn) { btn.textContent = 'Create Free Account'; btn.disabled = false; }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  FORGOT PASSWORD
// ══════════════════════════════════════════════════════════════════════════════

async function doForgotPassword() {
  const btn = document.getElementById('fp-btn');
  const err = document.getElementById('fp-err');
  const ok  = document.getElementById('fp-ok');
  if (err) { err.textContent = ''; err.style.display = 'none'; }
  if (ok)  { ok.innerHTML = ''; ok.style.display = 'none'; }

  const email = (document.getElementById('fp-email')?.value || '').trim();
  if (!email) {
    if (err) { err.textContent = 'Enter your email address.'; err.style.display = 'block'; }
    return;
  }

  if (btn) { btn.textContent = 'Sending…'; btn.disabled = true; }

  try {
    const data = await req('POST', '/api/auth/forgot-password', { email });

    if (ok) {
      if (data?.reset_url) {
        // Dev/demo mode: no email server → show link directly in modal
        ok.innerHTML =
          '<div style="font-weight:600;color:var(--a2);margin-bottom:8px">✓ Reset link ready</div>' +
          '<div style="font-size:11.5px;color:var(--muted);margin-bottom:8px">Click the link below to set a new password:</div>' +
          '<a href="' + data.reset_url + '" style="display:block;color:var(--accent);font-size:12px;' +
          'word-break:break-all;padding:10px;background:rgba(108,99,255,.08);border-radius:8px;' +
          'border:1px solid rgba(108,99,255,.2);text-decoration:none">' + data.reset_url + '</a>' +
          '<div style="font-size:10.5px;color:var(--muted);margin-top:8px">⏱ Expires in 1 hour</div>';
      } else {
        ok.textContent = 'If that email is registered, a reset link has been sent. Check your inbox.';
      }
      ok.style.display = 'block';
    }
    if (btn) btn.textContent = 'Sent ✓';

  } catch (e) {
    console.error('[doForgotPassword]', e);
    if (err) { err.textContent = 'Error — please try again.'; err.style.display = 'block'; }
    if (btn) { btn.textContent = 'Send Reset Link'; btn.disabled = false; }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  RESET PASSWORD (from ?reset_token= URL)
// ══════════════════════════════════════════════════════════════════════════════

async function doResetPassword() {
  const btn = document.getElementById('rp-btn');
  const err = document.getElementById('rp-err');
  const ok  = document.getElementById('rp-ok');
  if (err) { err.textContent = ''; err.style.display = 'none'; }
  if (ok)  { ok.style.display = 'none'; }

  const pw1 = document.getElementById('rp-pw1')?.value || '';
  const pw2 = document.getElementById('rp-pw2')?.value || '';
  const tok = new URLSearchParams(window.location.search).get('reset_token') || '';

  if (!pw1 || pw1.length < 6) {
    if (err) { err.textContent = 'Password must be at least 6 characters.'; err.style.display = 'block'; }
    return;
  }
  if (pw1 !== pw2) {
    if (err) { err.textContent = 'Passwords do not match.'; err.style.display = 'block'; }
    return;
  }
  if (!tok) {
    if (err) { err.textContent = 'Invalid reset link. Please request a new one.'; err.style.display = 'block'; }
    return;
  }

  if (btn) { btn.textContent = 'Resetting…'; btn.disabled = true; }

  try {
    const data = await req('POST', '/api/auth/reset-password', { token: tok, new_password: pw1 });
    if (data && !data.detail) {
      if (ok) { ok.textContent = '✓ Password updated! Redirecting to login…'; ok.style.display = 'block'; }
      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
        switchAuthTab('login');
      }, 2000);
    } else {
      const msg = typeof data?.detail === 'string' ? data.detail : 'Reset failed. Link may have expired.';
      if (err) { err.textContent = msg; err.style.display = 'block'; }
    }
  } catch (e) {
    console.error('[doResetPassword]', e);
    if (err) { err.textContent = 'Error. Please try again.'; err.style.display = 'block'; }
  } finally {
    if (btn) { btn.textContent = 'Set New Password'; btn.disabled = false; }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  LOGOUT
// ══════════════════════════════════════════════════════════════════════════════

function doLogout() {
  ['mpilot_token','mpilot_user','mpilot_biz','mpilot_last_biz','mpilot_auth_intent']
    .forEach(k => localStorage.removeItem(k));
  window.location.replace('landing.html');
}

// ══════════════════════════════════════════════════════════════════════════════
//  UPGRADE MODAL
// ══════════════════════════════════════════════════════════════════════════════

function doUpgrade() {
  const m = document.getElementById('upgrade-modal');
  if (m) m.style.display = 'flex';
  _upgradePeriod = 'monthly';
  setUpgradePeriod('monthly');   // resets toggle + re-renders grid
}

function closeUpgradeModal() {
  const m = document.getElementById('upgrade-modal');
  if (m) m.style.display = 'none';
}

function closePricingModal() {
  const m = document.getElementById('pricing-modal');
  if (m) m.style.display = 'none';
}

async function upgradePlan(planId, planName) {
  const btn = event?.target;
  if (btn) { btn.disabled = true; btn.textContent = 'Upgrading…'; }

  try {
    const data = await req('POST', '/api/billing/upgrade', { plan: planId });
    if (data && (data.status === 'upgraded' || data.success)) {
      if (typeof USER !== 'undefined' && USER) {
        USER.plan = planId;
        localStorage.setItem('mpilot_user', JSON.stringify(USER));
      }
      if (typeof initUserUI === 'function') initUserUI();
      closeUpgradeModal();
      closePricingModal();
      _renderUpgradeGrid();   // refresh grid with new current plan
      if (typeof toast === 'function') toast(`✓ Upgraded to ${planName} plan!`, 'ok');
    } else {
      const msg = data?.detail || data?.message || 'Upgrade failed — please try again';
      if (typeof toast === 'function') toast(msg, 'err');
    }
  } catch (e) {
    console.error('[upgradePlan]', e);
    if (typeof toast === 'function') toast('Upgrade error — please try again', 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = planId === 'free' ? 'Free Plan' : `Upgrade to ${planName}`; }
  }
}

function selectPlan(planId, planName) {
  upgradePlan(planId, planName);
}

// ══════════════════════════════════════════════════════════════════════════════
//  MY PROFILE (Setup → My Account tab)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Load the current user's info into the My Account read-only fields.
 * Also resolves the active business name.
 */
async function loadMyProfile() {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '—';
  };

  // Show loading state
  ['mp-name','mp-email','mp-role','mp-plan','mp-biz','mp-since']
    .forEach(id => set(id, '…'));

  // Always fetch fresh from backend — localStorage may be stale
  let user = {};
  try {
    const fresh = await req('GET', '/api/auth/me');
    if (fresh && fresh.email) {
      user = fresh;
      // Keep localStorage in sync
      localStorage.setItem('mpilot_user', JSON.stringify(fresh));
      if (typeof USER !== 'undefined') USER = fresh;
    } else {
      // Fallback to localStorage if fetch failed
      user = JSON.parse(localStorage.getItem('mpilot_user') || '{}');
    }
  } catch(e) {
    user = JSON.parse(localStorage.getItem('mpilot_user') || '{}');
  }

  const planLabels = {
    free:    'Free Plan',
    starter: 'Starter — ₹299/month',
    growth:  'Growth — ₹799/month ⭐',
    pro:     'Pro — ₹1,499/month',
    agency:  'Agency — ₹2,999/month',
  };
  const roleLabels = { owner: 'Owner', manager: 'Manager', staff: 'Staff', agency: 'Agency' };

  set('mp-name',  user.name  || user.email?.split('@')[0] || '—');
  set('mp-email', user.email || '—');
  set('mp-role',  roleLabels[user.role] || (user.role || 'Owner'));

  const planEl = document.getElementById('mp-plan');
  if (planEl) {
    const plan = user.plan || 'free';
    planEl.textContent = planLabels[plan] || plan;
    planEl.style.color = plan === 'free' ? 'var(--muted)' : 'var(--accent)';
  }

  // Active business — read from currently selected dropdown
  const bizId  = localStorage.getItem('mpilot_biz') || (typeof BIZ !== 'undefined' ? BIZ : '');
  const bizSel = document.getElementById('biz-sel');
  let bizName  = '';
  if (bizSel) {
    const opt = bizSel.querySelector(`option[value="${bizId}"]`);
    if (opt && opt.value) bizName = opt.textContent;
  }
  if (!bizName && bizId) {
    try {
      const biz = await req('GET', `/api/businesses/${bizId}`);
      if (biz?.name) bizName = biz.name;
    } catch(e) {}
  }
  set('mp-biz', bizName || (bizId ? bizId : '— no business selected —'));

  // Member since
  const since = user.created_at || user.plan_since || '';
  if (since) {
    try {
      const d = new Date(since);
      set('mp-since', d.toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' }));
    } catch(e) { set('mp-since', since.slice(0, 10)); }
  } else {
    set('mp-since', '—');
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  CHANGE PASSWORD (My Account tab)
// ══════════════════════════════════════════════════════════════════════════════

async function changePassword() {
  const btn     = document.getElementById('cp-btn');
  const err     = document.getElementById('cp-err');
  const ok      = document.getElementById('cp-ok');
  const current = document.getElementById('cp-current')?.value || '';
  const newPw   = document.getElementById('cp-new')?.value     || '';
  const confirm = document.getElementById('cp-confirm')?.value || '';

  if (err) { err.textContent = ''; err.style.display = 'none'; }
  if (ok)  { ok.textContent  = ''; ok.style.display  = 'none'; }

  if (!current) {
    if (err) { err.textContent = 'Enter your current password.'; err.style.display = 'block'; }
    return;
  }
  if (!newPw || newPw.length < 6) {
    if (err) { err.textContent = 'New password must be at least 6 characters.'; err.style.display = 'block'; }
    return;
  }
  if (newPw !== confirm) {
    if (err) { err.textContent = 'New passwords do not match.'; err.style.display = 'block'; }
    return;
  }
  if (current === newPw) {
    if (err) { err.textContent = 'New password must be different from current password.'; err.style.display = 'block'; }
    return;
  }

  if (btn) { btn.textContent = 'Updating…'; btn.disabled = true; }

  try {
    const data = await req('POST', '/api/auth/change-password', {
      current_password: current,
      new_password:     newPw,
    });

    if (data && !data.detail) {
      if (ok) { ok.textContent = '✓ Password updated successfully!'; ok.style.display = 'block'; }
      // Clear fields
      ['cp-current','cp-new','cp-confirm'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
    } else {
      const msg = typeof data?.detail === 'string'
        ? data.detail
        : (data?.detail?.[0]?.msg || 'Password update failed. Check your current password.');
      if (err) { err.textContent = msg; err.style.display = 'block'; }
    }
  } catch (e) {
    console.error('[changePassword]', e);
    if (err) { err.textContent = 'Error — please try again.'; err.style.display = 'block'; }
  } finally {
    if (btn) { btn.textContent = 'Update Password'; btn.disabled = false; }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  API BASE URL SAFETY NET
//  The inline script sets const API using smart detection.
//  This block verifies it's correct and logs it for debugging.
// ══════════════════════════════════════════════════════════════════════════════
(function verifyAPIBase() {
  try {
    const expected = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:8000'
      : 'https://mpilot-backend.onrender.com';

    if (typeof API !== 'undefined') {
      if (API === '') {
        console.error('[MPilot] API base is EMPTY — all fetch calls will fail!');
        console.error('[MPilot] Expected:', expected);
      } else {
        console.log('[MPilot] API base:', API);
      }
    }
  } catch(e) {}
})();

// ══════════════════════════════════════════════════════════════════════════════
//  DOMContentLoaded — final wiring
// ══════════════════════════════════════════════════════════════════════════════

// ── My Account page routing ─────────────────────────────────────────────────
// Extend loadPage to handle 'myaccount'
const _origLoadPage = typeof loadPage === 'function' ? loadPage : null;
if (_origLoadPage) {
  window.loadPage = function(page) {
    if (page === 'myaccount') { loadMyProfile(); return; }
    _origLoadPage(page);
  };
}

document.addEventListener('DOMContentLoaded', () => {
  // ESC closes any open modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeAuthModal();
      closeUpgradeModal();
      closePricingModal();
    }
  });

  // Ensure auth modal starts hidden
  const authModal = document.getElementById('auth-modal');
  if (authModal && authModal.style.display === '') {
    authModal.style.display = 'none';
  }

  console.log('[MPilot] app.js loaded ✓');
});
