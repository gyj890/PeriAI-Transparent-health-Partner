// conflict with the globally imported `supabase` object from the CDN script.
const SUPABASE_URL = 'https://rnfijxarifgdejqblfti.supabase.co';
const SUPABASE_ANON_KEY = 'your_key_here'; 

let _supabaseClient = null;

function initSupabase() {
  try {
    // This connects your public site to your live Supabase database
    _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Connected to Public Supabase Instance");
  } catch(e) {
    console.error('Connection failed:', e);
  }
}


function showAuthError(msg) {
  const el = document.getElementById('loginError');
  el.textContent = msg; el.style.display = 'block';
}

function clearAuthError() {
  const el = document.getElementById('loginError');
  if (el) { el.textContent = ''; el.style.display = 'none'; }
}

function switchAuthTab(tab) {
  clearAuthError();
  document.getElementById('tabLogin').classList.toggle('active',  tab === 'login');
  document.getElementById('tabSignup').classList.toggle('active', tab === 'signup');
  document.getElementById('formLogin').style.display  = tab === 'login'  ? '' : 'none';
  document.getElementById('formSignup').style.display = tab === 'signup' ? '' : 'none';
}

// ── SIGN UP ─────────────────────────────────────────────────
async function doSignup() {
  clearAuthError();
  const name    = (document.getElementById('signupName').value    || '').trim();
  const email   = (document.getElementById('signupEmail').value   || '').trim().toLowerCase();
  const pass    =  document.getElementById('signupPassword').value;
  const confirm =  document.getElementById('signupConfirm').value;

  if (!name)                         { showAuthError('Please enter your name.'); return; }
  if (!email || !email.includes('@')) { showAuthError('Please enter a valid email address.'); return; }
  if (pass.length < 6)               { showAuthError('Password must be at least 6 characters.'); return; }
  if (pass !== confirm)              { showAuthError('Passwords do not match.'); return; }

  setBtnState('signupSubmitBtn', true, 'Creating account…');

  const { data, error } = await _supabaseClient.auth.signUp({
    email,
    password: pass,
    options: { data: { name } }
  });

  setBtnState('signupSubmitBtn', false, 'Create Account');

  if (error) { showAuthError(error.message); return; }

  if (data.session) {
    // Email confirmation OFF — logged in immediately
    await enterApp(data.user);
  } else {
    // Email confirmation ON — ask user to check inbox
    showSuccess('Account created! Check your email for a confirmation link, then sign in.');
  }
}

// ── SIGN IN ─────────────────────────────────────────────────
async function doLogin() {
  clearAuthError();
  const email = (document.getElementById('loginEmail').value  || '').trim().toLowerCase();
  const pass  =  document.getElementById('loginPassword').value;
  if (!email || !pass) { showAuthError('Please enter your email and password.'); return; }

  setBtnState('loginSubmitBtn', true, 'Signing in…');

  const { data, error } = await _supabaseClient.auth.signInWithPassword({ email, password: pass });

  setBtnState('loginSubmitBtn', false, 'Sign In');

  if (error) {
    if (error.message.includes('Invalid login')) {
      showAuthError('Incorrect email or password. Please try again.');
    } else if (error.message.includes('Email not confirmed')) {
      showAuthError('Please confirm your email address first. Check your inbox.');
    } else {
      showAuthError(error.message);
    }
    return;
  }

  await enterApp(data.user);
}

// ── ENTER APP (called after login or on session restore) ────
async function enterApp(user) {
  currentUser = user;
  const displayName = user.user_metadata?.name || user.email.split('@')[0];

  // Load profile
  const { data: prof } = await _supabaseClient
    .from('profiles').select('*').eq('id', user.id).single();

  if (prof) {
    profile = {
      name:         prof.name          || displayName,
      age:          prof.age           ? String(prof.age) : '',
      heightCm:     prof.height_cm     ? String(prof.height_cm) : '',
      weightKg:     prof.weight_kg     ? String(prof.weight_kg) : '',
      gender:       prof.gender        || '',
      systolic:     prof.systolic      ? String(prof.systolic) : '',
      diastolic:    prof.diastolic     ? String(prof.diastolic) : '',
      cholesterol:  prof.cholesterol   || '',
      glucose:      prof.glucose       || '',
      smoking:      prof.smoking       || '',
      alcohol:      prof.alcohol       || '',
      physActivity: prof.phys_activity || '',
      cardio:       prof.cardio        || '',
      menStatus:    prof.men_status    || '',
      lastPeriod:   prof.last_period   || '',
      meds:         prof.meds          || '',
      conditions:   prof.conditions    || [],
      famHistory:   prof.fam_history   || '',
      doctor:       prof.doctor        || '',
    };
  } else {
    profile = { name: displayName };
  }

  // Load symptom log (most recent entry per symptom_id)
  const { data: logs } = await _supabaseClient
    .from('symptom_logs').select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (logs) {
    const seen = new Set();
    logs.forEach(row => {
      if (!seen.has(row.symptom_id)) {
        seen.add(row.symptom_id);
        symptomLog[row.symptom_id] = { severity: row.severity, freq: row.freq };
      }
    });
  }

  // Load reports
  const { data: rpts } = await _supabaseClient
    .from('reports').select('*')
    .eq('user_id', user.id)
    .order('report_date', { ascending: false });

  if (rpts) {
    savedReports = rpts.map(r => ({ ...r.data, _dbId: r.id }));
  }

  // Show user pill, hide login overlay
  const pill = document.getElementById('userPill');
  if (pill) { pill.textContent = profile.name || displayName; pill.style.display = 'flex'; }
  document.getElementById('loginOverlay').style.display = 'none';

  setTimeout(() => {
    try { buildCondGrid(); } catch(e) {}
    try { updateStats();   } catch(e) {}
  }, 50);
}

// ── SIGN OUT ─────────────────────────────────────────────────
async function doLogout() {
  await _supabaseClient.auth.signOut();
  currentUser = null;
  profile = {}; symptomLog = {}; savedReports = []; convoHistory = [];
  document.getElementById('loginOverlay').style.display = 'flex';
  const pill = document.getElementById('userPill');
  if (pill) pill.style.display = 'none';
}

// ── SAVE SYMPTOM LOG → supabase symptom_logs ─────────────────
async function saveSymptomLog() {
  if (!currentUser) return;
  const rows = Object.entries(symptomLog)
    .filter(([, v]) => v && v.severity && v.severity !== 'none')
    .map(([symptom_id, v]) => ({
      user_id:     currentUser.id,
      symptom_id,
      severity:    v.severity || null,
      freq:        v.freq     || null,
      logged_date: new Date().toISOString().split('T')[0],
    }));
  if (!rows.length) return;
  const { error } = await _supabaseClient.from('symptom_logs').insert(rows);
  if (error) console.error('Symptom log save error:', error.message);
}

// ── HELPERS ──────────────────────────────────────────────────
function setBtnState(id, loading, text) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = text;
}

function showSuccess(msg) {
  const el = document.getElementById('loginError');
  if (!el) return;
  el.textContent = msg;
  el.style.background = '#E0F0E8';
  el.style.color = '#1A5C3A';
  el.style.display = 'block';
}

// ── INIT ─────────────────────────────────────────────────────
window.addEventListener('load', async () => {
  initSupabase();

  // Listen for auth changes (handles email confirmation redirect, etc.)
  _supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session && !currentUser) {
      await enterApp(session.user);
    }
    if (event === 'SIGNED_OUT') {
      currentUser = null;
    }
  });

  // Restore existing session on page load/refresh
  const { data: { session } } = await _supabaseClient.auth.getSession();
  if (session) {
    await enterApp(session.user);
  }
  // else: login overlay stays visible
});
