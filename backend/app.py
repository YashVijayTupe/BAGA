"""
app.py — BAGA Flask Backend
============================
Main API server providing:
  POST /process-complaint  →  AI-powered complaint parsing, routing & ML prediction
  GET  /health             →  Health check

Uses LangChain with Groq (Llama 3) or Google Gemini for zero-shot
extraction, and a trained Random Forest model for resolution time prediction.
"""

import os
import json
import traceback
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# LangChain imports
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

# ML imports
import joblib
import numpy as np

# Local governance module
from governance import (
    build_prompt_routing_table,
    get_sla_range,
    PRIORITY_ENCODING,
    CATEGORY_ENCODING,
    JURISDICTION_ENCODING,
)

# ─────────────────────────────────────────────────────────────
# INIT
# ─────────────────────────────────────────────────────────────
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ─────────────────────────────────────────────────────────────
# AI PROVIDER SETUP
# ─────────────────────────────────────────────────────────────
AI_PROVIDER = os.getenv("AI_PROVIDER", "groq").lower()

def get_llm():
    """Initialize the LLM based on the configured provider."""
    if AI_PROVIDER == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0,
            max_output_tokens=512,
        )
    else:
        from langchain_groq import ChatGroq
        return ChatGroq(
            model="llama-3.3-70b-versatile",
            groq_api_key=os.getenv("GROQ_API_KEY"),
            temperature=0,
            max_tokens=512,
        )

# ─────────────────────────────────────────────────────────────
# ML MODEL LOADING
# ─────────────────────────────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "resolution_model.pkl")
ml_model = None

def load_ml_model():
    """Load the trained Random Forest model for resolution time prediction."""
    global ml_model
    if os.path.exists(MODEL_PATH):
        ml_model = joblib.load(MODEL_PATH)
        print(f"[OK] ML Model loaded from {MODEL_PATH}")
    else:
        print(f"[WARN] ML Model not found at {MODEL_PATH}. Run train_model.py first.")
        print("   Resolution predictions will use SLA midpoint as fallback.")

load_ml_model()


# ─────────────────────────────────────────────────────────────
# LANGCHAIN SYSTEM PROMPT (The Core of BAGA)
# ─────────────────────────────────────────────────────────────

# Dynamically build the routing table from governance.py
ROUTING_TABLE = build_prompt_routing_table()

SYSTEM_PROMPT = f"""You are BAGA (Bharat Autonomous Governance Agent), an expert AI system for
classifying and routing Indian citizen complaints to the correct government
department and officer.

You are an expert in Indian municipal governance, rural panchayat systems,
and state-level utility administration.

## YOUR TASK
Analyze the citizen's complaint text and extract:
1. **issue_category** — The category of the complaint
2. **jurisdiction_level** — Whether this is Urban, Rural, or State level
3. **assigned_department** — The exact government department to handle this
4. **officer_title** — The exact officer title responsible
5. **priority_level** — Critical, High, Medium, or Low

## CRITICAL RULES — YOU MUST FOLLOW THESE EXACTLY:

1. You MUST ONLY output values from the routing table below. Do NOT invent
   departments, officer titles, or categories that are not listed.

2. JURISDICTION DETECTION:
   - If the complaint mentions a city, municipal corporation, nagar palika,
     ward, urban area, or city name → jurisdiction_level = "Urban"
   - If the complaint mentions a village, gram panchayat, taluka, tehsil,
     block, rural area, gaon, or hamlet → jurisdiction_level = "Rural"
   - Electricity complaints (power, bijli, streetlight, transformer) are
     ALWAYS jurisdiction_level = "State" regardless of location.

3. CATEGORY DETECTION:
   - Water issues (pipes, supply, contamination, leaks) →
     Urban: "Water Supply" | Rural: "Water & Local Sanitation"
   - Sanitation issues (garbage, drains, sewage, waste) →
     Urban: "Sanitation & Solid Waste" | Rural: "Water & Local Sanitation"
   - Road/Infrastructure (potholes, bridges, footpaths) →
     Urban: "Roads & Infrastructure" | Rural: "Major Infrastructure & Roads"
   - Electricity (power cuts, poles, streetlights, transformers) →
     Always: "Electricity"

4. When the complaint is ambiguous about Urban vs Rural, default to "Urban".

5. When the complaint mentions Hindi/regional language terms:
   - "bijli", "light", "current" → Electricity
   - "paani", "pani", "jal", "neer" → Water
   - "kachra", "gandagi", "safai" → Sanitation
   - "sadak", "rasta", "gaddha" → Roads

{ROUTING_TABLE}

## OUTPUT FORMAT
You MUST respond with ONLY a valid JSON object. No explanations, no markdown,
no extra text. Just the JSON:

{{{{
  "issue_category": "<exact category from table>",
  "jurisdiction_level": "<Urban|Rural|State>",
  "assigned_department": "<exact department from table>",
  "officer_title": "<exact officer title from table>",
  "priority_level": "<Critical|High|Medium|Low>"
}}}}

## EXAMPLES

Complaint: "There is a huge pothole on MG Road near the municipal office, very dangerous for vehicles"
Output: {{{{"issue_category": "Roads & Infrastructure", "jurisdiction_level": "Urban", "assigned_department": "Municipal Public Works Department", "officer_title": "Executive Engineer (Roads)", "priority_level": "Medium"}}}}

Complaint: "Bijli nahi aa rahi hai 3 ghante se, transformer se awaaz aa rahi hai"
Output: {{{{"issue_category": "Electricity", "jurisdiction_level": "State", "assigned_department": "State Electricity Board (MSEDCL/MSEB)", "officer_title": "Junior Engineer (JE) / Lineman", "priority_level": "Critical"}}}}

Complaint: "Hamare gaon mein handpump kharab ho gaya hai, paani nahi aa raha"
Output: {{{{"issue_category": "Water & Local Sanitation", "jurisdiction_level": "Rural", "assigned_department": "Gram Panchayat", "officer_title": "Gram Sevak / Jal Surakshak", "priority_level": "Medium"}}}}

Complaint: "Ward 15 area mein kachra collection 1 hafte se nahi hua, bahut gandagi hai"
Output: {{{{"issue_category": "Sanitation & Solid Waste", "jurisdiction_level": "Urban", "assigned_department": "Municipal Solid Waste Management", "officer_title": "Sanitary Inspector (SI)", "priority_level": "Medium"}}}}

Now analyze the following citizen complaint:
"""


# ─────────────────────────────────────────────────────────────
# LANGCHAIN CHAIN
# ─────────────────────────────────────────────────────────────

prompt_template = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", "{complaint_text}")
])

output_parser = JsonOutputParser()


def predict_resolution_hours(issue_category, jurisdiction_level, priority_level):
    """
    Use the trained ML model to predict resolution hours.
    Falls back to SLA midpoint if model is not available.
    """
    if ml_model is not None:
        try:
            # Encode features matching training schema
            cat_encoded = CATEGORY_ENCODING.get(issue_category, 0)
            jur_encoded = JURISDICTION_ENCODING.get(jurisdiction_level, 0)
            pri_encoded = PRIORITY_ENCODING.get(priority_level, 2)

            features = np.array([[cat_encoded, jur_encoded, pri_encoded]])
            prediction = ml_model.predict(features)[0]

            # Clamp to SLA bounds
            sla_min, sla_max = get_sla_range(issue_category, jurisdiction_level)
            clamped = max(sla_min, min(sla_max, round(prediction, 1)))
            return clamped

        except Exception as e:
            print(f"⚠️  ML prediction error: {e}")

    # Fallback: midpoint of SLA range
    sla_min, sla_max = get_sla_range(issue_category, jurisdiction_level)
    return round((sla_min + sla_max) / 2, 1)


# ─────────────────────────────────────────────────────────────
# API ENDPOINTS
# ─────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "BAGA Backend",
        "ai_provider": AI_PROVIDER,
        "ml_model_loaded": ml_model is not None,
        "timestamp": datetime.now().isoformat()
    })


@app.route("/process-complaint", methods=["POST"])
def process_complaint():
    """
    Main endpoint: Process a citizen complaint using AI + ML.

    Request JSON:
      { "raw_text": "complaint text here" }

    Response JSON:
      {
        "issue_category": "...",
        "jurisdiction_level": "...",
        "assigned_department": "...",
        "officer_title": "...",
        "priority_level": "...",
        "predicted_hours": 36.0,
        "status": "Routed",
        "processed_at": "2026-04-22T21:00:00"
      }
    """
    try:
        data = request.get_json()

        if not data or "raw_text" not in data:
            return jsonify({
                "error": "Missing 'raw_text' in request body"
            }), 400

        raw_text = data["raw_text"].strip()

        if len(raw_text) < 5:
            return jsonify({
                "error": "Complaint text too short. Please provide more details."
            }), 400

        # ── Step 1: AI Classification via LangChain ──
        llm = get_llm()
        chain = prompt_template | llm | output_parser

        ai_result = chain.invoke({"complaint_text": raw_text})

        # Validate required fields
        required_fields = [
            "issue_category", "jurisdiction_level",
            "assigned_department", "officer_title", "priority_level"
        ]
        for field in required_fields:
            if field not in ai_result:
                return jsonify({
                    "error": f"AI response missing field: {field}",
                    "ai_raw": ai_result
                }), 500

        # ── Step 2: ML Prediction ──
        predicted_hours = predict_resolution_hours(
            ai_result["issue_category"],
            ai_result["jurisdiction_level"],
            ai_result["priority_level"]
        )

        # ── Step 3: Build final response ──
        response = {
            "issue_category": ai_result["issue_category"],
            "jurisdiction_level": ai_result["jurisdiction_level"],
            "assigned_department": ai_result["assigned_department"],
            "officer_title": ai_result["officer_title"],
            "priority_level": ai_result["priority_level"],
            "predicted_hours": predicted_hours,
            "status": "Routed",
            "processed_at": datetime.now().isoformat()
        }

        print(f"[OK] Complaint processed: {ai_result['issue_category']} -> "
              f"{ai_result['assigned_department']} ({predicted_hours}h)")

        return jsonify(response), 200

    except json.JSONDecodeError as e:
        return jsonify({
            "error": "AI returned invalid JSON. Retrying may help.",
            "details": str(e)
        }), 500

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "true").lower() == "true"

    print("=" * 60)
    print("  BAGA Backend - Bharat Autonomous Governance Agent")
    print(f"  AI Provider : {AI_PROVIDER.upper()}")
    print(f"  ML Model    : {'Loaded [OK]' if ml_model else 'Not Found [WARN]'}")
    print(f"  Port        : {port}")
    print("=" * 60)

    app.run(host="0.0.0.0", port=port, debug=debug)
