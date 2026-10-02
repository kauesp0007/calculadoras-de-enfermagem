# -*- coding: utf-8 -*-
"""b09.py: Scales 17 and 18 (curb-65, gds)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 17 and 18...")
    # 17. CURB-65
    e = FormPDFEngineEN("CURB-65 PNEUMONIA SEVERITY SCORE", "Mortality Risk and Site-of-Care Assessment in Community-Acquired Pneumonia", "5 points", "Lim WS, et al. Thorax, 2003;58(5):377-382.")
    e.extra_css = ".table-eval td { padding: 8.5px 10px !important; } .opt-item { margin-bottom: 4px !important; }"
    e.add_table_section("CURB-65 FIVE CLINICAL CRITERIA", [
        (("C - Confusion", "Mental status alteration"), [("Abnormal: New onset mental confusion / Abbreviated Mental Test ≤ 8", 1), ("Normal: Intact mental status, oriented in time/place", 0)]),
        (("U - Urea (BUN)", "Renal impairment indicator"), [("Abnormal: Blood Urea Nitrogen > 19 mg/dL (Serum Urea > 7 mmol/L)", 1), ("Normal: BUN ≤ 19 mg/dL (Urea ≤ 7 mmol/L)", 0)]),
        (("R - Respiratory Rate", "Tachypnea assessment"), [("Abnormal: Respiratory rate ≥ 30 breaths/min", 1), ("Normal: Respiratory rate < 30 breaths/min", 0)]),
        (("B - Blood Pressure", "Hemodynamic instability"), [("Abnormal: Systolic BP < 90 mmHg or Diastolic BP ≤ 60 mmHg", 1), ("Normal: SBP ≥ 90 mmHg and DBP > 60 mmHg", 0)]),
        (("65 - Age ≥ 65 Years", "Advanced age risk factor"), [("Patient age 65 years or older", 1), ("Patient age under 65 years", 0)])
    ])
    e.add_raw_html_section('''
    <div class="visual-box" style="margin-top:6px; font-size:7.4pt; line-height:1.32; text-align:left;">
        <b>British Thoracic Society (BTS) Pneumonia Management Pathway:</b><br>
        • Diagnostic Workup: Sputum & blood cultures before antibiotics, urine antigen (Legionella/Pneumococcal), CXR.<br>
        • Target Oxygenation: Titrate O2 to maintain SpO2 94-98% (or 88-92% if at risk of hypercapnic respiratory failure).<br>
        • Time to Antibiotic: Administer 1st antibiotic dose within 4 hours (or within 1 hour if CURB-65 ≥ 3 / septic shock).
    </div>
    ''')
    e.set_risk_stratification([
        ("Low Risk (Group 1)", "0 - 1 point", "30-day mortality < 1.5%. Suitable for outpatient oral antibiotic management.", "green"),
        ("Moderate Risk (Group 2)", "2 points", "Mortality approx 9.2%. Inpatient hospital ward admission recommended.", "yellow"),
        ("Severe Risk (Group 3)", "3 - 5 points", "Mortality 15% to 40%. Urgent hospitalization; consider ICU admission for scores 4-5.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_curb-65.pdf"))

    # 18. GDS-15
    e = FormPDFEngineEN("GERIATRIC DEPRESSION SCALE (GDS-15)", "Screening Tool for Depression in Older Adults (Short Form)", "15 points", "Sheikh JI, Yesavage JA. Clin Gerontol, 1986;5(1-2):165-173.")
    e.layout_mode = "double_col"
    e.extra_css = ".table-eval-col2 td { padding: 6.5px 7px !important; font-size: 7.5pt !important; } .sec-title { margin: 6px 0 3px !important; }"
    e.add_table_section("QUESTIONS 1 TO 8", [
        ("1. Basically satisfied with life?", [("Yes", 0), ("No", 1)]),
        ("2. Dropped many activities/interests?", [("No", 0), ("Yes", 1)]),
        ("3. Feel that your life is empty?", [("No", 0), ("Yes", 1)]),
        ("4. Often get bored?", [("No", 0), ("Yes", 1)]),
        ("5. In good spirits most of the time?", [("Yes", 0), ("No", 1)]),
        ("6. Afraid something bad will happen?", [("No", 0), ("Yes", 1)]),
        ("7. Feel happy most of the time?", [("Yes", 0), ("No", 1)]),
        ("8. Often feel helpless?", [("No", 0), ("Yes", 1)])
    ])
    e.add_table_section("QUESTIONS 9 TO 15", [
        ("9. Prefer to stay home rather than go out?", [("No", 0), ("Yes", 1)]),
        ("10. More problems with memory than most?", [("No", 0), ("Yes", 1)]),
        ("11. Wonderful to be alive now?", [("Yes", 0), ("No", 1)]),
        ("12. Feel pretty worthless the way you are?", [("No", 0), ("Yes", 1)]),
        ("13. Feel full of energy?", [("Yes", 0), ("No", 1)]),
        ("14. Feel your situation is hopeless?", [("No", 0), ("Yes", 1)]),
        ("15. Think most people are better off than you?", [("No", 0), ("Yes", 1)])
    ])
    e.add_raw_html_section('''
    <div class="visual-box" style="margin-top:6px; font-size:7.2pt; line-height:1.28; text-align:left;">
        <b>Administration Guide:</b> Ask patient how they felt over the past week. Questions are answered Yes or No.
        Bolded/underlined answers indicate depressive symptomatology (1 point each). Scores ≥ 5 warrant comprehensive clinical evaluation.
    </div>
    ''')
    e.set_risk_stratification([
        ("Normal / No Depression", "0 - 4 points", "Depressive symptoms unlikely. Routine healthy aging surveillance.", "green"),
        ("Suggestive of Mild Depression", "5 - 9 points", "Evaluation by primary care physician, explore social engagement.", "yellow"),
        ("Suggestive of Severe Depression", "10 - 15 points", "High likelihood of major depression. Comprehensive geriatric psychiatry evaluation.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_gds.pdf"))

if __name__ == "__main__":
    run()
