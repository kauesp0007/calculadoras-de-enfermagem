# -*- coding: utf-8 -*-
"""b15.py: Scales 30 and 31 (humpty, johns)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 30 and 31...")
    # 30. Humpty Dumpty
    e = FormPDFEngineEN("HUMPTY DUMPTY PEDIATRIC FALL RISK SCALE", "Pediatric Inpatient Fall Risk Assessment and Prevention Protocol", "26 points (7 to 26)", "Hill-Rodriguez D, et al. J Pediatr Nurs, 2009;24(1):26-36.")
    e.add_table_section("SEVEN PEDIATRIC RISK DOMAINS", [
        (("1. Age Category", "Developmental stage"), [("≥ 13 years old", 1), ("7 - 12 years old", 2), ("3 - 6 years old", 3), ("< 3 years old", 4)]),
        (("2. Gender", "Statistical pediatric risk"), [("Female", 1), ("Male", 2)]),
        (("3. Diagnosis", "Clinical medical reason for admission"), [("Other medical diagnosis", 1), ("Psychiatric / Behavioral disorder", 2), ("Respiratory condition / Dehydration", 3), ("Neurological condition / Seizure disorder", 4)]),
        (("4. Cognitive Impairments", "Awareness of physical limits"), [("Aware of own limitations", 1), ("Forgets limitations intermittently", 2), ("Completely unaware of limitations / Impulsive", 3)]),
        (("5. Environmental Factors", "Patient physical setting"), [("Outpatient clinic area", 1), ("Bed patient in standard hospital room", 2), ("Infant / Toddler placed in crib", 3), ("History of falls during admission / Multiple lines", 4)]),
        (("6. Surgery / Sedation", "Time elapsed since procedure"), [("None / More than 48 hours ago", 1), ("Within 48 hours", 2), ("Within 24 hours of general anesthesia", 3)]),
        (("7. Medication Regimen", "Prescription of sedating drugs"), [("Other medications / No medications", 1), ("One high-fall risk medication", 2), ("Multiple high-fall risk medications (sedatives, narcotics, laxatives)", 3)])
    ])
    e.set_risk_stratification([
        ("Low Fall Risk", "7 - 11 points", "Universal pediatric precautions, crib rails up x4, education of parents.", "green"),
        ("High Fall Risk", "≥ 12 points", "High-risk fall protocol: Humpty sticker on crib, non-skid socks, direct supervision.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_humpty.pdf"))

    # 31. Johns Hopkins
    e = FormPDFEngineEN("JOHNS HOPKINS FALL RISK ASSESSMENT (JHFRAT)", "Hospital Inpatient Fall Risk Assessment and Intervention Tool", "35 points (Low 0-5, Mod 6-13, High >13)", "Poe SS, et al. J Nurs Care Qual, 2005;20(2):107-116.")
    e.add_table_section("SEVEN RISK CATEGORIES", [
        (("1. Age", "Patient chronological age"), [("< 60 years", 0), ("60 - 69 years", 1), ("70 - 79 years", 2), ("≥ 80 years", 3)]),
        (("2. Fall History", "Documented falls prior to or during stay"), [("No falls in past 6 months", 0), ("One fall within past 6 months", 5), ("More than one fall in past 6 months", 10)]),
        (("3. Elimination Needs", "Urinary and fecal bowel patterns"), [("Normal / Continent", 0), ("Incontinence / Urgency / Frequency", 2), ("Assistance required for toileting", 4)]),
        (("4. Medications", "Sedatives, diuretics, narcotics, antihypertensives"), [("None of the listed drugs", 0), ("One high-risk medication", 3), ("Two or more high-risk medications", 5)]),
        (("5. Patient Care Equipment", "Lines, catheters, tubes tethering patient"), [("No equipment / lines", 0), ("One line or piece of equipment", 1), ("Two lines / pieces of equipment", 2), ("Three or more lines / equipment", 3)]),
        (("6. Mobility / Gait", "Balance and assistance needed to walk"), [("Independent / Normal steady gait", 0), ("Uses cane, walker, or crutches", 2), ("Impaired balance / unsteady / staggering", 4), ("Requires assistance of 1-2 people", 6)]),
        (("7. Cognition", "Orientation and safety judgment"), [("Oriented x3 (person, place, time)", 0), ("Mild confusion / Overestimates ability", 2), ("Severe confusion / Agitation / Delirium", 4)])
    ])
    e.set_risk_stratification([
        ("Low Fall Risk", "0 - 5 points", "Universal fall precautions: call light within reach, bed low, non-skid footwear.", "green"),
        ("Moderate Fall Risk", "6 - 13 points", "Fall alert sign on door, assisted ambulation, evaluate medication timing.", "yellow"),
        ("High Fall Risk", "> 13 points", "Yellow wristband, bed/chair alarm, toileting schedule q2h, 1:1 supervision if restless.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_johns.pdf"))

if __name__ == "__main__":
    run()
