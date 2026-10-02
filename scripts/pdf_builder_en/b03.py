# -*- coding: utf-8 -*-
"""b03.py: Scales 5 and 6 (ballard, barthel)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 5 and 6...")
    # 5. Ballard
    e = FormPDFEngineEN("NEW BALLARD SCORE", "Assessment of Neonatal Gestational Maturity", "50 points (-10 to 50)", "Ballard JL, et al. J Pediatr, 1991;119(3):417-423.")
    e.layout_mode = "double_col"
    e.extra_css = """
    .cols-2 { gap: 4mm !important; }
    .card-param { border: 1px solid #CBD5E1; border-radius: 3px; padding: 1.2px 3.5px; margin-bottom: 1.5px; font-size: 6.6pt; background: #fff; }
    .card-param-title { font-weight: 700; color: #1A3E74; margin-bottom: 0.5px; }
    .card-opt { display: flex; align-items: flex-start; gap: 2.5px; margin-bottom: 0.5px; line-height: 1.12; font-size: 6.3pt; }
    .card-opt:last-child { margin-bottom: 0; }
    .sec-title { margin: 4px 0 2px !important; }
    """
    col1 = '<div class="sec-title">1. NEUROMUSCULAR MATURITY</div>'
    items1 = [
        ("1. Posture", [("Extended limbs (-1)", -1), ("Slight flexion hips/knees (0)", 0), ("Moderate flexion (1)", 1), ("Moderate to strong (2)", 2), ("Legs flexed & arms (3)", 3), ("Full flexion (4)", 4)]),
        ("2. Square Window (Wrist)", [(">90° angle (-1)", -1), ("90° angle (0)", 0), ("60° angle (1)", 1), ("45° angle (2)", 2), ("30° angle (3)", 3), ("0° full flexion (4)", 4)]),
        ("3. Arm Recoil", [("180° no recoil (0)", 0), ("140-180° slight (1)", 1), ("110-140° moderate (2)", 2), ("90-110° brisk (3)", 3), ("<90° immediate (4)", 4)]),
        ("4. Popliteal Angle", [("180° angle (-1)", -1), ("160° angle (0)", 0), ("140° angle (1)", 1), ("120° angle (2)", 2), ("100° angle (3)", 3), ("<90° angle (5)", 5)]),
        ("5. Scarf Sign", [("Elbow across body (-1)", -1), ("Past midline (0)", 0), ("At midline (1)", 1), ("Before midline (2)", 2), ("Meets firm resistance (3)", 3)]),
        ("6. Heel to Ear", [("Heel reaches ear (-1)", -1), ("Near ear (0)", 0), ("Resistance at 90° (1)", 1), ("Popliteal resistance (2)", 2), ("Firm resistance (3)", 3)])
    ]
    for p_title, opts in items1:
        col1 += f'<div class="card-param"><div class="card-param-title">{p_title}</div>'
        for opt, pts in opts:
            col1 += f'<div class="card-opt"><span class="sq"></span> {opt} <b>({pts})</b></div>'
        col1 += '</div>'

    col2 = '<div class="sec-title">2. PHYSICAL MATURITY</div>'
    items2 = [
        ("7. Skin Texture", [("Sticky, friable, transparent (-1)", -1), ("Gelatinous, red, translucent (0)", 0), ("Smooth pink, visible veins (1)", 1), ("Superficial peeling / rash (2)", 2), ("Cracking, pale areas (3)", 3), ("Parchment, deep cracks (4)", 4)]),
        ("8. Lanugo", [("None (-1)", -1), ("Sparse (0)", 0), ("Abundant (1)", 1), ("Thinning (2)", 2), ("Bald areas (3)", 3), ("Mostly bald (4)", 4)]),
        ("9. Plantar Surface", [("Heel-toe 40-50mm (-1)", -1), (">50mm no creases (0)", 0), ("Faint red marks (1)", 1), ("Ant transverse crease (2)", 2), ("Creases ant 2/3 (3)", 3), ("Creases entire sole (4)", 4)]),
        ("10. Breast Tissue", [("Imperceptible (-1)", -1), ("Barely perceptible (0)", 0), ("Flat areola, no bud (1)", 1), ("Stippled areola 1-2mm (2)", 2), ("Raised areola 3-4mm (3)", 3), ("Full areola 5-10mm (4)", 4)]),
        ("11. Eye / Ear", [("Lids fused (-1)", -1), ("Lids open, pinna flat (0)", 0), ("Slightly curved pinna (1)", 1), ("Well-curved, soft recoil (2)", 2), ("Formed & firm, instant (3)", 3), ("Thick cartilage (4)", 4)]),
        ("12. Genitalia (M/F)", [("Scrotum flat / Clitoris prominent (-1)", -1), ("Scrotum empty, faint rugae (0)", 0), ("Testes in upper canal (1)", 1), ("Testes descending (2)", 2), ("Testes down, good rugae (3)", 3), ("Pendulous / Majora covers (4)", 4)])
    ]
    for p_title, opts in items2:
        col2 += f'<div class="card-param"><div class="card-param-title">{p_title}</div>'
        for opt, pts in opts:
            col2 += f'<div class="card-opt"><span class="sq"></span> {opt} <b>({pts})</b></div>'
        col2 += '</div>'

    e.add_raw_html_section(f'<div class="cols-2"><div>{col1}</div><div>{col2}</div></div>')
    e.set_risk_stratification([
        ("Extreme Preterm", "-10 to 10 pts", "20-28 wks. NICU incubator, surfactant, minimal handling protocol.", "red"),
        ("Moderate Preterm", "15 to 30 pts", "30-36 wks. Temperature control, feeding support, phototherapy.", "yellow"),
        ("Term / Post-Term", "35 to 50 pts", "38-44 wks. Rooming-in, routine screening, breastfeeding support.", "green")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_ballard.pdf"))

    # 6. Barthel (Single column, roomy stacked options)
    e = FormPDFEngineEN("BARTHEL INDEX OF ADLs", "Assessment of Functional Independence in Basic Activities of Daily Living", "100 points", "Mahoney FI, Barthel DW. Md State Med J, 1965;14:61-65.")
    e.layout_mode = "single"
    e.extra_css = ".table-eval td { padding: 5px 8px !important; } .opt-item { margin-bottom: 2px !important; }"
    e.add_table_section("TEN ACTIVITIES OF DAILY LIVING", [
        (("1. Feeding", "Eating meal"), [("Unable (0)", 0), ("Needs help cutting, spreading butter (5)", 5), ("Independent with food (10)", 10)]),
        (("2. Bathing", "Personal hygiene"), [("Dependent (0)", 0), ("Independent in shower or tub (5)", 5)]),
        (("3. Grooming", "Face, hair, teeth, shaving"), [("Needs help with personal care (0)", 0), ("Independent with grooming (5)", 5)]),
        (("4. Dressing", "Clothing and shoes"), [("Dependent (0)", 0), ("Needs help but does half (5)", 5), ("Independent with buttons, zips (10)", 10)]),
        (("5. Bowel Control", "Fecal sphincter control"), [("Incontinent / needs enemas (0)", 0), ("Occasional accident once a week (5)", 5), ("Continent (10)", 10)]),
        (("6. Bladder Control", "Urinary control"), [("Incontinent / catheterized (0)", 0), ("Occasional accident once a day (5)", 5), ("Continent (10)", 10)]),
        (("7. Toilet Use", "Commode / toilet transfers"), [("Dependent (0)", 0), ("Needs some help with wiping/clothes (5)", 5), ("Independent (10)", 10)]),
        (("8. Transfers", "Bed to chair and back"), [("Unable, no sitting balance (0)", 0), ("Major help (2 people) (5)", 5), ("Minor help (1 person) (10)", 10), ("Independent (15)", 15)]),
        (("9. Mobility", "Walking level surfaces"), [("Immobile / <50 meters (0)", 0), ("Wheelchair independent >50m (5)", 5), ("Walks with help >50m (10)", 10), ("Independent >50m (15)", 15)]),
        (("10. Stairs", "Ascending and descending"), [("Unable (0)", 0), ("Needs help (physical or verbal) (5)", 5), ("Independent up and down stairs (10)", 10)])
    ])
    e.set_risk_stratification([
        ("Total Dependence", "0-20 pts", "Full nursing care for basic daily activities, high skin/fall risk.", "red"),
        ("Severe Dependence", "21-60 pts", "Substantial nursing assistance required for mobility and self-care.", "orange"),
        ("Moderate Dependence", "61-90 pts", "Assistance needed for specific tasks; rehabilitation potential.", "yellow"),
        ("Independent", "91-100 pts", "Minimal or no assistance required; autonomous functional capacity.", "green")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_barthel.pdf"))

if __name__ == "__main__":
    run()

