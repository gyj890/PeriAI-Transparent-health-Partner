function populateProfileForm() {
  buildCondGrid();
  const textMap = {
    pName:'name', pAge:'age', pHeightVal:'heightVal', pWeightVal:'weightVal',
    pSystolic:'systolic', pDiastolic:'diastolic',
    pMenStatus:'menStatus', pLastPeriod:'lastPeriod',
    pMeds:'meds', pFamHistory:'famHistory', pDoctor:'doctor'
  };
  Object.entries(textMap).forEach(([el, key]) => {
    const e = document.getElementById(el);
    if (e && profile[key] != null) e.value = profile[key];
  });
  const selMap = { pHeightUnit:'heightUnit', pWeightUnit:'weightUnit' };
  Object.entries(selMap).forEach(([el, key]) => {
    const e = document.getElementById(el);
    if (e && profile[key]) e.value = profile[key];
  });
  const tMap = {
    gender:      ['gn-f','gn-m','gn-o'],
    cholesterol: ['ch-1','ch-2','ch-3'],
    glucose:     ['gl-1','gl-2','gl-3'],
    smoking:     ['sm-0','sm-1'],
    alcohol:     ['al-0','al-1'],
    physActivity:['pa-1','pa-0'],
    cardio:      ['cv-0','cv-1'],
  };
  Object.entries(tMap).forEach(([field, ids]) => {
    if (profile[field]) selectToggle(field, profile[field], ids);
  });
  document.querySelectorAll('.cond-chip').forEach(c => {
    c.classList.toggle('checked', (profile.conditions||[]).includes(c.textContent.trim()));
  });
  ['pHeightVal','pHeightFt','pHeightIn','pWeightVal'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', calcBMI);
  });
  document.getElementById('pHeightUnit')?.addEventListener('change', e => {
    const ftIn = document.getElementById('heightFtIn');
    const hVal = document.getElementById('pHeightVal');
    if (e.target.value === 'ft') {
      if (ftIn) ftIn.style.display = 'block';
      if (hVal) { hVal.style.display = 'none'; hVal.value = ''; }
    } else {
      if (ftIn) ftIn.style.display = 'none';
      if (hVal) hVal.style.display = '';
    }
    calcBMI();
  });
  document.getElementById('pWeightUnit')?.addEventListener('change', calcBMI);
  ['pSystolic','pDiastolic'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', interpretBP);
  });
  calcBMI();
  interpretBP();
}

async function saveProfile() {
  const checked = [...document.querySelectorAll('.cond-chip.checked')].map(el => el.textContent.trim());
  let hCm = parseFloat(document.getElementById('pHeightVal')?.value || 0);
  const hUnit = document.getElementById('pHeightUnit')?.value;
  if (hUnit === 'ft') {
    hCm = (parseFloat(document.getElementById('pHeightFt')?.value||0)*30.48)
        + (parseFloat(document.getElementById('pHeightIn')?.value||0)*2.54);
  }
  const wRaw  = parseFloat(document.getElementById('pWeightVal')?.value || 0);
  const wUnit = document.getElementById('pWeightUnit')?.value;
  const wKg   = wUnit === 'lbs' ? wRaw / 2.205 : wRaw;
  profile = {
    name: document.getElementById('pName').value.trim(),
    age: document.getElementById('pAge').value,
    heightVal: document.getElementById('pHeightVal').value,
    heightUnit: hUnit,
    heightFt: document.getElementById('pHeightFt')?.value || '',
    heightIn: document.getElementById('pHeightIn')?.value || '',
    heightCm: hCm.toFixed(1),
    weightVal: document.getElementById('pWeightVal').value,
    weightUnit: wUnit,
    weightKg: wKg.toFixed(1),
    gender: toggleSelections.gender || profile.gender || '',
    systolic: document.getElementById('pSystolic').value,
    diastolic: document.getElementById('pDiastolic').value,
    cholesterol: toggleSelections.cholesterol || profile.cholesterol || '',
    glucose: toggleSelections.glucose || profile.glucose || '',
    smoking: toggleSelections.smoking || profile.smoking || '',
    alcohol: toggleSelections.alcohol || profile.alcohol || '',
    physActivity: toggleSelections.physActivity || profile.physActivity || '',
    cardio: toggleSelections.cardio || profile.cardio || '',
    menStatus: document.getElementById('pMenStatus').value,
    lastPeriod: document.getElementById('pLastPeriod').value,
    meds: document.getElementById('pMeds').value.trim(),
    conditions: checked,
    famHistory: document.getElementById('pFamHistory').value.trim(),
    doctor: document.getElementById('pDoctor').value.trim(),
  };
  if (hCm && wKg) {
    const hM = hCm / 100;
    profile.bmi = (wKg / (hM * hM)).toFixed(1);
  }
  // Save to Supabase profiles table
  if (currentUser) {
    const row = {
      id:            currentUser.id,
      name:          profile.name          || null,
      age:           parseInt(profile.age) || null,
      height_cm:     parseFloat(profile.heightCm) || null,
      weight_kg:     parseFloat(profile.weightKg) || null,
      gender:        profile.gender        || null,
      systolic:      parseInt(profile.systolic)   || null,
      diastolic:     parseInt(profile.diastolic)  || null,
      cholesterol:   profile.cholesterol   || null,
      glucose:       profile.glucose       || null,
      smoking:       profile.smoking       || null,
      alcohol:       profile.alcohol       || null,
      phys_activity: profile.physActivity  || null,
      cardio:        profile.cardio        || null,
      men_status:    profile.menStatus     || null,
      last_period:   profile.lastPeriod    || null,
      meds:          profile.meds          || null,
      conditions:    profile.conditions?.length ? profile.conditions : null,
      fam_history:   profile.famHistory    || null,
      doctor:        profile.doctor        || null,
      updated_at:    new Date().toISOString(),
    };
    const { error } = await _supabaseClient.from('profiles').upsert(row);
    if (error) console.error('Profile save error:', error.message);
  }
  const m = document.getElementById('savedMsg');
  if (m) { m.classList.add('show'); setTimeout(() => m.classList.remove('show'), 2500); }
}

// ── INTERVIEW ENGINE ─────────────────────
