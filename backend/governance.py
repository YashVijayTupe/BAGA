"""
governance.py — Indian Governance Routing Logic for BAGA

This module contains the canonical Indian administrative structure,
SLAs, department mappings, and officer titles that the AI must
strictly adhere to when routing citizen complaints.
"""

# ─────────────────────────────────────────────────────────────
# GOVERNANCE KNOWLEDGE BASE
# This is the single source of truth for all routing decisions.
# ─────────────────────────────────────────────────────────────

GOVERNANCE_RULES = {
    # ── URBAN JURISDICTION ──────────────────────────────────
    "urban": {
        "water": {
            "issue_category": "Water Supply",
            "assigned_department": "Municipal Water Works Department",
            "officer_title": "Ward Officer / Assistant Engineer",
            "priority_level": "High",
            "sla_min_hours": 24,
            "sla_max_hours": 48,
            "keywords": [
                "water", "pipe", "burst", "leak", "no water",
                "water supply", "tap", "pipeline", "water pressure",
                "contaminated water", "dirty water", "water shortage",
                "tanker", "borewell", "overhead tank", "water cut",
                "jal", "paani", "neer", "pani"
            ]
        },
        "sanitation": {
            "issue_category": "Sanitation & Solid Waste",
            "assigned_department": "Municipal Solid Waste Management",
            "officer_title": "Sanitary Inspector (SI)",
            "priority_level": "Medium",
            "sla_min_hours": 24,
            "sla_max_hours": 72,
            "keywords": [
                "garbage", "waste", "dump", "drain", "sewer",
                "sanitation", "trash", "overflow", "clogged",
                "drainage", "nala", "gutter", "stink", "smell",
                "mosquito", "kachra", "safai", "kuda", "gandagi",
                "solid waste", "dustbin", "dumping", "sewage"
            ]
        },
        "roads": {
            "issue_category": "Roads & Infrastructure",
            "assigned_department": "Municipal Public Works Department",
            "officer_title": "Executive Engineer (Roads)",
            "priority_level": "Medium",
            "sla_min_hours": 168,   # 7 days
            "sla_max_hours": 360,   # 15 days
            "keywords": [
                "road", "pothole", "footpath", "pavement",
                "bridge", "flyover", "divider", "signal",
                "broken road", "damaged road", "construction",
                "sadak", "rasta", "gaddha", "footover bridge"
            ]
        }
    },

    # ── RURAL JURISDICTION ──────────────────────────────────
    "rural": {
        "water": {
            "issue_category": "Water & Local Sanitation",
            "assigned_department": "Gram Panchayat",
            "officer_title": "Gram Sevak / Jal Surakshak",
            "priority_level": "Medium",
            "sla_min_hours": 48,    # 2 days
            "sla_max_hours": 120,   # 5 days
            "keywords": [
                "water", "well", "handpump", "borewell", "tank",
                "water supply", "village water", "no water",
                "panchayat water", "gram", "gaon ka paani",
                "contaminated", "sanitation", "open defecation",
                "toilet", "shauchalay"
            ]
        },
        "infrastructure": {
            "issue_category": "Major Infrastructure & Roads",
            "assigned_department": "Zilla Parishad / State PWD",
            "officer_title": "Block Development Officer (BDO) / PWD Engineer",
            "priority_level": "Low",
            "sla_min_hours": 360,   # 15 days
            "sla_max_hours": 720,   # 30 days
            "keywords": [
                "road", "bridge", "school building", "anganwadi",
                "community hall", "village road", "kaccha road",
                "panchayat building", "infrastructure", "zilla",
                "parishad", "block", "tehsil", "taluka"
            ]
        }
    },

    # ── STATE-LEVEL (Both Urban & Rural) ────────────────────
    "state": {
        "electricity": {
            "issue_category": "Electricity",
            "assigned_department": "State Electricity Board (MSEDCL/MSEB)",
            "officer_title": "Junior Engineer (JE) / Lineman",
            "priority_level": "Critical",
            "sla_min_hours": 4,
            "sla_max_hours": 12,
            "keywords": [
                "electricity", "power", "power cut", "outage",
                "blackout", "transformer", "pole", "fallen pole",
                "streetlight", "street light", "dead light",
                "electric", "wire", "cable", "voltage", "meter",
                "bill", "bijli", "light", "load shedding",
                "lineman", "phase", "mcb", "short circuit"
            ]
        }
    }
}


# ─────────────────────────────────────────────────────────────
# PRIORITY LEVELS (for ML feature encoding)
# ─────────────────────────────────────────────────────────────
PRIORITY_ENCODING = {
    "Critical": 4,
    "High": 3,
    "Medium": 2,
    "Low": 1
}

# ─────────────────────────────────────────────────────────────
# CATEGORY ENCODING (for ML feature encoding)
# ─────────────────────────────────────────────────────────────
CATEGORY_ENCODING = {
    "Water Supply": 0,
    "Sanitation & Solid Waste": 1,
    "Roads & Infrastructure": 2,
    "Water & Local Sanitation": 3,
    "Major Infrastructure & Roads": 4,
    "Electricity": 5
}

JURISDICTION_ENCODING = {
    "Urban": 0,
    "Rural": 1,
    "State": 2
}


def get_all_valid_outputs():
    """
    Returns a list of all valid routing outputs for LLM prompt construction.
    This ensures the LangChain prompt always stays in sync with the rules.
    """
    outputs = []
    for jurisdiction, categories in GOVERNANCE_RULES.items():
        for cat_key, details in categories.items():
            outputs.append({
                "issue_category": details["issue_category"],
                "jurisdiction_level": jurisdiction.capitalize(),
                "assigned_department": details["assigned_department"],
                "officer_title": details["officer_title"],
                "priority_level": details["priority_level"]
            })
    return outputs


def get_sla_range(issue_category, jurisdiction_level):
    """
    Get the SLA hour range for a given category and jurisdiction.
    Returns (min_hours, max_hours) tuple.
    """
    jurisdiction = jurisdiction_level.lower()
    for cat_key, details in GOVERNANCE_RULES.get(jurisdiction, {}).items():
        if details["issue_category"] == issue_category:
            return details["sla_min_hours"], details["sla_max_hours"]
    return 24, 72  # Default fallback


def build_prompt_routing_table():
    """
    Builds a formatted routing table string for inclusion in the
    LangChain system prompt.
    """
    lines = []
    lines.append("=== VALID ROUTING TABLE (YOU MUST ONLY USE THESE EXACT VALUES) ===\n")

    for jurisdiction, categories in GOVERNANCE_RULES.items():
        lines.append(f"── {jurisdiction.upper()} JURISDICTION ──")
        for cat_key, details in categories.items():
            lines.append(f"  Category: {details['issue_category']}")
            lines.append(f"    Department: {details['assigned_department']}")
            lines.append(f"    Officer: {details['officer_title']}")
            lines.append(f"    Priority: {details['priority_level']}")
            lines.append(f"    SLA: {details['sla_min_hours']}h – {details['sla_max_hours']}h")
            lines.append(f"    Keywords: {', '.join(details['keywords'][:10])}...")
            lines.append("")

    return "\n".join(lines)
