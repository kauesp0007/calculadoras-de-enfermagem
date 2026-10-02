# -*- coding: utf-8 -*-
"""b22.py: Scales 46 and 47 (painad, pelod)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 46 and 47...")
    # 46. PAINAD
    e = FormPDFEngineEN("PAIN ASSESSMENT IN ADVANCED DEMENTIA (PAINAD)", "Observational Pain Assessment for Non-Communicative Dementia Patients", "10 points (0 to 10)", "Warden V, et al. J Am Med Dir Assoc, 2003;4(1):9-15.")
    e.add_table_section("FIVE OBSERVATIONAL BEHAVIORAL INDICATORS", [
        (("1. Breathing (Vocalization independent)", "Ventilatory effort and noise"), [("Normal: Relaxed breathing", 0), ("Occasional labored breathing, short periods of hyperventilation", 1), ("Noisy labored breathing, long periods of hyperventilation, Cheyne-Stokes", 2)]),
        (("2. Negative Vocalization", "Verbal signs of distress"), [("None: Normal vocal tone or silence", 0), ("Occasional moan or groan; low volume complaint", 1), ("Repeated troubled calling out, loud moaning or groaning, crying", 2)]),
        (("3. Facial Expression", "Muscle tension and grimacing"), [("Smiling or inexpressive", 0), ("Sad, frightened, furrowed brow", 1), ("Facial grimacing, clenching teeth, tightly closed eyes", 2)]),
        (("4. Body Language", "Physical posture and agitation"), [("Relaxed, calm posture", 0), ("Tense, distressed pacing, fidgeting, guarded posture", 1), ("Rigid, fists clenched, knees pulled up, pulling or pushing away, striking out", 2)]),
        (("5. Consolability", "Response to reassuring touch/voice"), [("No need to console", 0), ("Distracted or reassured by voice or touch", 1), ("Unable to console, distract, or reassure", 2)])
    ])
    e.set_risk_stratification([
        ("No / Mild Pain", "0 - 3 points", "Comfortable state. Provide non-pharmacological comfort (soothing voice, gentle touch, repositioning).", "green"),
        ("Moderate Pain", "4 - 6 points", "Pain present. Administer prescribed regular or breakthrough analgesic, reassess within 45 min.", "yellow"),
        ("Severe Pain", "7 - 10 points", "Severe pain crisis. Urgent analgesic titration (opioid regimen if prescribed), physician notification.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_painad.pdf"))

    # 47. PELOD-2
    e = FormPDFEngineEN("PELOD-2 SCORE", "Pediatric Logistic Organ Dysfunction-2 in Pediatric ICU", "33 points", "Leteurtre S, et al. Crit Care Med, 2013;41(4):1039-1053.")
    e.layout_mode = "single"
    e.extra_css = ".table-eval td { padding: 4.5px 7px !important; font-size: 7.4pt !important; } .opt-item { margin-bottom: 2px !important; } .sec-title { margin: 5px 0 2px !important; }"
    e.add_table_section("TEN PEDIATRIC ORGAN DYSFUNCTION CRITERIA", [
        (("1. Glasgow Coma Scale", "Neurological consciousness"), [("11 - 15 (0)", 0), ("5 - 10 (1)", 1), ("3 - 4 (4)", 4)]),
        (("2. Pupillary Reaction", "Brainstem pupillary reflexes"), [("Both pupils reactive to light (0)", 0), ("One pupil non-reactive (2)", 2), ("Both pupils fixed / non-reactive (5)", 5)]),
        (("3. Serum Lactate", "Tissue hypoperfusion indicator"), [("< 5.0 mmol/L (0)", 0), ("5.0 - 10.9 mmol/L (1)", 1), ("≥ 11.0 mmol/L (4)", 4)]),
        (("4. Mean Arterial Pressure", "Cardiovascular perfusion"), [("Normal MAP for age (0)", 0), ("Low MAP for age (2)", 2), ("Severely low MAP for age (4)", 4)]),
        (("5. Serum Creatinine", "Renal function for age"), [("Normal creatinine for age (0)", 0), ("Elevated creatinine for age (2)", 2)]),
        (("6. PaO2 / FiO2 Ratio", "Pulmonary gas exchange"), [("≥ 400 mmHg or non-ventilated (0)", 0), ("200 - 399 mmHg (2)", 2), ("< 200 mmHg (4)", 4)]),
        (("7. PaCO2", "Ventilatory adequacy"), [("≤ 58 mmHg (0)", 0), ("> 58 mmHg (1)", 1)]),
        (("8. Invasive Mechanical Ventilation", "Airway and ventilatory support"), [("No invasive ventilation (0)", 0), ("Invasive mechanical ventilation present (3)", 3)]),
        (("9. White Blood Cells", "Immunologic / hematologic response"), [("≥ 2.0 x10⁹/L (0)", 0), ("< 2.0 x10⁹/L (2)", 2)]),
        (("10. Platelet Count", "Coagulation competence"), [("≥ 77 x10⁹/L (0)", 0), ("35 - 76 x10⁹/L (1)", 1), ("< 35 x10⁹/L (2)", 2)])
    ])
    e.set_risk_stratification([
        ("Low Organ Dysfunction", "0 - 4 points", "Predicted PICU mortality < 2%. Routine intensive care monitoring.", "green"),
        ("Moderate Dysfunction", "5 - 9 points", "Predicted mortality 5 - 15%. Multiple organ support titration.", "yellow"),
        ("Severe Dysfunction", "≥ 10 points", "Predicted mortality > 30%. High risk of refractory pediatric multiple organ failure.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_pelod.pdf"))

if __name__ == "__main__":
    run()
