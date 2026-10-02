# -*- coding: utf-8 -*-
"""b05.py: Scales 9 and 10 (braden, bps)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 9 and 10...")
    # 9. Braden
    e = FormPDFEngineEN("BRADEN SCALE FOR PRESSURE INJURY RISK", "Predictive Risk Assessment of Pressure Ulcers/Injuries in Adults", "23 points", "Bergstrom N, Braden BJ, et al. Nurs Res, 1987;36(4):205-210.")
    e.add_table_section("BRADEN RISK SUBSCALES", [
        (("1. Sensory Perception", "Ability to respond meaningfully to pressure discomfort"), [("Completely limited: Unresponsive to painful stimuli", 1), ("Very limited: Responds only to painful stimuli", 2), ("Slightly limited: Responds to verbal commands, has sensory deficit", 3), ("No impairment: Responds fully to verbal commands, intact sensation", 4)]),
        (("2. Moisture", "Degree to which skin is exposed to moisture"), [("Constantly moist: Skin kept moist constantly by perspiration/urine", 1), ("Very moist: Linen must be changed at least once a shift", 2), ("Occasionally moist: Extra linen change required roughly once a day", 3), ("Rarely moist: Skin usually dry, routine diaper/linen changes only", 4)]),
        (("3. Activity", "Degree of physical activity"), [("Bedfast: Confined to bed continuously", 1), ("Chairfast: Ability to walk severely limited or non-existent, chairbound", 2), ("Walks occasionally: Walks short distances during day with or without help", 3), ("Walks frequently: Walks outside room at least twice a day", 4)]),
        (("4. Mobility", "Ability to change and control body position"), [("Completely immobile: Does not make even slight changes in body position", 1), ("Very limited: Makes occasional slight changes in body position", 2), ("Slightly limited: Makes frequent slight changes independently", 3), ("No limitation: Makes major and frequent changes in position without help", 4)]),
        (("5. Nutrition", "Usual food intake pattern"), [("Very poor: Never eats a complete meal, drinks little fluid, NPO >5 days", 1), ("Probably inadequate: Rarely eats a complete meal, receives less than optimum", 2), ("Adequate: Eats over half of most meals, takes supplements if needed", 3), ("Excellent: Eats most of every meal, never refuses food, eats between meals", 4)]),
        (("6. Friction & Shear", "Friction with linens and slide in bed/chair"), [("Problem: Requires moderate to maximum assist in moving, sliding in bed", 1), ("Potential problem: Moves feebly, requires minimal assist during move", 2), ("No apparent problem: Moves in bed and in chair independently, good strength", 3)])
    ])
    e.set_risk_stratification([
        ("Very High / High Risk", "≤ 12 points", "Dynamic pressure-reducing mattress, q2h repositioning, barrier cream, dietitian consult.", "red"),
        ("Moderate Risk", "13 - 14 points", "Static foam overlay, q2h turning schedule, heel elevation, moisture management.", "orange"),
        ("Mild / Low Risk", "15 - 18 points", "Regular turning protocol, skin moisturization, encourage mobilization.", "yellow"),
        ("No Risk", "19 - 23 points", "Routine nursing care, environmental surveillance, reevaluate weekly.", "green")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_braden.pdf"))

    # 10. BPS
    e = FormPDFEngineEN("BEHAVIORAL PAIN SCALE (BPS)", "Pain Assessment in Intubated, Sedated Critically Ill Adult Patients", "12 points (3 to 12)", "Payen JF, et al. Crit Care Med, 2001;29(12):2258-2263.")
    e.extra_css = ".table-eval td { padding: 8px 10px !important; } .opt-item { margin-bottom: 5px !important; }"
    e.add_table_section("BEHAVIORAL DOMAINS", [
        (("1. Facial Expression", "Muscle contraction and grimace"), [("Relaxed: Completely restful, neutral face", 1), ("Partially tightened: Brow furrowing, tension", 2), ("Fully tightened: Eye closure, deep grimacing", 3), ("Grimacing: Distorted face, clenched jaw, tears", 4)]),
        (("2. Upper Limbs Movement", "Posture and defensive movements"), [("No movement: Relaxed arms in neutral position", 1), ("Partially bent: Slight elbow or finger flexion", 2), ("Fully bent with finger flexion: Defense posture", 3), ("Permanently retracted: Rigid limb flexion and resistance", 4)]),
        (("3. Compliance with Ventilation", "Patient-ventilator synchrony"), [("Tolerating movement: No alarm, synchronized breathing", 1), ("Coughing but tolerating ventilation: Coughs, settles spontaneously", 2), ("Fighting ventilator: Dyssynchrony, alarms triggered frequently", 3), ("Unable to control ventilation: Patient fighting ventilator continuously", 4)])
    ])
    e.add_raw_html_section('''
    <div class="visual-box" style="margin-top:6px; font-size:7.4pt; line-height:1.30; text-align:left;">
        <b>ICU Analgesia & Sedation Titration Guideline:</b>
        Evaluate BPS prior to painful procedures (suctioning, wound dressing, turning) and 15-30 min post-intervention.
        Target score in critical care: BPS ≤ 5. If BPS ≥ 6, initiate multimodal analgesia / opioid titration before escalating sedatives.
    </div>
    ''')
    e.set_risk_stratification([
        ("No Pain / Acceptable", "3 - 5 points", "Adequate comfort and analgesia. Maintain current sedation/analgesic regimen.", "green"),
        ("Mild to Moderate Pain", "6 - 7 points", "Assess patient; provide non-pharmacological comfort or analgesia titration.", "yellow"),
        ("Severe Pain / Discomfort", "≥ 8 points", "Immediate analgesic intervention required (IV opioid bolus/titration). Reevaluate in 15-30m.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_bps.pdf"))

if __name__ == "__main__":
    run()
