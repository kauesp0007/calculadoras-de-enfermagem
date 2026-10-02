# -*- coding: utf-8 -*-
"""b11.py: Scales 21 to 23 (elpo, flacc, fast)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 21 to 23...")
    # 21. ELPO
    e = FormPDFEngineEN("ELPO SCALE", "Risk Assessment of Perioperative Surgical Positioning Injury", "35 points (7 to 35)", "Menezes S, et al. Rev Lat Am Enfermagem, 2013;21(6):1298-1305.")
    e.add_table_section("SEVEN PERIOPERATIVE RISK FACTORS", [
        (("1. Surgical Position", "Main surgical posture"), [("Supine", 1), ("Prone", 2), ("Lateral", 3), ("Lithotomy / Trendelenburg", 4)]),
        (("2. Surgical Duration", "Total operating room time"), [("≤ 1 hour", 1), ("1 - 2 hours", 2), ("2 - 4 hours", 3), ("4 - 6 hours", 4), ("> 6 hours", 5)]),
        (("3. Anesthesia Type", "Anesthetic technique used"), [("Local / MAC", 1), ("Regional (Spinal/Epidural)", 2), ("General anesthesia", 3), ("Combined general + regional", 4)]),
        (("4. Support Surface", "Mattress and padding"), [("Viscoelastic / Gel pad", 1), ("Foam mattress", 2), ("Standard OR table pad only", 3)]),
        (("5. Limb Positioning", "Angle of extremities"), [("Anatomical (≤90°)", 1), ("Arms extended >90°", 2), ("Limbs flexed / elevated", 3)]),
        (("6. Comorbidities", "Underlying medical conditions"), [("None", 1), ("Vascular disease / Diabetes", 2), ("Malnutrition / Obesity", 3), ("Multiple comorbidities", 4)]),
        (("7. Patient Age", "Age risk category"), [("18 - 39 years", 1), ("40 - 59 years", 2), ("60 - 79 years", 3), ("≥ 80 years / Pediatric", 4)])
    ])
    e.set_risk_stratification([
        ("Low Risk of Injury", "≤ 19 points", "Standard perioperative care, padded armboards, neutral alignment.", "green"),
        ("High Risk of Injury", "≥ 20 points", "Pressure-redistributing gel pads, nerve protectors, frequent posture checks.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_elpo.pdf"))

    # 22. FLACC
    e = FormPDFEngineEN("FLACC BEHAVIORAL PAIN SCALE", "Pain Assessment for Infants, Young Children, and Non-Verbal Patients", "10 points (0 to 10)", "Merkel SI, et al. Pediatr Nurs, 1997;23(3):293-297.")
    e.add_table_section("FIVE BEHAVIORAL CATEGORIES", [
        (("F - Face", "Facial expression and grimace"), [("No particular expression or smile", 0), ("Occasional grimace or frown, withdrawn, uninterested", 1), ("Frequent to constant quivering chin, clenched jaw", 2)]),
        (("L - Legs", "Muscular tension in lower limbs"), [("Normal position or relaxed", 0), ("Uneasy, restless, tense", 1), ("Kicking, or legs drawn up", 2)]),
        (("A - Activity", "Body movement and positioning"), [("Lying quietly, normal position, moves easily", 0), ("Squirming, shifting back and forth, tense", 1), ("Arched, rigid or jerking", 2)]),
        (("C - Cry", "Vocal complaints and weeping"), [("No cry (awake or asleep)", 0), ("Moans or whimpers; occasional complaint", 1), ("Crying steadily, screams or sobs, frequent complaints", 2)]),
        (("C - Consolability", "Response to comforting measures"), [("Content, relaxed", 0), ("Reassured by occasional touching, hugging, talking to", 1), ("Difficult to console or comfort", 2)])
    ])
    e.set_risk_stratification([
        ("Relaxed and Comfortable", "0 points", "No evidence of pain. Maintain routine pediatric comfort measures.", "green"),
        ("Mild Discomfort", "1 - 3 points", "Non-pharmacological soothing (distraction, swaddling, parent presence).", "yellow"),
        ("Moderate Pain", "4 - 6 points", "Mild analgesia (paracetamol / ibuprofen) plus comforting interventions.", "orange"),
        ("Severe Discomfort / Pain", "7 - 10 points", "Prompt analgesic intervention (IV opioid / physician notification). Reassess in 15-30m.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_flacc.pdf"))

    # 23. FAST
    e = FormPDFEngineEN("FAST STROKE ASSESSMENT TOOL", "Face Arm Speech Time Protocol for Suspected Acute Stroke", "Stroke Positive / Negative", "Harbison J, et al. Stroke, 2003;34(1):71-76.")
    e.extra_css = ".table-eval td { padding: 8.5px 10px !important; } .opt-item { margin-bottom: 4px !important; }"
    e.add_table_section("FAST ASSESSMENT DOMAINS", [
        (("F - Facial Droop", "Ask patient to smile or show teeth"), [("Normal: Symmetrical smile and facial movement", 0), ("Abnormal: One side of face droops or is numb", 1)]),
        (("A - Arm Weakness", "Raise both arms forward, palms up, 10s"), [("Normal: Both arms stay up equally for 10 seconds", 0), ("Abnormal: One arm drifts downward or is paralyzed", 1)]),
        (("S - Speech Difficulty", "Ask patient to repeat simple sentence"), [("Normal: Repeats simple sentence correctly without slurring", 0), ("Abnormal: Slurred speech, wrong words, or unable to speak", 1)]),
        (("T - Time to Act", "Time of onset / last known well"), [("Time of symptom onset recorded: ____:____ (Emergency EMS / Stroke Alert)", 0)])
    ])
    e.add_raw_html_section('''
    <div class="visual-box" style="margin-top:6px; font-size:7.4pt; line-height:1.32; text-align:left;">
        <b>Emergency Acute Stroke Management Protocol:</b><br>
        • Exact Time of Last Known Well (LKW): ____:____ (Crucial for thrombolytic window &lt; 4.5 hours and thrombectomy &lt; 24 hours).<br>
        • Immediate Bedside Fingerstick Glucose: Rule out hypoglycemia (if &lt; 60 mg/dL, treat immediately with 50% dextrose).<br>
        • Stat Neurovascular Imaging: Urgent non-contrast head CT + CTA head/neck to exclude hemorrhage and identify LVO.
    </div>
    ''')
    e.set_risk_stratification([
        ("Stroke Unlikely", "0 Symptoms", "Alternative diagnostic evaluation (hypoglycemia check, Bell palsy, migraine).", "green"),
        ("Acute Stroke Alert!", "≥ 1 Symptom Present", "Time is Brain! Immediate Code Stroke, neuroimaging (CT/MRI), IV thrombolysis / thrombectomy pathway.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_fast.pdf"))

if __name__ == "__main__":
    run()
