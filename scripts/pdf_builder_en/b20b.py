# -*- coding: utf-8 -*-
"""b20b.py: Scales 42 and 43 (nips, nihss)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 42 and 43...")
    # 42. NIPS
    e = FormPDFEngineEN("NEONATAL INFANT PAIN SCALE (NIPS)", "Behavioral Pain Assessment in Premature and Full-Term Neonates", "7 points (0 to 7)", "Lawrence J, et al. Neonatal Netw, 1993;12(6):59-66.")
    e.add_table_section("SIX BEHAVIORAL AND PHYSIOLOGICAL CRITERIA", [
        (("1. Facial Expression", "Muscle relaxation vs grimace"), [("Relaxed: Restful face, neutral expression", 0), ("Grimace: Tight facial muscles, furrowed brow, chin quiver", 1)]),
        (("2. Cry", "Audible vocal quality"), [("No cry: Quiet, not crying", 0), ("Whimper: Mild moaning, intermittent cry", 1), ("Vigorous cry: Loud scream, continuous, high-pitched", 2)]),
        (("3. Breathing Patterns", "Respiratory effort"), [("Relaxed: Usual baseline respiratory pattern", 0), ("Change in breathing: Irregular, faster, gagging, breath-holding", 1)]),
        (("4. Arms Movement", "Upper limb tension"), [("Relaxed / Restrained: No muscular rigidity, spontaneous movement", 0), ("Flexed / Extended: Tense, straight arms, rigid extension or flexion", 1)]),
        (("5. Legs Movement", "Lower limb tension"), [("Relaxed / Restrained: No muscular rigidity, relaxed limbs", 0), ("Flexed / Extended: Tense, kicking, rigid leg extension or flexion", 1)]),
        (("6. State of Arousal", "Sleep-wake alertness"), [("Sleeping / Awake: Quiet, peaceful, alert and settled", 0), ("Fussy: Alert, restless, thrashing, crying intermittently", 1)])
    ])
    e.set_risk_stratification([
        ("Comfortable / No Pain", "0 - 2 points", "Infant comfortable. Maintain supportive developmental care (nesting, swaddling).", "green"),
        ("Mild to Moderate Pain", "3 - 4 points", "Non-pharmacological comfort (sucrose, non-nutritive sucking, kangaroo care).", "yellow"),
        ("Severe Pain", "≥ 5 points", "Prompt analgesic intervention required (pharmacological therapy) and reassessment in 15-30m.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_nips.pdf"))

    # 43. NIHSS
    e = FormPDFEngineEN("NATIONAL INSTITUTES OF HEALTH STROKE SCALE (NIHSS)", "Quantitative Measure of Stroke-Related Neurological Deficit", "42 points (0 to 42)", "Brott T, et al. Stroke, 1989;20(7):864-870.")
    e.layout_mode = "double_col"
    e.extra_css = ".table-eval-col2 td { padding: 5.5px 6px !important; font-size: 7.2pt !important; } .sec-title { margin: 5px 0 2px !important; }"
    e.add_table_section("1. CONSCIOUSNESS & GAZE", [
        ("1a. LOC Responsiveness", [("Alert (0)", 0), ("Drowsy (1)", 1), ("Stuporous (2)", 2), ("Comatose (3)", 3)]),
        ("1b. LOC Questions (Month/Age)", [("Both correct (0)", 0), ("One correct (1)", 1), ("Neither (2)", 2)]),
        ("1c. LOC Commands (Eyes/Fist)", [("Both correct (0)", 0), ("One correct (1)", 1), ("Neither (2)", 2)]),
        ("2. Best Gaze", [("Normal (0)", 0), ("Partial gaze palsy (1)", 1), ("Forced deviation (2)", 2)]),
        ("3. Visual Fields", [("No loss (0)", 0), ("Partial hemianopia (1)", 1), ("Complete (2)", 2), ("Bilateral (3)", 3)]),
        ("4. Facial Palsy", [("Normal (0)", 0), ("Minor palsy (1)", 1), ("Partial palsy (2)", 2), ("Complete (3)", 3)])
    ])
    e.add_table_section("2. MOTOR, SENSORY & LANGUAGE", [
        ("5. Motor Arm (Left & Right)", [("No drift (0)", 0), ("Drift (1)", 1), ("Some effort (2)", 2), ("No movement (4)", 4)]),
        ("6. Motor Leg (Left & Right)", [("No drift (0)", 0), ("Drift (1)", 1), ("Some effort (2)", 2), ("No movement (4)", 4)]),
        ("7. Limb Ataxia", [("Absent (0)", 0), ("In 1 limb (1)", 1), ("In 2 limbs (2)", 2)]),
        ("8. Sensory Loss", [("Normal (0)", 0), ("Mild-moderate (1)", 1), ("Severe loss (2)", 2)]),
        ("9. Best Language (Aphasia)", [("No aphasia (0)", 0), ("Mild-mod (1)", 1), ("Severe (2)", 2), ("Mute (3)", 3)]),
        ("10. Dysarthria", [("Normal (0)", 0), ("Mild-mod (1)", 1), ("Severe / mute (2)", 2)]),
        ("11. Inattention (Neglect)", [("No neglect (0)", 0), ("Partial (1)", 1), ("Profound (2)", 2)])
    ])
    e.add_raw_html_section('''
    <div class="visual-box" style="margin-top:5px; font-size:7.1pt; line-height:1.28; text-align:left;">
        <b>NIHSS Examination Rules:</b> Administer scale items in exact order. Record performance as observed; do not coach or prompt patient.
        Scores ≥ 5 warrant urgent consideration for acute ischemic revascularization (IV thrombolysis / mechanical thrombectomy).
    </div>
    ''')
    e.set_risk_stratification([
        ("Minor Stroke", "1 - 4 points", "Low functional deficit. Rapid secondary prevention and neuro monitoring.", "green"),
        ("Moderate Stroke", "5 - 15 points", "Candidate for IV thrombolysis / endovascular thrombectomy if in window.", "yellow"),
        ("Moderate to Severe", "16 - 20 points", "Substantial neurological deficit, high risk of hemorrhagic transformation.", "orange"),
        ("Severe Stroke", "21 - 42 points", "Severe stroke, high mortality risk. Neuro-ICU care, consider hemicraniectomy.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_nihss.pdf"))

if __name__ == "__main__":
    run()
