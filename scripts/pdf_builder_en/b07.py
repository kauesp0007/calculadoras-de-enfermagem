# -*- coding: utf-8 -*-
"""b07.py: Scales 13 and 14 (cincinnati, classificacao_wifi)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 13 and 14...")
    # 13. Cincinnati
    e = FormPDFEngineEN("CINCINNATI PREHOSPITAL STROKE SCALE (CPSS)", "Rapid Stroke Screening Tool for Emergency and Bedside Assessment", "3 criteria (Positive if ≥ 1 abnormal)", "Kothari RU, et al. Acad Emerg Med, 1999;6(10):987-990.")
    e.extra_css = ".table-eval td { padding: 9px 10px !important; } .opt-item { margin-bottom: 5px !important; }"
    e.add_table_section("THREE PHYSICAL EXAM FINDINGS", [
        (("1. Facial Droop", "Ask patient to show teeth or smile"), [("Normal: Both sides of face move equally and symmetrically", 0), ("Abnormal: One side of face does not move as well / droops", 1)]),
        (("2. Arm Drift", "Close eyes, extend both arms forward, palms up, 10s"), [("Normal: Both arms move the same or do not drift down", 0), ("Abnormal: One arm does not move or drifts downward compared with the other", 1)]),
        (("3. Abnormal Speech", "Ask patient to say 'You can't teach an old dog new tricks'"), [("Normal: Patient uses correct words with no slurring", 0), ("Abnormal: Patient slurs words, uses wrong words, or is unable to speak", 1)])
    ])
    e.add_raw_html_section('''
    <div class="visual-box" style="margin-top:6px; font-size:7.4pt; line-height:1.32; text-align:left;">
        <b>Prehospital Acute Stroke Protocol & Time Targets:</b>
        Record exact time of Last Known Well (LKW): ____:____ | Check bedside blood glucose (rule out hypoglycemia) | 
        Pre-notify receiving Emergency Dept ("Code Stroke Inbound") | Target Door-to-CT time: < 20 min | Target Door-to-Needle time: < 45 min.
    </div>
    <div class="visual-box" style="margin-top:6px; font-size:7.2pt; line-height:1.30; text-align:left;">
        <b>Acute Revascularization Screening Checklist:</b><br>
        • Time of symptom onset &lt; 4.5 hours? [ &nbsp; ] Yes &nbsp;&nbsp; [ &nbsp; ] No &nbsp;&nbsp;&nbsp;&nbsp;
        • Non-contrast Head CT: No intracranial hemorrhage? [ &nbsp; ] Yes &nbsp;&nbsp; [ &nbsp; ] No<br>
        • Blood pressure &lt; 185/110 mmHg? [ &nbsp; ] Yes &nbsp;&nbsp; [ &nbsp; ] No &nbsp;&nbsp;&nbsp;&nbsp;
        • No active internal bleeding or major surgery within past 21 days? [ &nbsp; ] Yes &nbsp;&nbsp; [ &nbsp; ] No
    </div>
    ''')
    e.set_risk_stratification([
        ("Stroke Unlikely (0 Abnormal)", "0 criteria", "Reevaluate for alternative neurological, metabolic, or toxic etiologies (e.g. hypoglycemia).", "green"),
        ("Acute Stroke Suspected (≥1 Abnormal)", "1 to 3 criteria", "72% (1 criterion) to >85% (3 criteria) stroke probability. Immediate Stroke Code, urgent non-contrast head CT.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_cincinnati.pdf"))

    # 14. WIfI
    e = FormPDFEngineEN("SVS WIfI CLASSIFICATION SYSTEM", "Threatened Lower Limb Risk Assessment (Wound, Ischemia, foot Infection)", "W (0-3), I (0-3), fI (0-3)", "Mills JL, et al. J Vasc Surg, 2014;59(1):220-234.")
    e.add_table_section("WIfI THREE CLINICAL DOMAINS", [
        (("W - Wound Depth & Extent", "Clinical ulceration and gangrene"), [("0: No ulcer (ischemic rest pain only), no gangrene", 0), ("1: Small shallow ulcer on distal leg or foot; no gangrene", 1), ("2: Deep ulcer with exposed tendon, joint, or bone; gangrene limited to digits", 2), ("3: Extensive deep ulcer involving heel/hindfoot; extensive gangrene", 3)]),
        (("I - Ischemia (Hemodynamics)", "Ankle-Brachial Index (ABI) or Toe Pressure (TP)"), [("0: ABI ≥ 0.80 / Ankle Press > 100 mmHg / Toe Press ≥ 60 mmHg", 0), ("1: ABI 0.60 - 0.79 / AP 70-100 mmHg / TP 40-59 mmHg", 1), ("2: ABI 0.40 - 0.59 / AP 50-70 mmHg / TP 30-39 mmHg", 2), ("3: ABI < 0.40 / AP < 50 mmHg / TP < 30 mmHg", 3)]),
        (("fI - foot Infection Severity", "Infection signs, erythema, systemic toxicity"), [("0: Uninfected: No purulence or manifestations of inflammation", 0), ("1: Mild: ≥2 local signs; erythema ≤ 2 cm around ulcer; superficial", 1), ("2: Moderate: Erythema > 2 cm; deeper tissues involved; no SIRS", 2), ("3: Severe: Systemic inflammatory response syndrome (SIRS) present", 3)])
    ])
    e.set_risk_stratification([
        ("Stage 1 - Very Low Amputation Risk", "W0-1, I0, fI0", "Wound care, glycemic control, pressure offloading. Revascularization not indicated.", "green"),
        ("Stage 2 - Low Amputation Risk", "W1-2, I0-1, fI0-1", "Local debridement, antibiotic therapy, consider non-invasive vascular studies.", "yellow"),
        ("Stage 3 - Moderate Amputation Risk", "W2-3, I1-2, fI1-2", "Vascular surgery consult for revascularization, IV antibiotics, urgent debridement.", "orange"),
        ("Stage 4 - High Amputation Risk", "Severe I3 / fI3 / W3", "High risk of major limb loss. Urgent revascularization and radical surgical debridement.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_classificacao_wifi.pdf"))

if __name__ == "__main__":
    run()
