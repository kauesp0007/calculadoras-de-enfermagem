# -*- coding: utf-8 -*-
"""b24.py: Scales 50 and 51 (prism, qsofa)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 50 and 51...")
    # 50. PRISM III
    e = FormPDFEngineEN("PRISM III SCORE", "Pediatric Risk of Mortality III in Pediatric Intensive Care", "74 points", "Pollack MM, et al. Crit Care Med, 1996;24(5):743-752.")
    e.layout_mode = "double_col"
    e.extra_css = ".table-eval-col2 td { padding: 5.5px 6.5px !important; font-size: 7.3pt !important; } .sec-title { margin: 6px 0 3px !important; }"
    e.add_table_section("1. CARDIOVASCULAR & NEUROLOGICAL", [
        ("Systolic Blood Pressure", [("Normal for age (0)", 0), ("Low for age (3)", 3), ("Severely low for age (7)", 7)]),
        ("Heart Rate (bpm)", [("Normal for age (0)", 0), ("Mildly abnormal (3)", 3), ("Severe tachycardia / brady (4)", 4)]),
        ("Pupil Reflexes", [("Both reactive (0)", 0), ("One fixed pupil (7)", 7), ("Both fixed pupils (11)", 11)]),
        ("Glasgow Coma Scale", [("GCS > 8 (0)", 0), ("GCS ≤ 8 (6)", 6)]),
        ("Temperature (°C)", [("36.0 - 38.4 °C (0)", 0), ("35.0-35.9 or 38.5-39.9 (2)", 2), ("<35.0 or ≥40.0 °C (5)", 5)])
    ])
    e.add_table_section("2. CHEMISTRY & ACID-BASE", [
        ("PaO2 / FiO2 Ratio", [("≥ 300 mmHg (0)", 0), ("200 - 299 (2)", 2), ("< 200 mmHg (3)", 3)]),
        ("PaCO2 (mmHg)", [("35 - 50 mmHg (0)", 0), ("51 - 65 (1)", 1), ("> 65 mmHg (3)", 3)]),
        ("Total CO2 (Bicarbonate)", [("16 - 32 mEq/L (0)", 0), ("< 16 mEq/L (3)", 3)]),
        ("Serum Potassium (mEq/L)", [("3.5 - 5.5 (0)", 0), ("< 3.0 or > 6.0 (3)", 3)]),
        ("Blood Glucose (mg/dL)", [("60 - 200 mg/dL (0)", 0), ("> 200 mg/dL (2)", 2)]),
        ("PT / PTT (Coagulation)", [("Normal (0)", 0), ("PT or PTT > 1.5x control (3)", 3)])
    ])
    e.add_raw_html_section('''
    <div class="visual-box" style="margin-top:5px; font-size:7.1pt; line-height:1.28; text-align:left;">
        <b>PRISM III Scoring Window:</b> Record the most abnormal value in the first 24 hours of PICU admission.
        Age-adjusted thresholds apply to blood pressure and heart rate. Neonates &lt; 24h old excluded.
    </div>
    ''')
    e.set_risk_stratification([
        ("Low Mortality Risk", "0 - 9 points", "Predicted PICU mortality < 3%. Standard intensive monitoring.", "green"),
        ("Moderate Mortality Risk", "10 - 19 points", "Predicted mortality 5 - 15%. Multiple organ support titration.", "yellow"),
        ("Severe Mortality Risk", "≥ 20 points", "Predicted mortality > 25%. High risk of refractory pediatric shock/organ failure.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_prism.pdf"))

    # 51. qSOFA
    e = FormPDFEngineEN("QUICK SOFA SCORE (qSOFA)", "Bedside Screening Tool for Sepsis in Adult Patients Outside the ICU", "3 points (High risk if ≥ 2)", "Singer M, et al. JAMA, 2016;315(8):801-810.")
    e.extra_css = ".table-eval td { padding: 9px 10px !important; } .opt-item { margin-bottom: 5px !important; }"
    e.add_table_section("THREE BEDSIDE CLINICAL CRITERIA", [
        (("1. Respiratory Rate (Tachypnea)", "Auscultate or observe breaths per minute"), [("Normal: Respiratory rate < 22 breaths/min", 0), ("Abnormal: Respiratory rate ≥ 22 breaths/min", 1)]),
        (("2. Altered Mentation (CNS)", "Mental status assessment based on Glasgow Coma Scale"), [("Normal: Glasgow Coma Scale = 15 (Fully awake, oriented in time/place)", 0), ("Abnormal: Glasgow Coma Scale < 15 (Any acute confusion, lethargy, drowsiness)", 1)]),
        (("3. Systolic Blood Pressure (Hypotension)", "Measured by standard cuff or invasive line"), [("Normal: Systolic BP > 100 mmHg", 0), ("Abnormal: Systolic BP ≤ 100 mmHg", 1)])
    ])
    e.add_raw_html_section('''
    <div class="visual-box" style="margin-top:6px; font-size:7.4pt; line-height:1.32; text-align:left;">
        <b>Surviving Sepsis Campaign Hour-1 Resuscitation Bundle:</b><br>
        1. Measure serum lactate immediately (remeasure within 2-4 hours if initial lactate &gt; 2 mmol/L).<br>
        2. Obtain blood cultures prior to starting antibiotics (do not delay antimicrobial therapy).<br>
        3. Administer broad-spectrum IV antimicrobials within 1 hour of recognition.<br>
        4. Rapidly infuse 30 mL/kg crystalloid fluid for hypotension (MAP &lt; 65 mmHg) or lactate ≥ 4 mmol/L.<br>
        5. Apply vasopressors (norepinephrine 1st-line) during or after fluid resuscitation to maintain MAP ≥ 65 mmHg.
    </div>
    ''')
    e.set_risk_stratification([
        ("Low Sepsis Risk", "0 - 1 point", "In-hospital mortality < 1%. Continue targeted treatment of underlying infection, monitor.", "green"),
        ("High Sepsis Risk / Critical", "≥ 2 points", "3x to 14x higher in-hospital mortality. Immediate sepsis bundle: blood cultures, broad-spectrum IV antibiotics, IV crystalloid resuscitation (30 mL/kg), serum lactate, ICU consult.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_qsofa.pdf"))

if __name__ == "__main__":
    run()
