# 🏛️ BAGA — Bharat Autonomous Governance Agent

An Agentic AI platform that automatically parses unstructured citizen complaints, routes them to the correct Indian government authority/officer, and predicts resolution times.

## Architecture

```
BAGA/
├── frontend/          # Next.js 14 (App Router) + Tailwind + Shadcn
├── backend/           # Python Flask + LangChain + Scikit-learn
│   ├── app.py         # Main Flask server
│   ├── train_model.py # ML model training script
│   ├── governance.py  # Indian governance routing logic
│   └── models/        # Saved ML models (.pkl)
└── README.md
```

## Quick Start

### 1. Backend (Flask + AI)
```bash
cd backend
pip install -r requirements.txt
python train_model.py        # Generate synthetic data & train model
python app.py                # Start Flask on :5000
```

### 2. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev                  # Start Next.js on :3000
```

## Environment Variables

### Backend (`backend/.env`)
```
GROQ_API_KEY=your_groq_api_key_here
# OR
GOOGLE_API_KEY=your_gemini_api_key_here
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FLASK_API_URL=http://localhost:5000
```

## Tech Stack
- **Frontend:** Next.js 14, React, Tailwind CSS, Shadcn UI, Lucide Icons
- **Auth & DB:** Firebase Auth + Firestore
- **Backend:** Python Flask
- **AI:** LangChain + Groq (Llama 3) / Gemini
- **ML:** Scikit-learn Random Forest Regressor
