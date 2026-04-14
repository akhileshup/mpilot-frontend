content = open('/home/claude/mpilot/frontend/index.html').read()
changes = []

# ── FIX 1: Remove autoConnectGBP call from doSignup ──
old = '    if (BIZ) { autoConnectGBP(BIZ); goTo(\'connect\'); }'
new = '    goTo(\'channels\');'
if old in content:
    content = content.replace(old, new)
    changes.append('Removed autoConnectGBP from doSignup ✓')
else:
    changes.append('WARN: doSignup autoConnect not found')

# ── FIX 2: Replace connectGBP — remove goTo inside it, capture event before async ──
old_gbp = """async function connectGBP() {
  if (!BIZ) return toast('Select a business first', 'err');
  goTo('connect');
  const btn = event && event.target ? event.target : null;
  if (btn) { btn.dataset.origText = btn.textContent; btn.disabled = true; btn.textContent = 'Loading locations...'; }
  try {
    const r = await req('GET', `/api/social/gbp/connect/${BIZ}`);
    if (!r || !r.oauth_url) { toast('Could not get connection URL', 'err'); return; }
    if (r.oauth_url.includes('mock_code')) {
      // MOCK MODE: show location picker — user must explicitly choose a location
      // Do NOT call the callback here — wait for user to select
      await loadGBPLocations();
    } else {
      // REAL MODE: open Google OAuth in new tab, show reload button
      window.open(r.oauth_url, '_blank');
      toast('Complete Google sign-in in the popup, then click Reload below');
      await loadGBPLocations();
    }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = btn.dataset.origText || 'Sign in with Google'; }
  }
}"""

new_gbp = """async function connectGBP(btn) {
  if (!BIZ) return toast('Select a business first', 'err');
  // Disable button immediately (sync, before any await)
  if (btn) { btn.dataset.orig = btn.textContent; btn.disabled = true; btn.textContent = 'Connecting...'; }
  try {
    const r = await req('GET', `/api/social/gbp/connect/${BIZ}`);
    if (!r || !r.oauth_url) { toast('Could not get connection URL', 'err'); return; }
    if (r.oauth_url.includes('mock_code')) {
      // MOCK MODE: store tokens, then show location picker
      await req('GET', `/api/social/gbp/callback?code=mock_code&state=${BIZ}`);
      goTo('connect');
      await loadGBPLocations();
      toast('Google authorised — select your business location below', 'ok');
    } else {
      // REAL MODE: open Google OAuth popup
      goTo('connect');
      window.open(r.oauth_url, '_blank');
      toast('Sign in with Google in the popup, then click "Reload Locations"');
    }
  } catch(e) {
    toast('Connection error — is the server running?', 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = btn.dataset.orig || 'Sign in with Google'; }
  }
}"""

if old_gbp in content:
    content = content.replace(old_gbp, new_gbp)
    changes.append('Replaced connectGBP ✓')
else:
    changes.append('WARN: connectGBP not matched exactly')
    # Show what's there
    idx = content.find('async function connectGBP(')
    if idx < 0: idx = content.find('async function connectGBP()')
    if idx >= 0:
        changes.append(f'  Found at: {repr(content[idx:idx+50])}')

# ── FIX 3: Replace connectMeta ──
old_meta = """async function connectMeta() {
  if (!BIZ) return toast('Select a business first', 'err');
  goTo('connect');
  const btn = event && event.target ? event.target : null;
  if (btn) { btn.dataset.origText = btn.textContent; btn.disabled = true; btn.textContent = 'Loading pages...'; }
  try {
    const r = await req('GET', `/api/social/meta/connect/${BIZ}`);
    if (!r || !r.oauth_url) { toast('Could not get connection URL', 'err'); return; }
    if (r.oauth_url.includes('mock_code')) {
      // MOCK MODE: show page picker — user must explicitly choose a page
      await loadMetaPages();
    } else {
      // REAL MODE: open Facebook OAuth in new tab
      window.open(r.oauth_url, '_blank');
      toast('Complete Facebook login in the popup, then click Reload below');
      await loadMetaPages();
    }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = btn.dataset.origText || 'Connect with Facebook'; }
  }
}"""

new_meta = """async function connectMeta(btn) {
  if (!BIZ) return toast('Select a business first', 'err');
  if (btn) { btn.dataset.orig = btn.textContent; btn.disabled = true; btn.textContent = 'Connecting...'; }
  try {
    const r = await req('GET', `/api/social/meta/connect/${BIZ}`);
    if (!r || !r.oauth_url) { toast('Could not get connection URL', 'err'); return; }
    if (r.oauth_url.includes('mock_code')) {
      // MOCK MODE: store tokens, then show page picker
      await req('GET', `/api/social/meta/callback?code=mock_code&state=${BIZ}`);
      goTo('connect');
      await loadMetaPages();
      toast('Facebook authorised — select your Page and Instagram account below', 'ok');
    } else {
      // REAL MODE: open Facebook OAuth popup
      goTo('connect');
      window.open(r.oauth_url, '_blank');
      toast('Log in with Facebook in the popup, then click "Reload Pages"');
    }
  } catch(e) {
    toast('Connection error — is the server running?', 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = btn.dataset.orig || 'Connect with Facebook'; }
  }
}"""

if old_meta in content:
    content = content.replace(old_meta, new_meta)
    changes.append('Replaced connectMeta ✓')
else:
    changes.append('WARN: connectMeta not matched')
    idx = content.find('async function connectMeta(')
    if idx >= 0: changes.append(f'  Found: {repr(content[idx:idx+50])}')

# ── FIX 4: Update all button onclick to pass 'this' ──
# All 4 connect buttons need to pass 'this' so the btn parameter works
import re
# connectGBP() -> connectGBP(this)
count1 = content.count('onclick="connectGBP()"')
content = content.replace('onclick="connectGBP()"', 'onclick="connectGBP(this)"')
changes.append(f'Updated {count1} connectGBP() -> connectGBP(this) ✓')

count2 = content.count("onclick=\"connectMeta()\"")
content = content.replace('onclick="connectMeta()"', 'onclick="connectMeta(this)"')
changes.append(f'Updated {count2} connectMeta() -> connectMeta(this) ✓')

# ── FIX 5: Clear stale gbp_connected on business select ──
# Add a reset check when business is selected
old_selectbiz = '''function selectBiz(id) {
  BIZ = id; localStorage.setItem('mpilot_biz', id);
  const nm = document.querySelector(`#biz-sel option[value="${id}"]`)?.textContent || '';
  document.getElementById('dash-biz-name').textContent = nm;
  const active = document.querySelector('.ni.on')?.dataset.p || 'dashboard';
  if (BIZ) loadPage(active);
}'''

new_selectbiz = '''function selectBiz(id) {
  BIZ = id; localStorage.setItem('mpilot_biz', id);
  const nm = document.querySelector(`#biz-sel option[value="${id}"]`)?.textContent || '';
  document.getElementById('dash-biz-name').textContent = nm;
  const active = document.querySelector('.ni.on')?.dataset.p || 'dashboard';
  if (BIZ) loadPage(active);
}

// Clear any stale mock-connected state from DB when page loads
async function clearStaleMockConnections(bizId) {
  const biz = await req('GET', `/api/businesses/${bizId}`);
  // If connected but location_id is a mock ID, disconnect to force real selection
  if (biz.gbp_connected && (biz.gbp_location_id === '' || biz.gbp_location_id === 'mock_location_456')) {
    await req('POST', `/api/social/gbp/disconnect/${bizId}`);
  }
  if (biz.meta_connected && (biz.meta_page_id === '' || biz.meta_page_id === 'mock_page_123')) {
    await req('POST', `/api/social/meta/disconnect/${bizId}`);
  }
}'''

if old_selectbiz in content:
    content = content.replace(old_selectbiz, new_selectbiz)
    changes.append('Added clearStaleMockConnections ✓')
else:
    changes.append('WARN: selectBiz not matched exactly')

# ── FIX 6: Call clearStaleMockConnections in init ──
old_init = '''  if (BIZ) {
    loadDash();
  }'''
new_init = '''  if (BIZ) {
    await clearStaleMockConnections(BIZ);
    loadDash();
  }'''
if old_init in content:
    content = content.replace(old_init, new_init)
    changes.append('Added clearStaleMockConnections call in init ✓')

# Write
open('/home/claude/mpilot/frontend/index.html', 'w').write(content)
print('\n'.join(changes))

# Validate
import ast
# Check no syntax in JS that's obviously broken
if 'const _origConnectGBP' in content:
    print('ERROR: broken const override still present!')
if 'autoConnectGBP' in content:
    print('WARN: autoConnectGBP still referenced:', [i for i,l in enumerate(content.split('\n')) if 'autoConnectGBP' in l])
