// ── STATE ────────────────────────────────
let profile = {};
let symptomLog = {};
let detectedSymptoms = {};
let convoHistory = [];
let orbState = 'idle';
let recognition = null;
let isListening = false;
let sessionActive = false;
let sessionSecs = 0;
let timerInt = null;
let savedReports = [];
// ── NAV ──────────────────────────────────
function goTo(id) {
  document.querySelectorAll('.section').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
  const sec = document.getElementById('sec-' + id);
  if (sec) { sec.style.display = ''; sec.classList.add('active'); }
  const tab = document.getElementById('tab-' + id);
  if (tab) tab.classList.add('active');
  if (id === 'log')     renderLogGrid();
  if (id === 'reports') renderReports();
  if (id === 'home')    updateStats();
  if (id === 'ai' && !sessionActive) initSession();
  if (id === 'profile') populateProfileForm();
  if (id === 'risk')    initRiskTab();
  document.getElementById('app').scrollTop = 0;
}

// ── HOME STATS ───────────────────────────
function updateStats() {
  const active = Object.values(symptomLog).filter(v => v.severity && v.severity !== 'none').length;
  document.getElementById('statS').textContent = active;
  document.getElementById('statSess').textContent = localStorage.getItem('lunaSessCount') || '0';
  document.getElementById('statR').textContent = savedReports.length;
}

// ── PROFILE ──────────────────────────────
const CONDITIONS = ['Hypertension','Diabetes','Thyroid Disorder','Osteoporosis','Heart Disease','PCOS','Cancer History'];
const toggleSelections = { gender: null, cholesterol: null, glucose: null, smoking: null, alcohol: null, physActivity: null, cardio: null };

function selectToggle(field, value, btnIds) {
  toggleSelections[field] = value;
  btnIds.forEach(id => {
    const b = document.getElementById(id);
    if (b) b.classList.remove('selected');
  });
  btnIds.forEach(id => {
    const b = document.getElementById(id);
    if (!b) return;
    const onclickStr = b.getAttribute('onclick') || '';
    // Extract the value from the onclick string: selectToggle('field','VALUE',...)
    const parts = onclickStr.match(/'([^']+)'/g);
    const btnVal = parts && parts[1] ? parts[1].replace(/'/g,'') : '';
    if (btnVal === value) b.classList.add('selected');
  });
}

function calcBMI() {
  const wVal  = parseFloat(document.getElementById('pWeightVal')?.value);
  const wUnit = document.getElementById('pWeightUnit')?.value;
  const hUnit = document.getElementById('pHeightUnit')?.value;
  let hCm = 0, wKg = 0;
  if (hUnit === 'ft') {
    const ft   = parseFloat(document.getElementById('pHeightFt')?.value || 0);
    const inch = parseFloat(document.getElementById('pHeightIn')?.value  || 0);
    hCm = (ft * 30.48) + (inch * 2.54);
  } else {
    hCm = parseFloat(document.getElementById('pHeightVal')?.value);
  }
  wKg = wUnit === 'lbs' ? wVal / 2.205 : wVal;
  const bmiBox = document.getElementById('bmiDisplay');
  if (!bmiBox) return;
  if (!hCm || !wKg || hCm < 50 || wKg < 20) { bmiBox.style.display = 'none'; return; }
  const hM  = hCm / 100;
  const bmi = (wKg / (hM * hM)).toFixed(1);
  let cat = '', catColor = '';
  if      (bmi < 18.5) { cat = 'Underweight';  catColor = '#5B8FD4'; }
  else if (bmi < 25)   { cat = 'Normal weight'; catColor = '#2E7D5A'; }
  else if (bmi < 30)   { cat = 'Overweight';    catColor = '#B8860B'; }
  else                 { cat = 'Obese';          catColor = '#A02030'; }
  bmiBox.style.display = 'block';
  bmiBox.innerHTML = `BMI: <strong style="color:${catColor}">${bmi}</strong>, <span style="color:${catColor}">${cat}</span> <span style="font-weight:500;color:var(--text-lt);font-size:0.76rem">(${hCm.toFixed(0)} cm · ${wKg.toFixed(1)} kg)</span>`;
}

function interpretBP() {
  const sys = parseInt(document.getElementById('pSystolic')?.value);
  const dia = parseInt(document.getElementById('pDiastolic')?.value);
  const box = document.getElementById('bpDisplay');
  if (!box) return;
  if (!sys || !dia) { box.style.display = 'none'; return; }
  let label = '', bg = '', border = '', color = '';
  if      (sys < 120 && dia < 80)  { label = 'Normal';                                  bg='var(--sage-lt)';  border='var(--sage)';   color='#2E7D5A'; }
  else if (sys < 130 && dia < 80)  { label = 'Elevated';                                bg='var(--yel-lt)';   border='var(--yellow)'; color='#8B6B00'; }
  else if (sys < 140 || dia < 90)  { label = 'High, Stage 1 Hypertension';             bg='var(--peach-lt)'; border='var(--peach)';  color='#C05020'; }
  else if (sys < 180 || dia < 120) { label = 'High, Stage 2 Hypertension';             bg='var(--blush-lt)'; border='var(--blush)';  color='#A02030'; }
  else                              { label = 'Hypertensive Crisis — seek medical attention'; bg='var(--blush-lt)'; border='#E08080'; color='#800000'; }
  box.style.cssText = `display:block;margin:0 0 0.5rem 0;padding:0.7rem 1rem;border-radius:10px;font-size:0.83rem;font-weight:700;background:${bg};border:1.5px solid ${border};color:${color}`;
  box.textContent = `${sys}/${dia} mmHg — ${label}`;
}

function buildCondGrid() {
  const g = document.getElementById('condGrid');
  if (!g || g.children.length) return;
  g.innerHTML = CONDITIONS.map(c =>
    `<div class="cond-chip ${(profile.conditions||[]).includes(c)?'checked':''}" onclick="this.classList.toggle('checked')">${c}</div>`
  ).join('');
}

