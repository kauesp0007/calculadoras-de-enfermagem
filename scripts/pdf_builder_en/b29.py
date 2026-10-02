# -*- coding: utf-8 -*-
"""b29.py: Scales 60 and 61 (zarit, waterlow)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 60 and 61...")
    # 60. Zarit
    e = FormPDFEngineEN("ZARIT BURDEN INTERVIEW (ZBI-12)", "Assessment of Caregiver Burden and Psychological Strain in Dementia Care", "48 points (0 to 48)", "Bedard M, et al. Gerontologist, 2001;41(5):652-657.")
    e.layout_mode = "double_col"
    e.extra_css = """
    .cols-2 { gap: 5mm !important; }
    .card-param { border: 1px solid #CBD5E1; border-radius: 4px; padding: 3px 5px; margin-bottom: 3.5px; font-size: 7pt; background: #fff; }
    .card-param-title { font-weight: 700; color: #1A3E74; margin-bottom: 1.5px; }
    .card-opt { display: flex; align-items: flex-start; gap: 4px; margin-bottom: 1px; line-height: 1.18; font-size: 6.8pt; }
    .card-opt:last-child { margin-bottom: 0; }
    """
    col1 = '<div class="sec-title">PART 1: QUESTIONS 1 TO 6</div>'
    items1 = [
        ("1. Patient asks for more help than needed?", [("Never (0)", 0), ("Rarely (1)", 1), ("Sometimes (2)", 2), ("Frequently (3)", 3), ("Nearly always (4)", 4)]),
        ("2. Don't have enough time for yourself?", [("Never (0)", 0), ("Rarely (1)", 1), ("Sometimes (2)", 2), ("Frequently (3)", 3), ("Nearly always (4)", 4)]),
        ("3. Stressed between caring and other duties?", [("Never (0)", 0), ("Rarely (1)", 1), ("Sometimes (2)", 2), ("Frequently (3)", 3), ("Nearly always (4)", 4)]),
        ("4. Embarrassed over patient's behavior?", [("Never (0)", 0), ("Rarely (1)", 1), ("Sometimes (2)", 2), ("Frequently (3)", 3), ("Nearly always (4)", 4)]),
        ("5. Angry when around patient?", [("Never (0)", 0), ("Rarely (1)", 1), ("Sometimes (2)", 2), ("Frequently (3)", 3), ("Nearly always (4)", 4)]),
        ("6. Patient affects relationships with others?", [("Never (0)", 0), ("Rarely (1)", 1), ("Sometimes (2)", 2), ("Frequently (3)", 3), ("Nearly always (4)", 4)])
    ]
    for p_title, opts in items1:
        col1 += f'<div class="card-param"><div class="card-param-title">{p_title}</div>'
        for opt, pts in opts:
            col1 += f'<div class="card-opt"><span class="sq"></span> {opt} <b>({pts})</b></div>'
        col1 += '</div>'

    col2 = '<div class="sec-title">PART 2: QUESTIONS 7 TO 12</div>'
    items2 = [
        ("7. Afraid of future for patient?", [("Never (0)", 0), ("Rarely (1)", 1), ("Sometimes (2)", 2), ("Frequently (3)", 3), ("Nearly always (4)", 4)]),
        ("8. Feel patient is dependent upon you?", [("Never (0)", 0), ("Rarely (1)", 1), ("Sometimes (2)", 2), ("Frequently (3)", 3), ("Nearly always (4)", 4)]),
        ("9. Feel strained around patient?", [("Never (0)", 0), ("Rarely (1)", 1), ("Sometimes (2)", 2), ("Frequently (3)", 3), ("Nearly always (4)", 4)]),
        ("10. Health suffered due to caregiving?", [("Never (0)", 0), ("Rarely (1)", 1), ("Sometimes (2)", 2), ("Frequently (3)", 3), ("Nearly always (4)", 4)]),
        ("11. Lack privacy you'd like?", [("Never (0)", 0), ("Rarely (1)", 1), ("Sometimes (2)", 2), ("Frequently (3)", 3), ("Nearly always (4)", 4)]),
        ("12. Overall, feel burdened caring for patient?", [("Never (0)", 0), ("Rarely (1)", 1), ("Sometimes (2)", 2), ("Frequently (3)", 3), ("Nearly always (4)", 4)])
    ]
    for p_title, opts in items2:
        col2 += f'<div class="card-param"><div class="card-param-title">{p_title}</div>'
        for opt, pts in opts:
            col2 += f'<div class="card-opt"><span class="sq"></span> {opt} <b>({pts})</b></div>'
        col2 += '</div>'

    e.add_raw_html_section(f'<div class="cols-2"><div>{col1}</div><div>{col2}</div></div>')
    e.set_risk_stratification([
        ("No to Mild Burden", "0 - 10 points", "Caregiver coping well. Offer health education and support resources.", "green"),
        ("Mild to Moderate Burden", "11 - 20 points", "Moderate caregiver strain. Respite care options, support group referral.", "yellow"),
        ("High Caregiver Burden", "≥ 21 points", "High risk of burnout and depression. Urgent social work and multidisciplinary support.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_zarit.pdf"))

    # 61. Waterlow
    e = FormPDFEngineEN("WATERLOW PRESSURE ULCER RISK SCALE", "Pressure Sore Risk Assessment and Prevention Strategy in Clinical Care", "Score > 20 (High Risk)", "Waterlow J. Prof Nurse, 1985;1(2):49-55.")
    e.layout_mode = "single"
    e.extra_css = ".table-eval td { padding: 4px 7px !important; font-size: 7.4pt !important; } .opt-item { margin-bottom: 1.5px !important; } .sec-title { margin: 5px 0 2px !important; }"
    e.add_table_section("PRESSURE ULCER RISK SUBSCALES", [
        (("1. Build / Weight for Height", "BMI assessment"), [("Average BMI (0)", 0), ("Above average BMI (1)", 1), ("Obese / BMI > 30 (2)", 2), ("Below average / Cachectic (3)", 3)]),
        (("2. Visual Skin Type", "High-risk areas"), [("Healthy intact skin (0)", 0), ("Tissue paper / Dry / Oedematous (1)", 1), ("Clammy / pyrexial skin (1)", 1), ("Discolored / Stage 1 erythema (2)", 2), ("Broken skin / Existing ulcer (3)", 3)]),
        (("3. Sex and Age Category", "Demographic risk weighting"), [("Male (1 pt) | Female (2 pts)", 1), ("14-49 yrs (1 pt) | 50-64 yrs (2 pts)", 2), ("65-74 yrs (3 pts) | 75-80 yrs (4 pts) | 81+ yrs (5 pts)", 4)]),
        (("4. Continence", "Sphincter control"), [("Complete continent / Catheterized (0)", 0), ("Occasional incontinence (1)", 1), ("Catheterized but incontinent of feces (2)", 2), ("Doubly incontinent of urine and feces (3)", 3)]),
        (("5. Mobility", "Physical movement"), [("Fully mobile (0)", 0), ("Restless / Fidgety (1)", 1), ("Apathetic (2)", 2), ("Restricted (3)", 3), ("Bedbound (4)", 4), ("Chairbound (5)", 5)]),
        (("6. Tissue Malnutrition", "Underlying systemic condition"), [("Terminal cachexia / Multi-organ failure (8)", 8), ("Single major organ failure (5)", 5), ("Peripheral vascular disease (5)", 5), ("Severe anemia / Smoking (2)", 2)]),
        (("7. Neurological Deficit", "Sensory-motor impairment"), [("Diabetes / MS / Stroke / Paraplegia / Neuropathy (4-6 pts)", 5)]),
        (("8. Major Surgery / Trauma", "Orthopedic / spinal / OR table time"), [("Orthopaedic or spinal surgery below waist (5)", 5), ("On operating table > 2 hours (5)", 5)])
    ])
    e.set_risk_stratification([
        ("At Risk", "10 - 14 points", "Preventive foam mattress, q3h repositioning schedule, keep skin clean and moisturized.", "green"),
        ("High Risk", "15 - 19 points", "Alternating pressure dynamic mattress, 30° tilt repositioning, heel elevation pads.", "yellow"),
        ("Very High Risk", "≥ 20 points", "Specialized air-fluidized / dynamic replacement bed, q2h turning, dietitian review.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_waterlow.pdf"))

if __name__ == "__main__":
    run()
