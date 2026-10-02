# -*- coding: utf-8 -*-
"""b06.py: Scales 11 and 12 (cam, capurro)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 11 and 12...")
    # 11. CAM-ICU
    e = FormPDFEngineEN("CAM-ICU DELIRIUM ASSESSMENT", "Confusion Assessment Method for the Intensive Care Unit", "Delirium Positive / Negative", "Ely EW, et al. JAMA, 2001;286(21):2703-2710.")
    e.extra_css = ".table-eval td { padding: 8px 10px !important; } .opt-item { margin-bottom: 4px !important; }"
    e.add_table_section("CAM-ICU FOUR CLINICAL FEATURES", [
        (("Feature 1: Acute Onset or Fluctuating Course", "Mental status change from baseline"), [("No change from baseline", 0), ("Acute change or fluctuating course in past 24 hours", 1)]),
        (("Feature 2: Inattention (ASE Letters)", "Letter test: Squeeze on 'A' in 'SAVEAHAART'"), [("0 - 2 errors: Normal attention", 0), ("> 2 errors: Inattention present", 1)]),
        (("Feature 3: Altered Level of Consciousness", "Richmond Agitation-Sedation Scale (RASS)"), [("Current RASS = 0 (Alert and calm)", 0), ("Current RASS other than 0 (e.g. -3 to -1 or +1 to +4)", 1)]),
        (("Feature 4: Disorganized Thinking", "Simple logic questions and 2-step command"), [("0 - 1 error on questions and command followed", 0), ("> 1 error on questions or unable to follow command", 1)])
    ])
    e.add_raw_html_section('''
    <div class="visual-box" style="margin-top:6px; font-size:7.4pt; line-height:1.30; text-align:left;">
        <b>ABCDEF ICU Delirium Prevention Bundle:</b>
        <b>A</b>ssess, prevent and manage pain | <b>B</b>oth SAT and SBT daily | <b>C</b>hoice of analgesia and sedation (avoid benzos) | 
        <b>D</b>elirium monitoring q shift | <b>E</b>arly mobility and exercise | <b>F</b>amily engagement and daytime orientation.
    </div>
    ''')
    e.set_risk_stratification([
        ("Delirium Negative", "Feature 1 or 2 Absent", "Normal cognitive status in ICU. Continue preventive delirium bundle (ABCDEF bundle).", "green"),
        ("Delirium Positive", "Feat 1 & 2 AND (Feat 3 or 4)", "Active delirium. Identify etiology (drugs, hypoxia, sepsis), mobilize, avoid benzodiazepines.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_cam.pdf"))

    # 12. Capurro
    e = FormPDFEngineEN("CAPURRO METHOD FOR GESTATIONAL AGE", "Gestational Maturity Assessment in Newborns (Somatic & Neurological)", "Formula: [204 + Score] ÷ 7", "Capurro H, et al. J Pediatr, 1978;93(1):120-122.")
    e.add_table_section("SOMATIC AND NEUROLOGICAL CRITERIA", [
        (("1. Ear Form / Pinna Curvature", "Incurving of pinna edge"), [("Flat, shapeless, no curve", 0), ("Incurving of part of superior pinna", 8), ("Well-defined incurving of entire superior pinna", 16), ("Fully curved upper pinna, firm cartilage", 24)]),
        (("2. Mammary Gland Size", "Palpation of breast tissue nodule"), [("Non-palpable nodule", 0), ("Palpable nodule < 5 mm diameter", 5), ("Palpable nodule 5 - 10 mm diameter", 10), ("Palpable nodule > 10 mm diameter", 15)]),
        (("3. Nipple Formation", "Areola elevation and border stippling"), [("Barely visible, no areola", 0), ("Nipple visible, areola flat and smooth", 5), ("Areola raised, non-stippled border", 10), ("Areola raised, stippled border with definite bud", 15)]),
        (("4. Skin Texture", "Inspection and palpation of epidermis"), [("Very thin, gelatinous, smooth", 0), ("Smooth, medium thickness, superficial peeling", 10), ("Superficial cracks, pale, definite peeling hands/feet", 15), ("Thick parchment-like, deep cracked skin", 20)]),
        (("5. Plantar Creases", "Sole creases on foot extension"), [("No creases visible on sole", 0), ("Faint red marks over anterior sole only", 5), ("Definite creases over anterior half of sole", 10), ("Deep indentations over more than anterior half", 15), ("Deep creases over entire sole surface", 20)]),
        (("6. Scarf Sign (if neuro+somatic)", "Elbow position across chest"), [("Elbow across to opposite axillary line", 0), ("Elbow between opposite axilla and midline", 6), ("Elbow reaches midline", 12), ("Elbow does not reach midline", 18)])
    ])
    e.set_risk_stratification([
        ("Post-Term Infant", "≥ 42 weeks", "Placental insufficiency risk, meconium surveillance, monitor neonatal blood glucose.", "yellow"),
        ("Full-Term Infant", "37 - 41 weeks", "Mature infant. Routine rooming-in, skin-to-skin contact, exclusive breastfeeding.", "green"),
        ("Moderate Preterm", "32 - 36 weeks", "Thermoregulation support, feeding assessment, phototherapy readiness.", "yellow"),
        ("Extreme Preterm", "< 32 weeks", "NICU admission, respiratory support (surfactant), radiant warmer, minimal handling.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_capurro.pdf"))

if __name__ == "__main__":
    run()
