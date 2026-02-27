// ── Symptom definitions, keywords, severity weights
// ── SYMPTOM DEFINITIONS ──────────────────
const SYMPTOMS = [
  {id:'hot_flashes',  name:'Hot Flashes',         icon:'', sub:'Sudden warmth, flushing, sweating'},
  {id:'night_sweats', name:'Night Sweats',         icon:'', sub:'Soaking sweats during sleep'},
  {id:'sleep',        name:'Sleep Disturbances',   icon:'', sub:'Difficulty falling or staying asleep'},
  {id:'mood',         name:'Mood Changes',         icon:'', sub:'Irritability, anxiety, sadness'},
  {id:'brain_fog',    name:'Brain Fog / Memory',   icon:'', sub:'Forgetfulness, poor concentration'},
  {id:'periods',      name:'Irregular Periods',    icon:'', sub:'Missed, heavy, or spotting'},
  {id:'vag_dry',      name:'Vaginal Dryness',      icon:'', sub:'Dryness, discomfort, painful sex'},
  {id:'libido',       name:'Low Libido',           icon:'', sub:'Reduced sexual desire'},
  {id:'joints',       name:'Joint & Muscle Pain',  icon:'', sub:'Aches, stiffness, joint pain'},
  {id:'headaches',    name:'Headaches',            icon:'', sub:'Frequency or severity changes'},
  {id:'weight',       name:'Weight / Bloating',    icon:'', sub:'Unexplained weight gain, bloating'},
  {id:'fatigue',      name:'Fatigue',              icon:'', sub:'Persistent tiredness, low energy'},
  {id:'palp',         name:'Heart Palpitations',   icon:'', sub:'Racing, fluttering, irregular heartbeat'},
  {id:'urinary',      name:'Urinary Changes',      icon:'', sub:'Urgency, leaking, frequent UTIs'},
  {id:'skin_hair',    name:'Skin & Hair Changes',  icon:'', sub:'Dryness, thinning hair, acne'},
];

const KWDS = {
  hot_flashes:  ['hot flash','hot flashes','flush','flushing','burning','sudden heat'],
  night_sweats: ['night sweat','sweating at night','soaking','drenched','waking up soaked'],
  sleep:        ["can't sleep",'insomnia','wake up','waking up','restless','awake all night','no sleep'],
  mood:         ['mood','irritable','anxious','anxiety','crying','emotional','anger','tearful','rage'],
  brain_fog:    ['brain fog','memory','forget','concentration','focus','confused','fuzzy'],
  periods:      ['period','bleeding','irregular','spotting','heavy bleeding','missed period'],
  vag_dry:      ['dryness','painful sex','vaginal dryness','vaginal discomfort','dry vagina'],
  libido:       ['libido','sex drive','no desire','not interested in sex'],
  joints:       ['joint pain','ache','stiff','stiffness','sore muscles','body aches'],
  headaches:    ['headache','migraine','head pain'],
  weight:       ['weight gain','bloat','bloating','gaining weight'],
  fatigue:      ['fatigue','exhausted','tired all','no energy','drained','wiped out'],
  palp:         ['palpitation','heart racing','flutter','racing heart','heart pounding'],
  urinary:      ['urinary','bladder','leaking','uti','frequent urination'],
  skin_hair:    ['hair loss','thinning hair','dry skin'],
};

const SEV_W = {
  severe:   ['severe','unbearable','terrible','worst','constant','debilitating','10/10'],
  moderate: ['moderate','really bad','pretty bad','frequent','most days','every day'],
  mild:     ['mild','little','slight','sometimes','occasionally','a bit'],
};

