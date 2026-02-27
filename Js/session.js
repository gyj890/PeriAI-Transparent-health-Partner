const INTERVIEW_QUESTIONS = [
  { id:'intro',        ask:(name) => `Hello${name?', '+name:''}! I'm Peri, your perimenopause companion. I'm going to ask you about 15 common symptoms so I can build a complete picture of how you're feeling. There are no right or wrong answers — just tell me what's true for you. Let's start: have you been experiencing any hot flashes or sudden waves of heat?`, symptomId:'hot_flashes' },
  { id:'night_sweats', ask:() => `Thank you. What about night sweats — are you waking up drenched or overheated during the night?`, symptomId:'night_sweats' },
  { id:'sleep',        ask:() => `How is your sleep overall? Are you having trouble falling asleep, staying asleep, or waking up too early?`, symptomId:'sleep' },
  { id:'mood',         ask:() => `Have you noticed any changes in your mood? Things like irritability, anxiety, sudden tearfulness, or feeling more on edge than usual?`, symptomId:'mood' },
  { id:'brain_fog',    ask:() => `What about your memory and concentration? Are you experiencing brain fog, forgetfulness, or difficulty focusing?`, symptomId:'brain_fog' },
  { id:'periods',      ask:() => `How have your periods been? Are they irregular, heavier, lighter, or have they stopped altogether?`, symptomId:'periods' },
  { id:'vag_dry',      ask:() => `Are you experiencing any vaginal dryness, discomfort, or pain during sex?`, symptomId:'vag_dry' },
  { id:'libido',       ask:() => `Has your sex drive changed? Do you feel less interested in intimacy than you used to?`, symptomId:'libido' },
  { id:'joints',       ask:() => `What about joint or muscle pain? Are you noticing aches, stiffness, or soreness that wasn't there before?`, symptomId:'joints' },
  { id:'headaches',    ask:() => `Have your headaches changed at all — more frequent, more intense, or happening at different times?`, symptomId:'headaches' },
  { id:'weight',       ask:() => `Have you noticed any unexplained weight changes or bloating, particularly around the midsection?`, symptomId:'weight' },
  { id:'fatigue',      ask:() => `How is your energy? Are you feeling persistently tired or exhausted even after a full night of sleep?`, symptomId:'fatigue' },
  { id:'palp',         ask:() => `Have you noticed any heart palpitations — a racing, fluttering, or pounding sensation in your chest?`, symptomId:'palp' },
  { id:'urinary',      ask:() => `Any changes with your bladder? Things like urgency, leaking when you laugh or sneeze, or frequent urinary tract infections?`, symptomId:'urinary' },
  { id:'skin_hair',    ask:() => `Last one — have you noticed changes to your skin or hair? Dryness, thinning hair, breakouts, or changes in texture?`, symptomId:'skin_hair' },
  { id:'done',         ask:() => `That's all 15 symptoms covered. Thank you for sharing all of that with me. I've been tracking everything you've told me. You can now save this to your symptom log, or generate a clinical report to share with your doctor. Is there anything else you'd like to tell me?`, symptomId:null },
];

let interviewStep    = 0;
let awaitingFollowUp = false;

function severityFromText(text) {
  const t = text.toLowerCase();
  if (t.match(/\b(none|no|not really|nope|not at all|never|don't have|don't notice|not experiencing)\b/)) return 'none';
  if (t.match(/\b(severe|terrible|unbearable|constant|debilitating|really bad|very bad|awful|worst|10|9)\b/)) return 'severe';
  if (t.match(/\b(moderate|pretty bad|quite a bit|most days|every day|often|frequent|regularly|7|8)\b/)) return 'moderate';
  return 'mild';
}

function freqFromText(text) {
  const t = text.toLowerCase();
  if (t.match(/\b(all day|constant|always|multiple times a day|every hour)\b/)) return 'Multiple times a day';
  if (t.match(/\b(once a day|daily|every day|every night)\b/)) return 'Once daily';
  if (t.match(/\b(few times a week|several times|most days|most nights)\b/)) return 'Several times a week';
  if (t.match(/\b(once a week|weekly|about once)\b/)) return 'Weekly';
  return 'Several times a week';
}

function askNext() {
  if (interviewStep >= INTERVIEW_QUESTIONS.length) return;
  const q = INTERVIEW_QUESTIONS[interviewStep];
  const text = q.ask(profile.name || '');
  addMsg('luna', text);
  speak(text);
  updateInterviewProgress();
}

function updateInterviewProgress() {
  const total = INTERVIEW_QUESTIONS.length - 2;
  const step  = Math.max(0, interviewStep - 1);
  const pct   = Math.min(100, Math.round((step / total) * 100));
  const label = document.getElementById('interviewProgressLabel');
  if (label) {
    if (interviewStep === 0) label.textContent = 'Starting session...';
    else if (interviewStep >= INTERVIEW_QUESTIONS.length - 1) label.textContent = 'Session complete';
    else label.textContent = `Question ${step} of ${total}`;
  }
  const fill = document.getElementById('interviewProgressFill');
  if (fill) fill.style.width = pct + '%';
}

function handleInterviewResponse(userText) {
  const currentQ = INTERVIEW_QUESTIONS[interviewStep];
  if (!currentQ) return;
  const symId = currentQ.symptomId;
  const sev   = severityFromText(userText);
  if (symId && symId !== null) {
    if (!symptomLog[symId]) symptomLog[symId] = {};
    symptomLog[symId].severity = sev;
    symptomLog[symId].date = new Date().toISOString();
    if (sev === 'none') {
      symptomLog[symId].freq = '';
      interviewStep++;
      setTimeout(askNext, 600);
      return;
    }
    if (!awaitingFollowUp) {
      awaitingFollowUp = true;
      const followUp = buildFollowUp(symId, sev);
      setTimeout(() => { addMsg('luna', followUp); speak(followUp); }, 500);
      return;
    }
    const freq = freqFromText(userText);
    symptomLog[symId].freq = freq;
    awaitingFollowUp = false;
    saveSymptomLog();
  }
  interviewStep++;
  setTimeout(askNext, 700);
}

function buildFollowUp(symId) {
  const followUps = {
    hot_flashes:  'How often are the hot flashes happening — a few times a day, or more like once or twice?',
    night_sweats: 'How often are they waking you up — most nights, or just occasionally?',
    sleep:        'How many nights a week does this affect your sleep?',
    mood:         'Is this something you\'re noticing most days, or does it come and go?',
    brain_fog:    'Is the brain fog affecting you daily, or is it more intermittent?',
    periods:      'How long has your cycle been irregular or changed?',
    vag_dry:      'Is this constant discomfort, or does it mainly bother you during intimacy?',
    libido:       'Has this been a gradual change, or did it shift more suddenly?',
    joints:       'Which joints or areas bother you most, and is it worse in the morning?',
    headaches:    'How often are they happening compared to before?',
    weight:       'How much weight would you estimate you\'ve gained, and over what timeframe?',
    fatigue:      'Is this affecting you every day, or mainly on certain days?',
    palp:         'How long do they typically last, and do you ever feel dizzy or short of breath with them?',
    urinary:      'How often is this happening — daily, a few times a week?',
    skin_hair:    'Is the hair thinning noticeable to others, or mainly something you\'ve noticed yourself?',
  };
  return followUps[symId] || 'How often does this affect you — daily, weekly, or occasionally?';
}

// ── SESSION ──────────────────────────────
function initSession() {
  sessionActive    = true;
  convoHistory     = [];
  detectedSymptoms = {};
  interviewStep    = 0;
  awaitingFollowUp = false;
  clearInterval(timerInt);
  sessionSecs = 0;
  timerInt = setInterval(() => {
    sessionSecs++;
    const m = String(Math.floor(sessionSecs / 60)).padStart(2,'0');
    const s = String(sessionSecs % 60).padStart(2,'0');
    document.getElementById('sessionTimer').textContent = `${m}:${s}`;
  }, 1000);
  document.getElementById('recDot').classList.add('on');
  document.getElementById('liveBadge').className = 'live-badge badge-live';
  document.getElementById('liveBadge').textContent = 'live';
  const cnt = parseInt(localStorage.getItem('lunaSessCount') || '0') + 1;
  localStorage.setItem('lunaSessCount', cnt);
  document.getElementById('messages').innerHTML = '';
  const pw = document.getElementById('interviewProgressWrap');
  if (pw) pw.style.display = 'block';
  setTimeout(askNext, 400);
}

function endSession() {
  sessionActive = false;
  stopAudio();
  stopListening();
  clearInterval(timerInt);
  document.getElementById('recDot').classList.remove('on');
  document.getElementById('liveBadge').className = 'live-badge badge-idle';
  document.getElementById('liveBadge').textContent = 'idle';
  setOrb('idle');
  const pw = document.getElementById('interviewProgressWrap');
  if (pw) pw.style.display = 'none';
}

// ── ORB ──────────────────────────────────
function setOrb(state) {
  orbState = state;
  document.getElementById('orbWrap').className = 'orb-wrap ' + state;
  const cfg = {
    idle:      { s:'Tap to speak',      h:'click to start listening', e:'' },
    listening: { s:'Listening…',        h:'speak now · tap to stop',  e:'' },
    thinking:  { s:'Thinking…',         h:'just a moment…',           e:'' },
    speaking:  { s:'Peri is speaking',  h:'tap to interrupt',         e:'' },
  };
  const c = cfg[state] || cfg.idle;
  document.getElementById('orbState').textContent = c.s;
  document.getElementById('orbHint').textContent  = c.h;
  document.getElementById('orbEmoji').textContent = c.e;
}

function handleOrbClick() {
  if (!sessionActive) { initSession(); return; }
  if (orbState === 'speaking')  { stopAudio(); return; }
  if (orbState === 'listening') { stopListening(); return; }
  if (orbState === 'idle')      startListening();
}

// ── SPEECH RECOGNITION ───────────────────
function startListening() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    addMsg('luna','Voice input needs Chrome or Edge. Please switch browsers for the voice experience!');
    return;
  }
  recognition = new SR();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  const bar = document.getElementById('interimBar');
  recognition.onstart  = () => { isListening = true; setOrb('listening'); bar.style.display='block'; bar.textContent='…'; };
  recognition.onresult = e => {
    let interim = '', final = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      e.results[i].isFinal ? final += t : interim += t;
    }
    bar.textContent = final || interim || '…';
    if (final) recognition._final = final;
  };
  recognition.onend = () => {
    isListening = false;
    const txt = recognition._final || bar.textContent;
    bar.style.display = 'none'; bar.textContent = '';
    if (txt && txt !== '…' && txt.length > 1) handleInput(txt.trim());
    else setOrb('idle');
  };
  recognition.onerror = e => {
    isListening = false;
    bar.style.display = 'none';
    if (e.error === 'not-allowed') {
      addMsg('luna', 'Microphone access was blocked. Click the lock icon in your browser address bar, set Microphone to Allow, then refresh.');
    } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
      addMsg('luna', `Couldn't quite catch that (${e.error}). Try again?`);
    }
    setOrb('idle');
  };
  recognition.start();
}

function stopListening() { try { recognition?.stop(); } catch(e) {} }

// ── HANDLE INPUT ─────────────────────────
async function handleInput(text) {
  addMsg('user', text);
  extractSymptoms(text);
  convoHistory.push({ role: 'user', content: text });
  if (interviewStep < INTERVIEW_QUESTIONS.length) {
    setOrb('thinking');
    showThinking();
    await delay(400);
    removeThinking();
    handleInterviewResponse(text);
  } else {
    setOrb('thinking');
    showThinking();
    await delay(700);
    const reply = postInterviewReply(text);
    removeThinking();
    if (reply) {
      addMsg('luna', reply);
      convoHistory.push({ role: 'assistant', content: reply });
      speak(reply);
    }
  }
}

function postInterviewReply(text) {
  const t = text.toLowerCase();
  if (t.includes('report'))  return "You can generate your clinical report using the Report button below.";
  if (t.includes('save'))    return "Hit the Save to Log button below and all your symptoms will be saved.";
  if (t.includes('risk'))    return "Head to the Risk Analysis tab to see your cardiovascular risk score.";
  if (t.includes('thank'))   return "It was my pleasure. Take care of yourself.";
  return "I've captured everything from our conversation. You can save your symptom log, generate a report for your doctor, or check your risk score in the Risk Analysis tab.";
}

// ── TTS ──────────────────────────────────
function speak(text) {
  const clean = text.replace(/\*+/g,'').replace(/[\u2764\uFE0F]/g,'').trim();
  if (!clean || !window.speechSynthesis) { setOrb('idle'); afterSpeak(); return; }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(clean);
  const voices = window.speechSynthesis.getVoices();
  const preferred = ['Ava','Allison','Samantha','Aria','Jenny','Susan','Karen','Victoria','Zira'];
  const badMale   = ['David','Mark','Guy','Fred','Alex','Tom','Daniel','James','Brian'];
  let v = null;
  for (const n of preferred) { v = voices.find(x => x.name.includes(n) && x.lang.startsWith('en')); if (v) break; }
  if (!v) v = voices.find(x => x.lang === 'en-US' && !badMale.some(m => x.name.includes(m)));
  if (!v) v = voices.find(x => x.lang.startsWith('en'));
  if (v) utter.voice = v;
  utter.rate = 0.91; utter.pitch = 1.1; utter.volume = 1;
  utter.onstart = () => setOrb('speaking');
  utter.onend   = () => { setOrb('idle'); afterSpeak(); };
  utter.onerror = () => { setOrb('idle'); afterSpeak(); };
  window.speechSynthesis.speak(utter);
  setOrb('speaking');
}

function afterSpeak() {
  if (sessionActive && orbState === 'idle') setTimeout(startListening, 400);
}
function stopAudio() { window.speechSynthesis?.cancel(); setOrb('idle'); }

if (window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener('voiceschanged', () => window.speechSynthesis.getVoices());
}

// ── MESSAGES ─────────────────────────────
function addMsg(role, text) {
  const box = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const av = role === 'luna' ? 'P' : 'Y';
  div.innerHTML = `
    <div class="msg-av">${av}</div>
    <div class="msg-body">
      <div class="msg-who">${role === 'luna' ? 'Peri' : 'You'} · ${time}</div>
      <div class="msg-bubble">${text.replace(/\n/g,'<br>')}</div>
    </div>`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function showThinking() {
  const box = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'msg luna'; div.id = 'thinkMsg';
  div.innerHTML = `<div class="msg-av">P</div><div class="msg-body"><div class="msg-bubble"><div class="think-dots"><span></span><span></span><span></span></div></div></div>`;
  box.appendChild(div); box.scrollTop = box.scrollHeight;
}
function removeThinking() { document.getElementById('thinkMsg')?.remove(); }

// ── EXTRACT SYMPTOMS ─────────────────────
function extractSymptoms(text) {
  const lower = text.toLowerCase();
  Object.entries(KWDS).forEach(([id, kws]) => {
    if (kws.some(kw => lower.includes(kw))) {
      let sev = 'mild';
      if (SEV_W.severe.some(w => lower.includes(w))) sev = 'severe';
      else if (SEV_W.moderate.some(w => lower.includes(w))) sev = 'moderate';
      if (!detectedSymptoms[id]) detectedSymptoms[id] = { sev, freq: 'Daily' };
    }
  });
}

