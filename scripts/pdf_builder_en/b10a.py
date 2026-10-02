# -*- coding: utf-8 -*-
"""b10a.py: Scale 19 (downton)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scale 19: Downton...")
    e = FormPDFEngineEN("DOWNTON FALL RISK INDEX", "Assessment of Fall Risk in Adult and Geriatric Inpatients", "14 points (Risk if > 2)", "Downton JH. St. Michael's Hospital, 1993.")
    e.add_table_section("FIVE RISK MODULES", [
        (("1. Previous Falls", "History of falls within past 12 months"), [("No previous falls in past 12 months", 0), ("Yes: Has fallen one or more times in past 12 months", 1)]),
        (("2. Medications", "Prescription of fall-risk drugs (1 pt each category)"), [("None of the listed risk medications taken", 0), ("Tranquilizers / Sedatives / Hypnotics", 1), ("Diuretics", 1), ("Antihypertensive agents", 1), ("Antiparkinsonian drugs", 1), ("Antidepressants", 1)]),
        (("3. Sensory Deficits", "Sensory impairments affecting balance"), [("None: Normal vision, hearing, and limb mobility", 0), ("Visual impairment / Blindness", 1), ("Hearing impairment / Deafness", 1), ("Limb motor weakness / Paralysis / Amputation", 1)]),
        (("4. Mental State", "Cognitive orientation and awareness"), [("Oriented: Intact awareness of surroundings and limits", 0), ("Confused / Disoriented / Wandering / Impulsive", 1)]),
        (("5. Ambulation / Gait", "Walking stability and gait quality"), [("Normal: Safe walking, normal steady stride", 0), ("Safe with walking aid (cane, walker, crutches)", 1), ("Unsafe with or without walking aid", 1), ("Unable to walk / Completely bedbound", 0)])
    ])
    e.set_risk_stratification([
        ("Low Fall Risk", "0 - 2 points", "Standard universal fall precautions, call light within reach, safe non-skid footwear.", "green"),
        ("High Fall Risk", "> 2 points", "High fall protocol: yellow armband, bed alarm, assisted toileting schedule, supervised transfers.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_downton.pdf"))

if __name__ == "__main__":
    run()
