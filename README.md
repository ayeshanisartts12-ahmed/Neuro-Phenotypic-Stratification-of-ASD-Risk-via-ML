# NeuroStrat AI — Python ASD Screening Backend & Game Suite

Welcome to the **Python backend & clinical Pygame game suite** for NeuroStrat AI, the state-of-the-art neuro-phenotypic Autism Spectrum Disorder (ASD) risk stratification platform. 

This repository houses the end-to-end Python pipeline, including the FastAPI registration gateway, SQLite session telemetry database, multi-modal clinical Pygame modules, risk scoring matrices, and PDF clinical summary engines.

---

## 🏗️ Architecture Design

```
neurostrat/
├── main.py                  # FastAPI server endpoints (CORS enabled)
├── router.py                # Age-based routing engine
├── run_module.py            # CLI subprocess launcher for Pygame engines
├── modules/
│   ├── base_module.py       # ABC defining gameplay telemetry logging & scoring hooks
│   ├── m1_behavioral/       # Ages 4–8 (Emotion Recognition, Symmetries)
│   ├── m2_social_sim/       # Ages 9–12 (Empathy scenario novel)
│   ├── m3_voice/            # Ages 12–16 (Vocal prosody, monotone analytics)
│   ├── m4_social_reasoning/ # Ages 17–22 (Typed linguistic reasoning chat)
│   └── m5_cognitive/        # Ages 22+ (Cognitive Stroop, Dual N-Back mapping)
├── data/
│   ├── collector.py         # Telemetry database recorder
│   ├── scorer.py            # Clinical weighted score matrix
│   └── reporter.py          # ReportLab PDF & JSON generator
├── models/
│   └── screening.py         # SQLAlchemy schemas for Patients & Telemetry
```

---

## 🚀 Setup & Execution

### 1. Prerequisites
Ensure you have **Python 3.11+** installed.

### 2. Dependency Installation
Install all pinned dependency packages:
```bash
pip install -r requirements.txt
```

### 3. Running the FastAPI Backend Server
Fire up the uvicorn development server:
```bash
uvicorn neurostrat.main:app --reload --port 8000
```
This serves the API gateway at `http://127.0.0.1:8000`. The schema docs are available at `http://127.0.0.1:8000/docs`.

### 4. Running unit tests
Run age routing and clinical scoring tests via pytest:
```bash
pytest
```

---

## 🛰️ REST API Documentation

### `POST /api/register`
Creates a patient triage session and auto-routes age to the correct module.
- **Request Body:**
  ```json
  {
    "name": "Arisha Khan",
    "age": 7,
    "email": "parent@domain.pk",
    "gender": "Female",
    "country": "Pakistan",
    "notes": "Prefers bright color displays."
  }
  ```
- **Response:**
  ```json
  {
    "patient_id": "NS-3D2F1E",
    "assigned_module": "BehavioralAdventureModule",
    "module_description": "Fun interactive games that analyze behavioral patterns in children ages 4-8."
  }
  ```

### `POST /api/launch/{patient_id}`
Triggers the backend subprocess to spin up the fullscreen Pygame sandbox matching the assigned age module.

### `GET /api/result/{patient_id}`
Parses all compiled event records, executes scoring algorithms, exports a printable clinical report PDF to `/output_reports/`, and returns the final JSON telemetry.

---

## 🔬 Clinical Scoring Models
Weights are dynamically loaded based on validated literature for each respective age cohort:
- **Ages 4-8:** Repetitive play, symmetry preferences, task compliance, and inhibition markers.
- **Ages 9-12:** Empathetic logic paths, theory of mind indices, and latency variations.
- **Ages 12-16:** Vocal prosody acoustic deviations (monotone indices/speech melody).
- **Ages 17-22:** Syntactic fit, social vocabulary richness, and written literalisms.
- **Ages 22+:** Dual-channel switching accuracy, Stroop interference shifts, and behavioral consistency checks.

---
*Disclaimer: All NeuroStrat AI screening indices are for experimental triaging and clinical pre-assessment screening. They must be reviewed by licensed medical practitioners.*
