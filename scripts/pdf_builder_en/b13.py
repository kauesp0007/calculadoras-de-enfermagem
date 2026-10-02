# -*- coding: utf-8 -*-
"""b13.py: Scales 26 and 27 (fugulin, gosnell)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 26 and 27...")
    # 26. Fugulin
    e = FormPDFEngineEN("FUGULIN PATIENT CLASSIFICATION SYSTEM (SCP)", "Assessment of Nursing Care Dependency and Staffing Workload", "36 points (9 to 36)", "Fugulin FMT, et al. Rev Esc Enferm USP, 2005;39(1):26-34.")
    e.layout_mode = "single"
    e.extra_css = ".table-eval td { padding: 3px 6px !important; font-size: 7.4pt !important; } .opt-item { margin-bottom: 1.5px !important; font-size: 7.3pt !important; } .sec-title { margin: 5px 0 2px !important; }"
    e.add_table_section("NINE NURSING CARE ASSESSMENT AREAS", [
        (("1. Mental Status", "Sensorium and cognitive orientation"), [("Oriented in time & place (1)", 1), ("Disorientation in periods (2)", 2), ("Continuous confusion / delirium (3)", 3), ("Comatose / unresponsive (4)", 4)]),
        (("2. Oxygenation", "Ventilatory support requirements"), [("Room air breathing (1)", 1), ("Intermittent oxygen (2)", 2), ("Continuous oxygen therapy (3)", 3), ("Mechanical ventilation / CPAP (4)", 4)]),
        (("3. Vital Signs", "Monitoring frequency"), [("Routine monitoring q8h (1)", 1), ("q6h monitoring (2)", 2), ("q4h monitoring (3)", 3), ("q2h or continuous monitoring (4)", 4)]),
        (("4. Motility", "Physical movement in bed"), [("Moves all extremities actively (1)", 1), ("Limited limb movement (2)", 2), ("Needs help for repositioning (3)", 3), ("Completely bedbound / immobile (4)", 4)]),
        (("5. Ambulation", "Walking capacity"), [("Walks independently (1)", 1), ("Walks with aid / staff assist (2)", 2), ("Wheelchair / chair bound (3)", 3), ("Strict bed confinement (4)", 4)]),
        (("6. Alimentation", "Nutritional intake method"), [("Feeds self independently (1)", 1), ("Needs assistance with feeding (2)", 2), ("Enteral tube feeding (NGT/PEG) (3)", 3), ("Total parenteral nutrition (TPN) (4)", 4)]),
        (("7. Body Care", "Bathing and personal hygiene"), [("Self-shower / self-bath (1)", 1), ("Assisted shower / tub (2)", 2), ("Bed bath performed by 1 nurse (3)", 3), ("Bed bath requiring 2+ nurses (4)", 4)]),
        (("8. Elimination", "Sphincter control and appliances"), [("Independent toilet use (1)", 1), ("Commode / urinal assistance (2)", 2), ("Incontinent / diaper use (3)", 3), ("Catheter / ostomy management (4)", 4)]),
        (("9. Therapeutics", "Medication administration route"), [("Oral medications only (1)", 1), ("Intermittent IV / IM / SC meds (2)", 2), ("Continuous IV infusions (3)", 3), ("Vasoactive drugs / chemotherapy (4)", 4)])
    ])
    e.set_risk_stratification([
        ("Minimal Care", "9 - 14 pts", "Self-sufficient patient. Routine general ward nursing care.", "green"),
        ("Intermediate Care", "15 - 20 pts", "Partial dependence for hygiene and therapy. Regular assistance.", "green"),
        ("High Dependency", "21 - 26 pts", "High nursing workload, partial instability, frequent monitoring.", "yellow"),
        ("Semi-Intensive", "27 - 31 pts", "High risk of instability, intensive care unit step-down level.", "orange"),
        ("Intensive Care", "32 - 36 pts", "Full critical care dependence, vital support, continuous nursing.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_fugulin.pdf"))

    # 27. Gosnell
    e = FormPDFEngineEN("GOSNELL SCALE FOR PRESSURE ULCER RISK", "Assessment of Pressure Sore Risk in Hospitalized Adult Patients", "20 points (5 to 20)", "Gosnell DJ. Nurs Res, 1973;22(1):55-59.")
    e.add_table_section("FIVE CLINICAL SUBSCALES", [
        (("1. Mental Status", "Orientation and sensorium"), [("Alert: Oriented to time, place, and person", 1), ("Apathetic: Drowsy, passive, depressed", 2), ("Confused: Converses inappropriately", 3), ("Stuporous: Arousable only with vigorous stimuli", 4), ("Comatose: Unresponsive to stimuli", 5)]),
        (("2. Continence", "Bladder and bowel control"), [("Fully continent: Complete sphincter control", 1), ("Usually continent: Incontinent only once a day", 2), ("Occasionally incontinent: Incontinent twice a day", 3), ("Usually incontinent: Incontinent several times a day", 4), ("Incontinent of urine & feces: Total incontinence", 5)]),
        (("3. Mobility", "Ability to change body position"), [("Full: Moves all extremities actively", 1), ("Slightly limited: Moves with some assistance", 2), ("Very limited: Requires major help to move", 3), ("Immobile: Completely unable to change position", 4)]),
        (("4. Activity", "Degree of ambulation"), [("Ambulatory: Walks unassisted", 1), ("Walks with assistance: Requires cane, walker, person", 2), ("Chairfast: Confined to chair/wheelchair", 3), ("Bedfast: Confined to bed continuously", 4)]),
        (("5. Nutrition", "Food and fluid intake quality"), [("Good: Eats regular balanced meals completely", 1), ("Fair: Eats partial meals, requires supplements", 2), ("Poor: Refuses food, takes liquids only, tube fed", 3)])
    ])
    e.set_risk_stratification([
        ("Low Risk", "5 - 9 points", "Standard skin hygiene, keep skin dry, regular repositioning.", "green"),
        ("Moderate Risk", "10 - 14 points", "q2h turning schedule, pressure-relieving mattress, nutritional support.", "yellow"),
        ("High Risk of Ulcer", "≥ 15 points", "Dynamic alternating air mattress, heel protectors, barrier cream, dietitian consult.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_gosnell.pdf"))

if __name__ == "__main__":
    run()
