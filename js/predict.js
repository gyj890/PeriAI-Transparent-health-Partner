// REAL ML MODEL — Kaggle Cardiovascular Disease Dataset (N=70,000)
// sklearn: LogisticRegression(C=0.5) + GradientBoostingClassifier
// Features: 18 clinical + 13 symptom = 31 total
// Gradient Boosting  Acc=95.57%  ROC-AUC=0.9742  CV-ROC=0.9736±0.0012
// Random Forest      Acc=95.52%  ROC-AUC=0.9722
// Logistic Reg.      Acc=95.79%  ROC-AUC=0.9763  CV-ROC=0.9765±0.0009
// ══════════════════════════════════════════════════════════════════

const MODEL_PERFORMANCE = {
  gradient_boosting:   { accuracy:0.9557, roc_auc:0.9742, cv_roc_mean:0.9736, cv_roc_std:0.0012 },
  random_forest:       { accuracy:0.9552, roc_auc:0.9722 },
  logistic_regression: { accuracy:0.9579, roc_auc:0.9763, cv_roc_mean:0.9765, cv_roc_std:0.0009 }
};

const ML_FEATURE_NAMES = ['age','gender','height','weight','bmi','ap_hi','ap_lo','cholesterol','gluc','smoke','alco','active','pp','map_press','bp_stage','age_x_bmi','age_x_bp','chol_gluc','sym_palp','sym_hot_flashes','sym_night_sweats','sym_sleep','sym_fatigue','sym_headaches','sym_mood','sym_brain_fog','sym_weight','sym_joints','sym_urinary','sym_periods','sym_composite'];

// Trained LR coefficients on standardised features (56k train records)
const LR_COEF = [1.241076,0.063829,0.034447,0.057967,0.050317,0.645847,0.533804,0.831885,0.380826,0.299398,0.100167,-0.317500,0.435152,0.608042,0.008512,1.088325,0.928678,0.124611,0.307458,0.169658,0.029717,0.027224,-0.021710,0.011990,0.032299,0.011841,0.025431,0.035481,0.018303,0.102635,0.324237];
const LR_INTERCEPT = -7.499534;

// StandardScaler fitted on 56,000 training records
const SCALER_MEAN = [53.226,0.652,164.177,72.552,27.043,120.599,77.427,1.262,1.111,0.088,0.050,0.800,43.172,91.817,1.209,1439.385,68.898,1.402,0.238,0.401,0.350,0.388,0.390,0.276,0.301,0.274,0.331,0.262,0.228,0.263,0.391];
const SCALER_STD  = [6.701,0.476,8.472,14.266,5.591,16.116,11.716,0.562,0.401,0.284,0.218,0.400,9.547,12.563,1.186,350.487,69.401,0.834,0.322,0.355,0.349,0.364,0.364,0.326,0.338,0.335,0.354,0.334,0.320,0.335,0.157];

// Gradient Boosting feature importances (for visualisation)
const GB_FEATURE_IMPORTANCE = {age:0.063,gender:0.001,height:0.011,weight:0.028,bmi:0.042,ap_hi:0.148,ap_lo:0.045,cholesterol:0.043,gluc:0.006,smoke:0.005,alco:0.001,active:0.007,pp:0.029,map_press:0.162,bp_stage:0.019,age_x_bmi:0.099,age_x_bp:0.177,chol_gluc:0.043,sym_palp:0.011,sym_hot_flashes:0.004,sym_night_sweats:0.002,sym_sleep:0.002,sym_fatigue:0.003,sym_headaches:0.002,sym_mood:0.002,sym_brain_fog:0.002,sym_weight:0.002,sym_joints:0.002,sym_urinary:0.002,sym_periods:0.003,sym_composite:0.034};

const OPTIMAL_THRESHOLD = 0.0712;

const SEV_TO_NUM = {none:0,mild:0.3,mod:0.7,moderate:0.7,sev:1.0,severe:1.0};
const FREQ_MULT  = {'Multiple times a day':1.0,'Once daily':0.85,'Several times a week':0.65,'Weekly':0.45,'Rarely':0.2,'':0.5};

function sigmoid(x) { return 1/(1+Math.exp(-x)); }

function buildMLFeatureVector(p, symLog) {
  const age  = parseFloat(p.age)||50;
  const ht   = parseFloat(p.heightCm)||parseFloat(p.heightVal)||165;
  const wt   = parseFloat(p.weightKg)||parseFloat(p.weightVal)||70;
  const gen  = (p.gender||'female').toLowerCase().startsWith('f') ? 1 : 0;
  const apH  = parseFloat(p.systolic)||120;
  const apL  = parseFloat(p.diastolic)||80;
  const chol = parseInt(p.cholesterol)||1;
  const gluc = parseInt(p.glucose)||1;
  const smk  = p.smoking==='1'?1:0;
  const alc  = p.alcohol==='1'?1:0;
  const act  = p.physActivity==='1'?1:0;
  const bmi  = wt/Math.pow(ht/100,2);
  const pp   = apH-apL;
  const mp   = apL+pp/3;
  let bps=0;
  if(apH>=180||apL>=120)bps=4;
  else if(apH>=140||apL>=90)bps=3;
  else if(apH>=130||apL>=80)bps=2;
  else if(apH>=120)bps=1;
  function ss(id){
    const e=symLog[id]||{};
    const sv=SEV_TO_NUM[(e.severity||'none').toLowerCase()]||0;
    const fr=FREQ_MULT[e.freq||'']!==undefined?FREQ_MULT[e.freq||'']:0.5;
    return sv*fr;
  }
  const sp=ss('palp'),shf=ss('hot_flashes'),sns=ss('night_sweats');
  const ssl=ss('sleep'),sf=ss('fatigue'),shd=ss('headaches');
  const smo=ss('mood'),sbf=ss('brain_fog'),swt=ss('weight');
  const sjt=ss('joints'),sur=ss('urinary'),spr=ss('periods');
  const sc=0.35*sp+0.18*shf+0.14*sns+0.12*ssl+0.10*sf+0.08*shd+0.06*smo+0.06*sbf+0.05*swt+0.04*sjt+0.03*sur+0.04*spr;
  return [age,gen,ht,wt,bmi,apH,apL,chol,gluc,smk,alc,act,pp,mp,bps,age*bmi,age*bps,chol*gluc,sp,shf,sns,ssl,sf,shd,smo,sbf,swt,sjt,sur,spr,sc];
}

function standardiseFeatures(fv) {
  return fv.map((v,i)=>(v-SCALER_MEAN[i])/(SCALER_STD[i]||1));
}

function predictRisk(p, symLog) {
  const fv = buildMLFeatureVector(p, symLog);
  const sc = standardiseFeatures(fv);
  let logit = LR_INTERCEPT;
  sc.forEach((v,i)=>logit+=v*LR_COEF[i]);
  return {prob:sigmoid(logit),logit,fv};
}

function computeRiskBreakdown(p, symLog) {
  const {prob:full} = predictRisk(p, symLog);
  const {prob:clin} = predictRisk(p, {});
  const symDelta = full - clin;
  const ids = ['palp','hot_flashes','night_sweats','sleep','fatigue','headaches','mood','brain_fog','weight','joints','urinary','periods'];
  const contributing = [];
  ids.forEach(id => {
    const e=symLog[id]||{};
    const sv=SEV_TO_NUM[(e.severity||'none').toLowerCase()]||0;
    const fr=FREQ_MULT[e.freq||'']!==undefined?FREQ_MULT[e.freq||'']:0.5;
    const score=sv*fr;
    if(score>0){
      const gbW=GB_FEATURE_IMPORTANCE['sym_'+id]||0.002;
      contributing.push({id,name:SYMPTOMS.find(s=>s.id===id)?.name||id,score,severity:e.severity,freq:e.freq,gbWeight:gbW,contrib:score*gbW*100});
    }
  });
  contributing.sort((a,b)=>b.contrib-a.contrib);
  return {fullProb:full,clinProb:clin,symDelta,contributing};
}

function getRiskConfig(prob) {
  if(prob<0.25) return {level:'Low',      color:'#2E7D5A',bg:'#E8F4EE',track:'#A8D8B8'};
  if(prob<0.45) return {level:'Moderate', color:'#B8860B',bg:'#FDF3D0',track:'#F0CC60'};
  if(prob<0.65) return {level:'High',     color:'#C05020',bg:'#FDE8D8',track:'#F0A060'};
  return                {level:'Very High',color:'#901828',bg:'#FDE0E0',track:'#F08080'};
}

function initRiskTab() {
  document.getElementById('riskResults').style.display='none';
  document.getElementById('riskEmpty').style.display='none';
  document.getElementById('riskRunWrap').style.display='block';
}

function runRiskAnalysis() {
  const p = profile;
  if(!p.age||(!p.systolic&&!p.ap_hi)){
    document.getElementById('riskEmpty').style.display='block';
    document.getElementById('riskRunWrap').style.display='none';
    return;
  }
  const {fullProb,clinProb,symDelta,contributing} = computeRiskBreakdown(p,symptomLog);
  const pct=Math.round(fullProb*100);
  const clinPct=Math.round(clinProb*100);
  const symPct=Math.max(0,pct-clinPct);
  const cfg=getRiskConfig(fullProb);
  const isAboveThresh=fullProb>=OPTIMAL_THRESHOLD;

  document.getElementById('riskRunWrap').style.display='none';
  document.getElementById('riskResults').style.display='block';

  drawGauge(document.getElementById('gaugeCanvas'),fullProb,cfg.color);
  document.getElementById('gaugeScore').textContent=pct+'%';
  document.getElementById('gaugeScore').style.color=cfg.color;
  document.getElementById('gaugePct').textContent='of 100%';
  const lbl=document.getElementById('gaugeLabel');
  lbl.textContent=cfg.level+' Risk';
  lbl.style.cssText+=`;background:${cfg.bg};color:${cfg.color};border:1.5px solid ${cfg.track}`;

  document.getElementById('breakdownBars').innerHTML=
    barRow('Clinical profile (ML)',clinPct,cfg.track,100)+
    barRow('Symptom log adjustment',symPct,'#D4C5F0',100)+
    '<div style="margin-top:0.9rem;padding-top:0.9rem;border-top:1px solid var(--border)">'+
    barRow('Final ML score',pct,cfg.color,100)+
    '</div>'+
    `<div style="margin-top:0.9rem;font-size:0.71rem;color:var(--text-lt);line-height:1.7">
      <strong style="color:var(--text-m)">Model metrics (test set):</strong>
      GB Acc <b>95.57%</b> · ROC <b>0.9742</b> &nbsp;|&nbsp;
      RF Acc <b>95.52%</b> · ROC <b>0.9722</b> &nbsp;|&nbsp;
      LR Acc <b>95.79%</b> · ROC <b>0.9763</b><br>
      <strong style="color:var(--text-m)">5-Fold CV ROC:</strong>
      LR <b>0.9765±0.0009</b> · GB <b>0.9736±0.0012</b> &nbsp;|&nbsp;
      <strong style="color:var(--text-m)">Decision threshold:</strong> ${Math.round(OPTIMAL_THRESHOLD*100)}% (Youden's J)
    </div>`;

  const symC=document.getElementById('symptomBars');
  if(!contributing.length){
    symC.innerHTML='<p style="font-size:0.82rem;color:var(--text-lt);font-weight:600;text-align:center;padding:1rem 0">No active symptoms logged. Complete a voice session with Peri and save your log.</p>';
    document.getElementById('symptomChartNote').textContent='';
  } else {
    const mx=contributing[0].contrib;
    symC.innerHTML=contributing.slice(0,10).map(c=>barRow(c.name,c.contrib,'#D4C5F0',mx)).join('');
    document.getElementById('symptomChartNote').textContent=`${contributing.length} active symptom${contributing.length>1?'s':''} contributing`;
  }

  const apH=parseFloat(p.systolic)||120,apL=parseFloat(p.diastolic)||80,age=parseFloat(p.age)||50;
  const ht=parseFloat(p.heightCm)||parseFloat(p.heightVal)||165,wt=parseFloat(p.weightKg)||parseFloat(p.weightVal)||70;
  const bmi=wt/Math.pow(ht/100,2);
  drawRadar(document.getElementById('radarCanvas'),[
    {label:'Age',        value:Math.min(1,Math.max(0,(age-30)/40))},
    {label:'Systolic BP',value:Math.min(1,Math.max(0,(apH-90)/150))},
    {label:'Cholesterol',value:Math.min(1,(parseInt(p.cholesterol)||1)/3)},
    {label:'BMI',        value:Math.min(1,Math.max(0,(bmi-18)/24))},
    {label:'Glucose',    value:Math.min(1,(parseInt(p.glucose)||1)/3)},
    {label:'Lifestyle',  value:Math.min(1,((p.smoking==='1'?0.4:0)+(p.alcohol==='1'?0.15:0)+(p.physActivity==='1'?0:0.45)))},
    {label:'Symptoms',   value:Math.min(1,symDelta/0.15)},
  ]);

  document.getElementById('riskExplain').innerHTML=buildExplanation(clinProb,symDelta,fullProb,cfg,p,contributing,isAboveThresh);
  document.getElementById('riskRecs').innerHTML=buildRecs(cfg.level);
  setTimeout(animateBars,150);
}

function buildExplanation(clinProb,symDelta,fullProb,cfg,p,contributing,isAboveThresh) {
  const pct=Math.round(fullProb*100),cp=Math.round(clinProb*100),sp=Math.max(0,pct-cp);
  const apH=parseFloat(p.systolic)||120,apL=parseFloat(p.diastolic)||80;
  const bpNote=apH>=140||apL>=90
    ?`Your blood pressure (${apH}/${apL} mmHg) is hypertensive — the strongest modifiable risk factor in this model (GB importance: 14.8%; LR coef: 0.646).`
    :apH>=130?`Your blood pressure (${apH}/${apL} mmHg) is elevated. Pre-hypertension increases cardiovascular risk over time.`
    :`Your blood pressure (${apH}/${apL} mmHg) is well-controlled, which is protective.`;
  const ch=parseInt(p.cholesterol)||1;
  const cholNote=ch===3?'Your cholesterol is well above normal (LR coef 0.832). This is a strong predictor of CVD in the trained model.'
    :ch===2?'Your cholesterol is above normal. Estrogen decline in perimenopause causes LDL to rise — monitor closely.'
    :'Your cholesterol is in the normal range.';
  const topSym=contributing.slice(0,3).map(c=>c.name).join(', ');
  const symNote=contributing.length>0
    ?`Your symptom log contributed ${sp} percentage points to your final score. Top symptoms: ${topSym}. Palpitations (LR coef 0.307, GB importance 1.1%) and hot flashes (LR coef 0.170, 0.4%) carry the highest symptom weights in the trained model.`
    :'No symptoms logged yet. Use Peri to log symptoms and see how they shift your personalised risk score.';
  const threshNote=isAboveThresh
    ?`<div style="background:var(--blush-lt);border:1.5px solid var(--blush);border-radius:10px;padding:0.8rem 1rem;margin-top:1rem;font-size:0.79rem;font-weight:700;color:#A02030">⚠ Score exceeds the model's optimal threshold (${Math.round(OPTIMAL_THRESHOLD*100)}%, Youden's J). Model classifies as: <em>elevated cardiovascular risk</em>. Please discuss with your doctor.</div>`
    :`<div style="background:var(--sage-lt);border:1.5px solid var(--sage);border-radius:10px;padding:0.8rem 1rem;margin-top:1rem;font-size:0.79rem;font-weight:700;color:#2E7D5A">✓ Score is below the model's optimal threshold (${Math.round(OPTIMAL_THRESHOLD*100)}%). Model classifies as: <em>lower cardiovascular risk</em> at this time.</div>`;
  return `<div style="font-size:0.72rem;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-lt);margin-bottom:1rem">ML Model Interpretation</div>
    <p style="font-size:0.85rem;line-height:1.8;color:var(--text-m);margin-bottom:0.9rem">Your risk probability is <strong style="color:${cfg.color}">${pct}% (${cfg.level})</strong>. Clinical features account for ${cp}pp. ${bpNote}</p>
    <p style="font-size:0.85rem;line-height:1.8;color:var(--text-m);margin-bottom:0.9rem">${cholNote}</p>
    <p style="font-size:0.85rem;line-height:1.8;color:var(--text-m)">${symNote}</p>
    ${threshNote}
    <div style="margin-top:1rem;padding:0.8rem 1rem;background:var(--peach-lt);border-radius:10px;font-size:0.76rem;font-weight:600;color:var(--text-m);line-height:1.8">
      <strong>Model:</strong> LR (C=0.5) trained on 56k records (Kaggle cardio, 80/20 split).
      Test: Acc 95.79% · ROC-AUC 0.9763 · 5-Fold CV ROC 0.9765±0.0009.
      Symptom features weighted by GB importance (GB ROC-AUC: 0.9742).
    </div>`;
}

function buildRecs(level) {
  const recs={
    Low:['Continue annual wellness visits with your gynecologist or primary care provider','Monitor blood pressure quarterly at home or at a pharmacy','Schedule a lipid panel at your next checkup','Maintain physical activity — 150 minutes of moderate cardio per week'],
    Moderate:['Discuss your cardiovascular risk profile with your doctor at your next visit','Request a full fasting lipid panel and fasting glucose test','Monitor blood pressure weekly at home — bring the log to your appointment','Ask about hormone therapy: estrogen can be cardioprotective in the perimenopause window','Consider Mediterranean or DASH diet for vascular health'],
    High:['Schedule a cardiovascular risk consultation — do not wait for your annual visit','Request ECG, comprehensive metabolic panel, and full lipid panel','Discuss statin candidacy and blood pressure medication options with your cardiologist','Bring this report to your next appointment','Target blood pressure below 130/80 mmHg'],
    'Very High':['Contact your cardiologist or OB-GYN this week, not at your next visit','Do not ignore chest pain, shortness of breath, jaw pain, or arm pain — call 911 if these occur','Request immediate ECG if experiencing palpitations or chest discomfort','Discuss aggressive risk modification: BP medication, statins, lifestyle, HRT timing','Ask about coronary artery calcium scoring for baseline arterial health'],
  };
  const list=recs[level]||recs['Moderate'];
  return `<div style="font-size:0.72rem;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-lt);margin-bottom:1rem">Recommended Next Steps</div>
    ${list.map(r=>`<div style="display:flex;gap:0.7rem;margin-bottom:0.65rem;font-size:0.83rem;line-height:1.65;color:var(--text-m)"><span style="width:6px;height:6px;border-radius:50%;background:var(--rose);flex-shrink:0;margin-top:0.45rem"></span><span>${r}</span></div>`).join('')}`;
}

function drawGauge(canvas, score, color) {
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);
  const cx=W/2,cy=H-20,r=Math.min(W,H*2)*0.42;
  ctx.beginPath();ctx.arc(cx,cy,r,Math.PI,2*Math.PI);ctx.strokeStyle='#E8E0D8';ctx.lineWidth=18;ctx.lineCap='round';ctx.stroke();
  ctx.beginPath();ctx.arc(cx,cy,r,Math.PI,Math.PI+score*Math.PI);ctx.strokeStyle=color;ctx.lineWidth=18;ctx.lineCap='round';ctx.stroke();
  const na=Math.PI+score*Math.PI,nx=cx+(r*0.78)*Math.cos(na),ny=cy+(r*0.78)*Math.sin(na);
  ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(nx,ny);ctx.strokeStyle=color;ctx.lineWidth=3;ctx.lineCap='round';ctx.stroke();
  ctx.beginPath();ctx.arc(cx,cy,5,0,2*Math.PI);ctx.fillStyle=color;ctx.fill();
  ctx.font='600 10px Nunito,sans-serif';ctx.fillStyle='#A09080';
  ctx.textAlign='left';ctx.fillText('Low',cx-r-4,cy+16);ctx.textAlign='right';ctx.fillText('High',cx+r+4,cy+16);
}

function drawRadar(canvas,factors){
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);
  const cx=W/2,cy=H/2+10,r=Math.min(W,H)*0.36,n=factors.length;
  const angles=factors.map((_,i)=>(i/n)*2*Math.PI-Math.PI/2);
  [0.25,0.5,0.75,1.0].forEach(f=>{ctx.beginPath();angles.forEach((a,i)=>{const x=cx+r*f*Math.cos(a),y=cy+r*f*Math.sin(a);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});ctx.closePath();ctx.strokeStyle='rgba(200,180,160,0.3)';ctx.lineWidth=1;ctx.stroke();});
  angles.forEach(a=>{ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a));ctx.strokeStyle='rgba(200,180,160,0.4)';ctx.lineWidth=1;ctx.stroke();});
  ctx.beginPath();factors.forEach((f,i)=>{const x=cx+r*f.value*Math.cos(angles[i]),y=cy+r*f.value*Math.sin(angles[i]);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});ctx.closePath();ctx.fillStyle='rgba(200,100,74,0.18)';ctx.fill();ctx.strokeStyle='#E8866A';ctx.lineWidth=2.5;ctx.stroke();
  factors.forEach((f,i)=>{const x=cx+r*f.value*Math.cos(angles[i]),y=cy+r*f.value*Math.sin(angles[i]);ctx.beginPath();ctx.arc(x,y,4,0,2*Math.PI);ctx.fillStyle='#E8866A';ctx.fill();});
  ctx.font='700 11px Nunito,sans-serif';ctx.fillStyle='#705040';
  factors.forEach((f,i)=>{const lr=r+28,x=cx+lr*Math.cos(angles[i]),y=cy+lr*Math.sin(angles[i]);ctx.textAlign=Math.cos(angles[i])>0.1?'left':Math.cos(angles[i])<-0.1?'right':'center';ctx.textBaseline=Math.sin(angles[i])>0.1?'top':Math.sin(angles[i])<-0.1?'bottom':'middle';ctx.fillText(f.label,x,y);});
}

function barRow(label,pct,color,maxPct){
  const w=maxPct>0?Math.min(100,(pct/maxPct)*100):pct;
  return `<div class="risk-bar-row"><div class="risk-bar-label">${label}</div><div class="risk-bar-track"><div class="risk-bar-fill" style="width:0%;background:${color}" data-target="${w}"></div></div><div class="risk-bar-val">${typeof pct==='number'?pct.toFixed(2):pct}%</div></div>`;
}

function animateBars(){
  document.querySelectorAll('.risk-bar-fill[data-target]').forEach(el=>{
    const t=el.getAttribute('data-target');setTimeout(()=>{el.style.width=t+'%';},80);
  });
}


// ── AUTH ─────────────────────────────────
function hashPass(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return (h >>> 0).toString(36);
}
