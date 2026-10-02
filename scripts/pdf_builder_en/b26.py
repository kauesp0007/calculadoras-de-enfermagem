# -*- coding: utf-8 -*-
"""b26.py: Scales 54 and 55 (richmond, saps)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 54 and 55...")
    # 54. RASS (Single column, 10 levels)
    e = FormPDFEngineEN("RICHMOND AGITATION-SEDATION SCALE (RASS)", "Targeted Titration of Sedation and Agitation in Critical Care", "10 levels (-5 to +4)", "Sessler CN, et al. Am J Respir Crit Care Med, 2002;166(10):1338-1344.")
    e.layout_mode = "single"
    e.extra_css = ".table-eval td { padding: 4px 7px !important; font-size: 7.4pt !important; } .opt-item { margin-bottom: 1.5px !important; font-size: 7.3pt !important; }"
    e.add_table_section("TEN SEDATION-AGITATION LEVELS", [
        (("+4: Combative", "Violent behavior"), [("Overtly combative or violent; immediate danger to staff safety.", 4)]),
        (("+3: Very Agitated", "Aggressive behavior"), [("Pulls on or removes endotracheal tubes or intravenous catheters; aggressive.", 3)]),
        (("+2: Agitated", "Non-purposeful movement"), [("Frequent non-purposeful movement or patient-ventilator dyssynchrony.", 2)]),
        (("+1: Restless", "Apprehensive / anxious"), [("Anxious or apprehensive but movements not aggressive or vigorous.", 1)]),
        (("0: Alert and Calm", "Target baseline state"), [("Spontaneously alert, calm, attends to examiner.", 0)]),
        (("-1: Drowsy", "Slight sedation"), [("Not fully alert, but has sustained awakening (eye-opening/contact to voice ≥ 10s).", -1)]),
        (("-2: Light Sedation", "Brief eye contact"), [("Briefly awakens with eye contact to voice (< 10 seconds).", -2)]),
        (("-3: Moderate Sedation", "Movement to voice"), [("Any movement (eye opening or limb motion) to voice, but no eye contact.", -3)]),
        (("-4: Deep Sedation", "Physical stimulation only"), [("No response to voice, but any movement to physical stimulation (shoulder shake).", -4)]),
        (("-5: Unarousable", "No response to pain"), [("No response to voice or physical stimulation (sternal rub / nailbed pressure).", -5)])
    ])
    e.set_risk_stratification([
        ("Agitated State (+1 to +4)", "+1 to +4", "Assess pain (BPS/CPOT), assess delirium (CAM-ICU), treat cause.", "yellow"),
        ("Target Sedation (0 to -1)", "0 to -1", "Ideal target for most awake, spontaneously ventilating ICU patients.", "green"),
        ("Moderate Sedation (-2 to -3)", "-2 to -3", "Target for acute mechanical ventilator dyssynchrony or prone position.", "green"),
        ("Deep Sedation (-4 to -5)", "-4 to -5", "Perform daily spontaneous awakening trial (SAT) unless contraindicated.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_richmond.pdf"))

    # 55. SAPS 3
    e = FormPDFEngineEN("SAPS 3 SCORE", "Simplified Acute Physiology Score III in Intensive Care", "100+ points", "Moreno RP, et al. Intensive Care Med, 2005;31(10):1336-1344.")
    e.layout_mode = "double_col"
    e.extra_css = ".table-eval-col2 td { padding: 5.5px 6.5px !important; font-size: 7.2pt !important; } .sec-title { margin: 5px 0 2px !important; }"
    e.add_table_section("1. PATIENT STATUS PRIOR TO ICU", [
        ("Age Score", [("<40 yrs (0)", 0), ("40-59 (5)", 5), ("60-69 (9)", 9), ("70-74 (13)", 13), ("75-79 (16)", 16), ("≥80 (18)", 18)]),
        ("Comorbidities", [("None (0)", 0), ("Cancer/Immunosuppressed (6)", 6), ("Heart Failure NYHA IV (8)", 8), ("Cirrhosis / Leukemia (10)", 10)]),
        ("Pre-ICU Location", [("Emergency Room (0)", 0), ("Other hospital (5)", 5), ("Ward (7)", 7), ("Other ICU (8)", 8)]),
        ("Admission Reason", [("Scheduled surgery (0)", 0), ("Unscheduled surgery (5)", 5), ("Medical admission (6)", 6)])
    ])
    e.add_table_section("2. PHYSIOLOGY AT ICU ADMISSION", [
        ("Glasgow Coma Scale", [("GCS 13-15 (0)", 0), ("GCS 7-12 (7)", 7), ("GCS 3-6 (15)", 15)]),
        ("Heart Rate (bpm)", [("<120 (0)", 0), ("120-159 (5)", 5), ("≥160 (7)", 7), ("Cardiac arrest (13)", 13)]),
        ("Systolic Blood Pressure", [("≥120 mmHg (0)", 0), ("70-119 (6)", 6), ("<70 mmHg (11)", 11)]),
        ("Body Temperature", [("≥35.0 °C (0)", 0), ("<35.0 °C (7)", 7)]),
        ("Oxygenation (PaO2/FiO2)", [("≥250 (0)", 0), ("100-249 (7)", 7), ("<100 mmHg (11)", 11)]),
        ("Serum Creatinine", [("<1.2 mg/dL (0)", 0), ("1.2-1.9 (6)", 6), ("≥2.0 mg/dL (8)", 8)]),
        ("Bilirubin (mg/dL)", [("<2.0 (0)", 0), ("2.0-5.9 (4)", 4), ("≥6.0 mg/dL (6)", 6)]),
        ("Platelet Count", [("≥100k (0)", 0), ("50-99k (5)", 5), ("<50k (8)", 8)])
    ])
    e.add_raw_html_section('''
    <div class="visual-box" style="margin-top:5px; font-size:7.1pt; line-height:1.28; text-align:left;">
        <b>SAPS 3 Data Collection Window:</b> Record physiological data within ± 1 hour of ICU admission.
        Points from all 3 boxes are summed to calculate predicted hospital mortality via customized logistic equations.
    </div>
    ''')
    e.set_risk_stratification([
        ("Low Predicted Mortality", "< 45 points", "Hospital mortality risk < 15%. Routine intensive care monitoring.", "green"),
        ("Moderate Mortality Risk", "45 - 60 points", "Hospital mortality 25 - 50%. Advanced organ support and hemodynamic titration.", "yellow"),
        ("High Mortality Risk", "> 60 points", "Hospital mortality > 60%. Severe multiorgan failure, critical care escalation.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_saps.pdf"))

if __name__ == "__main__":
    run()

