# -*- coding: utf-8 -*-
"""b23.py: Scales 48 and 49 (perroca, pews)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 48 and 49...")
    # 48. Perroca
    e = FormPDFEngineEN("PERROCA PATIENT CLASSIFICATION SYSTEM", "Assessment of Nursing Care Complexity and Workforce Sizing", "36 points (9 to 36)", "Perroca MG. Rev Esc Enferm USP, 2011;45(2):413-421.")
    e.layout_mode = "single"
    e.extra_css = ".table-eval td { padding: 3px 6px !important; font-size: 7.4pt !important; } .opt-item { margin-bottom: 1.5px !important; font-size: 7.3pt !important; } .sec-title { margin: 5px 0 2px !important; }"
    e.add_table_section("NINE NURSING CARE COMPLEXITY DOMAINS", [
        (("1. Planning of Nursing Care", "Coordination and nursing process"), [("Routine ward protocol (1)", 1), ("Moderate coordination required (2)", 2), ("Individualized complex nursing plan (3)", 3), ("Intensive multi-team coordination (4)", 4)]),
        (("2. Investigation & Monitoring", "Vital signs and clinical surveillance"), [("Routine monitoring q8h (1)", 1), ("q6h monitoring (2)", 2), ("q4h monitoring / continuous ECG (3)", 3), ("Continuous invasive monitoring / hemodynamics (4)", 4)]),
        (("3. Body Hygiene", "Hygiene and self-care dependence"), [("Independent self-care (1)", 1), ("Assisted shower / bath (2)", 2), ("Bed bath performed by 1 nurse (3)", 3), ("Bed bath requiring 2+ nurses (4)", 4)]),
        (("4. Nutrition & Hydration", "Nutritional intake method"), [("Oral feeding independently (1)", 1), ("Assisted oral feeding (2)", 2), ("Enteral nutrition (tube/stoma) (3)", 3), ("Total parenteral nutrition (TPN) (4)", 4)]),
        (("5. Elimination", "Sphincter control and care"), [("Independent toileting (1)", 1), ("Commode / urinal assistance (2)", 2), ("Incontinent / diaper changes (3)", 3), ("Catheter / ostomy irrigation (4)", 4)]),
        (("6. Locomotion / Activity", "Mobility in bed and ward"), [("Walks independently (1)", 1), ("Walks with aid / staff assist (2)", 2), ("Chair / wheelchair transfers (3)", 3), ("Bedbound / dependent transfers (4)", 4)]),
        (("7. Skin & Mucous Integrity", "Wound care and dressings"), [("Intact skin / clean (1)", 1), ("Stage 1-2 injury / dressing 1x daily (2)", 2), ("Extensive dressing 2x daily (3)", 3), ("Complex wound dressing ≥3x daily (4)", 4)]),
        (("8. Therapeutics", "Medication complexity"), [("Oral medications only (1)", 1), ("Intermittent IV / IM meds (2)", 2), ("Continuous IV infusions (3)", 3), ("Vasoactive drugs / chemotherapy (4)", 4)]),
        (("9. Emotional Support", "Psychosocial interaction"), [("Calm, receptive (1)", 1), ("Anxious, needs reassurance (2)", 2), ("Agitated, uncooperative (3)", 3), ("Severe crisis / conflictive (4)", 4)])
    ])
    e.set_risk_stratification([
        ("Minimal Care", "9 - 13 points", "Autonomous patient in stable condition. Basic ward nursing staffing.", "green"),
        ("Intermediate Care", "14 - 20 points", "Moderate dependency for hygiene and medication administration.", "green"),
        ("High Dependency Care", "21 - 26 points", "High nursing workload, partial clinical instability.", "yellow"),
        ("Semi-Intensive Care", "27 - 31 points", "Step-down care, high risk of acute decompensation.", "orange"),
        ("Intensive Care", "32 - 36 points", "Full critical care, multi-organ support, continuous 1:1 or 1:2 nursing.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_perroca.pdf"))

    # 49. PEWS
    e = FormPDFEngineEN("PEDIATRIC EARLY WARNING SCORE (PEWS)", "Inpatient Pediatric Deterioration Screening and Rapid Response Trigger", "9 points (+ modifiers)", "Monaghan A. Br J Nurs, 2005;14(5):278-281.")
    e.add_table_section("THREE CORE PHYSIOLOGICAL DOMAINS", [
        (("1. Behavior", "Mental state and irritability"), [("Playing / Appropriate response", 0), ("Sleeping / Irritable but consolable", 1), ("Inconsolable / Lethargic / Weak", 2), ("Reduced response to pain / Comatose", 3)]),
        (("2. Cardiovascular", "Skin color and capillary refill"), [("Pink / Cap refill 1-2s", 0), ("Pale / Cap refill 3s", 1), ("Grey / Cap refill 4s / Tachycardia >20bpm above normal", 2), ("Grey, mottled / Cap refill ≥5s / Tachycardia >30bpm or Bradycardia", 3)]),
        (("3. Respiratory", "Ventilatory effort and rate"), [("Normal rate, no retractions", 0), ("Tachypnea >10bpm above normal, accessory muscles, or 30%+ FiO2", 1), ("Tachypnea >20bpm above normal, retractions, or 40%+ FiO2", 2), ("Tachypnea >30bpm above normal, grunting, sternal recession, or 50%+ FiO2", 3)]),
        (("4. Special Modifiers", "Clinical treatments"), [("Quarter-hourly nebulizers: Yes [ ] (2 pts)", 2), ("Persistent postoperative vomiting: Yes [ ] (2 pts)", 2)])
    ])
    e.set_risk_stratification([
        ("Low Risk (Green)", "0 - 2 points", "Routine 4-hourly observations. Continue planned pediatric ward care.", "green"),
        ("Medium Risk (Amber)", "3 - 4 points", "Repeat vitals within 1 hour, bedside nurse in charge review, notify resident physician.", "yellow"),
        ("High Risk (Red)", "≥ 5 points (or single 3)", "Immediate Medical Emergency Team (MET) / Pediatric Critical Care response.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_pews.pdf"))

if __name__ == "__main__":
    run()
