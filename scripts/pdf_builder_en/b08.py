# -*- coding: utf-8 -*-
"""b08.py: Scales 15 and 16 (cornell, cries)"""
import os
from engine_en import FormPDFEngineEN

OUT = r"c:\calculadoras-de-enfermagem\FORMULARIOS_DE_ESCALAS\EN"

def run():
    print("Compiling Scales 15 and 16...")
    # 15. Cornell
    e = FormPDFEngineEN("CORNELL SCALE FOR DEPRESSION IN DEMENTIA", "Screening and Assessment of Depression in Patients with Dementia", "38 points (0 to 38)", "Alexopoulos GS, et al. Biol Psychiatry, 1988;23(3):271-284.")
    e.layout_mode = "double_col"
    e.add_table_section("A. MOOD & BEHAVIOR", [
        ("1. Anxiety (worry, fearful)", [("Absent", 0), ("Mild / Intermittent", 1), ("Severe", 2)]),
        ("2. Sadness (tone, tearful)", [("Absent", 0), ("Mild / Intermittent", 1), ("Severe", 2)]),
        ("3. Lack of Reactivity", [("Absent", 0), ("Mild / Intermittent", 1), ("Severe", 2)]),
        ("4. Irritability (easily annoyed)", [("Absent", 0), ("Mild / Intermittent", 1), ("Severe", 2)]),
        ("5. Agitation (restlessness)", [("Absent", 0), ("Mild / Intermittent", 1), ("Severe", 2)]),
        ("6. Retardation (slow speech/mov)", [("Absent", 0), ("Mild / Intermittent", 1), ("Severe", 2)]),
        ("7. Multiple Physical Complaints", [("Absent", 0), ("Mild / Intermittent", 1), ("Severe", 2)]),
        ("8. Loss of Interest / Energy", [("Absent", 0), ("Mild / Intermittent", 1), ("Severe", 2)])
    ])
    e.add_table_section("B. CYCLIC & IDEATIONAL", [
        ("9. Appetite Loss (eating less)", [("Absent", 0), ("Mild / Intermittent", 1), ("Severe", 2)]),
        ("10. Weight Loss (>2kg / 1mo)", [("Absent", 0), ("Mild / Intermittent", 1), ("Severe", 2)]),
        ("11. Lack of Energy", [("Absent", 0), ("Mild / Intermittent", 1), ("Severe", 2)]),
        ("12. Diurnal Variation (worse AM)", [("Absent", 0), ("Mild / Intermittent", 1), ("Severe", 2)]),
        ("13. Difficulty Falling Asleep", [("Absent", 0), ("Mild / Intermittent", 1), ("Severe", 2)]),
        ("14. Multiple Night Awakenings", [("Absent", 0), ("Mild / Intermittent", 1), ("Severe", 2)]),
        ("15. Early Morning Awakening", [("Absent", 0), ("Mild / Intermittent", 1), ("Severe", 2)]),
        ("16. Suicide / Self-Harm Thoughts", [("Absent", 0), ("Mild / Intermittent", 1), ("Severe", 2)]),
        ("17. Poor Self-Esteem", [("Absent", 0), ("Mild / Intermittent", 1), ("Severe", 2)]),
        ("18. Pessimism / Guilt", [("Absent", 0), ("Mild / Intermittent", 1), ("Severe", 2)]),
        ("19. Mood-Congruent Delusions", [("Absent", 0), ("Mild / Intermittent", 1), ("Severe", 2)])
    ])
    e.set_risk_stratification([
        ("No Depression", "0 - 7 points", "Depressive symptoms unlikely. Continue supportive dementia care.", "green"),
        ("Mild / Probable Depression", "8 - 12 points", "Probable depressive disorder. Behavioral environmental optimization, reevaluate.", "yellow"),
        ("Definite Major Depression", "≥ 13 points", "Major depression in dementia. Psychogeriatric evaluation, consider antidepressant therapy.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_cornell.pdf"))

    # 16. CRIES
    e = FormPDFEngineEN("CRIES NEONATAL PAIN SCALE", "Postoperative Pain Assessment Tool for Neonates (≥32 Weeks)", "10 points", "Krechel SW, Bildner J. Paediatr Anaesth, 1995;5(1):53-61.")
    e.add_table_section("FIVE PHYSIOLOGICAL & BEHAVIORAL SIGNS", [
        (("C - Crying", "Vocal tone and pitch"), [("No cry / Normal cry", 0), ("High pitched cry, consolable", 1), ("Inconsolable, continuous cry", 2)]),
        (("R - Requires Oxygen", "Oxygenation to maintain SpO2 >95%"), [("No O2 required (SpO2 >95% air)", 0), ("Requires < 30% FiO2 to maintain SpO2 >95%", 1), ("Requires ≥ 30% FiO2 to maintain SpO2 >95%", 2)]),
        (("I - Increased Vital Signs", "Heart rate and blood pressure above baseline"), [("HR & BP equal/less than preop baseline", 0), ("HR or BP increased by ≤ 20% of baseline", 1), ("HR or BP increased by > 20% of baseline", 2)]),
        (("E - Expression (Facial)", "Facial grimace and muscle tension"), [("Relaxed / neutral expression", 0), ("Grimace present (brow bulge, eye squeeze)", 1), ("Grimace and non-purposeful grunt", 2)]),
        (("S - Sleeplessness", "Sleep-wake cycle in past hour"), [("Continuously asleep / wakes normally", 0), ("Awakens at frequent intervals", 1), ("Constantly awake, restless", 2)])
    ])
    e.set_risk_stratification([
        ("No Significant Pain", "0 - 3 points", "Comfortable neonate. Non-pharmacological comfort (swaddling, pacifier, sucrose).", "green"),
        ("Moderate to Severe Pain", "≥ 4 points", "Pharmacological analgesia indicated (paracetamol / IV opioid bolus) plus comfort measures. Reevaluate in 30m.", "red")
    ])
    e.render(os.path.join(OUT, "formulario_escala_de_cries.pdf"))

if __name__ == "__main__":
    run()
