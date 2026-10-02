# -*- coding: utf-8 -*-
"""b18.py: Scales 37 and 38 (meem, meows)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 37 and 38...")
    # 37. MMSE / MEEM
    e = FormPDFEngineEN("MINI-MENTAL STATE EXAMINATION (MMSE)", "Screening Tool for Cognitive Impairment and Dementia", "30 points", "Folstein MF, et al. J Psychiatr Res, 1975;12(3):189-198.")
    e.layout_mode = "double_col"
    e.add_table_section("1. ORIENTATION & REGISTRATION", [
        ("Time Orientation (Year, Season, Month, Date, Day)", [("1 point for each correct (0 to 5)", 5)]),
        ("Place Orientation (Country, State, City, Hospital, Floor)", [("1 point for each correct (0 to 5)", 5)]),
        ("Registration (Name 3 objects: Apple, Table, Penny)", [("1 point for each repeated on 1st trial (0 to 3)", 3)])
    ])
    e.add_table_section("2. ATTENTION, RECALL & LANGUAGE", [
        ("Attention (Serial 7s backward: 93, 86, 79, 72, 65)", [("1 point for each correct subtraction (0 to 5)", 5)]),
        ("Recall (Ask for the 3 objects named above)", [("1 point for each recalled object (0 to 3)", 3)]),
        ("Naming (Show watch and pencil, ask patient to name)", [("1 point for each correct object (0 to 2)", 2)]),
        ("Repetition ('No ifs, ands, or buts')", [("1 point for exact repetition (0 to 1)", 1)]),
        ("3-Stage Command (Paper in right hand, fold, put on floor)", [("1 point for each part executed (0 to 3)", 3)]),
        ("Reading & Obeying ('CLOSE YOUR EYES')", [("1 point if patient closes eyes (0 to 1)", 1)]),
        ("Writing (Write a spontaneous sensible sentence)", [("1 point for subject, verb, and sense (0 to 1)", 1)]),
        ("Copying (Intersecting pentagons)", [("1 point if 10 angles and 4-sided overlap (0 to 1)", 1)])
    ])
    e.set_risk_stratification([
        ("Normal Cognition", "24 - 30 points", "No significant cognitive impairment. Account for educational attainment.", "green"),
        ("Mild Cognitive Impairment", "19 - 23 points", "Mild impairment. Clinical evaluation for reversible causes / early dementia.", "yellow"),
        ("Moderate Impairment", "10 - 18 points", "Moderate dementia. Safety supervision, caregiver support, neurology consult.", "orange"),
        ("Severe Cognitive Impairment", "< 10 points", "Severe dementia. Total care dependence, 24-hour supervision required.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_meem.pdf"))

    # 38. MEOWS
    e = FormPDFEngineEN("MODIFIED EARLY OBSTETRIC WARNING SCORE (MEOWS)", "Maternal Deterioration Tracking and Obstetric Trigger System", "Color-Coded Triggers (Yellow / Red)", "Royal College of Obstetricians and Gynaecologists (RCOG), 2021.")
    e.add_table_section("SEVEN PHYSIOLOGICAL PARAMETERS", [
        (("1. Respiratory Rate (/min)", "Auscultate for 60 seconds"), [("11-20 (Normal)", 0), ("21-30 (Yellow trigger)", 1), ("<10 or >30 (Red trigger)", 2)]),
        (("2. Oxygen Saturation (SpO2)", "Room air pulse oximetry"), [("≥ 96% on room air (Normal)", 0), ("92 - 95% (Yellow trigger)", 1), ("< 92% (Red trigger)", 2)]),
        (("3. Temperature (°C)", "Tympanic / Oral temperature"), [("36.0 - 37.4 °C (Normal)", 0), ("35.0-35.9 or 37.5-37.9 °C (Yellow)", 1), ("<35.0 or ≥38.0 °C (Red trigger)", 2)]),
        (("4. Systolic BP (mmHg)", "Manual or automated measurement"), [("100 - 139 mmHg (Normal)", 0), ("90 - 99 or 140 - 149 mmHg (Yellow)", 1), ("<90 or ≥150 mmHg (Red trigger)", 2)]),
        (("5. Diastolic BP (mmHg)", "Phase V Korotkoff sound"), [("< 90 mmHg (Normal)", 0), ("90 - 99 mmHg (Yellow trigger)", 1), ("≥ 100 mmHg (Red trigger)", 2)]),
        (("6. Heart Rate (bpm)", "Apical or radial pulse count"), [("60 - 99 bpm (Normal)", 0), ("50 - 59 or 100 - 119 bpm (Yellow)", 1), ("<50 or ≥120 bpm (Red trigger)", 2)]),
        (("7. Consciousness / Pain", "Neurological alertness / maternal pain"), [("Alert / Normal pain (Normal)", 0), ("Responds to voice / Agitated / Severe pain (Yellow)", 1), ("Responds only to pain / Unresponsive (Red trigger)", 2)])
    ])
    e.set_risk_stratification([
        ("Normal / Low Risk", "0 Triggers", "Continue routine intrapartum / postpartum obstetric vital signs schedule.", "green"),
        ("Moderate Concern", "1 Yellow Trigger", "Repeat vitals within 30 min, notify obstetric nurse leader, assess fluid balance.", "yellow"),
        ("Urgent Obstetric Alert", "1 Red or ≥2 Yellow", "Immediate obstetrician review, bedside senior midwife, consider MET call.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_meows.pdf"))

if __name__ == "__main__":
    run()
