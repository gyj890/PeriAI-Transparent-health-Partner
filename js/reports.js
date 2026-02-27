
async function buildReport() {
  const logged = SYMPTOMS.filter(s => symptomLog[s.id]?.severity && symptomLog[s.id].severity !== 'none');
  if (!logged.length) {
    if (confirm('No symptoms logged yet. Go to Symptom Log to add some first?')) goTo('log');
    return;
  }
  const r = {
    id: Date.now(),
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    dateShort: new Date().toLocaleDateString(),
    profile: { ...profile },
    symptoms: logged.map(s => ({ ...s, severity: symptomLog[s.id].severity, freq: symptomLog[s.id].freq })),
    risks: buildRisks(logged),
    discussion: buildDiscussion(logged),
    summary: buildSummary(logged),
    sessionTime: document.getElementById('sessionTimer').textContent,
  };
  savedReports.unshift(r);
  // Save to Supabase
  if (currentUser) {
    const { data, error } = await _supabaseClient.from('reports').insert({
      user_id:      currentUser.id,
      data:         r,
      session_time: r.sessionTime || '',
    }).select('id').single();
    if (data) r._dbId = data.id;
    if (error) console.error('Report save error:', error.message);
  }
}

function buildRisks(logged) {
  const risks = [];
  const ids = logged.map(s => s.id);
  const sevIds = logged.filter(s => symptomLog[s.id]?.severity === 'sev').map(s => s.id);
  if (sevIds.includes('palp'))       risks.push({level:'high',icon:'!',text:'Severe palpitations — ECG and cardiac evaluation recommended to rule out arrhythmia.'});
  if (ids.includes('periods') && parseInt(profile.age) >= 55) risks.push({level:'high',icon:'!',text:'Bleeding at age 55+ requires endometrial evaluation to rule out malignancy.'});
  if (sevIds.includes('hot_flashes') || sevIds.includes('night_sweats')) risks.push({level:'mod',icon:'~',text:'Severe vasomotor symptoms — HRT, fezolinetant (Veozah), or SSNRIs are evidence-based options.'});
  if (ids.includes('brain_fog') || ids.includes('fatigue')) risks.push({level:'mod',icon:'~',text:'Cognitive changes and fatigue — thyroid panel, B12, ferritin, and hormone panel recommended.'});
  if (logged.length >= 6) risks.push({level:'mod',icon:'~',text:`High symptom burden (${logged.length} categories) — comprehensive perimenopause assessment recommended.`});
  risks.push({level:'ok',icon:'✓',text:'Confirm preventive screenings: mammogram, DEXA scan, PAP smear, lipid panel, colonoscopy.'});
  return risks;
}

function buildDiscussion(logged) {
  const pts = [];
  const ids = logged.map(s => s.id);
  if (ids.includes('hot_flashes') || ids.includes('night_sweats')) pts.push('Vasomotor symptom management — HRT candidacy, fezolinetant, or non-hormonal alternatives');
  if (ids.includes('vag_dry') || ids.includes('urinary')) pts.push('Genitourinary Syndrome of Menopause — local estrogen, Ospemifene, or vaginal laser therapy');
  if (ids.includes('mood')) pts.push('Mental health management — SSNRIs treat both mood and vasomotor symptoms simultaneously');
  if (ids.includes('sleep')) pts.push('Sleep optimization — CBT-I therapy, sleep hygiene protocol, or pharmacologic options');
  if (ids.includes('brain_fog')) pts.push('Cognitive evaluation — rule out thyroid dysfunction, B12/D deficiency, and sleep disorder');
  if (ids.includes('palp')) pts.push('Cardiac evaluation — resting ECG, consider Holter monitor if episodes are frequent');
  if (ids.includes('joints')) pts.push('Bone density — DEXA scan recommended, calcium and vitamin D assessment');
  pts.push('Full hormone panel: FSH, estradiol, testosterone (free/total), DHEA-S, TSH');
  return pts;
}

function buildSummary(logged) {
  const name = profile.name || 'The patient';
  const sev = logged.filter(s => symptomLog[s.id]?.severity === 'sev').map(s => s.name);
  const mod = logged.filter(s => symptomLog[s.id]?.severity === 'mod').map(s => s.name);
  let s = `${name} (age ${profile.age||'—'}) presents with ${logged.length} active symptoms consistent with ${profile.menStatus||'perimenopausal transition'}. `;
  if (sev.length) s += `Severe symptoms include ${sev.join(', ')}. `;
  if (mod.length) s += `Moderate symptoms: ${mod.join(', ')}. `;
  s += `A full hormonal evaluation (FSH, estradiol, TSH) and an individualised management plan are recommended.`;
  return s;
}

// ── RENDER REPORTS ────────────────────────
function renderReports() {
  const list = document.getElementById('rptList');
  const cnt  = document.getElementById('rptCount');
  if (!savedReports.length) {
    cnt.textContent = 'No reports yet';
    list.innerHTML = `<div class="no-reports"><div class="big" style="font-family:monospace;color:var(--rose);font-size:3rem">[ ]</div><p>You haven't generated any reports yet.<br>Log some symptoms, then tap <strong>+ New Report</strong>.</p></div>`;
    return;
  }
  cnt.textContent = `${savedReports.length} report${savedReports.length !== 1 ? 's' : ''} on file`;
  list.innerHTML = savedReports.map((r, i) => {
    const hiCnt  = r.risks.filter(k => k.level === 'high').length;
    const sevCnt = r.symptoms.filter(s => symptomLog[s.id]?.severity === 'sev').length;
    const bc = hiCnt > 0 ? 'badge-alert' : sevCnt > 0 ? 'badge-warn' : 'badge-ok';
    const bl = hiCnt > 0 ? `${hiCnt} Alert${hiCnt>1?'s':''}` : sevCnt > 0 ? 'Needs Review' : 'All Clear';
    return `
    <div class="rpt-item">
      <div class="rpt-head" onclick="toggleRpt(${i})">
        <div>
          <div class="rpt-title">Health Report: ${r.dateShort}</div>
          <div class="rpt-meta">${r.symptoms.length} symptoms · session ${r.sessionTime} · Dr. ${r.profile.doctor||'not specified'}</div>
        </div>
        <div style="display:flex;gap:0.55rem;align-items:center">
          <span class="rpt-badge ${bc}">${bl}</span>
          <span style="color:var(--text-lt);font-size:0.8rem" id="chev-${i}">▼</span>
        </div>
      </div>
      <div class="rpt-body" id="rb-${i}">
        <div class="rpt-st">Patient Info</div>
        <div class="rpt-row"><span style="color:var(--text-m);font-weight:700">${r.profile.name||'—'}, Age ${r.profile.age||'—'}</span><span style="font-size:0.75rem;color:var(--text-lt)">${r.date}</span></div>
        <div class="rpt-row"><span style="color:var(--text-lt)">Status</span><span style="color:var(--text-m)">${r.profile.menStatus||'—'}</span></div>
        <div class="rpt-row"><span style="color:var(--text-lt)">Medications</span><span style="color:var(--text-m)">${r.profile.meds||'None'}</span></div>
        <div class="rpt-st">Symptoms Reported (${r.symptoms.length})</div>
        ${r.symptoms.map(s => {
          const sk = s.severity==='mod'?'moderate':s.severity==='sev'?'severe':(s.severity||'none');
          const sl = s.severity==='mod'?'Moderate':s.severity==='sev'?'Severe':(s.severity||'None').charAt(0).toUpperCase()+(s.severity||'none').slice(1);
          return `<div class="rpt-row"><span style="color:var(--text-m)">${s.icon} ${s.name}</span><div style="display:flex;gap:0.45rem;align-items:center"><span style="font-size:0.7rem;color:var(--text-lt)">${s.freq||''}</span><span class="chip-sev chip-${sk}">${sl}</span></div></div>`;
        }).join('')}
        <div class="rpt-st">Risk Flags</div>
        ${r.risks.map(rk => `<div class="risk-pill ${rk.level}"><span style="flex-shrink:0">${rk.icon}</span><span>${rk.text}</span></div>`).join('')}
        <div class="rpt-st">AI Clinical Summary</div>
        <p style="font-size:0.84rem;color:var(--text-m);line-height:1.8;font-style:italic;background:var(--peach-lt);padding:1rem 1.2rem;border-radius:12px;border-left:3px solid var(--rose);margin-bottom:0.5rem">${r.summary}</p>
        <div class="rpt-st">Discussion Points for Dr. ${r.profile.doctor||'Your Doctor'}</div>
        ${r.discussion.map(d => `<div class="rpt-row"><span style="color:var(--rose);font-weight:800;flex-shrink:0">→</span><span style="color:var(--text-m);font-size:0.82rem">${d}</span></div>`).join('')}
        <div class="rpt-actions">
          <button class="btn-sm-p" onclick="downloadRpt(${i})">Download PDF</button>
          <button class="btn-sm-s" onclick="copyRpt(${i})">Copy Text</button>
          <button class="btn-sm-s" onclick="deleteRpt(${i})" style="margin-left:auto">Delete</button>
        </div>
        <p style="font-size:0.68rem;color:var(--text-lt);margin-top:0.9rem;font-style:italic">Not a medical diagnosis. For discussion with your healthcare provider only.</p>
      </div>
    </div>`;
  }).join('');
}

function toggleRpt(i) {
  const b = document.getElementById(`rb-${i}`);
  const c = document.getElementById(`chev-${i}`);
  b.classList.toggle('open');
  c.textContent = b.classList.contains('open') ? '▲' : '▼';
}

function downloadRpt(i) {
  const r = savedReports[i];
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>PeriAI Health Report</title>
  <style>body{font-family:Georgia,serif;max-width:780px;margin:0 auto;padding:2.5rem;color:#3D2C25;line-height:1.6}.header{background:linear-gradient(135deg,#F9C4A8,#E8866A);color:white;padding:1.8rem 2rem;border-radius:12px;margin-bottom:2rem}.header h1{font-size:1.6rem;margin-bottom:.2rem}h2{font-size:.78rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#E8866A;margin:1.5rem 0 .5rem;padding-bottom:.4rem;border-bottom:2px solid #FDE8D8}.row{display:flex;justify-content:space-between;padding:.42rem 0;border-bottom:1px solid #FEF0E8;font-size:.88rem}.badge{display:inline-block;padding:.15rem .5rem;border-radius:20px;font-size:.7rem;font-weight:700}.b-mild{background:#FDF6D8;color:#8B6B00}.b-moderate{background:#FDE8D8;color:#C05020}.b-severe{background:#FDE8E8;color:#A02030}.b-none{background:#E0F0E8;color:#2E7D5A}.risk{border-radius:8px;padding:.65rem .9rem;margin-bottom:.4rem;font-size:.82rem}.r-high{background:#FDE8E8;border-left:3px solid #E88080}.r-mod{background:#FDF6D8;border-left:3px solid #E8C860}.r-ok{background:#E0F0E8;border-left:3px solid #80C8A0}.summary{background:#FDE8D8;border-left:4px solid #E8866A;padding:1rem;font-style:italic;font-size:.85rem;border-radius:0 10px 10px 0}</style></head><body>
  <div class="header"><h1>PeriAI Health Report</h1><div style="opacity:.85;font-size:.85rem">Prepared for Dr. ${r.profile.doctor||'Your Doctor'} · ${r.date}</div></div>
  <h2>Patient Information</h2>
  <div class="row"><span>${r.profile.name||'—'}, Age ${r.profile.age||'—'}</span><span>${r.profile.menStatus||'—'}</span></div>
  <div class="row"><span>Medications</span><span>${r.profile.meds||'None'}</span></div>
  <div class="row"><span>Conditions</span><span>${(r.profile.conditions||[]).join(', ')||'None'}</span></div>
  <h2>Symptoms (${r.symptoms.length})</h2>
  ${r.symptoms.map(s=>{const sk=s.severity==='mod'?'moderate':s.severity==='sev'?'severe':(s.severity||'none');const sl=s.severity==='mod'?'Moderate':s.severity==='sev'?'Severe':(s.severity||'None').charAt(0).toUpperCase()+(s.severity||'none').slice(1);return`<div class="row"><span>${s.name}</span><div><span style="color:#9C7B6E;font-size:.78rem;margin-right:.4rem">${s.freq||''}</span><span class="badge b-${sk}">${sl}</span></div></div>`}).join('')}
  <h2>Risk Flags</h2>${r.risks.map(k=>`<div class="risk r-${k.level}">${k.icon} ${k.text}</div>`).join('')}
  <h2>Clinical Summary</h2><div class="summary">${r.summary}</div>
  <h2>Discussion Points</h2>${r.discussion.map(d=>`<div class="row"><span>→ ${d}</span></div>`).join('')}
  <p style="font-size:.7rem;color:#9C7B6E;margin-top:2rem;border-top:1px solid #FDE8D8;padding-top:.8rem">Generated by PeriAI. Not a medical diagnosis.</p>
  </body></html>`);
  w.document.close(); w.print();
}

function copyRpt(i) {
  const r = savedReports[i];
  const lines = [
    `PERIAI HEALTH REPORT: ${r.date}`,
    `Patient: ${r.profile.name||'—'}, Age ${r.profile.age||'—'} | Status: ${r.profile.menStatus||'—'}`,
    `For: Dr. ${r.profile.doctor||'—'} | Medications: ${r.profile.meds||'None'}`,
    '', `SYMPTOMS (${r.symptoms.length}):`,
    ...r.symptoms.map(s => `  • ${s.name}: ${s.severity}, ${s.freq||'not recorded'}`),
    '', 'RISK FLAGS:',
    ...r.risks.map(k => `  ${k.icon} ${k.text}`),
    '', 'CLINICAL SUMMARY:', r.summary,
    '', 'DISCUSSION POINTS:',
    ...r.discussion.map(d => `  → ${d}`),
    '', 'Generated by PeriAI. Not a medical diagnosis.'
  ];
  navigator.clipboard.writeText(lines.join('\n')).then(() => alert('Copied to clipboard!'));
}

async function deleteRpt(i) {
  if (!confirm('Delete this report?')) return;
  const r = savedReports[i];
  if (r._dbId && currentUser) {
    await _supabaseClient.from('reports').delete().eq('id', r._dbId);
  }
  savedReports.splice(i, 1);
  renderReports();
}

async function clearAllReports() {
  if (!confirm('Delete ALL reports? This cannot be undone.')) return;
  if (currentUser) {
    await _supabaseClient.from('reports').delete().eq('user_id', currentUser.id);
  }
  savedReports = [];
  renderReports();
}

// ── UTILS ────────────────────────────────
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ══════════════════════════════════════════════════════════════════
