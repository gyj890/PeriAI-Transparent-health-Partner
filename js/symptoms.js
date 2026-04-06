// ── Symptom definitions, keywords, severity weights
// ── SYMPTOM DEFINITIONS ──────────────────
const SYMPTOMS = [
  { id: 'hot_flashes', name: 'Hot Flashes', icon: '', sub: 'Sudden warmth, flushing, sweating' },
  { id: 'night_sweats', name: 'Night Sweats', icon: '', sub: 'Soaking sweats during sleep' },
  { id: 'sleep', name: 'Sleep Disturbances', icon: '', sub: 'Difficulty falling or staying asleep' },
  { id: 'mood', name: 'Mood Changes', icon: '', sub: 'Irritability, anxiety, sadness' },
  { id: 'brain_fog', name: 'Brain Fog / Memory', icon: '', sub: 'Forgetfulness, poor concentration' },
  { id: 'periods', name: 'Irregular Periods', icon: '', sub: 'Missed, heavy, or spotting' },
  { id: 'chest_pain', name: 'Chest Discomfort', icon: '', sub: 'Dryness, discomfort, painful sex' },
  { id: 'breathless', name: 'Shortness of Breath', icon: '', sub: 'Reduced sexual desire' },
  { id: 'dizziness', name: 'Fainting', icon: '', sub: 'Aches, stiffness, joint pain' },
  { id: 'headaches', name: 'Headaches', icon: '', sub: 'Frequency or severity changes' },
  { id: 'weight', name: 'Weight / Bloating', icon: '', sub: 'Unexplained weight gain, bloating' },
  { id: 'fatigue', name: 'Fatigue', icon: '', sub: 'Persistent tiredness, low energy' },
  { id: 'palp', name: 'Heart Palpitations', icon: '', sub: 'Racing, fluttering, irregular heartbeat' },
  { id: 'swelling', name: 'Leg Swelling', icon: '', sub: 'Urgency, leaking, frequent UTIs' },
  { id: 'nausea', name: 'Nausea ', icon: '', sub: 'Dryness, thinning hair, acne' },
];

const KWDS = {
  hot_flashes: ['hot flash', 'hot flashes', 'flush', 'flushing', 'burning', 'sudden heat'],
  night_sweats: ['night sweat', 'sweating at night', 'soaking', 'drenched', 'waking up soaked'],
  sleep: ["can't sleep", 'insomnia', 'wake up', 'waking up', 'restless', 'awake all night', 'no sleep'],
  mood: ['mood', 'irritable', 'anxious', 'anxiety', 'crying', 'emotional', 'anger', 'tearful', 'rage'],
  brain_fog: ['brain fog', 'memory', 'forget', 'concentration', 'focus', 'confused', 'fuzzy'],
  periods: ['period', 'bleeding', 'irregular', 'spotting', 'heavy bleeding', 'missed period'],
  chest_pain: ['chest pain', 'chest tightness', 'chest pressure', 'squeezing', 'chest discomfort', 'pressure in chest', 'heavy chest', 'chest ache', 'tight chest', 'chest burning'],
  breathless: ['short of breath', 'breathless', 'winded', 'out of breath', 'cant breathe', 'difficulty breathing', 'gasping', 'breathing hard', 'breathlessness'],
  dizziness: ['dizzy', 'lightheaded', 'faint', 'spinning', 'vertigo', 'woozy', 'nearly fainted', 'blacked out', 'dizzy spell', 'feel faint', 'unsteady'],
  headaches: ['headache', 'migraine', 'head pain'],
  weight: ['weight gain', 'bloat', 'bloating', 'gaining weight'],
  fatigue: ['fatigue', 'exhausted', 'tired all', 'no energy', 'drained', 'wiped out'],
  palp: ['palpitation', 'heart racing', 'flutter', 'racing heart', 'heart pounding'],
  swelling: ['swelling', 'swollen ankles', 'swollen feet', 'puffy legs', 'fluid retention', 'legs swollen', 'ankles swollen', 'water retention', 'puffy feet'],
  nausea: ['nausea', 'nauseous', 'indigestion', 'stomach discomfort', 'sick to stomach', 'queasy', 'upset stomach', 'heartburn', 'acid reflux', 'vomiting'],
};

const SEV_W = {
  severe: ['severe', 'unbearable', 'terrible', 'worst', 'constant', 'debilitating', '10/10'],
  moderate: ['moderate', 'really bad', 'pretty bad', 'frequent', 'most days', 'every day'],
  mild: ['mild', 'little', 'slight', 'sometimes', 'occasionally', 'a bit'],
};

