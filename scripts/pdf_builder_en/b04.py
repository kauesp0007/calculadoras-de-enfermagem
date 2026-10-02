# -*- coding: utf-8 -*-
"""b04.py: Scales 7 and 8 (berg, bishop)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 7 and 8...")
    # 7. Berg
    e = FormPDFEngineEN("BERG BALANCE SCALE (BBS)", "Clinical Assessment of Balance Function and Fall Risk", "56 points", "Berg KO, et al. Physiother Can, 1989;41(6):304-311.")
    e.layout_mode = "double_col"
    e.extra_css = """
    .cols-2 { gap: 5mm !important; }
    .card-param { border: 1px solid #CBD5E1; border-radius: 4px; padding: 3px 5px; margin-bottom: 3.5px; font-size: 7pt; background: #fff; }
    .card-param-title { font-weight: 700; color: #1A3E74; margin-bottom: 1.5px; }
    .card-opt { display: flex; align-items: flex-start; gap: 4px; margin-bottom: 1px; line-height: 1.18; font-size: 6.8pt; }
    .card-opt:last-child { margin-bottom: 0; }
    """
    col1 = '<div class="sec-title">1. SITTING & TRANSFERS (PART 1)</div>'
    items1 = [
        ("1. Sitting to Standing", [("Needs assist (0)", 0), ("Minimal assist (1)", 1), ("Uses hands (2)", 2), ("Independent (4)", 4)]),
        ("2. Standing Unsupported", [("Unable (0)", 0), ("Stands 30s (2)", 2), ("Stands 2 min supervision (3)", 3), ("Stands 2 min safely (4)", 4)]),
        ("3. Sitting Unsupported", [("Unable (0)", 0), ("Sits 30s (2)", 2), ("Sits 2 min supervision (3)", 3), ("Sits 2 min safely (4)", 4)]),
        ("4. Standing to Sitting", [("Needs assist (0)", 0), ("Awkward landing (1)", 1), ("Uses back of legs (2)", 2), ("Sits safely (4)", 4)]),
        ("5. Transfers", [("Needs 2 people (0)", 0), ("Needs 1 person (1)", 1), ("Needs verbal cue (2)", 2), ("Independent safely (4)", 4)]),
        ("6. Standing Eyes Closed", [("Needs assist (0)", 0), ("Unable 3s (1)", 1), ("Stands 3s (2)", 2), ("Stands 10s safely (4)", 4)]),
        ("7. Standing Feet Together", [("Needs assist (0)", 0), ("Unable 15s (1)", 1), ("Supervision 1 min (3)", 3), ("Stands 1 min safely (4)", 4)])
    ]
    for p_title, opts in items1:
        col1 += f'<div class="card-param"><div class="card-param-title">{p_title}</div>'
        for opt, pts in opts:
            col1 += f'<div class="card-opt"><span class="sq"></span> {opt} <b>({pts})</b></div>'
        col1 += '</div>'

    col2 = '<div class="sec-title">2. DYNAMIC BALANCE (PART 2)</div>'
    items2 = [
        ("8. Reaching Forward", [("Needs assist (0)", 0), ("Reaches <5cm (1)", 1), ("Reaches >12cm (3)", 3), ("Reaches >25cm safely (4)", 4)]),
        ("9. Pick Up Object", [("Unable (0)", 0), ("Supervision (1)", 1), ("Awkwardly (3)", 3), ("Picks up safely (4)", 4)]),
        ("10. Turning Behind", [("Needs assist (0)", 0), ("Supervision (1)", 1), ("One side only (2)", 2), ("Looks both sides safely (4)", 4)]),
        ("11. Turn 360 Degrees", [("Needs assist (0)", 0), ("Takes >4s (2)", 2), ("Turns safely ≤4s both ways (4)", 4)]),
        ("12. Dynamic Step Stool", [("Needs assist (0)", 0), ("<2 steps (1)", 1), ("4 steps (2)", 2), ("8 steps ≤20s safely (4)", 4)]),
        ("13. Tandem Stance", [("Needs assist (0)", 0), ("Small step 30s (1)", 1), ("Independent tandem 30s safely (4)", 4)]),
        ("14. Standing One Leg", [("Unable (0)", 0), ("Holds <3s (1)", 1), ("Holds 5-10s (3)", 3), ("Holds >10s safely (4)", 4)])
    ]
    for p_title, opts in items2:
        col2 += f'<div class="card-param"><div class="card-param-title">{p_title}</div>'
        for opt, pts in opts:
            col2 += f'<div class="card-opt"><span class="sq"></span> {opt} <b>({pts})</b></div>'
        col2 += '</div>'

    e.add_raw_html_section(f'<div class="cols-2"><div>{col1}</div><div>{col2}</div></div>')
    e.set_risk_stratification([
        ("High Fall Risk", "0-20 pts", "Wheelchair user / 100% fall risk. Full assistance, fall protocol.", "red"),
        ("Moderate Fall Risk", "21-40 pts", "Assisted ambulation (walker/cane), physical therapy gait training.", "yellow"),
        ("Low Fall Risk", "41-56 pts", "Independent ambulation; maintain activity, environmental precautions.", "green")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_berg.pdf"))

    # 8. Bishop
    e = FormPDFEngineEN("BISHOP SCORE (PELVIC SCORE)", "Pre-Induction Cervical Ripening and Labor Success Predictor", "13 points", "Bishop EH. Obstet Gynecol, 1964;24(2):266-268.")
    e.add_table_section("CERVICAL EXAMINATION PARAMETERS", [
        (("1. Cervical Dilation", "Internal os diameter in cm"), [("Closed (0 cm)", 0), ("1 - 2 cm", 1), ("3 - 4 cm", 2), ("≥ 5 cm", 3)]),
        (("2. Cervical Effacement", "Length of cervix shortened (%)"), [("0 - 30% (thick)", 0), ("40 - 50%", 1), ("60 - 70%", 2), ("≥ 80% (paper thin)", 3)]),
        (("3. Fetal Station", "Position relative to ischial spines (cm)"), [("-3 (floating/high)", 0), ("-2", 1), ("-1 / 0 (at spines)", 2), ("+1 / +2 (engaged/low)", 3)]),
        (("4. Cervical Consistency", "Palpatory tissue firmness"), [("Firm (like tip of nose)", 0), ("Medium (like chin)", 1), ("Soft (like lips)", 2)]),
        (("5. Cervical Position", "Direction of os relative to pelvic axis"), [("Posterior", 0), ("Mid-position", 1), ("Anterior", 2)])
    ])
    e.set_risk_stratification([
        ("Unfavorable Cervix", "≤ 5 points", "Ripening agent indicated (dinoprostone / misoprostol / Foley balloon).", "red"),
        ("Intermediate Cervix", "6 - 7 points", "Equivocal ripeness. Reassess or low-dose mechanical ripening vs oxytocin.", "yellow"),
        ("Favorable Cervix", "≥ 8 points", "High vaginal delivery probability similar to spontaneous labor. Proceed.", "green")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_bishop.pdf"))

if __name__ == "__main__":
    run()
