"""
train_model.py — BAGA ML Model Training
========================================
Generates a synthetic dataset of 1000 Indian civic complaints
with realistic SLA-based resolution times, then trains a
Random Forest Regressor to predict resolution hours.

Usage:
    python train_model.py

Output:
    data/synthetic_complaints.csv  — Training data
    models/resolution_model.pkl    — Trained model
"""

import os
import random
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

from governance import (
    GOVERNANCE_RULES,
    PRIORITY_ENCODING,
    CATEGORY_ENCODING,
    JURISDICTION_ENCODING,
)


# ─────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────
NUM_SAMPLES = 1000
RANDOM_SEED = 42
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")

random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)


# ─────────────────────────────────────────────────────────────
# BUILD COMPLAINT TEMPLATES FOR REALISTIC DATA
# ─────────────────────────────────────────────────────────────

COMPLAINT_TEMPLATES = {
    "urban_water": [
        "There is no water supply in Ward {ward} since {hours} hours",
        "Water pipe burst on {road} near {landmark}",
        "Dirty contaminated water coming from tap in {area}",
        "Water pressure is very low in {area}, need urgent fix",
        "Overhead tank not filling in our colony {area}",
    ],
    "urban_sanitation": [
        "Garbage not collected for {days} days in Ward {ward}",
        "Drain overflowing on {road}, causing health hazard",
        "Open dumping of waste near {landmark} in {area}",
        "Sewer line blocked in {area}, sewage on road",
        "Dustbins removed from {road}, kachra everywhere",
    ],
    "urban_roads": [
        "Huge pothole on {road} near {landmark}, very dangerous",
        "Footpath broken in {area}, elderly people falling",
        "Road damaged after monsoon near {landmark}",
        "No speed breakers near school on {road}",
        "Divider damaged on {road}, accidents happening",
    ],
    "rural_water": [
        "Handpump in village {village} not working for {days} days",
        "No water in gram panchayat {village}, bore well dried up",
        "Village {village} needs water tanker, no piped supply",
        "Water contamination in {village}, children falling sick",
        "Toilet construction incomplete in {village} under SBM",
    ],
    "rural_infrastructure": [
        "Village road from {village} to taluka in terrible condition",
        "Bridge near {village} damaged, vehicles cannot pass",
        "Anganwadi building in {village} needs repair",
        "Community hall roof collapsed in gram panchayat {village}",
        "School building in {village} is dangerous, walls cracking",
    ],
    "state_electricity": [
        "Power cut in {area} for {hours} hours, no update from MSEDCL",
        "Transformer burst in {area}, sparks flying — very dangerous",
        "Streetlight not working on {road} for {days} days",
        "Electric pole fallen on road near {landmark} in {area}",
        "Voltage fluctuation damaging appliances in {area}",
    ],
}

AREAS = ["Koregaon Park", "Hadapsar", "Baner", "Aundh", "Kothrud", "MG Road area",
         "Gandhi Nagar", "Nehru Colony", "Shivaji Nagar", "Laxmi Nagar", "Sadar Bazar"]
ROADS = ["MG Road", "Station Road", "NH-48", "Old Mumbai Highway", "Ring Road",
         "GT Road", "Mall Road", "Civil Lines Road", "Tilak Road", "FC Road"]
LANDMARKS = ["bus stand", "railway station", "hospital", "school", "temple",
             "market", "college", "park", "government office", "petrol pump"]
VILLAGES = ["Wadgaon", "Bhimashankar", "Junnar", "Kolegaon", "Shirgaon",
            "Mahuli", "Pargaon", "Devgad", "Ambegaon", "Rajgurunagar"]
WARDS = list(range(1, 50))


def fill_template(template):
    """Replace placeholders in a complaint template with random values."""
    return template.format(
        area=random.choice(AREAS),
        road=random.choice(ROADS),
        landmark=random.choice(LANDMARKS),
        village=random.choice(VILLAGES),
        ward=random.choice(WARDS),
        hours=random.choice([2, 3, 4, 5, 6, 8, 10, 12, 24]),
        days=random.choice([2, 3, 5, 7, 10, 15]),
    )


# ─────────────────────────────────────────────────────────────
# GENERATE SYNTHETIC DATASET
# ─────────────────────────────────────────────────────────────

def generate_dataset():
    """Generate a synthetic CSV of 1000 civic complaints with SLA-based resolution times."""

    # Define the mapping from template keys to governance rules
    template_to_rule = {
        "urban_water":          ("urban", "water"),
        "urban_sanitation":     ("urban", "sanitation"),
        "urban_roads":          ("urban", "roads"),
        "rural_water":          ("rural", "water"),
        "rural_infrastructure": ("rural", "infrastructure"),
        "state_electricity":    ("state", "electricity"),
    }

    # Weight distribution (electricity and water complaints are more common)
    weights = {
        "urban_water": 0.20,
        "urban_sanitation": 0.15,
        "urban_roads": 0.12,
        "rural_water": 0.15,
        "rural_infrastructure": 0.08,
        "state_electricity": 0.30,
    }

    template_keys = list(weights.keys())
    template_probs = [weights[k] for k in template_keys]

    records = []

    for i in range(NUM_SAMPLES):
        # Pick a category based on distribution
        key = np.random.choice(template_keys, p=template_probs)
        jurisdiction, category = template_to_rule[key]
        rule = GOVERNANCE_RULES[jurisdiction][category]

        # Generate complaint text
        template = random.choice(COMPLAINT_TEMPLATES[key])
        complaint_text = fill_template(template)

        # Generate realistic resolution hours using truncated normal
        sla_min = rule["sla_min_hours"]
        sla_max = rule["sla_max_hours"]
        mean_hours = (sla_min + sla_max) / 2
        std_hours = (sla_max - sla_min) / 4  # 95% within SLA range

        # Add some noise — sometimes faster, sometimes slower
        actual_hours = np.random.normal(mean_hours, std_hours)
        # Clamp: allow slight overruns (up to 20% above SLA max)
        actual_hours = max(sla_min * 0.5, min(sla_max * 1.2, actual_hours))
        actual_hours = round(actual_hours, 1)

        records.append({
            "complaint_id": f"BAGA-{i+1:04d}",
            "raw_text": complaint_text,
            "issue_category": rule["issue_category"],
            "jurisdiction_level": jurisdiction.capitalize(),
            "assigned_department": rule["assigned_department"],
            "officer_title": rule["officer_title"],
            "priority_level": rule["priority_level"],
            "actual_resolution_hours": actual_hours,
        })

    df = pd.DataFrame(records)

    os.makedirs(DATA_DIR, exist_ok=True)
    csv_path = os.path.join(DATA_DIR, "synthetic_complaints.csv")
    df.to_csv(csv_path, index=False)
    print(f"📊 Generated {len(df)} synthetic complaints → {csv_path}")
    print(f"\n   Category Distribution:")
    print(df["issue_category"].value_counts().to_string())
    print(f"\n   Resolution Hours Summary:")
    print(df.groupby("issue_category")["actual_resolution_hours"].describe()
            .round(1).to_string())

    return df


# ─────────────────────────────────────────────────────────────
# TRAIN RANDOM FOREST MODEL
# ─────────────────────────────────────────────────────────────

def train_model(df):
    """Train a Random Forest Regressor on the synthetic complaint data."""

    print("\n" + "=" * 60)
    print("  🧠 Training Random Forest Regressor")
    print("=" * 60)

    # Encode categorical features
    df["cat_encoded"] = df["issue_category"].map(CATEGORY_ENCODING)
    df["jur_encoded"] = df["jurisdiction_level"].map(JURISDICTION_ENCODING)
    df["pri_encoded"] = df["priority_level"].map(PRIORITY_ENCODING)

    # Features and target
    X = df[["cat_encoded", "jur_encoded", "pri_encoded"]].values
    y = df["actual_resolution_hours"].values

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED
    )

    # Train Random Forest
    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=3,
        random_state=RANDOM_SEED,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    # Evaluate
    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)

    print(f"\n   Training MAE : {mean_absolute_error(y_train, y_pred_train):.2f} hours")
    print(f"   Testing  MAE : {mean_absolute_error(y_test, y_pred_test):.2f} hours")
    print(f"   Training R²  : {r2_score(y_train, y_pred_train):.4f}")
    print(f"   Testing  R²  : {r2_score(y_test, y_pred_test):.4f}")

    # Feature importances
    feature_names = ["Category", "Jurisdiction", "Priority"]
    importances = model.feature_importances_
    print(f"\n   Feature Importances:")
    for name, imp in sorted(zip(feature_names, importances), key=lambda x: -x[1]):
        bar = "█" * int(imp * 40)
        print(f"     {name:15s} : {imp:.4f}  {bar}")

    # Save model
    os.makedirs(MODEL_DIR, exist_ok=True)
    model_path = os.path.join(MODEL_DIR, "resolution_model.pkl")
    joblib.dump(model, model_path)
    print(f"\n   💾 Model saved → {model_path}")

    # Quick sanity check: predict for each category
    print(f"\n   🔍 Sanity Check — Predictions per category:")
    for cat_name, cat_code in CATEGORY_ENCODING.items():
        for jur_name, jur_code in JURISDICTION_ENCODING.items():
            for pri_name, pri_code in PRIORITY_ENCODING.items():
                pred = model.predict([[cat_code, jur_code, pri_code]])[0]
                # Only show relevant combinations
                if (cat_name == "Water Supply" and jur_name == "Urban") or \
                   (cat_name == "Electricity" and jur_name == "State") or \
                   (cat_name == "Water & Local Sanitation" and jur_name == "Rural") or \
                   (cat_name == "Sanitation & Solid Waste" and jur_name == "Urban"):
                    if pri_name in ["High", "Medium", "Critical"]:
                        print(f"     {cat_name} | {jur_name} | {pri_name} → {pred:.1f}h")

    return model


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("  🏛️  BAGA — ML Model Training Pipeline")
    print("=" * 60)

    df = generate_dataset()
    model = train_model(df)

    print("\n" + "=" * 60)
    print("  ✅ Training Complete! You can now start the Flask server:")
    print("     python app.py")
    print("=" * 60)
