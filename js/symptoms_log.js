function saveToLog() {
  Object.entries(detectedSymptoms).forEach(([id, d]) => {
    if (!symptomLog[id]) symptomLog[id] = {};
    symptomLog[id].severity = d.sev;
    symptomLog[id].freq = d.freq || 'Daily';
  });
  saveSymptomLog();
  const c = Object.keys(detectedSymptoms).length;
  addMsg('luna', `Done! I've saved ${c} symptom${c !== 1 ? 's' : ''} to your log.`);
  speak(`Saved ${c} symptom${c !== 1 ? 's' : ''} to your log.`);
}

// ── SYMPTOM LOG GRID ─────────────────────
function renderLogGrid() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  document.getElementById('logDateLbl').textContent = `Tracking symptoms for ${today}`;
  document.getElementById('logDateSub').textContent = today;
  const grid = document.getElementById('symGrid');
  grid.innerHTML = '';
  SYMPTOMS.forEach(s => {
    const cur = symptomLog[s.id] || { severity: null, freq: '' };
    const sev = cur.severity || 'none';
    const card = document.createElement('div');
    card.className = 'sym-card';
    card.innerHTML = `
      <div class="sym-top">
        <span class="sym-icon">${s.icon}</span>
        <div><div class="sym-name">${s.name}</div><div class="sym-sub">${s.sub}</div></div>
      </div>
      <div class="sev-btns">
        ${['none','mild','mod','sev'].map(lv =>
          `<button class="sev-btn ${sev===lv?'sel-'+lv:''}" onclick="setSev('${s.id}','${lv}',this)">
            ${lv==='mod'?'Moderate':lv==='sev'?'Severe':lv.charAt(0).toUpperCase()+lv.slice(1)}
          </button>`
        ).join('')}
      </div>
      <select class="freq-sel" onchange="setFreq('${s.id}',this.value)">
        <option value="">— How often? —</option>
        ${['Multiple times a day','Once daily','Several times a week','Weekly','Rarely'].map(f =>
          `<option${cur.freq===f?' selected':''}>${f}</option>`
        ).join('')}
      </select>`;
    grid.appendChild(card);
  });
}

function setSev(id, lv, btn) {
  if (!symptomLog[id]) symptomLog[id] = {};
  symptomLog[id].severity = lv;
  btn.closest('.sev-btns').querySelectorAll('.sev-btn').forEach(b => b.className = 'sev-btn');
  btn.className = `sev-btn sel-${lv}`;
  saveSymptomLog();
}

function setFreq(id, val) {
  if (!symptomLog[id]) symptomLog[id] = {};
  symptomLog[id].freq = val;
  saveSymptomLog();
}

function clearLog() {
  if (!confirm('Clear all symptom entries?')) return;
  symptomLog = {};
  saveSymptomLog();
  renderLogGrid();
}

