# -*- coding: utf-8 -*-
"""b28.py: Scales 58 and 59 (sofa, tinetti)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 58 and 59...")
    # 58. SOFA
    e = FormPDFEngineEN("SEQUENTIAL ORGAN FAILURE ASSESSMENT (SOFA)", "Tracking of Organ Dysfunction and Mortality in Critical Care", "24 points (0 to 24)", "Vincent JL, et al. Intensive Care Med, 1996;22(7):707-710.")
    e.layout_mode = "single"
    e.extra_css = ".table-eval td { padding: 4px 7px !important; font-size: 7.4pt !important; } .opt-item { margin-bottom: 1.5px !important; font-size: 7.3pt !important; } .sec-title { margin: 5px 0 2px !important; }"
    e.add_table_section("SOFA SIX ORGAN SYSTEM CRITERIA", [
        (("1. Respiration", "PaO2 / FiO2 ratio (mmHg) and ventilatory support"), [("PaO2 / FiO2 ≥ 400 mmHg (0)", 0), ("PaO2 / FiO2 < 400 mmHg (1)", 1), ("PaO2 / FiO2 < 300 mmHg (2)", 2), ("PaO2 / FiO2 < 200 mmHg with invasive ventilation (3)", 3), ("PaO2 / FiO2 < 100 mmHg with invasive ventilation (4)", 4)]),
        (("2. Coagulation", "Platelet count (x10³/μL)"), [("Platelets ≥ 150 x10³/μL (0)", 0), ("Platelets < 150 x10³/μL (1)", 1), ("Platelets < 100 x10³/μL (2)", 2), ("Platelets < 50 x10³/μL (3)", 3), ("Platelets < 20 x10³/μL (4)", 4)]),
        (("3. Liver", "Total serum bilirubin (mg/dL)"), [("Bilirubin < 1.2 mg/dL (0)", 0), ("Bilirubin 1.2 - 1.9 mg/dL (1)", 1), ("Bilirubin 2.0 - 5.9 mg/dL (2)", 2), ("Bilirubin 6.0 - 11.9 mg/dL (3)", 3), ("Bilirubin ≥ 12.0 mg/dL (4)", 4)]),
        (("4. Cardiovascular", "Mean Arterial Pressure & Vasopressors (mcg/kg/min)"), [("MAP ≥ 70 mmHg (0)", 0), ("MAP < 70 mmHg (1)", 1), ("Dopamine ≤ 5 or Dobutamine any dose (2)", 2), ("Dopamine > 5, or Norepinephrine ≤ 0.1 (3)", 3), ("Dopamine > 15, or Norepinephrine > 0.1 (4)", 4)]),
        (("5. Central Nervous", "Glasgow Coma Scale (GCS) score"), [("GCS = 15 (0)", 0), ("GCS = 13 - 14 (1)", 1), ("GCS = 10 - 12 (2)", 2), ("GCS = 6 - 9 (3)", 3), ("GCS < 6 (4)", 4)]),
        (("6. Renal", "Serum creatinine (mg/dL) or Urine Output (mL/d)"), [("Creatinine < 1.2 mg/dL (0)", 0), ("Creatinine 1.2 - 1.9 mg/dL (1)", 1), ("Creatinine 2.0 - 3.4 mg/dL (2)", 2), ("Creatinine 3.5 - 4.9 mg/dL or UO < 500 mL/d (3)", 3), ("Creatinine ≥ 5.0 mg/dL or UO < 200 mL/d (4)", 4)])
    ])
    e.set_risk_stratification([
        ("Low Dysfunction", "0 - 6 points", "Mortality < 10%. Continuous ICU vital signs and metabolic monitoring.", "green"),
        ("Moderate Failure", "7 - 9 points", "Mortality 15 - 20%. Support failing organs, optimize tissue perfusion.", "yellow"),
        ("Severe Multi-Organ Failure", "10 - 12 points", "Mortality 40 - 50%. Advanced organ replacement therapy (CRRT, mechanical ventilation).", "orange"),
        ("Critical / Refractory", "> 12 points", "Mortality > 80%. Multi-vasopressor support, critical care crisis management.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_sofa.pdf"))

    # 59. Tinetti (POMA)
    e = FormPDFEngineEN("TINETTI MOBILITY ASSESSMENT (POMA)", "Performance-Oriented Assessment of Balance and Gait for Fall Risk", "28 points (Balance 16 + Gait 12)", "Tinetti ME. J Am Geriatr Soc, 1986;34(2):119-126.")
    e.layout_mode = "double_col"
    e.add_table_section("1. BALANCE (16 PTS)", [
        ("Sitting Balance", [("Leans/Slides", 0), ("Steady/Safe", 1)]),
        ("Arising from Chair", [("Unable", 0), ("Uses arms", 1), ("Able without arms", 2)]),
        ("Attempts to Arise", [("Unable", 0), ("Multiple tries", 1), ("One attempt", 2)]),
        ("Immediate Standing Balance", [("Unsteady", 0), ("Steady with aid", 1), ("Steady narrow", 2)]),
        ("Standing Balance", [("Unsteady", 0), ("Steady wide", 1), ("Steady narrow", 2)]),
        ("Nudge on Sternum (3x)", [("Begins to fall", 0), ("Staggers", 1), ("Steady", 2)]),
        ("Eyes Closed Standing", [("Unsteady", 0), ("Steady", 1)]),
        ("Turning 360 Degrees", [("Discontinuous", 0), ("Continuous", 1), ("Unsteady", 0), ("Steady", 1)]),
        ("Sitting Down", [("Unsafe/Flops", 0), ("Uses arms", 1), ("Safe/Smooth", 2)])
    ])
    e.add_table_section("2. GAIT (12 PTS)", [
        ("Initiation of Gait", [("Hesitancy", 0), ("No hesitancy", 1)]),
        ("Step Length (R & L)", [("Does not pass foot", 0), ("Passes weight foot", 1)]),
        ("Step Height (R & L)", [("Drags foot", 0), ("Foot clears floor", 1)]),
        ("Step Symmetry", [("Steps unequal", 0), ("Steps equal", 1)]),
        ("Step Continuity", [("Stopping between steps", 0), ("Continuous", 1)]),
        ("Path (Marked 10-ft lane)", [("Marked deviation", 0), ("Mild deviation/aid", 1), ("Straight line", 2)]),
        ("Trunk Stability", [("Marked sway", 0), ("Flexes knees/arms", 1), ("Stable trunk", 2)]),
        ("Walking Stance", [("Heels apart (>10cm)", 0), ("Heels almost touch", 1)])
    ])
    e.set_risk_stratification([
        ("Low Fall Risk", "24 - 28 points", "Independent ambulator. Routine environmental safety precautions.", "green"),
        ("Moderate Fall Risk", "19 - 23 points", "Fall risk present. Recommend walking aid evaluation, physical therapy balance training.", "yellow"),
        ("High Fall Risk", "< 19 points", "5x higher risk of falling. Assisted ambulation only, bedside fall prevention protocol.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_tinetti.pdf"))

if __name__ == "__main__":
    run()
