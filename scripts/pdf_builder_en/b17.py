# -*- coding: utf-8 -*-
"""b17.py: Scales 34 to 36 (lachs, lanss, lawton)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 34 to 36...")
    # 34. Lachs (VES-13)
    e = FormPDFEngineEN("LACHS VULNERABLE ELDERS SURVEY (VES-13)", "Identification of Older Persons at Risk of Functional Decline or Death", "10 points (Risk if ≥ 3)", "Saliba D, et al. J Am Geriatr Soc, 2001;49(12):1691-1699.")
    e.layout_mode = "double_col"
    e.extra_css = ".table-eval-col2 td { padding: 6px 7px !important; font-size: 7.4pt !important; } .sec-title { margin: 6px 0 3px !important; }"
    e.add_table_section("1. AGE & HEALTH", [
        ("1. Age Score", [("< 75 years (0)", 0), ("75 - 84 years (1)", 1), ("≥ 85 years (3)", 3)]),
        ("2. Self-Rated Health", [("Good / Excellent (0)", 0), ("Fair / Poor (1)", 1)])
    ])
    e.add_table_section("2. FUNCTIONAL LIMITATIONS", [
        ("3. Stooping, crouching", [("No difficulty (0)", 0), ("Some/Much difficulty (1)", 1)]),
        ("4. Lifting 10 lbs", [("No difficulty (0)", 0), ("Some/Much difficulty (1)", 1)]),
        ("5. Reaching above shoulders", [("No difficulty (0)", 0), ("Some/Much difficulty (1)", 1)]),
        ("6. Writing, small objects", [("No difficulty (0)", 0), ("Some/Much difficulty (1)", 1)]),
        ("7. Walking 1/4 mile", [("No difficulty (0)", 0), ("Some/Much difficulty (1)", 1)]),
        ("8. Heavy housework", [("No difficulty (0)", 0), ("Some/Much difficulty (1)", 1)]),
        ("9. Shopping groceries", [("No difficulty (0)", 0), ("Needs help / Unable (1)", 1)]),
        ("10. Managing money", [("No difficulty (0)", 0), ("Needs help / Unable (1)", 1)]),
        ("11. Walking across room", [("No difficulty (0)", 0), ("Needs help / Unable (1)", 1)])
    ])
    e.add_raw_html_section('''
    <div class="visual-box" style="margin-top:5px; font-size:7.2pt; line-height:1.28; text-align:left;">
        <b>Clinical Scoring Rule:</b> Sum points from Age (0-3), Self-Rated Health (0-1), Physical Limitations (max 2 pts), and IADLs (max 4 pts).
        Total score ranges from 0 to 10. A score of 3 or higher identifies vulnerable elders requiring comprehensive geriatric care.
    </div>
    ''')
    e.set_risk_stratification([
        ("Robust / Non-Vulnerable", "0 - 2 points", "Low risk of death or functional deterioration in 2 years. Preventive care.", "green"),
        ("Vulnerable Elder", "≥ 3 points", "4.2x higher risk of functional decline or mortality. Comprehensive Geriatric Assessment (CGA) indicated.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_lachs.pdf"))

    # 35. LANSS
    e = FormPDFEngineEN("LANSS PAIN SCALE", "Leeds Assessment of Neuropathic Symptoms and Signs", "24 points (Neuropathic if ≥ 12)", "Bennett M. Pain, 2001;92(1-2):147-157.")
    e.add_table_section("A. PAIN QUESTIONNAIRE (PATIENT REPORT)", [
        (("1. Pricking / Tingling Sensation", "Pins and needles in painful area"), [("No", 0), ("Yes", 5)]),
        (("2. Color Change", "Skin looks mottled, red, or flushed"), [("No", 0), ("Yes", 5)]),
        (("3. Temperature Sensitivity", "Skin feels abnormally hot or cold"), [("No", 0), ("Yes", 3)]),
        (("4. Sudden Bursts / Shocks", "Electric shocks, stabbing bursts"), [("No", 0), ("Yes", 2)]),
        (("5. Burning Sensation", "Skin feels on fire, severe burning"), [("No", 0), ("Yes", 1)])
    ])
    e.add_table_section("B. CLINICAL BEDSIDE EXAMINATION", [
        (("6. Allodynia (Cotton Wool)", "Light stroking with cotton produces pain"), [("No: Normal sensation", 0), ("Yes: Allodynia present", 5)]),
        (("7. Altered Pinprick Threshold", "23G needle pricked in painful area vs normal"), [("No: Equal sensation", 0), ("Yes: Altered threshold / hyperalgesia", 3)])
    ])
    e.set_risk_stratification([
        ("Nociceptive Pain Likely", "< 12 points", "Neuropathic mechanisms unlikely. Standard nociceptive analgesia (NSAIDs, paracetamol).", "green"),
        ("Neuropathic Pain Likely", "≥ 12 points", "Neuropathic pain mechanisms contributing. Gabapentinoids (pregabalin/gabapentin), SNRIs, TCAs indicated.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_lanss.pdf"))

    # 36. Lawton
    e = FormPDFEngineEN("LAWTON INSTRUMENTAL ADL SCALE (IADL)", "Assessment of Independent Living Skills in Community and Inpatients", "8 points (0 to 8)", "Lawton MP, Brody EM. Gerontologist, 1969;9(3):179-186.")
    e.layout_mode = "single"
    e.extra_css = ".table-eval td { padding: 4.8px 7px !important; } .opt-item { margin-bottom: 2px !important; }"
    e.add_table_section("EIGHT INSTRUMENTAL ADL DOMAINS", [
        (("1. Ability to Use Telephone", "Operating phone"), [("Operates phone on own initiative; dials numbers (1)", 1), ("Dials a few well-known numbers (1)", 1), ("Answers phone but does not dial (1)", 1), ("Does not use telephone at all (0)", 0)]),
        (("2. Shopping", "Procuring groceries and necessities"), [("Takes care of all shopping needs independently (1)", 1), ("Shops independently for small purchases (0)", 0), ("Needs to be accompanied on shopping trips (0)", 0), ("Completely unable to shop (0)", 0)]),
        (("3. Food Preparation", "Meal planning and cooking"), [("Plans, prepares, and serves meals independently (1)", 1), ("Prepares meals if ingredients are supplied (0)", 0), ("Heats and serves prepared meals (0)", 0), ("Needs to have meals prepared and served (0)", 0)]),
        (("4. Housekeeping", "Maintaining residence"), [("Maintains house alone or with occasional help (1)", 1), ("Performs light daily tasks (dishes, bed) (1)", 1), ("Performs light tasks poorly (1)", 1), ("Needs help with all home maintenance (0)", 0)]),
        (("5. Laundry", "Clothing care"), [("Does personal laundry completely (1)", 1), ("Launders small items (rinses stockings) (1)", 1), ("All laundry must be done by others (0)", 0)]),
        (("6. Transportation", "Travel capability"), [("Travels independently (public transit / drives car) (1)", 1), ("Arranges own travel via taxi (1)", 1), ("Travels on transit when assisted/accompanied (1)", 1), ("Does not travel at all (0)", 0)]),
        (("7. Responsibility for Medications", "Medication management"), [("Takes medication in correct dosages at correct time (1)", 1), ("Takes if prepared in advance in separate dosages (0)", 0), ("Incapable of dispensing own medication (0)", 0)]),
        (("8. Ability to Handle Finances", "Financial management"), [("Manages financial matters independently (bills, banking) (1)", 1), ("Manages day-to-day purchases, needs help with banking (1)", 1), ("Incapable of handling money (0)", 0)])
    ])
    e.set_risk_stratification([
        ("High Independence", "8 points", "Autonomous in complex instrumental daily tasks. Community independent.", "green"),
        ("Moderate Impairment", "4 - 7 points", "Assistance needed for complex living activities (medications, finances).", "yellow"),
        ("Severe Dependence", "0 - 3 points", "High care dependency. Requires caregiver support or assisted living facility.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_lawton.pdf"))

if __name__ == "__main__":
    run()
