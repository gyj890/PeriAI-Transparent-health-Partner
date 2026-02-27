## PeriAI: AI-Driven Preventive Health Partner
Vision: To create a world where advanced technology and human empathy come together to empower every woman to protect her heart and unlock her healthiest, most vibrant life.


## Purpose
PeriAI is an AI-driven preventive health partner that empowers proactive cardiac care for women. By integrating continuous wearable data with advanced predictive analytics, PeriAI detects subtle physiological changes often overlooked by traditional diagnostics, enabling timely interventions and reducing the risk of life-threatening cardiac events.


## Data-Driven AI & Technical Implementation
- Core Model Architecture: Deploys a Logistic Regression (C=0.5) classifier for real-time inference, benchmarked against Gradient Boosting and Random Forest ensembles for maximum predictive stability.
- Model Calibration: Optimized via Youden’s J Statistic to a 7.12% decision threshold, precisely balancing sensitivity and specificity for early cardiovascular detection.
- Training & Validation: Trained on 70,000 Kaggle records using an 80/20 split and validated via 5-Fold Cross-Validation ($0.9765 \pm 0.0009$ ROC-AUC).
- Advanced Feature Engineering: Engineers a 31-dimension vector incorporating 18 clinical markers, 13 symptom inputs, and non-linear interactions like Age × BMI and Pulse Pressure.
- Symptom Processing Engine: Quantifies qualitative logs into numerical values using a severity-frequency multiplier weighted by Gradient Boosting feature importance (e.g., palpitations, hot flashes).
- Real-time Inference Pipeline: Executes client-side preprocessing via StandardScaler and computes risk probabilities through a Sigmoid Activation Function on vectorized feature weights.
- Visual Interpretation Layer: Translates complex logic into Radar Charts and Canvas Gauges, decomposing the score into clinical base risk versus symptom-induced variance.


## How to Use: Workflow & Generation
- Step 1: Clinical Profile
Input baseline metrics (Age, Gender, BMI) and clinical vitals (BP, Cholesterol, Glucose) for real-time, color-coded health categorization.
- Step 2: Symptom Logging
Record symptoms via the Log or AI Chat; severity and frequency are weighted to calculate a "Symptom Delta" for risk adjustment.
- Step 3: AI Risk Analysis
Execute the Logistic Regression engine to generate a probability score against the 7.12% optimal threshold and view results on the dynamic gauge.
- Step 4: Interpret & Action
Review the ML-driven interpretation of your specific risk drivers and follow personalized clinical recommendations based on your risk tier.
- Step 5: Local Storage
Save generated reports to the History tab for local tracking of health fluctuations and future consultation with medical providers


## Technology Stack
- Frontend: Tailwind CSS, Vanilla JavaScript (ES6+) and HTML5 for a high-fidelity, responsive clinician and patient dashboard.
- Backend: Vercel, Python (FastAPI) for high-throughput, asynchronous API management.
- AI/ML Engine: Python with Scikit-Learn for model training (Logistic Regression & Gradient Boosting) and StandardScaler for feature normalization.
- Data visualization: High-performance rendering using HTML5 Canvas API for custom gauges and dynamic radar (spider) charts.
- Data Storage: SuperBase for storing dynamic data.
  
