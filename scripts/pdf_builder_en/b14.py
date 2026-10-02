# -*- coding: utf-8 -*-
"""b14.py: Scales 28 and 29 (hamilton, hendrich)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 28 and 29...")
    # 28. Hamilton
    e = FormPDFEngineEN("HAMILTON ANXIETY RATING SCALE (HAM-A)", "Clinical Assessment of Anxiety Symptoms and Treatment Efficacy", "56 points (0 to 56)", "Hamilton M. Br J Med Psychol, 1959;32(1):50-55.")
    e.layout_mode = "double_col"
    e.add_table_section("ANXIETY DOMAINS (PART 1)", [
        ("1. Anxious Mood (worries)", [("None", 0), ("Mild", 1), ("Mod", 2), ("Severe", 3), ("Very severe", 4)]),
        ("2. Tension (fatigue, startle)", [("None", 0), ("Mild", 1), ("Mod", 2), ("Severe", 3), ("Very severe", 4)]),
        ("3. Fears (dark, strangers)", [("None", 0), ("Mild", 1), ("Mod", 2), ("Severe", 3), ("Very severe", 4)]),
        ("4. Insomnia (broken sleep)", [("None", 0), ("Mild", 1), ("Mod", 2), ("Severe", 3), ("Very severe", 4)]),
        ("5. Intellectual (poor memory)", [("None", 0), ("Mild", 1), ("Mod", 2), ("Severe", 3), ("Very severe", 4)]),
        ("6. Depressed Mood (loss of joy)", [("None", 0), ("Mild", 1), ("Mod", 2), ("Severe", 3), ("Very severe", 4)]),
        ("7. Somatic (Muscular aches)", [("None", 0), ("Mild", 1), ("Mod", 2), ("Severe", 3), ("Very severe", 4)])
    ])
    e.add_table_section("ANXIETY DOMAINS (PART 2)", [
        ("8. Somatic (Sensory tinnitus)", [("None", 0), ("Mild", 1), ("Mod", 2), ("Severe", 3), ("Very severe", 4)]),
        ("9. Cardiovascular (tachycardia)", [("None", 0), ("Mild", 1), ("Mod", 2), ("Severe", 3), ("Very severe", 4)]),
        ("10. Respiratory (dyspnea)", [("None", 0), ("Mild", 1), ("Mod", 2), ("Severe", 3), ("Very severe", 4)]),
        ("11. Gastrointestinal (nausea)", [("None", 0), ("Mild", 1), ("Mod", 2), ("Severe", 3), ("Very severe", 4)]),
        ("12. Genitourinary (frequency)", [("None", 0), ("Mild", 1), ("Mod", 2), ("Severe", 3), ("Very severe", 4)]),
        ("13. Autonomic (dry mouth, flush)", [("None", 0), ("Mild", 1), ("Mod", 2), ("Severe", 3), ("Very severe", 4)]),
        ("14. Behavior at Interview", [("None", 0), ("Mild", 1), ("Mod", 2), ("Severe", 3), ("Very severe", 4)])
    ])
    e.set_risk_stratification([
        ("Mild Anxiety", "< 17 points", "Mild symptom severity. Reassurance, supportive counseling, sleep hygiene.", "green"),
        ("Mild to Moderate", "18 - 24 points", "Moderate anxiety. Psychotherapy referral, non-pharmacological stress reduction.", "yellow"),
        ("Moderate to Severe", "25 - 30 points", "Significant anxiety disorder. Medical evaluation for pharmacological treatment.", "orange"),
        ("Severe / Disabling", "> 30 points", "Disabling anxiety symptoms. Urgent psychiatric consultation and crisis plan.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_hamilton.pdf"))

    # 29. Hendrich II
    e = FormPDFEngineEN("HENDRICH II FALL RISK MODEL", "Screening for Fall Risk in Acute and Inpatient Healthcare Settings", "16 points (Risk if ≥ 5)", "Hendrich AL, et al. Appl Nurs Res, 2003;16(2):65-73.")
    e.add_table_section("EIGHT CLINICAL RISK FACTORS", [
        (("1. Confusion / Disorientation", "Impaired cognitive awareness and judgment"), [("No", 0), ("Yes", 4)]),
        (("2. Symptomatic Depression", "Presence of active depressive signs"), [("No", 0), ("Yes", 2)]),
        (("3. Altered Elimination", "Urgency, frequency, or incontinence"), [("No", 0), ("Yes", 1)]),
        (("4. Dizziness / Vertigo", "Reported or documented lightheadedness"), [("No", 0), ("Yes", 1)]),
        (("5. Male Gender", "Epidemiological risk weighting"), [("Female", 0), ("Male", 1)]),
        (("6. Antiepileptic Medications", "Administered anticonvulsants"), [("No", 0), ("Yes", 2)]),
        (("7. Benzodiazepine Medications", "Administered sedatives/hypnotics"), [("No", 0), ("Yes", 1)]),
        (("8. Get-Up-and-Go Test", "Rising from seated position"), [("Able to rise in single movement without hands", 0), ("Pushes up in one attempt", 1), ("Multiple attempts but succeeds", 3), ("Unable to rise without assistance", 4)])
    ])
    e.set_risk_stratification([
        ("Low Fall Risk", "0 - 4 points", "Standard universal fall precautions, call light within reach, safe footwear.", "green"),
        ("High Fall Risk", "≥ 5 points", "Fall prevention protocol: yellow armband, bed alarm, scheduled toileting, assist ambulation.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_hendrich.pdf"))

if __name__ == "__main__":
    run()
